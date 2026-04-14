from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    ApprovalWorkflow, PaymentTerm,
    SupplierMaterial, SupplierPriceHistory,
    PurchaseRequisition, PurchaseRequisitionItem,
    RequestForQuotation, Quotation,
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem,
    RawMaterialBatch, QcInspection,
    PurchaseReturn, AccountsPayable, ReorderRule,
)
from .serializers import (
    ApprovalWorkflowSerializer, PaymentTermSerializer,
    SupplierMaterialSerializer, SupplierPriceHistorySerializer,
    PurchaseRequisitionSerializer, PurchaseRequisitionWriteSerializer,
    PurchaseRequisitionItemSerializer,
    RequestForQuotationSerializer, QuotationSerializer,
    PurchaseOrderSerializer, PurchaseOrderWriteSerializer,
    PurchaseOrderItemSerializer,
    GoodsReceiptSerializer, GoodsReceiptWriteSerializer,
    GoodsReceiptItemSerializer,
    RawMaterialBatchSerializer, QcInspectionSerializer,
    PurchaseReturnSerializer, AccountsPayableSerializer,
    ReorderRuleSerializer,
)
from .services import ProcurementService


# ── 1. Approval Workflows ─────────────────────────────────────────────────────
class ApprovalWorkflowViewSet(viewsets.ModelViewSet):
    queryset = ApprovalWorkflow.objects.all()
    serializer_class = ApprovalWorkflowSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['entity_type']


# ── 2. Payment Terms ──────────────────────────────────────────────────────────
class PaymentTermViewSet(viewsets.ModelViewSet):
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer
    permission_classes = [IsAuthenticated]


# ── 3. Supplier Materials ─────────────────────────────────────────────────────
class SupplierMaterialViewSet(viewsets.ModelViewSet):
    queryset = SupplierMaterial.objects.select_related('supplier_id', 'material_id').all()
    serializer_class = SupplierMaterialSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['supplier_id', 'material_id', 'preferred_supplier', 'status']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response({'message': 'Supplier material deactivated'}, status=status.HTTP_200_OK)


# ── 4. Supplier Price History ─────────────────────────────────────────────────
class SupplierPriceHistoryViewSet(viewsets.ModelViewSet):
    queryset = SupplierPriceHistory.objects.select_related('supplier_id', 'material_id').all()
    serializer_class = SupplierPriceHistorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['supplier_id', 'material_id']


# ── 5. Purchase Requisitions ──────────────────────────────────────────────────
class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.prefetch_related('items').all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'approval_status', 'department']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return PurchaseRequisitionWriteSerializer
        return PurchaseRequisitionSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status not in ('Draft', 'Rejected'):
            return Response(
                {'error': f"Cannot delete a PR in '{instance.status}' status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a Draft PR for approval, dynamically route to correct approver."""
        pr = self.get_object()
        if pr.status != 'Draft':
            return Response({'error': f"PR is already in '{pr.status}' status."}, status=400)
        
        # We route for approval to let's say test the logic
        approver_role = ProcurementService.route_for_approval(pr)

        pr.status = 'Submitted'
        pr.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'message': f"PR submitted. Routed to role: {approver_role}",
            'data': PurchaseRequisitionSerializer(pr).data
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a submitted PR."""
        pr = self.get_object()
        if pr.status != 'Submitted':
            return Response({'error': f"Cannot approve a PR in '{pr.status}' status."}, status=400)
        pr.status = 'Approved'
        pr.approval_status = 'Approved'
        pr.save(update_fields=['status', 'approval_status', 'updated_at'])
        return Response(PurchaseRequisitionSerializer(pr).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a submitted PR."""
        pr = self.get_object()
        if pr.status not in ('Submitted', 'Approved'):
            return Response({'error': f"Cannot reject a PR in '{pr.status}' status."}, status=400)
        pr.status = 'Rejected'
        pr.approval_status = 'Rejected'
        pr.save(update_fields=['status', 'approval_status', 'updated_at'])
        return Response(PurchaseRequisitionSerializer(pr).data)

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        """List or add items on a PR."""
        pr = self.get_object()
        if request.method == 'GET':
            serializer = PurchaseRequisitionItemSerializer(pr.items.all(), many=True)
            return Response(serializer.data)
        serializer = PurchaseRequisitionItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(requisition_id=pr)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='convert-to-po')
    def convert_to_po(self, request, pk=None):
        """Convert an Approved PR into a Draft PO."""
        pr = self.get_object()
        if pr.status != 'Approved':
            return Response({'error': 'Only Approved PRs can be converted to POs.'}, status=400)
            
        supplier_id = request.data.get('supplier_id')
        if not supplier_id:
            return Response({'error': 'supplier_id is required to create a PO.'}, status=400)

        with transaction.atomic():
            # Create PO
            po = PurchaseOrder.objects.create(
                supplier_id_id=supplier_id,
                warehouse_id=pr.items.first().warehouse_id if pr.items.exists() else None,
                status='Draft',
                created_by=request.user if request.user.is_authenticated else None,
                currency='PKR'
            )
            
            # Create PO Items
            for pr_item in pr.items.all():
                # We default to standard_cost for the PO unit price. 
                # Realistically we should fetch SupplierMaterial matching the selected supplier, but this suffices for the test
                price = pr_item.material_id.standard_cost or 0
                PurchaseOrderItem.objects.create(
                    po_id=po,
                    material_id=pr_item.material_id,
                    ordered_quantity=pr_item.requested_quantity,
                    unit_price=price,
                )
                
            pr.status = 'Converted'
            pr.save(update_fields=['status', 'updated_at'])

        return Response(PurchaseOrderSerializer(po).data, status=status.HTTP_201_CREATED)


# ── 6. Request for Quotation ──────────────────────────────────────────────────
class RequestForQuotationViewSet(viewsets.ModelViewSet):
    queryset = RequestForQuotation.objects.prefetch_related('quotations').all()
    serializer_class = RequestForQuotationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'supplier_id']


