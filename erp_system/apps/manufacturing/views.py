from decimal import Decimal, InvalidOperation

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    ProductionStage, ProductionOrder, ProductionOrderItem,
    ProductionBatch, BatchStageLog, MaterialReservation,
    MaterialIssue, MaterialConsumption, ProductionYield,
    ProductionWaste, OilConsumptionLog, MachineLog,
    PackingLog, ProductionOutput, BatchCostSummary,
)
from .serializers import (
    ProductionStageSerializer, ProductionOrderSerializer,
    ProductionOrderItemSerializer, ProductionBatchSerializer,
    BatchStageLogSerializer, MaterialReservationSerializer,
    MaterialIssueSerializer, MaterialConsumptionSerializer,
    ProductionYieldSerializer, ProductionWasteSerializer,
    OilConsumptionLogSerializer, MachineLogSerializer,
    PackingLogSerializer, ProductionOutputSerializer,
    BatchCostSummarySerializer, BatchTraceSerializer,
)
from .services import ManufacturingService


# ─── Production Stage ─────────────────────────────────────────────────────────

class ProductionStageViewSet(viewsets.ModelViewSet):
    queryset           = ProductionStage.objects.all()
    serializer_class   = ProductionStageSerializer
    permission_classes = [IsAuthenticated]


# ─── Production Order ─────────────────────────────────────────────────────────

class ProductionOrderViewSet(viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.select_related(
        'product_id', 'created_by', 'approved_by'
    ).prefetch_related('items').all()
    serializer_class   = ProductionOrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['status', 'product_id']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        order = self.get_object()
        try:
            order = ManufacturingService.release_order(order)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        order = self.get_object()
        try:
            order = ManufacturingService.start_order(order, request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        order = self.get_object()
        try:
            order = ManufacturingService.complete_order(order)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)


# ─── Production Order Item ────────────────────────────────────────────────────

class ProductionOrderItemViewSet(viewsets.ModelViewSet):
    serializer_class   = ProductionOrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProductionOrderItem.objects.filter(
            production_order_id=self.kwargs['order_pk']
        ).select_related('product_id')


# ─── Production Batch ─────────────────────────────────────────────────────────

class ProductionBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductionBatch.objects.select_related(
        'product_id', 'production_order_id', 'production_line_id', 'operator_id'
    ).all()
    serializer_class   = ProductionBatchSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['status', 'product_id', 'production_order_id']

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        batch = self.get_object()
        try:
            batch = ManufacturingService.start_batch(batch)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionBatchSerializer(batch).data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        batch = self.get_object()
        try:
            batch = ManufacturingService.pause_batch(batch)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionBatchSerializer(batch).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        batch = self.get_object()
        try:
            batch = ManufacturingService.resume_batch(batch)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionBatchSerializer(batch).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        batch = self.get_object()
        try:
            batch = ManufacturingService.complete_batch(str(batch.pk))
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionBatchSerializer(batch).data)

    @action(detail=True, methods=['get'])
    def trace(self, request, pk=None):
        """Full traceability snapshot for a batch."""
        batch = self.get_object()
        return Response(BatchTraceSerializer(batch).data)

    @action(detail=True, methods=['post'], url_path='calculate-cost')
    def calculate_cost(self, request, pk=None):
        batch   = self.get_object()
        summary = ManufacturingService.calculate_cost(batch, request.user)
        return Response(BatchCostSummarySerializer(summary).data)


# ─── Batch Stage Log ──────────────────────────────────────────────────────────

class BatchStageLogViewSet(viewsets.ModelViewSet):
    serializer_class   = BatchStageLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BatchStageLog.objects.filter(
            batch_id=self.kwargs['batch_pk']
        ).select_related('stage_id', 'machine_id', 'operator_id')


# ─── Material Reservation ─────────────────────────────────────────────────────

