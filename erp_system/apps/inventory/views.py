from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import (
    InventoryLedger, BatchTable, InventorySummary, StockTransfer,
    TransferItem, StockReservation, WarehousePicking, PickingItem, InventoryAdjustment
)
from .serializers import (
    InventoryLedgerSerializer, BatchTableSerializer, InventorySummarySerializer,
    StockTransferSerializer, TransferItemSerializer, StockReservationSerializer,
    WarehousePickingSerializer, PickingItemSerializer, InventoryAdjustmentSerializer
)


# ─────────────────────────────────────────────────────────────────────────────
# Batch Traceability Endpoint
# GET /api/inventory/batches/{batch_number}/trace/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def batch_trace(request, batch_number):
    """
    Full end-to-end traceability for a production batch:
      - batch_info        : BatchTable details + product name
      - raw_materials     : every MaterialIssue with material & supplier info
      - production_stages : BatchStageLog ordered by stage sequence
      - yield             : ProductionYield record
      - oil_logs          : OilConsumptionLog entries
      - costing           : BatchCostSummary
      - distribution      : Sales-dispatch ledger lines for the batch
    """
    from apps.manufacturing.models import (
        ProductionBatch, MaterialIssue, BatchStageLog,
        ProductionYield, OilConsumptionLog, BatchCostSummary,
    )
    from apps.manufacturing.serializers import (
        ProductionBatchSerializer, MaterialIssueSerializer, BatchStageLogSerializer,
        ProductionYieldSerializer, OilConsumptionLogSerializer, BatchCostSummarySerializer,
    )

    # ── 1. Resolve the inventory batch (404 if not found) ──────────────────
    inv_batch  = get_object_or_404(
        BatchTable.objects.select_related('product_id', 'material_id'),
        batch_number=batch_number,
    )

    # ── 2. Resolve the production batch (may not exist yet) ─────────────────
    prod_batch = ProductionBatch.objects.filter(batch_number=batch_number).first()

    # ── 3. Build batch_info ─────────────────────────────────────────────────
    batch_info = {
        'batch_number'   : inv_batch.batch_number,
        'production_date': str(inv_batch.production_date),
        'expiry_date'    : str(inv_batch.expiry_date) if inv_batch.expiry_date else None,
        'status'         : inv_batch.status,
        'product_id'     : str(inv_batch.product_id_id) if inv_batch.product_id_id else None,
        'product_name'   : (
            inv_batch.product_id.product_name if inv_batch.product_id else None
        ),
        'product_sku'    : (
            inv_batch.product_id.sku_code if inv_batch.product_id else None
        ),
        'material_id'    : str(inv_batch.material_id_id) if inv_batch.material_id_id else None,
        'material_name'  : (
            inv_batch.material_id.material_name if inv_batch.material_id else None
        ),
    }

    # If no production batch exists yet return partial info
    if prod_batch is None:
        return Response({
            'batch_info'       : batch_info,
            'production_record': None,
            'raw_materials'    : [],
            'production_stages': [],
            'yield'            : None,
            'oil_logs'         : [],
            'costing'          : None,
            'distribution'     : [],
            'warning'          : 'No production batch record found for this batch number.',
        })

    # ── 4. Enrich batch_info with production details ─────────────────────────
    batch_info.update({
        'production_batch_id': str(prod_batch.id),
        'planned_quantity'   : str(prod_batch.planned_quantity),
        'start_datetime'     : prod_batch.start_time.isoformat() if prod_batch.start_time else None,
        'end_datetime'       : prod_batch.end_time.isoformat()   if prod_batch.end_time   else None,
        'production_status'  : prod_batch.status,
    })

    # ── 5. Pull related records ──────────────────────────────────────────────
    raw_materials = (
        MaterialIssue.objects
        .filter(batch_id=prod_batch.id)
        .select_related('material_id', 'issued_by')
    )

    production_stages = (
        BatchStageLog.objects
        .filter(batch_id=prod_batch.id)
        .select_related('stage_id', 'operator_id', 'machine_id')
        .order_by('stage_id__sequence_number')
    )

    yield_record = (
        ProductionYield.objects
        .filter(batch_id=prod_batch.id)
        .select_related('batch_id')
        .first()
    )

    oil_logs = (
        OilConsumptionLog.objects
        .filter(batch_id=prod_batch.id)
        .select_related('oil_material_id', 'operator_id')
    )

    costing = (
        BatchCostSummary.objects
        .filter(batch_id=prod_batch.id)
        .select_related('calculated_by')
        .first()
    )

    distribution = (
        InventoryLedger.objects
        .filter(batch_number=batch_number, movement_type='DISPATCH')
        .select_related('warehouse_id', 'user_id')
    )

    # ── 6. Serialize & return ────────────────────────────────────────────────
    return Response({
        'batch_info'       : batch_info,
        'raw_materials'    : MaterialIssueSerializer(raw_materials,       many=True).data,
        'production_stages': BatchStageLogSerializer(production_stages,   many=True).data,
        'yield'            : ProductionYieldSerializer(yield_record).data if yield_record else None,
        'oil_logs'         : OilConsumptionLogSerializer(oil_logs,        many=True).data,
        'costing'          : BatchCostSummarySerializer(costing).data     if costing else None,
        'distribution'     : InventoryLedgerSerializer(distribution,      many=True).data,
    })

class InventoryLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLedger.objects.all()
    serializer_class = InventoryLedgerSerializer


class InventorySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventorySummary.objects.all()
    serializer_class = InventorySummarySerializer


class BatchTableViewSet(viewsets.ModelViewSet):
    queryset = BatchTable.objects.all()
    serializer_class = BatchTableSerializer


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferSerializer

    @action(detail=True, methods=['post'], url_path='items')
    def items(self, request, pk=None):
        transfer = self.get_object()
        serializer = TransferItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(transfer_id=transfer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='dispatch-transfer')
    def dispatch_transfer(self, request, pk=None):
        """Dispatch items from source warehouse (creates ledger out)."""
        transfer = self.get_object()
        if transfer.status != 'Draft':
            return Response({'error': 'Can only dispatch Draft transfers.'}, status=400)
            
        with transaction.atomic():
            for item in transfer.items.all():
                # Deduction entry
                InventoryLedger.objects.create(
                    item_type='Product' if item.product_id else 'Material',
                    product_id=item.product_id,
                    material_id=item.material_id,
                    warehouse_id=transfer.source_warehouse,
                    batch_number=item.batch_number,
                    movement_type='TRANSFER',
                    quantity_out=item.quantity,
                    reference_type='StockTransfer',
                    reference_id=transfer.id,
                    user_id=request.user if request.user.is_authenticated else None
                )
            
            from datetime import date
            transfer.status = 'In Transit'
            transfer.dispatched_date = date.today()
            transfer.save()
            
        return Response({'status': 'Transfer dispatched'})

    @action(detail=True, methods=['post'], url_path='receive-transfer')
    def receive_transfer(self, request, pk=None):
        """Receive items into destination warehouse (creates ledger in)."""
        transfer = self.get_object()
        if transfer.status != 'In Transit':
            return Response({'error': 'Can only receive In Transit transfers.'}, status=400)
            
        with transaction.atomic():
            for item in transfer.items.all():
                # Addition entry
                InventoryLedger.objects.create(
                    item_type='Product' if item.product_id else 'Material',
                    product_id=item.product_id,
                    material_id=item.material_id,
                    warehouse_id=transfer.destination_warehouse,
                    batch_number=item.batch_number,
                    movement_type='TRANSFER',
                    quantity_in=item.quantity,
                    reference_type='StockTransfer',
                    reference_id=transfer.id,
                    user_id=request.user if request.user.is_authenticated else None
                )
            
            from datetime import date
            transfer.status = 'Received'
            transfer.received_date = date.today()
            transfer.save()
            
        return Response({'status': 'Transfer received'})


class StockReservationViewSet(viewsets.ModelViewSet):
    queryset = StockReservation.objects.all()
    serializer_class = StockReservationSerializer


class WarehousePickingViewSet(viewsets.ModelViewSet):
    queryset = WarehousePicking.objects.all()
    serializer_class = WarehousePickingSerializer

    @action(detail=True, methods=['post'], url_path='items')
    def items(self, request, pk=None):
        picking = self.get_object()
        serializer = PickingItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(picking_id=picking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = InventoryAdjustment.objects.all()
    serializer_class = InventoryAdjustmentSerializer

    def perform_create(self, serializer):
        adj = serializer.save()
        # Auto trigger the immediate Ledger creation for the adjustment difference
        # Depending on type, it's either an addition or deduction
        q_in, q_out = 0, 0
        if adj.adjustment_type in ['Damaged', 'Shrinkage']:
            q_out = abs(adj.quantity)
        elif adj.adjustment_type == 'Found':
            q_in = abs(adj.quantity)
        else: # Correction
            q_in = adj.quantity if adj.quantity > 0 else 0
            q_out = abs(adj.quantity) if adj.quantity < 0 else 0
        
        InventoryLedger.objects.create(
            item_type='Product' if adj.product_id else 'Material',
            product_id=adj.product_id,
            material_id=adj.material_id,
            warehouse_id=adj.warehouse_id,
            batch_number=adj.batch_number,
            movement_type='ADJUSTMENT',
            quantity_in=q_in,
            quantity_out=q_out,
            reference_type='InventoryAdjustment',
            reference_id=adj.id,
            user_id=self.request.user if self.request.user and self.request.user.is_authenticated else None
        )
