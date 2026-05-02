from rest_framework import serializers
from .models import MRPPlan, MRPRun, SeasonalConfig


class MRPRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = MRPRun
        fields = ['id', 'run_date', 'horizon_days', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'run_date', 'created_at']


class MRPPlanSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    sku_code = serializers.CharField(source='product_id.sku_code', read_only=True)

    class Meta:
        model = MRPPlan
        fields = [
            'id', 'plan_id', 'product_id', 'product_name', 'sku_code',
            'forecast_qty', 'current_inventory', 'safety_stock',
            'scheduled_production', 'required_production',
            'planned_production_date', 'mrp_run', 'created_at',
        ]
        read_only_fields = ['id', 'plan_id', 'required_production', 'created_at']


class SeasonalConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonalConfig
        fields = ['id', 'season', 'multiplier', 'description', 'is_active']