class MaterialReservationViewSet(viewsets.ModelViewSet):
    serializer_class   = MaterialReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MaterialReservation.objects.filter(
            batch_id=self.kwargs.get('batch_pk')
        ).select_related('material_id', 'warehouse_id')

    @action(detail=True, methods=['post'])
    def cancel(self, request, **kwargs):
        reservation = self.get_object()
        if reservation.status == 'Issued':
            return Response({'detail': 'Already issued — cannot cancel.'},
                            status=status.HTTP_400_BAD_REQUEST)
        reservation.status = 'Cancelled'
        reservation.save(update_fields=['status', 'updated_at'])
        return Response(MaterialReservationSerializer(reservation).data)


# ─── Material Issue ───────────────────────────────────────────────────────────

class MaterialIssueViewSet(viewsets.ModelViewSet):
    serializer_class   = MaterialIssueSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'material_id']

    def get_queryset(self):
        qs = MaterialIssue.objects.select_related('material_id', 'warehouse_id', 'issued_by')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs

    def perform_create(self, serializer):
        serializer.save(issued_by=self.request.user)


# ─── Material Consumption ─────────────────────────────────────────────────────

class MaterialConsumptionViewSet(viewsets.ModelViewSet):
    serializer_class   = MaterialConsumptionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'material_id', 'stage_id']

    def get_queryset(self):
        qs = MaterialConsumption.objects.select_related('material_id', 'stage_id', 'recorded_by')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


# ─── Production Yield ─────────────────────────────────────────────────────────

class ProductionYieldViewSet(viewsets.ModelViewSet):
    queryset           = ProductionYield.objects.select_related('batch_id').all()
    serializer_class   = ProductionYieldSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id']


# ─── Production Waste ─────────────────────────────────────────────────────────

class ProductionWasteViewSet(viewsets.ModelViewSet):
    serializer_class   = ProductionWasteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'waste_type', 'stage_id']

    def get_queryset(self):
        qs = ProductionWaste.objects.select_related('stage_id', 'material_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


# ─── Oil Consumption Log ──────────────────────────────────────────────────────

class OilConsumptionLogViewSet(viewsets.ModelViewSet):
    serializer_class   = OilConsumptionLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id']

    def get_queryset(self):
        qs = OilConsumptionLog.objects.select_related('oil_material_id', 'operator_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs

    def perform_create(self, serializer):
        serializer.save(operator_id=self.request.user)


# ─── Machine Log ──────────────────────────────────────────────────────────────

class MachineLogViewSet(viewsets.ModelViewSet):
    serializer_class   = MachineLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'machine_id']

    def get_queryset(self):
        qs = MachineLog.objects.select_related('machine_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs


# ─── Packing Log ──────────────────────────────────────────────────────────────

class PackingLogViewSet(viewsets.ModelViewSet):
    serializer_class   = PackingLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id']

    def get_queryset(self):
        qs = PackingLog.objects.select_related('operator_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs

    def perform_create(self, serializer):
        serializer.save(operator_id=self.request.user)


# ─── Production Output ────────────────────────────────────────────────────────

class ProductionOutputViewSet(viewsets.ModelViewSet):
    serializer_class   = ProductionOutputSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id', 'quality_status', 'product_id']

    def get_queryset(self):
        qs = ProductionOutput.objects.select_related('product_id', 'warehouse_id')
        if batch_pk := self.kwargs.get('batch_pk'):
            qs = qs.filter(batch_id=batch_pk)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, **kwargs):
        output = self.get_object()
        if output.quality_status != 'Pending':
            return Response({'detail': f"Output is already '{output.quality_status}'."},
                            status=status.HTTP_400_BAD_REQUEST)
        output.quality_status = 'Approved'
        output.save()   # triggers _on_approved() side-effects
        return Response(ProductionOutputSerializer(output).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, **kwargs):
        output = self.get_object()
        if output.quality_status != 'Pending':
            return Response({'detail': f"Output is already '{output.quality_status}'."},
                            status=status.HTTP_400_BAD_REQUEST)
        output.quality_status = 'Rejected'
        output.save()
        return Response(ProductionOutputSerializer(output).data)


# ─── Batch Cost Summary ───────────────────────────────────────────────────────

class BatchCostSummaryViewSet(viewsets.ModelViewSet):
    queryset           = BatchCostSummary.objects.select_related('batch_id', 'calculated_by').all()
    serializer_class   = BatchCostSummarySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['batch_id']
