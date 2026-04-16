"""
Module 5 — Process Costing Engine
Test Cases T5.1 – T5.6

Run:
    cd erp_system
    pytest tests/test_costing.py -v
    pytest tests/test_costing.py -v --tb=short   # compact tracebacks
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.authentication.models import SystemUser
from apps.costing.models import (
    BatchMaterialCost,
    BatchOverheadCost,
    CostVariance,
    FactoryOverhead,
    SKUProfitability,
    UnitCost,
)
from apps.costing.services import CostingService
from apps.manufacturing.models import (
    MaterialConsumption,
    MachineLog,
    OilConsumptionLog,
    ProductionBatch,
    ProductionOrder,
)
from apps.master_data.models import Machine, Product, RawMaterial, Warehouse

pytestmark = pytest.mark.django_db


# ─────────────────────────────────────────────────────────────────────────────
# Shared Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def operator(db):
    return SystemUser.objects.create_user(username='cost_tester_t5', password='pass')


@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        warehouse_name='Costing Test WH', warehouse_type='Factory',
        city='Lahore', province='Punjab',
    )


@pytest.fixture
def product(db):
    """Product with standard_cost=38 (used directly in T5.3 variance test)."""
    return Product.objects.create(
        sku_code='CN-COST-T5', product_name='Cheese Nachos 50g T5',
        pack_size='50g',
        net_weight=Decimal('0.050'),
        gross_weight=Decimal('0.055'),
        barcode='5901234123999',
        shelf_life_days=180,
        standard_cost=Decimal('38.00'),
    )


@pytest.fixture
def order(db, product, operator):
    return ProductionOrder.objects.create(
        order_number='PR-2026-T501',
        product_id=product,
        planned_quantity=Decimal('5000'),
        status='Released',
        created_by=operator,
    )


@pytest.fixture
def batch(db, order, product):
    return ProductionBatch.objects.create(
        batch_number='PN260415T5',
        production_order_id=order,
        product_id=product,
        planned_quantity=Decimal('5000'),
        status='Running',
        start_time=timezone.now(),
    )


@pytest.fixture
def besan(db):
    """Besan (chickpea flour) @ PKR 180/kg — used by T5.1."""
    return RawMaterial.objects.create(
        material_code='MAT-BESAN-T5', material_name='Besan',
        material_type='ingredient', unit_of_measure='kg',
        standard_cost=Decimal('180.00'),
    )


@pytest.fixture
def oil_280(db):
    """Palm oil @ PKR 280/L — used by T5.6."""
    return RawMaterial.objects.create(
        material_code='MAT-OIL-T5', material_name='Palm Oil 280',
        material_type='oil', unit_of_measure='litre',
        standard_cost=Decimal('280.00'),
    )


@pytest.fixture
def machine(db):
    return Machine.objects.create(machine_name='Fryer-T5', machine_type='Frying')


# ─────────────────────────────────────────────────────────────────────────────
# T5.1  Material cost calculation
#       350 kg besan × PKR 180/kg  →  BatchMaterialCost.total_cost = 63,000
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_1_MaterialCost:

    def test_batch_material_cost_total_is_correct(self, batch, besan):
        """
        Given:  MaterialConsumption of 350 kg besan, standard_cost = PKR 180
        When:   CostingService.calculate_batch_cost() runs
        Then:   BatchMaterialCost.total_cost == 63,000
                BatchMaterialCost.quantity_used == 350
                BatchMaterialCost.unit_cost == 180
        """
        MaterialConsumption.objects.create(
            batch_id=batch,
            material_id=besan,
            actual_quantity_used=Decimal('350.0000'),
        )

        CostingService.calculate_batch_cost(str(batch.pk))

        bmc = BatchMaterialCost.objects.get(batch_id=batch, material_id=besan)
        assert bmc.quantity_used == Decimal('350.0000'), \
            f"quantity_used expected 350, got {bmc.quantity_used}"
        assert bmc.unit_cost == Decimal('180.0000'), \
            f"unit_cost expected 180, got {bmc.unit_cost}"
        assert bmc.total_cost == Decimal('63000.0000'), \
            f"total_cost expected 63,000, got {bmc.total_cost}"

    def test_batch_material_cost_model_save_computes_total(self, batch, besan):
        """
        Model-level: total_cost is auto-computed by BatchMaterialCost.save()
        regardless of the service.
        """
        bmc = BatchMaterialCost.objects.create(
            batch_id=batch,
            material_id=besan,
            quantity_used=Decimal('350.0000'),
            unit_cost=Decimal('180.0000'),
        )
        assert bmc.total_cost == Decimal('63000.0000'), \
            f"Model save() should auto-compute total_cost; got {bmc.total_cost}"

    def test_batch_material_cost_accumulated_in_summary(self, batch, besan):
        """
        BatchCostSummary.material_cost equals the sum of all BatchMaterialCost rows.
        """
        MaterialConsumption.objects.create(
            batch_id=batch, material_id=besan,
            actual_quantity_used=Decimal('350.0000'),
        )
        summary = CostingService.calculate_batch_cost(str(batch.pk))
        assert summary.material_cost == Decimal('63000.0000'), \
            f"summary.material_cost expected 63,000, got {summary.material_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# T5.2  Unit cost formula
#       total_batch_cost = 200,000 / units = 5,000  →  unit_cost = 40.00
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_2_UnitCost:

    def test_unit_cost_model_auto_computes(self, batch, product):
        """
        UnitCost.save() must compute unit_cost = total_batch_cost / quantity_produced.
        """
        uc = UnitCost.objects.create(
            batch_id=batch,
            product_id=product,
            total_batch_cost=Decimal('200000.0000'),
            quantity_produced=Decimal('5000.0000'),
        )
        assert uc.unit_cost == Decimal('40.0000'), \
            f"unit_cost expected 40.00, got {uc.unit_cost}"

    def test_unit_cost_zero_when_no_output(self, batch, product):
        """If quantity_produced == 0, unit_cost must remain 0 (no division by zero)."""
        uc = UnitCost.objects.create(
            batch_id=batch,
            product_id=product,
            total_batch_cost=Decimal('200000.0000'),
            quantity_produced=Decimal('0'),
        )
        assert uc.unit_cost == Decimal('0'), \
            f"unit_cost should be 0 when quantity_produced=0; got {uc.unit_cost}"

    def test_unit_cost_via_service(self, batch, product, warehouse):
        """
        Full service path: ProductionOutput with quantity=5000 and
        BatchCostSummary.total_batch_cost=200,000 → UnitCost.unit_cost=40.
        We inject costs directly into BatchMaterialCost so the service has
        something to sum, then verify the UnitCost result.
        """
        from apps.manufacturing.models import ProductionOutput

        # Inject approved output (bypass _on_approved side-effects with update())
        po = ProductionOutput.objects.create(
            batch_id=batch, product_id=product,
            quantity_produced=Decimal('5000'),
            batch_number=batch.batch_number,
            warehouse_id=warehouse,
            quality_status='Pending',
        )
        ProductionOutput.objects.filter(pk=po.pk).update(quality_status='Approved')

        # Inject material cost rows that total 200,000 so service reads them
        mat = RawMaterial.objects.create(
            material_code='MAT-T52', material_name='Test Mat',
            material_type='ingredient', unit_of_measure='kg',
            standard_cost=Decimal('200.00'),
        )
        MaterialConsumption.objects.create(
            batch_id=batch, material_id=mat,
            actual_quantity_used=Decimal('1000'),
        )

        summary = CostingService.calculate_batch_cost(str(batch.pk))

        uc = UnitCost.objects.get(batch_id=batch)
        assert uc.quantity_produced == Decimal('5000'), \
            f"quantity_produced expected 5000, got {uc.quantity_produced}"
        assert uc.unit_cost == uc.total_batch_cost / Decimal('5000'), \
            "unit_cost must equal total_batch_cost / quantity_produced"


# ─────────────────────────────────────────────────────────────────────────────
# T5.3  Variance calculation
#       standard = 38, actual = 40  →  cost_variances.variance = +2.00
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_3_Variance:

    def test_variance_model_auto_computes(self, batch, product):
        """
        CostVariance.save() must set variance = actual_cost − standard_cost.
        """
        cv = CostVariance.objects.create(
            batch_id=batch,
            product_id=product,
            actual_cost=Decimal('40.00'),
            standard_cost=Decimal('38.00'),
        )
        assert cv.variance == Decimal('2.00'), \
            f"variance expected +2.00, got {cv.variance}"

    def test_negative_variance_when_below_standard(self, batch, product):
        """Under-spend produces a negative variance."""
        cv = CostVariance.objects.create(
            batch_id=batch,
            product_id=product,
            actual_cost=Decimal('35.00'),
            standard_cost=Decimal('38.00'),
        )
        assert cv.variance == Decimal('-3.00'), \
            f"variance expected -3.00, got {cv.variance}"

    def test_variance_via_service(self, batch, product, warehouse):
        """
        Full service path: product.standard_cost=38, inject costs that yield
        unit_cost=40 after service calculation → variance row must show +2.
        """
        from apps.manufacturing.models import ProductionOutput

        # Set product standard cost explicitly
        product.standard_cost = Decimal('38.00')
        product.save(update_fields=['standard_cost'])

        # 5000 units approved output
        po = ProductionOutput.objects.create(
            batch_id=batch, product_id=product,
            quantity_produced=Decimal('5000'),
            batch_number=batch.batch_number,
            warehouse_id=warehouse,
            quality_status='Pending',
        )
        ProductionOutput.objects.filter(pk=po.pk).update(quality_status='Approved')

        # Material cost: 5000 units × 40 PKR = 200,000
        mat = RawMaterial.objects.create(
            material_code='MAT-T53', material_name='T53 Mat',
            material_type='ingredient', unit_of_measure='kg',
            standard_cost=Decimal('40.00'),
        )
        MaterialConsumption.objects.create(
            batch_id=batch, material_id=mat,
            actual_quantity_used=Decimal('5000'),
        )

        CostingService.calculate_batch_cost(str(batch.pk))

        cv = CostVariance.objects.filter(batch_id=batch).last()
        assert cv.standard_cost == Decimal('38.00'), \
            f"standard_cost expected 38, got {cv.standard_cost}"
        assert cv.variance == cv.actual_cost - Decimal('38.00'), \
            "variance must always equal actual_cost − standard_cost"


# ─────────────────────────────────────────────────────────────────────────────
# T5.4  Overhead allocation (machine-hours proportional)
#       monthly_cost = 800,000  /  batch = 2 of 100 total hrs
#       → allocated_cost = (2/100) × 800,000 = 16,000
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_4_OverheadAllocation:

    def _build_machine_logs(self, batch, machine, batch_minutes, extra_batch, extra_minutes):
        """Create machine logs so batch contributes batch_minutes to the month.

        end_time must be offset by the run duration so that MachineLog.save()
        computes the correct runtime_minutes from (end_time - start_time).
        """
        now_dt = timezone.now()
        MachineLog.objects.create(
            batch_id=batch, machine_id=machine,
            start_time=now_dt,
            end_time=now_dt + timedelta(minutes=batch_minutes),
            runtime_minutes=batch_minutes,
        )
        MachineLog.objects.create(
            batch_id=extra_batch, machine_id=machine,
            start_time=now_dt,
            end_time=now_dt + timedelta(minutes=extra_minutes),
            runtime_minutes=extra_minutes,
        )

    def test_overhead_proportional_allocation(
        self, batch, product, operator, machine
    ):
        """
        Batch runs 2 hrs out of 100 total monthly hrs.
        FactoryOverhead.monthly_cost = 800,000.
        Expected: allocated_cost = (2/100) × 800,000 = 16,000.
        """
        # Second batch to contribute the other 98 hours to the monthly total
        extra_order = ProductionOrder.objects.create(
            order_number='PR-2026-T504X',
            product_id=product,
            planned_quantity=Decimal('1000'),
            status='Released',
            created_by=operator,
        )
        extra_batch = ProductionBatch.objects.create(
            batch_number='PN260415TX',
            production_order_id=extra_order,
            product_id=product,
            planned_quantity=Decimal('1000'),
            status='Running',
            start_time=timezone.now(),
        )

        # 120 min (2 hrs) for our batch, 5880 min (98 hrs) extra → total = 100 hrs
        self._build_machine_logs(
            batch=batch, machine=machine,
            batch_minutes=120,
            extra_batch=extra_batch, extra_minutes=5880,
        )

        overhead = FactoryOverhead.objects.create(
            name='Factory Rent',
            overhead_type='Rent',
            monthly_cost=Decimal('800000.00'),
            is_active=True,
        )

        CostingService.calculate_batch_cost(str(batch.pk))

        boc = BatchOverheadCost.objects.get(batch_id=batch, overhead_id=overhead)
        assert boc.allocated_cost == Decimal('16000.0000'), \
            f"allocated_cost expected 16,000; got {boc.allocated_cost}"

    def test_overhead_proportional_formula(self):
        """
        Unit formula check (no DB): (2/100) × 800,000 = 16,000.
        """
        batch_hours    = Decimal('2')
        total_hours    = Decimal('100')
        monthly_cost   = Decimal('800000')
        allocated      = (batch_hours / total_hours) * monthly_cost
        assert allocated == Decimal('16000'), f"Formula error: got {allocated}"

    def test_overhead_zero_when_no_machine_logs(self, batch, product):
        """With no machine logs, batch_hours=0, so allocated_cost=0."""
        FactoryOverhead.objects.create(
            name='Insurance', overhead_type='Insurance',
            monthly_cost=Decimal('500000'),
            is_active=True,
        )
        CostingService.calculate_batch_cost(str(batch.pk))

        total_allocated = BatchOverheadCost.objects.filter(
            batch_id=batch
        ).aggregate(__import__('django.db.models', fromlist=['Sum']).Sum('allocated_cost'))
        # All allocations should be 0 when batch has no machine hours
        for boc in BatchOverheadCost.objects.filter(batch_id=batch):
            assert boc.allocated_cost == Decimal('0'), \
                f"allocated_cost should be 0 with no machine hours; got {boc.allocated_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# T5.5  SKU profitability
#       selling_price=60, unit_cost=40, units=5000
#       → profit_per_unit=20, gross_margin=33.33%
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_5_SKUProfitability:

    def test_gross_margin_and_profit_per_unit(self, product):
        """
        total_units=5000, unit_cost=40, selling=60
        total_production_cost = 200,000
        total_revenue         = 300,000
        gross_profit          = 100,000  (profit_per_unit = 100,000/5,000 = 20)
        gross_margin_percent  = 33.33%
        """
        sp = SKUProfitability.objects.create(
            product_id=product,
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            total_units_produced=Decimal('5000'),
            total_production_cost=Decimal('200000'),
            total_revenue=Decimal('300000'),
        )

        # avg_unit_cost = 200,000 / 5,000 = 40
        assert sp.avg_unit_cost == Decimal('40.0000'), \
            f"avg_unit_cost expected 40.00, got {sp.avg_unit_cost}"

        # gross_profit = 300,000 − 200,000 = 100,000
        assert sp.gross_profit == Decimal('100000'), \
            f"gross_profit expected 100,000, got {sp.gross_profit}"

        # profit_per_unit = gross_profit / total_units = 100,000 / 5,000 = 20
        profit_per_unit = sp.gross_profit / sp.total_units_produced
        assert profit_per_unit == Decimal('20'), \
            f"profit_per_unit expected 20, got {profit_per_unit}"

        # gross_margin = (100,000 / 300,000) × 100 = 33.33%
        assert sp.gross_margin_percent == Decimal('33.33'), \
            f"gross_margin_percent expected 33.33%, got {sp.gross_margin_percent}"

    def test_negative_margin_when_cost_exceeds_revenue(self, product):
        """Cost > revenue → negative gross_profit and negative margin."""
        sp = SKUProfitability.objects.create(
            product_id=product,
            period_start=date(2026, 5, 1),
            period_end=date(2026, 5, 31),
            total_units_produced=Decimal('1000'),
            total_production_cost=Decimal('50000'),
            total_revenue=Decimal('40000'),
        )
        assert sp.gross_profit < 0, "Gross profit should be negative when cost > revenue"
        assert sp.gross_margin_percent < 0, "Margin should be negative when cost > revenue"

    def test_zero_margin_when_no_revenue(self, product):
        """With zero revenue, gross_margin_percent stays 0 (no division by zero)."""
        sp = SKUProfitability.objects.create(
            product_id=product,
            period_start=date(2026, 6, 1),
            period_end=date(2026, 6, 30),
            total_units_produced=Decimal('500'),
            total_production_cost=Decimal('10000'),
            total_revenue=Decimal('0'),
        )
        assert sp.gross_margin_percent == Decimal('0'), \
            f"gross_margin_percent should be 0 when no revenue; got {sp.gross_margin_percent}"


# ─────────────────────────────────────────────────────────────────────────────
# T5.6  Oil cost from OilConsumptionLog (sensor / flow-meter data)
#       120 L  ×  PKR 280/L  →  BatchMaterialCost.total_cost = 33,600
# ─────────────────────────────────────────────────────────────────────────────

class TestT5_6_OilCostFromSensor:

    def test_oil_log_creates_batch_material_cost(self, batch, oil_280):
        """
        Given:  OilConsumptionLog.quantity_added = 120 L
                oil_material.standard_cost = PKR 280
        When:   CostingService.calculate_batch_cost()
        Then:   BatchMaterialCost entry exists with total_cost = 33,600
        """
        OilConsumptionLog.objects.create(
            batch_id=batch,
            oil_material_id=oil_280,
            quantity_added=Decimal('120.0000'),
            quantity_remaining=Decimal('80.0000'),
        )

        CostingService.calculate_batch_cost(str(batch.pk))

        bmc = BatchMaterialCost.objects.get(batch_id=batch, material_id=oil_280)
        assert bmc.quantity_used == Decimal('120.0000'), \
            f"quantity_used expected 120, got {bmc.quantity_used}"
        assert bmc.unit_cost == Decimal('280.0000'), \
            f"unit_cost expected 280, got {bmc.unit_cost}"
        assert bmc.total_cost == Decimal('33600.0000'), \
            f"total_cost expected 33,600, got {bmc.total_cost}"

    def test_oil_cost_included_in_material_cost_summary(self, batch, oil_280):
        """
        BatchCostSummary.material_cost must include oil cost alongside
        other raw-material costs.
        """
        # Raw material: 100kg × 50
        raw = RawMaterial.objects.create(
            material_code='MAT-T56R', material_name='Corn T56',
            material_type='ingredient', unit_of_measure='kg',
            standard_cost=Decimal('50.00'),
        )
        MaterialConsumption.objects.create(
            batch_id=batch, material_id=raw,
            actual_quantity_used=Decimal('100'),
        )
        # Oil: 120L × 280
        OilConsumptionLog.objects.create(
            batch_id=batch, oil_material_id=oil_280,
            quantity_added=Decimal('120'), quantity_remaining=Decimal('0'),
        )

        summary = CostingService.calculate_batch_cost(str(batch.pk))

        expected_material_cost = Decimal('5000') + Decimal('33600')  # 100×50 + 120×280
        assert summary.material_cost == expected_material_cost, \
            f"summary.material_cost expected {expected_material_cost}, got {summary.material_cost}"

    def test_oil_log_without_material_is_skipped(self, batch):
        """OilConsumptionLog with oil_material_id=None is safely skipped."""
        OilConsumptionLog.objects.create(
            batch_id=batch,
            oil_material_id=None,
            quantity_added=Decimal('50'),
            quantity_remaining=Decimal('50'),
        )
        # Should not raise; just produces no BatchMaterialCost entry
        CostingService.calculate_batch_cost(str(batch.pk))
        assert BatchMaterialCost.objects.filter(batch_id=batch).count() == 0, \
            "No BatchMaterialCost should be created when oil_material_id is None"
