from rest_framework import serializers

from .models import (
    ProductionStage,
    ProductionOrder,
    ProductionOrderItem,
    ProductionBatch,
    BatchStageLog,
    MaterialReservation,
    MaterialIssue,
    MaterialConsumption,
    ProductionYield,
    ProductionWaste,
    OilConsumptionLog,
    MachineLog,
    PackingLog,
    ProductionOutput,
    BatchCostSummary,
)


class ProductionStageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductionStage
        fields = '__all__'


# ─── Production Order ─────────────────────────────────────────────────────────

class ProductionOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    sku_code     = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = ProductionOrderItem
        fields = '__all__'


class ProductionOrderSerializer(serializers.ModelSerializer):
    items            = ProductionOrderItemSerializer(many=True, read_only=True)
    product_name     = serializers.CharField(source='product_id.product_name',  read_only=True, default=None)
    created_by_name  = serializers.CharField(source='created_by.username',      read_only=True, default=None)
    approved_by_name = serializers.CharField(source='approved_by.username',     read_only=True, default=None)

    class Meta:
        model            = ProductionOrder
        fields           = '__all__'
        read_only_fields = ['order_number']


# ─── Production Batch ─────────────────────────────────────────────────────────

class ProductionBatchSerializer(serializers.ModelSerializer):
    product_name         = serializers.CharField(source='product_id.product_name',          read_only=True)
    product_sku          = serializers.CharField(source='product_id.sku_code',              read_only=True)
    order_number         = serializers.CharField(source='production_order_id.order_number', read_only=True, default=None)
    production_line_name = serializers.CharField(source='production_line_id.line_name',     read_only=True, default=None)
    operator_name        = serializers.CharField(source='operator_id.username',             read_only=True, default=None)

    class Meta:
        model            = ProductionBatch
        fields           = '__all__'
        read_only_fields = ['batch_number']


# ─── Batch Stage Log ──────────────────────────────────────────────────────────

class BatchStageLogSerializer(serializers.ModelSerializer):
    stage_name      = serializers.CharField(source='stage_id.name',              read_only=True)
    sequence_number = serializers.IntegerField(source='stage_id.sequence_number', read_only=True)
    machine_name    = serializers.CharField(source='machine_id.machine_name',    read_only=True, default=None)
    operator_name   = serializers.CharField(source='operator_id.username',       read_only=True, default=None)

    class Meta:
        model  = BatchStageLog
        fields = '__all__'


# ─── Material Reservation ─────────────────────────────────────────────────────

class MaterialReservationSerializer(serializers.ModelSerializer):
    material_name  = serializers.CharField(source='material_id.material_name',   read_only=True)
    material_code  = serializers.CharField(source='material_id.material_code',   read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)

    class Meta:
        model  = MaterialReservation
        fields = '__all__'


# ─── Material Issue ───────────────────────────────────────────────────────────

class MaterialIssueSerializer(serializers.ModelSerializer):
    material_code  = serializers.CharField(source='material_id.material_code',   read_only=True)
    material_name  = serializers.CharField(source='material_id.material_name',   read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True, default=None)
    issued_by_name = serializers.CharField(source='issued_by.username',          read_only=True, default=None)

    class Meta:
        model            = MaterialIssue
        fields           = '__all__'
        read_only_fields = ['issued_time']


# ─── Material Consumption ─────────────────────────────────────────────────────

class MaterialConsumptionSerializer(serializers.ModelSerializer):
    material_name    = serializers.CharField(source='material_id.material_name', read_only=True)
    stage_name       = serializers.CharField(source='stage_id.name',             read_only=True, default=None)
    recorded_by_name = serializers.CharField(source='recorded_by.username',      read_only=True, default=None)

    class Meta:
        model  = MaterialConsumption
        fields = '__all__'


# ─── Production Yield ─────────────────────────────────────────────────────────

class ProductionYieldSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch_id.batch_number', read_only=True)

    class Meta:
        model            = ProductionYield
        fields           = '__all__'
        read_only_fields = ['yield_percent']


# ─── Production Waste ─────────────────────────────────────────────────────────

class ProductionWasteSerializer(serializers.ModelSerializer):
    stage_name    = serializers.CharField(source='stage_id.name',             read_only=True, default=None)
    material_name = serializers.CharField(source='material_id.material_name', read_only=True, default=None)

    class Meta:
        model  = ProductionWaste
        fields = '__all__'


# ─── Oil Consumption Log ──────────────────────────────────────────────────────

class OilConsumptionLogSerializer(serializers.ModelSerializer):
    oil_material_name = serializers.CharField(source='oil_material_id.material_name', read_only=True, default=None)
    operator_name     = serializers.CharField(source='operator_id.username',          read_only=True, default=None)

    class Meta:
        model            = OilConsumptionLog
        fields           = '__all__'
        read_only_fields = ['timestamp']


# ─── Machine Log ──────────────────────────────────────────────────────────────

class MachineLogSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine_id.machine_name', read_only=True)
    batch_number = serializers.CharField(source='batch_id.batch_number',   read_only=True)

    class Meta:
        model  = MachineLog
        fields = '__all__'


# ─── Packing Log ──────────────────────────────────────────────────────────────

class PackingLogSerializer(serializers.ModelSerializer):
    batch_number  = serializers.CharField(source='batch_id.batch_number', read_only=True)
    operator_name = serializers.CharField(source='operator_id.username',  read_only=True, default=None)

    class Meta:
        model            = PackingLog
        fields           = '__all__'
        read_only_fields = ['timestamp']


# ─── Production Output ────────────────────────────────────────────────────────

class ProductionOutputSerializer(serializers.ModelSerializer):
    product_name   = serializers.CharField(source='product_id.product_name',    read_only=True)
    product_sku    = serializers.CharField(source='product_id.sku_code',        read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)

    class Meta:
        model  = ProductionOutput
        fields = '__all__'


# ─── Batch Cost Summary ───────────────────────────────────────────────────────

class BatchCostSummarySerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch_id.batch_number', read_only=True)

    class Meta:
        model  = BatchCostSummary
        fields = '__all__'


# ─── Batch Trace (full nested read-only snapshot) ────────────────────────────

class BatchTraceSerializer(serializers.ModelSerializer):
    product_name         = serializers.CharField(source='product_id.product_name',          read_only=True)
    product_sku          = serializers.CharField(source='product_id.sku_code',              read_only=True)
    order_number         = serializers.CharField(source='production_order_id.order_number', read_only=True, default=None)
    stage_logs           = BatchStageLogSerializer(many=True, read_only=True)
    material_issues      = MaterialIssueSerializer(many=True, read_only=True)
    consumptions         = MaterialConsumptionSerializer(many=True, read_only=True)
    waste_records        = ProductionWasteSerializer(many=True, read_only=True)
    oil_logs             = OilConsumptionLogSerializer(many=True, read_only=True)
    machine_logs         = MachineLogSerializer(many=True, read_only=True)
    packing_logs         = PackingLogSerializer(many=True, read_only=True)
    outputs              = ProductionOutputSerializer(many=True, read_only=True)
    yield_records        = ProductionYieldSerializer(many=True, read_only=True)
    cost_summary         = BatchCostSummarySerializer(read_only=True)

    class Meta:
        model  = ProductionBatch
        fields = '__all__'
