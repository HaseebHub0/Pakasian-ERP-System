"""
End-to-end procurement module tests.

Covers the full workflow per spec:
  PR create → submit → approve → convert-to-PO
  PO approve → send_to_supplier
  GRN create → confirm (PO auto-updates status)
  QC inspection
  Accounts Payable create → mark_paid
  Reorder Rule CRUD
  Supplier Material (auto-creates price history on price change)
"""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient

from apps.authentication.models import SystemUser
from apps.master_data.models import Supplier, RawMaterial, Warehouse
from apps.procurement.models import (
    PaymentTerm, PurchaseOrder, GoodsReceipt, AccountsPayable,
    ReorderRule, SupplierMaterial, SupplierPriceHistory,
)


@pytest.fixture
def api(db):
    from apps.authentication.models import Role
    role, _ = Role.objects.get_or_create(role_name='admin')
    user = SystemUser.objects.create_user(username='proc_test', password='pw12345', role_id=role)
    client = APIClient()
    client.force_authenticate(user=user)
    client.user = user
    return client


@pytest.fixture
def seed(db):
    supplier = Supplier.objects.create(supplier_name='Acme Ingredients')
    material = RawMaterial.objects.create(
        material_code='BES-01', material_name='Besan', material_type='ingredient',
        unit_of_measure='kg', standard_cost=Decimal('120.00'),
    )
    warehouse = Warehouse.objects.create(
        warehouse_name='Main WH', warehouse_type='Factory', city='KHI', province='Sindh',
    )
    pt = PaymentTerm.objects.create(term_name='Net 30', days=30)
    return {'supplier': supplier, 'material': material, 'warehouse': warehouse, 'pt': pt}


# ─── 1. Purchase Requisition lifecycle ──────────────────────────────────────
def test_pr_full_lifecycle_creates_po(api, seed):
    """PR create → submit → approve → convert-to-PO works end-to-end."""
    resp = api.post(
        '/api/procurement/purchase-requisitions/',
        {
            'department': 'production',
            'status': 'Draft',
            'items': [
                {'material_id': seed['material'].id, 'requested_quantity': '50', 'warehouse_id': seed['warehouse'].id}
            ],
        },
        format='json',
    )
    assert resp.status_code == 201, resp.content
    pr_id = resp.data['id']
    assert resp.data['requisition_number'].startswith('PR')
    assert len(resp.data['items']) == 1

    # Draft → Submitted (via custom action)
    r = api.post(f'/api/procurement/purchase-requisitions/{pr_id}/submit/')
    assert r.status_code == 200
    assert 'Routed to role' in r.data['message']

    # Submitted → Approved
    r = api.post(f'/api/procurement/purchase-requisitions/{pr_id}/approve/')
    assert r.status_code == 200
    assert r.data['status'] == 'Approved'

    # Approved → Convert to PO
    r = api.post(
        f'/api/procurement/purchase-requisitions/{pr_id}/convert-to-po/',
        {'supplier_id': seed['supplier'].id}, format='json',
    )
    assert r.status_code == 201, r.content
    assert r.data['po_number'].startswith('PO')
    # PR now Converted
    pr = api.get(f'/api/procurement/purchase-requisitions/{pr_id}/').data
    assert pr['status'] == 'Converted'


def test_pr_reject_from_submitted(api, seed):
    r = api.post('/api/procurement/purchase-requisitions/',
                 {'department': 'admin', 'items': []}, format='json')
    pr_id = r.data['id']
    api.post(f'/api/procurement/purchase-requisitions/{pr_id}/submit/')
    r = api.post(f'/api/procurement/purchase-requisitions/{pr_id}/reject/')
    assert r.status_code == 200
    assert r.data['status'] == 'Rejected'


def test_pr_delete_blocked_when_not_draft(api, seed):
    r = api.post('/api/procurement/purchase-requisitions/',
                 {'department': 'admin', 'items': []}, format='json')
    pr_id = r.data['id']
    api.post(f'/api/procurement/purchase-requisitions/{pr_id}/submit/')
    r = api.delete(f'/api/procurement/purchase-requisitions/{pr_id}/')
    assert r.status_code == 400


# ─── 2. Purchase Order lifecycle ───────────────────────────────────────────
def test_po_approve_and_send(api, seed):
    po = PurchaseOrder.objects.create(supplier_id=seed['supplier'], warehouse_id=seed['warehouse'])
    r = api.post(f'/api/procurement/purchase-orders/{po.id}/approve/')
    assert r.status_code == 200
    assert r.data['status'] == 'Approved'

    r = api.post(f'/api/procurement/purchase-orders/{po.id}/send_to_supplier/')
    assert r.status_code == 200
    assert r.data['status'] == 'Sent'


