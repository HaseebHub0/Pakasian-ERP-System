from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    BatchMaterialCost,
    LabourLog,
    MachineCostRate,
    BatchMachineCost,
    FactoryOverhead,
    BatchOverheadCost,
    BatchWasteCost,
    BatchCostSummary,
    UnitCost,
    CostVariance,
    SKUProfitability,
)
from .serializers import (
    BatchMaterialCostSerializer,
    LabourLogSerializer,
    MachineCostRateSerializer,
    BatchMachineCostSerializer,
    FactoryOverheadSerializer,
    BatchOverheadCostSerializer,
    BatchWasteCostSerializer,
    BatchCostSummarySerializer,
    UnitCostSerializer,
    CostVarianceSerializer,
    SKUProfitabilitySerializer,
    BatchSummarySnapshotSerializer,
)


# ─── Reference / master data ──────────────────────────────────────────────────

class MachineCostRateViewSet(viewsets.ModelViewSet):
    queryset           = MachineCostRate.objects.select_related('machine_id').all()
    serializer_class   = MachineCostRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['machine_id']


class FactoryOverheadViewSet(viewsets.ModelViewSet):
    queryset           = FactoryOverhead.objects.all()
    serializer_class   = FactoryOverheadSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['is_active']


# ─── Batch-level cost records ─────────────────────────────────────────────────

class BatchMaterialCostViewSet(viewsets.ModelViewSet):
    serializer_class   = BatchMaterialCostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'material_id']

    def get_queryset(self):
        qs = BatchMaterialCost.objects.select_related('batch_id', 'material_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


class LabourLogViewSet(viewsets.ModelViewSet):
    serializer_class   = LabourLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'stage_id', 'shift_date']

    def get_queryset(self):
        qs = LabourLog.objects.select_related('batch_id', 'stage_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


class BatchMachineCostViewSet(viewsets.ModelViewSet):
    serializer_class   = BatchMachineCostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'machine_id']

    def get_queryset(self):
        qs = BatchMachineCost.objects.select_related('batch_id', 'machine_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


class BatchOverheadCostViewSet(viewsets.ModelViewSet):
    serializer_class   = BatchOverheadCostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'overhead_id']

    def get_queryset(self):
        qs = BatchOverheadCost.objects.select_related('batch_id', 'overhead_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


class BatchWasteCostViewSet(viewsets.ModelViewSet):
    serializer_class   = BatchWasteCostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'material_id']

    def get_queryset(self):
        qs = BatchWasteCost.objects.select_related('batch_id', 'material_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


# ─── Summary / analytics ──────────────────────────────────────────────────────

class BatchCostSummaryViewSet(viewsets.ModelViewSet):
    queryset = BatchCostSummary.objects.select_related(
        'batch_id', 'calculated_by'
    ).all()
    serializer_class   = BatchCostSummarySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id']


class UnitCostViewSet(viewsets.ModelViewSet):
    queryset = UnitCost.objects.select_related('batch_id', 'product_id').all()
    serializer_class   = UnitCostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['product_id', 'cost_date']


class CostVarianceViewSet(viewsets.ModelViewSet):
    queryset           = CostVariance.objects.select_related('batch_id', 'product_id').all()
    serializer_class   = CostVarianceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'product_id']


class SKUProfitabilityViewSet(viewsets.ModelViewSet):
    """
    GET /api/costing/sku-profitability/
    GET /api/costing/sku-profitability/?product_id=<uuid>
    """
    queryset = SKUProfitability.objects.select_related('product_id').all()
    serializer_class   = SKUProfitabilitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['product_id', 'period_start', 'period_end']


# ─── Batch Summary snapshot endpoint ─────────────────────────────────────────

class BatchSummaryViewSet(viewsets.ViewSet):
    """
    GET /api/costing/batch-summary/{batch_id}/
    Returns the full costing breakdown for a single production batch.

    POST /api/costing/batch-summary/{batch_id}/recalculate/
    Re-runs the costing task synchronously and returns fresh results.
    """
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        from apps.manufacturing.models import ProductionBatch
        batch = get_object_or_404(ProductionBatch, pk=pk)

        try:
            summary = batch.costing_summary
        except BatchCostSummary.DoesNotExist:
            return Response(
                {'detail': 'No costing data for this batch. Run recalculate first.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        snapshot = {
            'summary':   summary,
            'unit_cost': getattr(batch, 'unit_cost', None),
            'material':  batch.material_costs.all(),
            'labour':    batch.labour_logs.all(),
            'machine':   batch.machine_costs.all(),
            'overhead':  batch.overhead_costs.all(),
            'waste':     batch.waste_costs.all(),
            'variances': batch.cost_variances.all(),
        }
        return Response(BatchSummarySnapshotSerializer(snapshot).data)

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Synchronously re-runs costing (use for testing / manual override)."""
        from .services import CostingService
        try:
            summary = CostingService.calculate_batch_cost(pk, user=request.user)
            return Response(BatchCostSummarySerializer(summary).data)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
