import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from apps.master_data.models import Warehouse, Product, RawMaterial
from apps.inventory.models import (
    InventoryLedger, BatchTable, InventorySummary,
    StockReservation, StockTransfer, InventoryAdjustment
)

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    from apps.authentication.models import SystemUser
    client = APIClient()
    user = SystemUser.objects.create(email='test@example.com', username='testuser')
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def setup_data():
    wh = Warehouse.objects.create(warehouse_name="Main WH", warehouse_code="WH01")
    wh_b = Warehouse.objects.create(warehouse_name="Second WH", warehouse_code="WH02")
    prod = Product.objects.create(product_name="Test Product", sku_code="SKU01", is_active=True)
    mat = RawMaterial.objects.create(material_name="Test Mat", material_code="MAT01", is_active=True)
    return {'wh': wh, 'wh_b': wh_b, 'prod': prod, 'mat': mat}

def test_t3_1_ledger_immutable(setup_data):
    ledger = InventoryLedger.objects.create(
        item_type='Product',
        product_id=setup_data['prod'],
        warehouse_id=setup_data['wh'],
        movement_type='GRN',
        quantity_in=100
    )
    with pytest.raises(ValueError, match="immutable"):
        ledger.quantity_in = 200
        ledger.save()
    
    # Using update() which bypasses save() in Django but maybe should be restricted.
    # To truly restrict update(), it often requires DB triggers or custom manager.
    # The test case says InventoryLedger.objects.filter().update(qty=1) raises exception or blocked?
    # Actually, preventing update() requires custom QuerySet/Manager. Let's start with save().

def test_t3_2_balance_after_correct(setup_data):
    wh = setup_data['wh']
    prod = setup_data['prod']
    InventoryLedger.objects.create(
        item_type='Product', product_id=prod, warehouse_id=wh, movement_type='GRN', quantity_in=500
    )
    l2 = InventoryLedger.objects.create(
        item_type='Product', product_id=prod, warehouse_id=wh, movement_type='GRN', quantity_in=1000
    )
    assert l2.balance_after == Decimal('1500')

def test_t3_3_trigger_updates_summary(setup_data):
    wh = setup_data['wh']
    prod = setup_data['prod']
    InventoryLedger.objects.create(
        item_type='Product', product_id=prod, warehouse_id=wh, movement_type='GRN', quantity_in=100, batch_number='B1'
    )
    summary = InventorySummary.objects.get(warehouse_id=wh, product_id=prod, batch_number='B1')
    assert summary.total_stock == Decimal('100')

def test_t3_4_available_stock_formula(setup_data):
    wh = setup_data['wh']
    prod = setup_data['prod']
    summary = InventorySummary.objects.create(
        warehouse_id=wh, product_id=prod, batch_number='B1', total_stock=1000, reserved_stock=200, in_transit_stock=100
    )
    # The save() method should compute available_stock
    assert summary.available_stock == Decimal('800')

def test_t3_5_fifo_batch_selection(setup_data):
    from apps.inventory.services import get_fifo_batch
    prod = setup_data['prod']
    wh = setup_data['wh']
    # Jan batch
    b_jan = BatchTable.objects.create(batch_number='JAN', product_id=prod, expiry_date=timezone.now().date() + timedelta(days=30), status='Approved')
    # Mar batch
    b_mar = BatchTable.objects.create(batch_number='MAR', product_id=prod, expiry_date=timezone.now().date() + timedelta(days=90), status='Approved')
    
    InventorySummary.objects.create(warehouse_id=wh, product_id=prod, batch_number='MAR', total_stock=100)
    InventorySummary.objects.create(warehouse_id=wh, product_id=prod, batch_number='JAN', total_stock=100)
    
    batch = get_fifo_batch(product_id=prod.id, warehouse_id=wh.id)
    assert batch.batch_number == 'JAN'

def test_t3_6_reserve_blocks_oversell(setup_data):
    wh = setup_data['wh']
    prod = setup_data['prod']
    InventorySummary.objects.create(warehouse_id=wh, product_id=prod, total_stock=500, reserved_stock=0, batch_number='B1')
    
    with pytest.raises(ValidationError, match="insufficient stock"):
        res = StockReservation(
            warehouse_id=wh, product_id=prod, reserved_quantity=600, batch_number='B1'
        )
        res.full_clean()
        res.save()

def test_t3_8_adjustment_creates_ledger(setup_data, api_client):
    wh = setup_data['wh']
    prod = setup_data['prod']
    url = '/api/inventory/adjustments/'
    response = api_client.post(url, {
        'warehouse_id': wh.id,
        'product_id': prod.id,
        'adjustment_type': 'Damaged',
        'quantity': 50,
        'reason': 'Water damage'
    }, format='json')
    assert response.status_code == 201
    # Should create ledger entry
    ledger_exists = InventoryLedger.objects.filter(movement_type='ADJUSTMENT', quantity_out=50).exists()
    assert ledger_exists

def test_t3_10_expiry_auto_alert(setup_data):
    from apps.core.tasks import check_expiring_batches
    prod = setup_data['prod']
    BatchTable.objects.create(
        batch_number='EXPIRING', product_id=prod, 
        expiry_date=timezone.now().date() + timedelta(days=25), # assuming 60 is alert
        status='Approved'
    )
    result = check_expiring_batches()
    assert result['flagged'] >= 1
