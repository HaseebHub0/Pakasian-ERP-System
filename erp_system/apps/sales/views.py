from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Customer,
    SalesOrder,
    SalesOrderItem,
    CustomerCreditLedger,
    DispatchOrder,
    DispatchItem,
    DeliveryConfirmation,
    SalesReturn,
    SalesReturnItem,
)
from .serializers import (
    CustomerSerializer,
    SalesOrderSerializer,
    SalesOrderWriteSerializer,
    SalesOrderItemSerializer,
    CustomerCreditLedgerSerializer,
    DispatchOrderSerializer,
    DispatchOrderWriteSerializer,
    DispatchItemSerializer,
    DeliveryConfirmationSerializer,
    SalesReturnSerializer,
    SalesReturnWriteSerializer,
    SalesReturnItemSerializer,
)
from .services import SalesService


# ─── Customer ────────────────────────────────────────────────────────────────

class CustomerViewSet(viewsets.ModelViewSet):
    queryset           = Customer.objects.all()
    serializer_class   = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['region', 'status', 'city']

    @action(detail=True, methods=['get'], url_path='credit-status')
    def credit_status(self, request, pk=None):
        """GET /api/sales/customers/{id}/credit-status/ — live credit position."""
        customer = self.get_object()
        result = SalesService.credit_check(str(customer.pk), Decimal('0'))
        return Response(result.as_dict())


# ─── Sales Order ─────────────────────────────────────────────────────────────

class SalesOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['order_status', 'customer_id', 'order_source', 'payment_type']

    def get_queryset(self):
        return SalesOrder.objects.select_related(
            'customer_id', 'warehouse_id'
        ).prefetch_related('items__product_id').all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SalesOrderWriteSerializer
        return SalesOrderSerializer

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """POST /api/sales/orders/{id}/approve/ — credit-check + approve."""
        try:
            order = SalesService.approve_order(pk)
            return Response(SalesOrderSerializer(order).data)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='credit-check')
    def credit_check(self, request, pk=None):
        """POST /api/sales/orders/{id}/credit-check/ — check without approving."""
        order  = get_object_or_404(SalesOrder, pk=pk)
        result = SalesService.credit_check(str(order.customer_id_id), order.total_amount)
        return Response(result.as_dict())


# ─── Sales Order Item ─────────────────────────────────────────────────────────

class SalesOrderItemViewSet(viewsets.ModelViewSet):
    serializer_class   = SalesOrderItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['order_id', 'product_id']

    def get_queryset(self):
        return SalesOrderItem.objects.select_related(
            'order_id', 'product_id'
        ).all()


# ─── Credit Ledger ───────────────────────────────────────────────────────────

class CustomerCreditLedgerViewSet(viewsets.ModelViewSet):
    serializer_class   = CustomerCreditLedgerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['customer_id', 'entry_type', 'transaction_date']

    def get_queryset(self):
        return CustomerCreditLedger.objects.select_related('customer_id').all()

    @action(detail=False, methods=['post'], url_path='record-payment')
    def record_payment(self, request):
        """
        POST /api/sales/credit-ledger/record-payment/
        Body: { customer_id, amount, notes? }
        Posts a Payment entry and returns the new ledger record.
        """
        customer_id = request.data.get('customer_id')
        amount      = Decimal(str(request.data.get('amount', 0)))
        notes       = request.data.get('notes', '')
        if not customer_id or amount <= 0:
            return Response(
                {'detail': 'customer_id and positive amount are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        entry = SalesService._post_ledger_entry(
            customer_id      = customer_id,
            entry_type       = 'Payment',
            payment_received = amount,
            notes            = notes,
        )
        return Response(CustomerCreditLedgerSerializer(entry).data, status=status.HTTP_201_CREATED)


# ─── Dispatch ────────────────────────────────────────────────────────────────

class DispatchOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['status', 'order_id', 'warehouse_id']

    def get_queryset(self):
        return DispatchOrder.objects.select_related(
            'order_id__customer_id', 'warehouse_id', 'vehicle_id'
        ).prefetch_related('items__product_id').all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DispatchOrderWriteSerializer
        return DispatchOrderSerializer

    @action(detail=True, methods=['post'], url_path='confirm-delivery')
    def confirm_delivery(self, request, pk=None):
        """
        POST /api/sales/dispatches/{id}/confirm-delivery/
        Body: { delivered_by, status, customer_signature? }
        """
        delivered_by       = request.data.get('delivered_by', '')
        status_val         = request.data.get('status', 'Delivered')
        customer_signature = request.data.get('customer_signature', '')

        if not delivered_by:
            return Response(
                {'detail': 'delivered_by is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            confirmation = SalesService.confirm_delivery(
                dispatch_id        = pk,
                delivered_by       = delivered_by,
                status             = status_val,
                customer_signature = customer_signature,
            )
            return Response(
                DeliveryConfirmationSerializer(confirmation).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class DispatchItemViewSet(viewsets.ModelViewSet):
    serializer_class   = DispatchItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['dispatch_id', 'product_id']

    def get_queryset(self):
        return DispatchItem.objects.select_related('dispatch_id', 'product_id').all()


# ─── Delivery Confirmation ───────────────────────────────────────────────────

class DeliveryConfirmationViewSet(viewsets.ModelViewSet):
    serializer_class   = DeliveryConfirmationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['dispatch_id', 'status']

    def get_queryset(self):
        return DeliveryConfirmation.objects.select_related('dispatch_id').all()


# ─── Sales Return ─────────────────────────────────────────────────────────────

class SalesReturnViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['status', 'order_id', 'customer_id']

    def get_queryset(self):
        return SalesReturn.objects.select_related(
            'order_id', 'customer_id'
        ).prefetch_related('items__product_id').all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SalesReturnWriteSerializer
        return SalesReturnSerializer

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """POST /api/sales/returns/{id}/approve/ — approve a pending return."""
        sales_return = get_object_or_404(SalesReturn, pk=pk)
        if sales_return.status != 'Requested':
            return Response(
                {'detail': f"Cannot approve return in status '{sales_return.status}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sales_return.status = 'Approved'
        sales_return.save(update_fields=['status', 'updated_at'])
        return Response(SalesReturnSerializer(sales_return).data)


class SalesReturnItemViewSet(viewsets.ModelViewSet):
    serializer_class   = SalesReturnItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['return_id', 'product_id', 'condition']

    def get_queryset(self):
        return SalesReturnItem.objects.select_related('return_id', 'product_id').all()
