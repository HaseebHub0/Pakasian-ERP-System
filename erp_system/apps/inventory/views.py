from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
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
        # Assuming adj.quantity means positive=addition, negative=deduction
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
