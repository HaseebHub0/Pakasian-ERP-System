from rest_framework import serializers
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


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalWorkflow
        fields = '__all__'


class PaymentTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTerm
        fields = '__all__'


class SupplierMaterialSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)

    class Meta:
        model = SupplierMaterial
        fields = '__all__'


class SupplierPriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierPriceHistory
        fields = '__all__'


class PurchaseRequisitionItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True, default=None)

    class Meta:
        model = PurchaseRequisitionItem
        fields = '__all__'
        read_only_fields = ['requisition_id']


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    items = PurchaseRequisitionItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseRequisition
        fields = '__all__'
        read_only_fields = ['requisition_number', 'approval_status']


class PurchaseRequisitionWriteSerializer(serializers.ModelSerializer):
    items = PurchaseRequisitionItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseRequisition
        fields = '__all__'
        read_only_fields = ['requisition_number', 'approval_status']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        pr = PurchaseRequisition.objects.create(**validated_data)
        for item in items_data:
            PurchaseRequisitionItem.objects.create(requisition_id=pr, **item)
        return pr


class QuotationSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)

    class Meta:
        model = Quotation
        fields = '__all__'


class RequestForQuotationSerializer(serializers.ModelSerializer):
    quotations = QuotationSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)
    material_name = serializers.CharField(source='material_id.material_name', read_only=True, default=None)

    class Meta:
        model = RequestForQuotation
        fields = '__all__'
        read_only_fields = ['rfq_number']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        read_only_fields = ['po_id', 'total_price']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True, default=None)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['po_number', 'total_amount', 'approved_by']


class PurchaseOrderWriteSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['po_number', 'total_amount', 'approved_by']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(po_id=po, **item)
        # Recalculate total
        po.total_amount = sum(i.total_price for i in po.items.all())
        po.save(update_fields=['total_amount', 'updated_at'])
        return po


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)

    class Meta:
        model = GoodsReceiptItem
        fields = '__all__'
        read_only_fields = ['grn_id']


class GoodsReceiptSerializer(serializers.ModelSerializer):
    items = GoodsReceiptItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)
    po_number = serializers.CharField(source='po_id.po_number', read_only=True, default=None)

    class Meta:
        model = GoodsReceipt
        fields = '__all__'
        read_only_fields = ['grn_number']


class GoodsReceiptWriteSerializer(serializers.ModelSerializer):
    items = GoodsReceiptItemSerializer(many=True, required=False)

    class Meta:
        model = GoodsReceipt
        fields = '__all__'
        read_only_fields = ['grn_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        grn = GoodsReceipt.objects.create(**validated_data)
        for item in items_data:
            GoodsReceiptItem.objects.create(grn_id=grn, **item)
        return grn


class RawMaterialBatchSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True, default=None)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True, default=None)

    class Meta:
        model = RawMaterialBatch
        fields = '__all__'


class QcInspectionSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    grn_number = serializers.CharField(source='grn_id.grn_number', read_only=True, default=None)
    batch_number = serializers.CharField(source='batch_id.batch_number', read_only=True, default=None)

    class Meta:
        model = QcInspection
        fields = '__all__'


class PurchaseReturnSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    grn_number = serializers.CharField(source='grn_id.grn_number', read_only=True, default=None)

    class Meta:
        model = PurchaseReturn
        fields = '__all__'


class AccountsPayableSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True)
    po_number = serializers.CharField(source='po_id.po_number', read_only=True, default=None)

    class Meta:
        model = AccountsPayable
        fields = '__all__'


class ReorderRuleSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True, default=None)

    class Meta:
        model = ReorderRule
        fields = '__all__'
