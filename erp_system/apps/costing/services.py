"""
CostingService
==============
Implements calculate_batch_cost(batch_id) step-by-step as specified:

  1. Material cost  — MaterialConsumption × material.standard_cost
  2. Oil cost       — OilConsumptionLog × oil_material.standard_cost (→ BatchMaterialCost)
  3. Labour cost    — LabourLog.hours_worked × hourly_rate
  4. Machine cost   — MachineLog.runtime_minutes/60 × MachineCostRate.cost_per_hour
  5. Overhead       — machine-hours proportional allocation from FactoryOverhead.monthly_cost
  6. Waste cost     — ProductionWaste.quantity × material.standard_cost
  7. BatchCostSummary
  8. UnitCost       — total_batch_cost / output.quantity_produced
  9. CostVariance   — actual unit_cost vs product.standard_cost
 10. SKUProfitability (monthly roll-up)
"""

import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import Q, Sum
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class CostingService:

    @staticmethod
    @transaction.atomic
    def calculate_batch_cost(batch_id: str, user=None):
        """
        Full costing pipeline.  Idempotent — safe to re-run.
        Returns the saved BatchCostSummary instance.
        """
        from apps.manufacturing.models import (
            ProductionBatch, MaterialConsumption,
            OilConsumptionLog, MachineLog, ProductionWaste,
            ProductionOutput,
        )
        
        from .models import (
            BatchMaterialCost, LabourLog, MachineCostRate,
            BatchMachineCost, FactoryOverhead, BatchOverheadCost,
            BatchWasteCost, BatchCostSummary, UnitCost,
            CostVariance,
        )

        batch = ProductionBatch.objects.select_related('product_id').get(pk=batch_id)

        # ── 1. Material cost ─────────────────────────────────────────────────
        BatchMaterialCost.objects.filter(batch_id=batch).delete()

        for consumption in MaterialConsumption.objects.filter(
            batch_id=batch_id
        ).select_related('material_id'):
            material = consumption.material_id
            BatchMaterialCost.objects.create(
                batch_id=batch,
                material_id=material,
                quantity_used=consumption.actual_quantity_used,
                unit_cost=material.standard_cost,
                total_cost=consumption.actual_quantity_used * material.standard_cost,
            )

        # ── 2. Oil cost (sensor / flow-meter logs → also BatchMaterialCost) ──
        for log in OilConsumptionLog.objects.filter(
            batch_id=batch_id
        ).select_related('oil_material_id'):
            if not log.oil_material_id:
                continue
            BatchMaterialCost.objects.create(
                batch_id=batch,
                material_id=log.oil_material_id,
                quantity_used=log.quantity_added,
                unit_cost=log.oil_material_id.standard_cost,
                total_cost=log.quantity_added * log.oil_material_id.standard_cost,
            )

        material_total = BatchMaterialCost.objects.filter(
            batch_id=batch
        ).aggregate(s=Sum('total_cost'))['s'] or Decimal('0')

        # ── 3. Labour cost ───────────────────────────────────────────────────
        labour_total = sum(
            Decimal(str(l.hours_worked)) * Decimal(str(l.hourly_rate))
            for l in LabourLog.objects.filter(batch_id=batch_id)
        )

        # ── 4. Machine cost ──────────────────────────────────────────────────
        BatchMachineCost.objects.filter(batch_id=batch).delete()

        machine_logs = list(MachineLog.objects.filter(batch_id=batch_id))
        for mlog in machine_logs:
            batch_date = batch.start_time.date() if batch.start_time else now().date()
            rate = MachineCostRate.objects.filter(
                machine_id=mlog.machine_id,
                effective_from__lte=batch_date,
            ).filter(
                Q(effective_to__isnull=True) | Q(effective_to__gte=batch_date)
            ).order_by('-effective_from').first()

            cost_per_hour = Decimal(str(rate.cost_per_hour)) if rate else Decimal('0')
            runtime_hours = Decimal(str(mlog.runtime_minutes)) / Decimal('60')

            BatchMachineCost.objects.create(
                batch_id=batch,
                machine_id=mlog.machine_id,
                runtime_hours=runtime_hours,
                hourly_rate=cost_per_hour,
                total_cost=runtime_hours * cost_per_hour,
            )

        machine_total = BatchMachineCost.objects.filter(
            batch_id=batch
        ).aggregate(s=Sum('total_cost'))['s'] or Decimal('0')

        # ── 5. Overhead allocation (machine-hours basis) ─────────────────────
        BatchOverheadCost.objects.filter(batch_id=batch).delete()

        total_month_machine_minutes = (
            MachineLog.objects.filter(
                start_time__month=now().month,
                start_time__year=now().year,
            ).aggregate(total=Sum('runtime_minutes'))['total'] or 0
        )
        total_month_hours = Decimal(str(total_month_machine_minutes)) / Decimal('60')

        batch_hours = sum(
            Decimal(str(ml.runtime_minutes)) for ml in machine_logs
        ) / Decimal('60')

        overhead_total = Decimal('0')
        for overhead in FactoryOverhead.objects.filter(is_active=True):
            allocated = (batch_hours / max(total_month_hours, Decimal('1'))) * overhead.monthly_cost
            BatchOverheadCost.objects.create(
                batch_id=batch,
                overhead_id=overhead,
                allocated_cost=allocated,
            )
            overhead_total += allocated

        # ── 6. Waste cost ────────────────────────────────────────────────────
        BatchWasteCost.objects.filter(batch_id=batch).delete()

        for waste in ProductionWaste.objects.filter(
            batch_id=batch_id
        ).exclude(material_id=None).select_related('material_id'):
            BatchWasteCost.objects.create(
                batch_id=batch,
                material_id=waste.material_id,
                waste_qty=waste.quantity,
                cost_per_unit=waste.material_id.standard_cost,
                total_cost=waste.quantity * waste.material_id.standard_cost,
            )

        waste_total = BatchWasteCost.objects.filter(
            batch_id=batch
        ).aggregate(s=Sum('total_cost'))['s'] or Decimal('0')

        # ── 7. BatchCostSummary ──────────────────────────────────────────────
        summary, _ = BatchCostSummary.objects.update_or_create(
            batch_id=batch,
            defaults={
                'material_cost': material_total,
                'labour_cost':   labour_total,
                'machine_cost':  machine_total,
                'overhead_cost': overhead_total,
                'waste_cost':    waste_total,
                'calculated_at': now(),
                'calculated_by': user,
            },
        )

        # ── 8. UnitCost ──────────────────────────────────────────────────────
        try:
            output = ProductionOutput.objects.get(
                batch_id=batch_id, quality_status='Approved'
            )
            qty_produced = output.quantity_produced
        except ProductionOutput.DoesNotExist:
            qty_produced = Decimal('0')

        unit_cost_val = (
            summary.total_batch_cost / qty_produced
            if qty_produced and qty_produced > 0
            else Decimal('0')
        )

        UnitCost.objects.update_or_create(
            batch_id=batch,
            defaults={
                'product_id':        batch.product_id,
                'total_batch_cost':  summary.total_batch_cost,
                'quantity_produced': qty_produced,
                'unit_cost':         unit_cost_val,
                'cost_date':         batch.start_time.date() if batch.start_time else now().date(),
            },
        )

        # ── 9. CostVariance ──────────────────────────────────────────────────
        product = batch.product_id
        variance_val = unit_cost_val - Decimal(str(product.standard_cost))

        CostVariance.objects.create(
            batch_id=batch,
            product_id=product,
            actual_cost=unit_cost_val,
            standard_cost=product.standard_cost,
            variance=variance_val,
        )

        # ── 10. SKUProfitability ─────────────────────────────────────────────
        CostingService._update_sku_profitability(batch, summary, qty_produced)

        logger.info(
            "CostingService: batch %s costed — total=%s unit_cost=%s variance=%s",
            batch.batch_number, summary.total_batch_cost, unit_cost_val, variance_val,
        )
        return summary

    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _update_sku_profitability(batch, summary, qty_produced):
        from .models import UnitCost, SKUProfitability

        today        = now().date()
        period_start = today.replace(day=1)
        period_end   = today

        # Aggregate all UnitCosts for this product in the current month
        uc_qs        = UnitCost.objects.filter(
            product_id=batch.product_id,
            cost_date__gte=period_start,
            cost_date__lte=period_end,
        )
        total_cost   = uc_qs.aggregate(s=Sum('total_batch_cost'))['s'] or Decimal('0')
        total_units  = uc_qs.aggregate(s=Sum('quantity_produced'))['s'] or Decimal('0')
        batch_count  = uc_qs.count()

        product       = batch.product_id
        selling_price = Decimal(str(getattr(product, 'selling_price', 0) or 0))
        total_revenue = selling_price * total_units

        SKUProfitability.objects.update_or_create(
            product_id=batch.product_id,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'batches_counted':       batch_count,
                'total_units_produced':  total_units,
                'total_production_cost': total_cost,
                'total_revenue':         total_revenue,
            },
        )
