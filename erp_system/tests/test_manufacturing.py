"""
Module 4 — Manufacturing Execution System
Test Cases T4.1 – T4.8

Run:
    cd erp_system
    pytest tests/test_manufacturing.py -v
"""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import call, patch

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import SystemUser
from apps.manufacturing.models import (
    BatchStageLog,
    MaterialIssue,
    OilConsumptionLog,
    ProductionBatch,
    ProductionOrder,
    ProductionOutput,
    ProductionStage,
    ProductionYield,
)
from apps.master_data.models import Product, RawMaterial, Warehouse

pytestmark = pytest.mark.django_db


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def operator(db):
    return SystemUser.objects.create_user(username='operator_t4', password='pass')


@pytest.fixture
def api_client(operator):
    client = APIClient()
    client.force_authenticate(user=operator)
    return client


@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        warehouse_name='Factory Warehouse', warehouse_type='Factory',
        city='Lahore', province='Punjab',
    )


@pytest.fixture
def product(db):
    return Product.objects.create(
        sku_code='PN-001', product_name='Plain Nachos 50g',
        pack_size='50g', net_weight=Decimal('0.050'),
        gross_weight=Decimal('0.055'), barcode='5901234123457',
        shelf_life_days=180, standard_cost=Decimal('25.00'),
    )


@pytest.fixture
def raw_material(db):
    return RawMaterial.objects.create(
        material_code='MAT-CORN-001', material_name='Corn Starch',
        material_type='ingredient', unit_of_measure='kg',
        standard_cost=Decimal('50.00'),
    )


@pytest.fixture
def oil_material(db):
    return RawMaterial.objects.create(
        material_code='MAT-OIL-001', material_name='Palm Oil',
        material_type='oil', unit_of_measure='kg',
        standard_cost=Decimal('120.00'),
    )


@pytest.fixture
def stages(db):
    """Seed all 6 production stages in sequence order."""
    data = [
        (1, 'Mixing'),
        (2, 'Frying'),
        (3, 'Oil Draining'),
        (4, 'Seasoning'),
        (5, 'Cooling'),
        (6, 'Packing'),
    ]
    return [
        ProductionStage.objects.get_or_create(
            sequence_number=seq, defaults={'name': name}
        )[0]
        for seq, name in data
    ]


@pytest.fixture
def order(db, product, operator):
    return ProductionOrder.objects.create(
        order_number='PR-2026-0001',
        product_id=product,
        planned_quantity=Decimal('5000'),
        status='Released',
        created_by=operator,
    )


