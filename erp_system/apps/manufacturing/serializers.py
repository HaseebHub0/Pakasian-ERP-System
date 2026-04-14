from rest_framework import serializers
from .models import (
    ProductionBatch, MaterialIssue, BatchStageLog,
    ProductionYield, OilConsumptionLog, BatchCostSummary,
    ProductionStage, ProductionOrder,
)


class ProductionBatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    product_sku  = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = ProductionBatch
        fields = '__all__'


class MaterialIssueSerializer(serializers.ModelSerializer):
    material_code = serializers.CharField(source='material_id.material_code', read_only=True)
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    material_type = serializers.CharField(source='material_id.material_type', read_only=True)
    supplier_name = serializers.CharField(source='supplier_id.supplier_name', read_only=True, default=None)
    supplier_phone = serializers.CharField(source='supplier_id.phone', read_only=True, default=None)

    class Meta:
        model  = MaterialIssue
        fields = '__all__'


class BatchStageLogSerializer(serializers.ModelSerializer):
    stage_name        = serializers.CharField(source='stage_id.name',            read_only=True)
    sequence_number   = serializers.IntegerField(source='stage_id.sequence_number', read_only=True)
    estimated_minutes = serializers.IntegerField(
        source='stage_id.estimated_duration_minutes', read_only=True
    )

    class Meta:
        model  = BatchStageLog
        fields = '__all__'


class ProductionYieldSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductionYield
        fields = '__all__'


class OilConsumptionLogSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True, default=None)

    class Meta:
        model  = OilConsumptionLog
        fields = '__all__'


class BatchCostSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model  = BatchCostSummary
        fields = '__all__'


class InventoryLedgerDistributionSerializer(serializers.ModelSerializer):
    """
    Thin serializer for the distribution slice of batch_trace.
    Imported from inventory inside the view to avoid circular imports.
    """
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)
    warehouse_city = serializers.CharField(source='warehouse_id.city',           read_only=True)

    class Meta:
        # model set dynamically in view — declared here for IDE support
        from apps.inventory.models import InventoryLedger
        model  = InventoryLedger
        fields = '__all__'
