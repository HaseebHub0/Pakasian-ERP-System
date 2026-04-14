import datetime

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import require_permission

from .models import (
    BatchTable,
    InventoryAdjustment,
    InventoryLedger,
    InventorySummary,
    StockReservation,
    StockTransfer,
    TransferItem,
    WarehousePicking,
    PickingItem,
)
from .serializers import (
    BatchTableSerializer,
    InventoryAdjustmentSerializer,
    InventoryLedgerSerializer,
    InventorySummarySerializer,
    PickingItemSerializer,
    StockReservationSerializer,
    StockTransferSerializer,
    TransferItemSerializer,
    WarehousePickingSerializer,
)
from .services import InventoryService


# ---------------------------------------------------------------------------
# Inventory Ledger — read-only with filtering
# ---------------------------------------------------------------------------

class InventoryLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list/retrieve ledger entries.

    Supported query params:
      item_id       — UUID of a product or material
      warehouse_id  — UUID of a warehouse
      date_from     — YYYY-MM-DD inclusive lower bound on timestamp
      date_to       — YYYY-MM-DD inclusive upper bound on timestamp
    """
    serializer_class = InventoryLedgerSerializer

    def get_queryset(self):
        qs = InventoryLedger.objects.all()
        p = self.request.query_params

        item_id = p.get('item_id')
        if item_id:
            qs = qs.filter(Q(product_id=item_id) | Q(material_id=item_id))

        warehouse_id = p.get('warehouse_id')
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        date_from = p.get('date_from')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)

        date_to = p.get('date_to')
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        return qs


# ---------------------------------------------------------------------------
# Inventory Summary — read-only with filtering
# ---------------------------------------------------------------------------

class InventorySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list/retrieve summary positions.

    Supported query params:
      warehouse_id  — UUID of a warehouse
      item_type     — 'product' | 'material'
    """
    serializer_class = InventorySummarySerializer

    def get_queryset(self):
        qs = InventorySummary.objects.all()
        p = self.request.query_params

        warehouse_id = p.get('warehouse_id')
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        item_type = p.get('item_type', '').lower()
        if item_type == 'product':
            qs = qs.filter(product_id__isnull=False)
        elif item_type == 'material':
            qs = qs.filter(material_id__isnull=False)

        return qs


# ---------------------------------------------------------------------------
# Batch Table — full CRUD + expire + trace
# ---------------------------------------------------------------------------