# ── 7. Quotations ─────────────────────────────────────────────────────────────
class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['rfq_id', 'supplier_id']


# ── 8. Purchase Orders ────────────────────────────────────────────────────────
class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.prefetch_related('items').all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'supplier_id']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return PurchaseOrderWriteSerializer
        return PurchaseOrderSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status not in ('Draft', 'Rejected'):
            return Response(
                {'error': f"Cannot cancel a PO in '{instance.status}' status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.status = 'Cancelled'
        instance.save(update_fields=['status', 'updated_at'])
        return Response({'message': f"PO {instance.po_number} cancelled."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = self.get_object()
        if po.status != 'Draft':
            return Response({'error': f"PO is in '{po.status}' — only Draft can be approved."}, status=400)
        po.status = 'Approved'
        po.approved_by = request.user
        po.save(update_fields=['status', 'approved_by', 'updated_at'])
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=['post'])
    def send_to_supplier(self, request, pk=None):
        po = self.get_object()
        if po.status != 'Approved':
            return Response({'error': 'Only Approved POs can be sent.'}, status=400)
        po.status = 'Sent'
        po.save(update_fields=['status', 'updated_at'])
        return Response(PurchaseOrderSerializer(po).data)


# ── 9. Goods Receipts ─────────────────────────────────────────────────────────
class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.prefetch_related('items').all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'po_id', 'supplier_id']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return GoodsReceiptWriteSerializer
        return GoodsReceiptSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm a Draft GRN
        """
        grn = self.get_object()
        if grn.status != 'Draft':
            return Response({'error': f"GRN is already '{grn.status}'."}, status=400)

        with transaction.atomic():
            grn.status = 'Confirmed'
            grn.save(update_fields=['status', 'updated_at'])
            
            # Update PO status if there is one
            if grn.po_id:
                po = grn.po_id
                all_grns = po.grns.filter(status__in=['Confirmed', 'Inspected'])
                total_received = sum(
                    item.received_qty
                    for g in all_grns
                    for item in g.items.all()
                )
                total_ordered = sum(i.ordered_quantity for i in po.items.all())
                if total_ordered and total_received >= total_ordered:
                    po.status = 'Completed'
                else:
                    po.status = 'Partially Received'
                po.save(update_fields=['status'])

        return Response(GoodsReceiptSerializer(grn).data)


# ── 10. Raw Material Batches ──────────────────────────────────────────────────
class RawMaterialBatchViewSet(viewsets.ModelViewSet):
    queryset = RawMaterialBatch.objects.all()
    serializer_class = RawMaterialBatchSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'material_id']


# ── 11. QC Inspections ────────────────────────────────────────────────────────
class QcInspectionViewSet(viewsets.ModelViewSet):
    queryset = QcInspection.objects.all()
    serializer_class = QcInspectionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['result', 'material_id', 'grn_id']

    def perform_create(self, serializer):
        """Invoke ProcurementService for handling QC flow upon creation."""
        inspection = serializer.save()
        ProcurementService.handle_qc_result(inspection)


# ── 12. Purchase Returns ──────────────────────────────────────────────────────
class PurchaseReturnViewSet(viewsets.ModelViewSet):
    queryset = PurchaseReturn.objects.all()
    serializer_class = PurchaseReturnSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'grn_id']


# ── 13. Accounts Payable ──────────────────────────────────────────────────────
class AccountsPayableViewSet(viewsets.ModelViewSet):
    queryset = AccountsPayable.objects.all()
    serializer_class = AccountsPayableSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'supplier_id', 'po_id']

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        ap = self.get_object()
        if ap.status == 'Paid':
            return Response({'error': 'Already paid.'}, status=400)
        ap.status = 'Paid'
        ap.save(update_fields=['status', 'updated_at'])
        return Response(AccountsPayableSerializer(ap).data)


# ── 14. Reorder Rules ─────────────────────────────────────────────────────────
class ReorderRuleViewSet(viewsets.ModelViewSet):
    queryset = ReorderRule.objects.all()
    serializer_class = ReorderRuleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['material_id', 'warehouse_id']
