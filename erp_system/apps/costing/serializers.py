from rest_framework import serializers

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


class BatchMaterialCostSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True)
    material_code = serializers.CharField(source='material_id.material_code', read_only=True)
    batch_number  = serializers.CharField(source='batch_id.batch_number',     read_only=True)

    class Meta:
        model  = BatchMaterialCost
        fields = '__all__'


class LabourLogSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch_id.batch_number', read_only=True)
    stage_name   = serializers.CharField(source='stage_id.name',         read_only=True, default=None)

    class Meta:
        model  = LabourLog
        fields = '__all__'


class MachineCostRateSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine_id.machine_name', read_only=True)

    class Meta:
        model  = MachineCostRate
        fields = '__all__'


class BatchMachineCostSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine_id.machine_name', read_only=True)
    batch_number = serializers.CharField(source='batch_id.batch_number',   read_only=True)

    class Meta:
        model  = BatchMachineCost
        fields = '__all__'


class FactoryOverheadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FactoryOverhead
        fields = '__all__'


class BatchOverheadCostSerializer(serializers.ModelSerializer):
    overhead_name = serializers.CharField(source='overhead_id.name',      read_only=True)
    batch_number  = serializers.CharField(source='batch_id.batch_number', read_only=True)

    class Meta:
        model  = BatchOverheadCost
        fields = '__all__'


class BatchWasteCostSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material_id.material_name', read_only=True, default=None)
    batch_number  = serializers.CharField(source='batch_id.batch_number',     read_only=True)

    class Meta:
        model  = BatchWasteCost
        fields = '__all__'


class BatchCostSummarySerializer(serializers.ModelSerializer):
    batch_number       = serializers.CharField(source='batch_id.batch_number',  read_only=True)
    calculated_by_name = serializers.CharField(source='calculated_by.username', read_only=True, default=None)

    class Meta:
        model  = BatchCostSummary
        fields = '__all__'


class UnitCostSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch_id.batch_number',   read_only=True)
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    product_sku  = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = UnitCost
        fields = '__all__'


class CostVarianceSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch_id.batch_number',   read_only=True)
    product_sku  = serializers.CharField(source='product_id.sku_code',     read_only=True, default=None)

    class Meta:
        model  = CostVariance
        fields = '__all__'


class SKUProfitabilitySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    product_sku  = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = SKUProfitability
        fields = '__all__'


# ─── Full batch cost snapshot ─────────────────────────────────────────────────

class BatchSummarySnapshotSerializer(serializers.Serializer):
    """GET /api/costing/batch-summary/{batch_id}/ — all costing rows for one batch."""
    summary       = BatchCostSummarySerializer(read_only=True)
    unit_cost     = UnitCostSerializer(read_only=True)
    material      = BatchMaterialCostSerializer(many=True, read_only=True)
    labour        = LabourLogSerializer(many=True, read_only=True)
    machine       = BatchMachineCostSerializer(many=True, read_only=True)
    overhead      = BatchOverheadCostSerializer(many=True, read_only=True)
    waste         = BatchWasteCostSerializer(many=True, read_only=True)
    variances     = CostVarianceSerializer(many=True, read_only=True)