class BatchTableViewSet(viewsets.ModelViewSet):
    """
    CRUD for batches.  Detail routes use batch_number as the lookup key.

    Custom actions:
      POST  /batches/{batch_number}/expire/  — mark batch Expired
      GET   /batches/{batch_number}/trace/   — full ledger trace for this batch
    """
    queryset = BatchTable.objects.all()
    serializer_class = BatchTableSerializer
    lookup_field = 'batch_number'

    @action(detail=True, methods=['post'], url_path='expire')
    def expire(self, request, batch_number=None):
        """Mark a batch as Expired."""
        batch = self.get_object()
        if batch.status == 'Expired':
            return Response(
                {'detail': 'Batch is already Expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        batch.status = 'Expired'
        batch.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(batch).data)

    @action(detail=True, methods=['get'], url_path='trace')
    def trace(self, request, batch_number=None):
        """Return all InventoryLedger rows for this batch (full traceability)."""
        batch = self.get_object()
        ledger_qs = (
            InventoryLedger.objects
            .filter(batch_number=batch.batch_number)
            .order_by('timestamp')
        )
        serializer = InventoryLedgerSerializer(ledger_qs, many=True)
        return Response({
            'batch_number': batch.batch_number,
            'batch_id': str(batch.pk),
            'status': batch.status,
            'trace': serializer.data,
        })


# ---------------------------------------------------------------------------
# Stock Transfers
# ---------------------------------------------------------------------------

class StockTransferViewSet(viewsets.ModelViewSet):
    """
    list / create transfers.

    Custom actions:
      POST /transfers/{id}/dispatch/  — dispatch items from source warehouse
      POST /transfers/{id}/receive/   — receive items into destination warehouse
    """
    queryset = StockTransfer.objects.prefetch_related('items').all()
    serializer_class = StockTransferSerializer

    # --- nested items endpoint (existing, kept for compatibility) ---
    @action(detail=True, methods=['post'], url_path='items')
    def items(self, request, pk=None):
        transfer = self.get_object()
        serializer = TransferItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(transfer_id=transfer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # --- new spec-compliant action names ---

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch(self, request, pk=None):
        """
        Dispatch a Draft transfer: post Transfer-Out ledger entries for each
        item and move status to In Transit.
        """
        transfer = self.get_object()
        if transfer.status != 'Draft':
            return Response(
                {'detail': 'Only Draft transfers can be dispatched.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for item in transfer.items.all():
                item_type = 'Product' if item.product_id else 'Material'
                item_id = item.product_id if item_type == 'Product' else item.material_id
                InventoryService.post_ledger_entry(
                    item_type=item_type,
                    item_id=item_id,
                    warehouse_id=transfer.source_warehouse,
                    bin_id=None,
                    batch_number=item.batch_number,
                    movement_type='TRANSFER',
                    qty_in=0,
                    qty_out=item.quantity,
                    reference_type='StockTransfer',
                    reference_id=transfer.id,
                    user_id=request.user if request.user.is_authenticated else None,
                )
            transfer.status = 'In Transit'
            transfer.dispatched_date = datetime.date.today()
            transfer.save(update_fields=['status', 'dispatched_date', 'updated_at'])

        return Response({'detail': 'Transfer dispatched.'})

    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        """
        Receive an In-Transit transfer via InventoryService.receive_stock_transfer().
        """
        transfer = self.get_object()
        try:
            InventoryService.receive_stock_transfer(
                transfer_id=transfer.id,
                user=request.user if request.user.is_authenticated else None,
            )
        except ValidationError as exc:
            return Response(
                {'detail': exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': 'Transfer received.'})

    # --- legacy action names (backward-compatible) ---

    @action(detail=True, methods=['post'], url_path='dispatch-transfer')
    def dispatch_transfer(self, request, pk=None):
        return self.dispatch(request, pk=pk)

    @action(detail=True, methods=['post'], url_path='receive-transfer')
    def receive_transfer(self, request, pk=None):
        return self.receive(request, pk=pk)


# ---------------------------------------------------------------------------
# Stock Reservations
# ---------------------------------------------------------------------------

class StockReservationViewSet(viewsets.ModelViewSet):
    """
    list / create reservations.

    Custom action:
      POST /reservations/{id}/release/  — release a Reserved reservation
    """
    queryset = StockReservation.objects.all()
    serializer_class = StockReservationSerializer

    @action(detail=True, methods=['post'], url_path='release')
    def release(self, request, pk=None):
        """Release a StockReservation via InventoryService."""
        try:
            InventoryService.release_reservation(reservation_id=pk)
        except StockReservation.DoesNotExist:
            return Response(
                {'detail': 'Reservation not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValidationError as exc:
            return Response(
                {'detail': exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': 'Reservation released.'})


# ---------------------------------------------------------------------------
# Warehouse Picking
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Inventory Adjustments — manager permission required
# ---------------------------------------------------------------------------

class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    """
    list / create adjustments.  Requires 'inventory / manage_adjustments' permission.
    On create, automatically posts a corresponding ADJUSTMENT ledger entry.
    """
    queryset = InventoryAdjustment.objects.all()
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [IsAuthenticated, require_permission('inventory', 'manage_adjustments')]

    def perform_create(self, serializer):
        adj = serializer.save()
        q_in = adj.quantity if adj.quantity > 0 else 0
        q_out = abs(adj.quantity) if adj.quantity < 0 else 0

        InventoryService.post_ledger_entry(
            item_type='Product' if adj.product_id else 'Material',
            item_id=adj.product_id if adj.product_id else adj.material_id,
            warehouse_id=adj.warehouse_id,
            bin_id=None,
            batch_number=adj.batch_number,
            movement_type='ADJUSTMENT',
            qty_in=q_in,
            qty_out=q_out,
            reference_type='InventoryAdjustment',
            reference_id=adj.id,
            user_id=self.request.user if self.request.user.is_authenticated else None,
        )