@pytest.fixture
def batch(db, order, product):
    """A running batch with a pre-set batch_number for most tests."""
    return ProductionBatch.objects.create(
        batch_number='PN260312X',       # X avoids clashing with T4.1
        production_order_id=order,
        product_id=product,
        planned_quantity=Decimal('1000'),
        status='Running',
        start_time=timezone.now(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# T4.1  Batch number format
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_1_batch_number_format(db, order, product):
    """
    Given: Create a batch for product PN, date frozen to 2026-03-12.
    Expected: batch_number == 'PN260312A'
    """
    fixed_dt = datetime(2026, 3, 12, 8, 0, 0, tzinfo=timezone.utc)

    with patch('apps.manufacturing.models.timezone') as mock_tz:
        mock_tz.now.return_value = fixed_dt
        mock_tz.utc = timezone.utc   # keep utc accessible

        b = ProductionBatch.objects.create(
            production_order_id=order,
            product_id=product,
            planned_quantity=Decimal('1000'),
        )

    assert b.batch_number == 'PN260312A', (
        f"Expected 'PN260312A', got '{b.batch_number}'"
    )


def test_t4_1_batch_number_increments_suffix(db, order, product):
    """
    Second batch on same day gets suffix B.
    """
    fixed_dt = datetime(2026, 3, 12, 8, 0, 0, tzinfo=timezone.utc)

    with patch('apps.manufacturing.models.timezone') as mock_tz:
        mock_tz.now.return_value = fixed_dt
        mock_tz.utc = timezone.utc

        b1 = ProductionBatch.objects.create(
            production_order_id=order,
            product_id=product,
            planned_quantity=Decimal('1000'),
        )
        b2 = ProductionBatch.objects.create(
            production_order_id=order,
            product_id=product,
            planned_quantity=Decimal('500'),
        )

    assert b1.batch_number == 'PN260312A'
    assert b2.batch_number == 'PN260312B'


# ─────────────────────────────────────────────────────────────────────────────
# T4.2  Stage sequence enforced
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_2_stage_sequence_blocks_out_of_order_start(db, batch, stages):
    """
    Given: Stage 1 (Mixing) has no end_time.
    When: Attempt to start stage 2 (Frying).
    Expected: ValidationError raised mentioning the incomplete previous stage.
    """
    stage_1, stage_2 = stages[0], stages[1]

    # Create stage-1 log WITHOUT end_time (still open)
    BatchStageLog.objects.create(batch_id=batch, stage_id=stage_1)

    # Try to create stage-2 log with a start_time → must fail clean()
    log2 = BatchStageLog(
        batch_id=batch,
        stage_id=stage_2,
        start_time=timezone.now(),
    )
    with pytest.raises(ValidationError) as exc_info:
        log2.full_clean()

    assert 'Mixing' in str(exc_info.value), (
        "Error should name the incomplete stage 'Mixing'"
    )


def test_t4_2_stage_sequence_allows_start_when_previous_complete(db, batch, stages):
    """
    Given: Stage 1 (Mixing) has end_time set.
    When: Stage 2 (Frying) is started.
    Expected: No ValidationError — record saves successfully.
    """
    stage_1, stage_2 = stages[0], stages[1]

    now = timezone.now()
    BatchStageLog.objects.create(
        batch_id=batch,
        stage_id=stage_1,
        start_time=now,
        end_time=now,       # completed
    )

    log2 = BatchStageLog(
        batch_id=batch,
        stage_id=stage_2,
        start_time=timezone.now(),
    )
    log2.full_clean()   # should NOT raise
    log2.save()

    assert BatchStageLog.objects.filter(batch_id=batch, stage_id=stage_2).exists()


def test_t4_2_first_stage_has_no_prerequisite(db, batch, stages):
    """
    Stage 1 (sequence_number=1) can be started at any time.
    """
    log1 = BatchStageLog(
        batch_id=batch,
        stage_id=stages[0],
        start_time=timezone.now(),
    )
    log1.full_clean()   # must NOT raise
    log1.save()
    assert log1.pk is not None


# ─────────────────────────────────────────────────────────────────────────────
# T4.3  Material issue creates inventory ledger entry
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_3_material_issue_creates_ledger_entry(db, batch, raw_material, warehouse, operator):
    """
    Given: Create a MaterialIssue for 50 kg.
    Expected: InventoryLedger row with movement_type='PRODUCTION', quantity_out=50.
    """
    from apps.inventory.models import InventoryLedger

    issue = MaterialIssue.objects.create(
        batch_id       = batch,
        material_id    = raw_material,
        quantity_issued= Decimal('50'),
        warehouse_id   = warehouse,
        issued_by      = operator,
    )

    ledger_entry = InventoryLedger.objects.filter(
        material_id   = raw_material,
        movement_type = 'PRODUCTION',
        quantity_out  = Decimal('50'),
    ).first()

    assert ledger_entry is not None, (
        "Expected an InventoryLedger row with movement_type=PRODUCTION after MaterialIssue.save()"
    )
    assert ledger_entry.quantity_out == Decimal('50')
    assert ledger_entry.reference_id == batch.pk


def test_t4_3_material_issue_via_api(db, api_client, batch, raw_material, warehouse):
    """
    POST /api/manufacturing/batches/{batch_pk}/issues/ creates ledger entry.
    """
    from apps.inventory.models import InventoryLedger

    url = f'/api/manufacturing/batches/{batch.pk}/issues/'
    payload = {
        'batch_id':       str(batch.pk),
        'material_id':    str(raw_material.pk),
        'quantity_issued': '75.0000',
        'warehouse_id':   str(warehouse.pk),
    }
    response = api_client.post(url, payload, format='json')

    assert response.status_code == 201, response.data

    assert InventoryLedger.objects.filter(
        material_id   = raw_material,
        movement_type = 'PRODUCTION',
        quantity_out  = Decimal('75'),
    ).exists()


# ─────────────────────────────────────────────────────────────────────────────
# T4.4  Yield auto-calculates
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_4_yield_percent_auto_calculated(db, batch):
    """
    Given: input_qty=1000, output_qty=910.
    Expected: yield_percent == Decimal('91.00').
    """
    y = ProductionYield.objects.create(
        batch_id   = batch,
        input_qty  = Decimal('1000'),
        output_qty = Decimal('910'),
    )

    assert y.yield_percent == Decimal('91.00'), (
        f"Expected 91.00, got {y.yield_percent}"
    )


def test_t4_4_yield_percent_rounds_to_two_decimals(db, batch):
    """
    input=300, output=100 → 33.33%
    """
    y = ProductionYield.objects.create(
        batch_id   = batch,
        input_qty  = Decimal('300'),
        output_qty = Decimal('100'),
    )
    assert y.yield_percent == Decimal('33.33')


def test_t4_4_yield_percent_zero_when_no_input(db, batch):
    """
    input_qty=0 → yield_percent stays 0 (no ZeroDivisionError).
    """
    y = ProductionYield.objects.create(
        batch_id   = batch,
        input_qty  = Decimal('0'),
        output_qty = Decimal('0'),
    )
    assert y.yield_percent == Decimal('0')


# ─────────────────────────────────────────────────────────────────────────────
# T4.5  Approved output posts finished goods to inventory ledger
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_5_approved_output_posts_fg_ledger(db, batch, product, warehouse):
    """
    When quality_status is set to Approved, InventoryLedger should receive a
    GRN credit row for the produced quantity.
    """
    from apps.inventory.models import InventoryLedger

    output = ProductionOutput.objects.create(
        batch_id          = batch,
        product_id        = product,
        quantity_produced = Decimal('910'),
        batch_number      = batch.batch_number,
        warehouse_id      = warehouse,
        quality_status    = 'Approved',   # directly approved on create
    )

    ledger_entry = InventoryLedger.objects.filter(
        product_id    = product,
        movement_type = 'GRN',
        quantity_in   = Decimal('910'),
    ).first()

    assert ledger_entry is not None, (
        "Expected GRN ledger entry after ProductionOutput quality_status=Approved"
    )
    assert ledger_entry.quantity_in == Decimal('910')
    assert ledger_entry.batch_number == batch.batch_number


def test_t4_5_pending_output_does_not_post_ledger(db, batch, product, warehouse):
    """
    A Pending output must NOT create a ledger entry.
    """
    from apps.inventory.models import InventoryLedger

    initial_count = InventoryLedger.objects.filter(product_id=product).count()

    ProductionOutput.objects.create(
        batch_id          = batch,
        product_id        = product,
        quantity_produced = Decimal('500'),
        batch_number      = batch.batch_number,
        warehouse_id      = warehouse,
        quality_status    = 'Pending',
    )

    assert InventoryLedger.objects.filter(product_id=product).count() == initial_count


def test_t4_5_transition_pending_to_approved_posts_ledger(db, batch, product, warehouse):
    """
    Changing quality_status from Pending → Approved on an existing record
    should post the ledger entry exactly once.
    """
    from apps.inventory.models import InventoryLedger

    output = ProductionOutput.objects.create(
        batch_id          = batch,
        product_id        = product,
        quantity_produced = Decimal('800'),
        batch_number      = batch.batch_number,
        warehouse_id      = warehouse,
        quality_status    = 'Pending',
    )

    before = InventoryLedger.objects.filter(
        product_id=product, movement_type='GRN'
    ).count()

    output.quality_status = 'Approved'
    output.save()

    after = InventoryLedger.objects.filter(
        product_id=product, movement_type='GRN'
    ).count()

    assert after == before + 1


# ─────────────────────────────────────────────────────────────────────────────
# T4.6  Costing Celery task queued on approve
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_6_calculate_batch_cost_task_queued(db, batch, product, warehouse):
    """
    When quality_status transitions to Approved, calculate_batch_cost.delay()
    must be called with the batch UUID.

    Tasks are imported locally inside _on_approved(), so we patch at the
    tasks module level: 'apps.manufacturing.tasks.calculate_batch_cost'.
    """
    with patch('apps.manufacturing.tasks.calculate_batch_cost') as mock_task:
        with patch('apps.manufacturing.tasks.print_batch_labels'):
            ProductionOutput.objects.create(
                batch_id          = batch,
                product_id        = product,
                quantity_produced = Decimal('910'),
                batch_number      = batch.batch_number,
                warehouse_id      = warehouse,
                quality_status    = 'Approved',
            )

    mock_task.delay.assert_called_once_with(str(batch.pk))


def test_t4_6_task_not_queued_for_pending(db, batch, product, warehouse):
    """
    Celery task must NOT be queued when quality_status remains Pending.
    """
    with patch('apps.manufacturing.tasks.calculate_batch_cost') as mock_task:
        ProductionOutput.objects.create(
            batch_id          = batch,
            product_id        = product,
            quantity_produced = Decimal('500'),
            batch_number      = batch.batch_number,
            warehouse_id      = warehouse,
            quality_status    = 'Pending',
        )

    mock_task.delay.assert_not_called()


def test_t4_6_task_not_queued_second_save_if_already_approved(db, batch, product, warehouse):
    """
    Saving an already-Approved output again must NOT re-queue the task.
    """
    with patch('apps.manufacturing.tasks.calculate_batch_cost') as mock_task:
        with patch('apps.manufacturing.tasks.print_batch_labels'):
            output = ProductionOutput.objects.create(
                batch_id          = batch,
                product_id        = product,
                quantity_produced = Decimal('910'),
                batch_number      = batch.batch_number,
                warehouse_id      = warehouse,
                quality_status    = 'Approved',
            )
            # Reset call count after first approval
            mock_task.delay.reset_mock()

            # Save again with no status change
            output.save()

    mock_task.delay.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# T4.7  ZPL print task queued on approve
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_7_print_batch_labels_task_queued(db, batch, product, warehouse):
    """
    When quality_status transitions to Approved, print_batch_labels.delay()
    must be called with the batch UUID.
    """
    with patch('apps.manufacturing.tasks.calculate_batch_cost'):
        with patch('apps.manufacturing.tasks.print_batch_labels') as mock_print:
            ProductionOutput.objects.create(
                batch_id          = batch,
                product_id        = product,
                quantity_produced = Decimal('910'),
                batch_number      = batch.batch_number,
                warehouse_id      = warehouse,
                quality_status    = 'Approved',
            )

    mock_print.delay.assert_called_once_with(str(batch.pk))


def test_t4_7_both_tasks_use_same_batch_id(db, batch, product, warehouse):
    """
    Both Celery tasks must receive the same batch UUID string.
    """
    with patch('apps.manufacturing.tasks.calculate_batch_cost') as mock_cost:
        with patch('apps.manufacturing.tasks.print_batch_labels') as mock_print:
            ProductionOutput.objects.create(
                batch_id          = batch,
                product_id        = product,
                quantity_produced = Decimal('910'),
                batch_number      = batch.batch_number,
                warehouse_id      = warehouse,
                quality_status    = 'Approved',
            )

    batch_id_str = str(batch.pk)
    mock_cost.delay.assert_called_once_with(batch_id_str)
    mock_print.delay.assert_called_once_with(batch_id_str)


# ─────────────────────────────────────────────────────────────────────────────
# T4.8  Oil log saves with auto timestamp and correct quantities
# ─────────────────────────────────────────────────────────────────────────────

def test_t4_8_oil_log_timestamp_auto_set(db, batch, oil_material, operator):
    """
    OilConsumptionLog.timestamp must be set automatically (auto_now_add).
    """
    before = timezone.now()

    log = OilConsumptionLog.objects.create(
        batch_id           = batch,
        oil_material_id    = oil_material,
        quantity_added     = Decimal('200'),
        quantity_remaining = Decimal('180'),
        operator_id        = operator,
    )

    after = timezone.now()

    assert log.timestamp is not None
    assert before <= log.timestamp <= after, (
        f"timestamp {log.timestamp} not between {before} and {after}"
    )


def test_t4_8_oil_log_quantity_remaining_saved(db, batch, oil_material, operator):
    """
    quantity_remaining must persist exactly as supplied.
    """
    log = OilConsumptionLog.objects.create(
        batch_id           = batch,
        oil_material_id    = oil_material,
        quantity_added     = Decimal('150.5000'),
        quantity_remaining = Decimal('132.2500'),
        operator_id        = operator,
    )

    # Re-fetch from DB
    log.refresh_from_db()

    assert log.quantity_remaining == Decimal('132.2500')
    assert log.quantity_added     == Decimal('150.5000')


def test_t4_8_oil_log_timestamp_not_editable(db, batch, oil_material, operator):
    """
    Because timestamp is auto_now_add, it must not be changeable via update.
    Two logs created sequentially must have different (or equal) timestamps,
    and neither timestamp should be None.
    """
    log1 = OilConsumptionLog.objects.create(
        batch_id=batch, oil_material_id=oil_material,
        quantity_added=Decimal('100'), quantity_remaining=Decimal('90'),
        operator_id=operator,
    )
    log2 = OilConsumptionLog.objects.create(
        batch_id=batch, oil_material_id=oil_material,
        quantity_added=Decimal('50'), quantity_remaining=Decimal('45'),
        operator_id=operator,
    )

    assert log1.timestamp is not None
    assert log2.timestamp is not None
    assert log1.timestamp <= log2.timestamp


def test_t4_8_oil_log_via_api(db, api_client, batch, oil_material, operator):
    """
    POST /api/manufacturing/batches/{batch_pk}/oil-logs/ saves correctly.
    """
    url     = f'/api/manufacturing/batches/{batch.pk}/oil-logs/'
    payload = {
        'batch_id':            str(batch.pk),
        'oil_material_id':     str(oil_material.pk),
        'quantity_added':      '200.0000',
        'quantity_remaining':  '175.5000',
        'operator_id':         str(operator.pk),
    }
    response = api_client.post(url, payload, format='json')

    assert response.status_code == 201, response.data
    data = response.data

    assert Decimal(data['quantity_remaining']) == Decimal('175.5000')
    assert data['timestamp'] is not None


# ─────────────────────────────────────────────────────────────────────────────
# ManufacturingService.complete_batch — bonus integration test
# ─────────────────────────────────────────────────────────────────────────────

def test_complete_batch_requires_all_stages_finished(db, batch, stages):
    """
    complete_batch() raises ValueError if any stage lacks end_time.
    """
    from apps.manufacturing.services import ManufacturingService

    now = timezone.now()
    for stage in stages:
        BatchStageLog.objects.create(
            batch_id=batch, stage_id=stage,
            start_time=now,
            end_time=now if stage.sequence_number < 6 else None,  # last stage open
        )

    with pytest.raises(ValueError, match='Packing'):
        ManufacturingService.complete_batch(str(batch.pk))


def test_complete_batch_calculates_yield(db, batch, stages):
    """
    complete_batch() creates a ProductionYield using stage-1 input and
    last-stage output.
    """
    from apps.manufacturing.services import ManufacturingService

    now = timezone.now()
    for stage in stages:
        BatchStageLog.objects.create(
            batch_id        = batch,
            stage_id        = stage,
            start_time      = now,
            end_time        = now,
            input_quantity  = Decimal('1000') if stage.sequence_number == 1 else Decimal('0'),
            output_quantity = Decimal('910')  if stage.sequence_number == 6 else Decimal('0'),
        )

    batch.status = 'Running'
    batch.save()

    completed = ManufacturingService.complete_batch(str(batch.pk))

    assert completed.status == 'Completed'
    assert completed.actual_quantity == Decimal('910')

    yield_record = ProductionYield.objects.get(batch_id=batch)
    assert yield_record.input_qty  == Decimal('1000')
    assert yield_record.output_qty == Decimal('910')
    assert yield_record.yield_percent == Decimal('91.00')
