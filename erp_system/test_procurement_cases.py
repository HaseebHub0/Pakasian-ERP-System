import os
import django
import sys
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test.client import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from apps.master_data.models import Supplier, RawMaterial, Warehouse
from apps.procurement.models import (
    ApprovalWorkflow, PurchaseRequisition, PurchaseOrder,
    GoodsReceipt, GoodsReceiptItem, QcInspection, AccountsPayable,
    PurchaseReturn, ReorderRule, SupplierMaterial, SupplierPriceHistory
)
from apps.inventory.models import InventoryLedger, InventorySummary
from apps.procurement.tasks import check_reorder_rules

User = get_user_model()

def setup_test_data():
    from apps.authentication.models import Role
    role, _ = Role.objects.get_or_create(role_name='admin')
    user, _ = User.objects.get_or_create(username='test_admin', defaults={'role_id': role, 'password': 'test'})
    
    supplier, _ = Supplier.objects.get_or_create(supplier_name='T_Supp', defaults={'rating': 5})
    material, _ = RawMaterial.objects.get_or_create(material_code='T_Mat', defaults={'material_name': 'T_Mat', 'standard_cost': Decimal('100.00')})
    warehouse, _ = Warehouse.objects.get_or_create(warehouse_name='T_WH', defaults={'city': 'City', 'warehouse_type': 'main'})
    return user, supplier, material, warehouse

def print_result(ts_id, desc, success, details=""):
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {ts_id}: {desc}")
    if details:
        print(f"    -> {details}")

def run_tests():
    print("--- Running Procurement Tests ---")
    user, supplier, material, warehouse = setup_test_data()
    
    client = Client()
    # Mocking authenticated user by forcing login because DRF SimpleJWT requires header.
    # We will just use the REST API client with force login or pass auth headers.
    from rest_framework.test import APIClient
    api = APIClient()
    api.force_authenticate(user=user)

    # Clean PRs
    PurchaseRequisition.objects.all().delete()
    
    # T2.1 PR number auto-generates
    resp = api.post('/api/procurement/purchase-requisitions/', {
        "department": "Test Dept",
        "requested_by": user.id,
        "items": [{
            "material_id": material.id,
            "requested_quantity": 500,
            "warehouse_id": warehouse.id
        }]
    }, format='json')
    
    pr_id = resp.data.get('id')
    pr = PurchaseRequisition.objects.get(id=pr_id)
    print_result('T2.1', 'PR number auto-generates', pr.requisition_number.startswith('PR-'), f"Generated: {pr.requisition_number}")

    # T2.2 Approval routing small (PR total 50,000)
    # The setup: material standard_cost = 100 * 500 = 50,000. Workflow should return procurement_manager.
    submit_resp = api.post(f'/api/procurement/purchase-requisitions/{pr_id}/submit/')
    print_result('T2.2', 'Approval routing small', "procurement_manager" in str(submit_resp.data), submit_resp.data.get('message'))
    
    # T2.3 Approval routing large
    pr_large = api.post('/api/procurement/purchase-requisitions/', {
        "items": [{"material_id": material.id, "requested_quantity": 6000}] # 600,000
    }, format='json')
    submit_resp_large = api.post(f'/api/procurement/purchase-requisitions/{pr_large.data["id"]}/submit/')
    print_result('T2.3', 'Approval routing large', "director" in str(submit_resp_large.data), submit_resp_large.data.get('message'))

    # T2.4 PO from approved PR
    # Approve the PR first
    api.post(f'/api/procurement/purchase-requisitions/{pr_id}/approve/')
    
    po_resp = api.post(f'/api/procurement/purchase-requisitions/{pr_id}/convert-to-po/', {
        "supplier_id": supplier.id
    }, format='json')
    po_number = po_resp.data.get('po_number', '')
    po_id = po_resp.data.get('id')
    print_result('T2.4', 'PO from approved PR', po_number.startswith('PO-') and po_resp.status_code == 201, f"PO status: {po_resp.status_code}")

    # Set PO to Approved & Sent
    api.post(f'/api/procurement/purchase-orders/{po_id}/approve/')
    api.post(f'/api/procurement/purchase-orders/{po_id}/send_to_supplier/')

    # T2.5 Partial GRN
    grn_resp = api.post('/api/procurement/goods-receipts/', {
        "po_id": po_id,
        "supplier_id": supplier.id,
        "warehouse_id": warehouse.id,
        "items": [{
            "material_id": material.id,
            "ordered_qty": 500,
            "received_qty": 200,
            "accepted_qty": 180,
            "rejected_qty": 20
        }]
    }, format='json')
    grn_id = grn_resp.data.get('id')
    
    # Confirm GRN
    grn_conf = api.post(f'/api/procurement/goods-receipts/{grn_id}/confirm/')
    po_recheck = PurchaseOrder.objects.get(id=po_id)
    print_result('T2.5', 'Partial GRN', po_recheck.status == 'Partially Received', f"PO status morphed to: {po_recheck.status}")

    # T2.6 & T2.7 & T2.8 QC Triggers
    qc_resp = api.post('/api/procurement/qc-inspections/', {
        "material_id": material.id,
        "grn_id": grn_id,
        "result": "Approved", # triggers AP and Ledger
        "remarks": "Passed, but some returned" # wait, we need to test Rejected return. 
    }, format='json')
    
    # After approved QC, we expect ledger + AP. 
    ledger_exists = InventoryLedger.objects.filter(reference_id=grn_id).exists()
    ap_exists = AccountsPayable.objects.filter(po_id=po_id).exists()
    print_result('T2.6', 'QC approval posts inventory', ledger_exists)
    print_result('T2.8', 'AP auto-created', ap_exists)

    # Let's test Reject flow
    qc_rej = api.post('/api/procurement/qc-inspections/', {
        "material_id": material.id,
        "grn_id": grn_id,
        "result": "Rejected"
    }, format='json')
    returns_exist = PurchaseReturn.objects.filter(grn_id=grn_id).exists()
    print_result('T2.7', 'QC rejection creates return', returns_exist)

    # T2.9 Reorder rule triggers PR
    # Setup inventory summary explicit
    InventorySummary.objects.update_or_create(
        product_id=material.id,
        warehouse_id=warehouse.id,
        defaults={'available_stock': Decimal('50')}
    )
    rule, _ = ReorderRule.objects.update_or_create(
        material_id=material,
        warehouse_id=warehouse,
        defaults={'minimum_stock': 100, 'reorder_quantity': 500, 'maximum_stock': 1000}
    )
    
    initial_prs = PurchaseRequisition.objects.filter(department="Auto-Reorder (System)").count()
    result_text = check_reorder_rules()
    after_prs = PurchaseRequisition.objects.filter(department="Auto-Reorder (System)").count()
    print_result('T2.9', 'Reorder rule triggers PR', after_prs > initial_prs, result_text)

    # T2.10 Price history
    sup_mat, _ = SupplierMaterial.objects.get_or_create(
        supplier_id=supplier, material_id=material, defaults={'standard_price': Decimal('50.0')}
    )
    # Give it some history base
    # Now update it
    sup_mat.standard_price = Decimal('75.0')
    sup_mat.save()
    
    hist_count = SupplierPriceHistory.objects.filter(supplier_id=supplier, material_id=material).count()
    print_result('T2.10', 'Price history saved', hist_count >= 1, f"History records: {hist_count}")


if __name__ == '__main__':
    run_tests()