# ─── 3. GRN flow + PO status auto-update ───────────────────────────────────
def test_grn_confirm_updates_po_status(api, seed):
    po = PurchaseOrder.objects.create(supplier_id=seed['supplier'], warehouse_id=seed['warehouse'])
    from apps.procurement.models import PurchaseOrderItem
    PurchaseOrderItem.objects.create(po_id=po, material_id=seed['material'],
                                     ordered_quantity=100, unit_price=Decimal('120'))

    grn_resp = api.post(
        '/api/procurement/goods-receipts/',
        {
            'po_id': po.id, 'supplier_id': seed['supplier'].id,
            'warehouse_id': seed['warehouse'].id,
            'items': [{'material_id': seed['material'].id, 'ordered_qty': '100',
                       'received_qty': '60', 'accepted_qty': '60'}],
        }, format='json',
    )
    assert grn_resp.status_code == 201, grn_resp.content
    grn_id = grn_resp.data['id']

    r = api.post(f'/api/procurement/goods-receipts/{grn_id}/confirm/')
    assert r.status_code == 200
    po.refresh_from_db()
    assert po.status == 'Partially Received'

    # Second GRN — completes the PO
    grn2 = api.post('/api/procurement/goods-receipts/',
                    {'po_id': po.id, 'supplier_id': seed['supplier'].id,
                     'warehouse_id': seed['warehouse'].id,
                     'items': [{'material_id': seed['material'].id, 'received_qty': '40'}]},
                    format='json').data
    api.post(f'/api/procurement/goods-receipts/{grn2["id"]}/confirm/')
    po.refresh_from_db()
    assert po.status == 'Completed'


# ─── 4. QC Inspection ──────────────────────────────────────────────────────
def test_qc_inspection_create(api, seed):
    r = api.post('/api/procurement/qc-inspections/',
                 {'material_id': seed['material'].id, 'result': 'Approved',
                  'remarks': 'Moisture OK'}, format='json')
    assert r.status_code == 201
    assert r.data['result'] == 'Approved'


# ─── 5. Accounts Payable ───────────────────────────────────────────────────
def test_ap_create_and_mark_paid(api, seed):
    r = api.post('/api/procurement/accounts-payable/',
                 {'supplier_id': seed['supplier'].id, 'invoice_number': 'INV-001',
                  'amount': '5000.00'}, format='json')
    assert r.status_code == 201
    ap_id = r.data['id']

    r = api.post(f'/api/procurement/accounts-payable/{ap_id}/mark_paid/')
    assert r.status_code == 200
    assert r.data['status'] == 'Paid'

    # Second mark-paid fails
    r = api.post(f'/api/procurement/accounts-payable/{ap_id}/mark_paid/')
    assert r.status_code == 400


# ─── 6. Reorder Rules ──────────────────────────────────────────────────────
def test_reorder_rule_crud(api, seed):
    r = api.post('/api/procurement/reorder-rules/',
                 {'material_id': seed['material'].id, 'warehouse_id': seed['warehouse'].id,
                  'minimum_stock': '10', 'maximum_stock': '100', 'reorder_quantity': '50'},
                 format='json')
    assert r.status_code == 201
    rid = r.data['id']

    r = api.patch(f'/api/procurement/reorder-rules/{rid}/', {'minimum_stock': '15'}, format='json')
    assert r.status_code == 200
    assert Decimal(r.data['minimum_stock']) == Decimal('15')


# ─── 7. Supplier Material CRUD + price-history on update ──────────────────
def test_supplier_material_crud_and_price_history_on_change(api, seed):
    r = api.post('/api/procurement/supplier-materials/',
                 {'supplier_id': seed['supplier'].id, 'material_id': seed['material'].id,
                  'standard_price': '120.00', 'lead_time_days': 7}, format='json')
    assert r.status_code == 201
    sm_id = r.data['id']

    # Price change through ORM (covers the save() override path)
    sm = SupplierMaterial.objects.get(id=sm_id)
    sm.standard_price = Decimal('130.00')
    sm.save()
    hist_count = SupplierPriceHistory.objects.filter(
        supplier_id=seed['supplier'], material_id=seed['material']).count()
    assert hist_count >= 1  # at least one row created on change

    # Soft-delete (viewset overrides destroy → sets inactive)
    r = api.delete(f'/api/procurement/supplier-materials/{sm_id}/')
    assert r.status_code == 200
    SupplierMaterial.objects.get(id=sm_id).status == 'inactive'


# ─── 8. Unauthenticated access blocked ─────────────────────────────────────
def test_unauthenticated_blocked(db):
    client = APIClient()
    r = client.get('/api/procurement/purchase-orders/')
    assert r.status_code == 401
