import os
import django
import sys
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test.client import Client
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.master_data.models import Supplier, RawMaterial, Warehouse, Product
from apps.inventory.models import (
    InventoryLedger, BatchTable, InventorySummary, StockTransfer,
    TransferItem, StockReservation, WarehousePicking, PickingItem, InventoryAdjustment
)

User = get_user_model()

def setup_data():
    from apps.authentication.models import Role
    role, _ = Role.objects.get_or_create(role_name='admin')
    user, _ = User.objects.get_or_create(username='test_admin', defaults={'role_id': role, 'password': 'test'})
    
    mat, _ = RawMaterial.objects.get_or_create(material_code='M1', defaults={'material_name': 'M1', 'standard_cost': Decimal('100.00')})
    prod, _ = Product.objects.get_or_create(sku_code='P1', defaults={'product_name': 'P1', 'net_weight': 1.0, 'gross_weight': 2.0, 'shelf_life_days': 365, 'standard_cost': Decimal('100.00'), 'category_id': None})
    
    wh1, _ = Warehouse.objects.get_or_create(warehouse_name='WH-Main', defaults={'city': 'A', 'warehouse_type': 'main'})
    wh2, _ = Warehouse.objects.get_or_create(warehouse_name='WH-Sub', defaults={'city': 'B', 'warehouse_type': 'sub'})
    
    return user, mat, prod, wh1, wh2

def print_res(ts_id, desc, success, details=""):
    print(f"[{'PASS' if success else 'FAIL'}] {ts_id}: {desc} | {details}")

def run_tests():
    print("--- Running Inventory Ledger Verification ---")
    user, mat, prod, wh1, wh2 = setup_data()
    
    api = APIClient()
    api.force_authenticate(user=user)

    # 1. Test Immutable Ledger via REST
    # Users should not be able to POST/DELETE/PATCH to 'ledger/'
    post_res = api.post('/api/inventory/ledger/', {'item_type': 'Product', 'warehouse_id': wh1.id, 'quantity_in': 10})
    print_res("INV.1", "Ledger immutability REST check", post_res.status_code == 405, "Method Not Allowed on POST")

    # 2. Test Adjustment Triggers Ledger & Summary
    adj_res = api.post('/api/inventory/adjustments/', {
        "warehouse_id": wh1.id,
        "material_id": mat.id,
        "batch_number": "B001",
        "adjustment_type": "Found",
        "quantity": 500,
        "reason": "Test Initial Inject"
    }, format='json')
    print_res("INV.2", "Adjustment creation", adj_res.status_code == 201, "API Success")
    
    # Check Ledger
    adj_id = adj_res.data['id']
    ledger_count = InventoryLedger.objects.filter(reference_id=adj_id).count()
    print_res("INV.3", "Ledger Auto-created from Adjustment", ledger_count == 1)

    # Check Summary
    summary = InventorySummary.objects.get(warehouse_id=wh1, material_id=mat, batch_number="B001")
    print_res("INV.4", "Summary Auto-updated by save override", summary.total_stock == Decimal('500.0000'), f"Stock = {summary.total_stock}")

    # 3. Test Transfer Protocol
    trans_res = api.post('/api/inventory/stock-transfers/', {
        "source_warehouse": wh1.id,
        "destination_warehouse": wh2.id,
        "status": "Draft"
    }, format='json')
    trans_id = trans_res.data['id']

    # Add item to transfer
    item_res = api.post(f'/api/inventory/stock-transfers/{trans_id}/items/', {
        "material_id": mat.id,
        "batch_number": "B001",
        "quantity": 150
    }, format='json')

    # Dispatch transfer -> creates ledger deduction
    api.post(f'/api/inventory/stock-transfers/{trans_id}/dispatch-transfer/')
    summary.refresh_from_db()
    print_res("INV.5", "Transfer Dispatch deducts stock", summary.total_stock == Decimal('350.0000'), f"WH1 Stock = {summary.total_stock}")

    # Receive transfer -> creates ledger addition
    api.post(f'/api/inventory/stock-transfers/{trans_id}/receive-transfer/')
    dest_summary = InventorySummary.objects.get(warehouse_id=wh2, material_id=mat, batch_number="B001")
    print_res("INV.6", "Transfer Receive adds stock", dest_summary.total_stock == Decimal('150.0000'), f"WH2 Stock = {dest_summary.total_stock}")

    print("\n--- Summary Constraints & Ledger Invariants Functional ---\n")

if __name__ == '__main__':
    run_tests()
