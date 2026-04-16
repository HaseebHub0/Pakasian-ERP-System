"""
ManufacturingService — business logic layer for the manufacturing app.

All multi-model write operations live here.  Views and tasks delegate to this.
"""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone


class ManufacturingService:
    """Stateless service class; every method is a @staticmethod."""

    # ─── Production Order lifecycle ────────────────────────────────────────

    @staticmethod
    def release_order(order) -> object:
        if order.status != 'Planned':
            raise ValueError(f"Cannot release order in status '{order.status}'.")
        order.status = 'Released'
        order.save(update_fields=['status', 'updated_at'])
        return order

    @staticmethod
    def start_order(order, user=None) -> object:
        if order.status not in ('Released', 'Planned'):
            raise ValueError(f"Cannot start order in status '{order.status}'.")
        from datetime import date
        order.status            = 'In Progress'
        order.actual_start_date = date.today()
        order.save(update_fields=['status', 'actual_start_date', 'updated_at'])
        return order

    @staticmethod
    def complete_order(order) -> object:
        if order.status != 'In Progress':
            raise ValueError(f"Cannot complete order in status '{order.status}'.")
        from datetime import date
        order.status          = 'Completed'
        order.actual_end_date = date.today()
        order.save(update_fields=['status', 'actual_end_date', 'updated_at'])
        return order

    # ─── Batch lifecycle ────────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def start_batch(batch) -> object:
        """Pending → Running.  Creates a BatchStageLog row for every active stage."""
        if batch.status != 'Pending':
            raise ValueError(f"Batch '{batch.batch_number}' is not Pending.")

        batch.status     = 'Running'
        batch.start_time = timezone.now()
        batch.save(update_fields=['status', 'start_time', 'updated_at'])

        from .models import ProductionStage, BatchStageLog
        for stage in ProductionStage.objects.filter(is_active=True):
            BatchStageLog.objects.get_or_create(
                batch_id=batch,
                stage_id=stage,
            )
        return batch

    @staticmethod
    def pause_batch(batch) -> object:
        if batch.status != 'Running':
            raise ValueError(f"Batch '{batch.batch_number}' is not Running.")
        batch.status = 'Paused'
        batch.save(update_fields=['status', 'updated_at'])
        return batch

    @staticmethod
    def resume_batch(batch) -> object:
        if batch.status != 'Paused':
            raise ValueError(f"Batch '{batch.batch_number}' is not Paused.")
        batch.status = 'Running'
        batch.save(update_fields=['status', 'updated_at'])
        return batch

    @staticmethod
    @transaction.atomic
    def complete_batch(batch_id: str) -> object:
        """
        Verify all 6 active stages have end_time set.
        Calculate input_qty from stage-1 input and output_qty from stage-6 output.
        Create ProductionYield entry.
        Update ProductionBatch.status=Completed, end_time=now(), actual_quantity=output_qty.
        """
        from .models import ProductionBatch, ProductionStage, BatchStageLog, ProductionYield

        batch = ProductionBatch.objects.select_related('product_id').get(pk=batch_id)

        active_stages = list(ProductionStage.objects.filter(is_active=True).order_by('sequence_number'))
        stage_logs    = {
            log.stage_id_id: log
            for log in BatchStageLog.objects.filter(batch_id=batch).select_related('stage_id')
        }

        # Validate all stages completed
        incomplete = [
            s.name for s in active_stages
            if s.pk not in stage_logs or not stage_logs[s.pk].end_time
        ]
        if incomplete:
            raise ValueError(
                f"Cannot complete batch — stages not finished: {', '.join(incomplete)}"
            )

        # Stage 1 → input qty
        stage_1      = active_stages[0]
        input_qty    = stage_logs[stage_1.pk].input_quantity or Decimal('0')

        # Last active stage → output qty
        stage_last   = active_stages[-1]
        raw_output   = stage_logs[stage_last.pk].output_quantity
        output_qty   = raw_output if raw_output is not None else Decimal('0')

        # Create / update yield record
        ProductionYield.objects.update_or_create(
            batch_id=batch,
            defaults={
                'input_qty':  input_qty,
                'output_qty': output_qty,
            },
        )

        # Complete the batch
        batch.status          = 'Completed'
        batch.end_time        = timezone.now()
        batch.actual_quantity = output_qty
        batch.save(update_fields=['status', 'end_time', 'actual_quantity', 'updated_at'])

        return batch

    # ─── Cost roll-up ───────────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def calculate_cost(batch, user=None) -> object:
        """Sum material + oil costs and save/update a BatchCostSummary."""
        from .models import MaterialIssue, OilConsumptionLog, BatchCostSummary

        mat_costs = MaterialIssue.objects.filter(batch_id=batch)
        # MaterialIssue no longer stores total_cost; derive from qty × material standard_cost
        material_total = sum(
            (issue.quantity_issued * (issue.material_id.standard_cost or Decimal('0')))
            for issue in mat_costs.select_related('material_id')
        )

        oil_costs = OilConsumptionLog.objects.filter(batch_id=batch).select_related('oil_material_id')
        oil_total = Decimal('0')
        for log in oil_costs:
            if log.oil_material_id:
                consumed = max(log.quantity_added - log.quantity_remaining, Decimal('0'))
                oil_total += consumed * (log.oil_material_id.standard_cost or Decimal('0'))

        summary, _ = BatchCostSummary.objects.update_or_create(
            batch_id=batch,
            defaults={
                'material_cost': material_total,
                'oil_cost':      oil_total,
                'calculated_at': timezone.now(),
                'calculated_by': user,
            },
        )
        return summary
