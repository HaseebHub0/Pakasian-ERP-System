from rest_framework import serializers
from .models import (
    Product, ProductCategory, RawMaterial, Supplier,
    Warehouse, WarehouseBin, Machine, ProductionLine,
)


class ProductCategorySerializer(serializers.ModelSerializer):
    subcategory_count = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent_category.category_name', read_only=True, default=None)

    class Meta:
        model = ProductCategory
        fields = ['id', 'category_name', 'parent_category', 'parent_name',
                  'subcategory_count', 'created_at', 'updated_at']

    def get_subcategory_count(self, obj):
        return obj.subcategories.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category_id.category_name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id', 'sku_code', 'product_name', 'brand',
            'category_id', 'category_name',
            'pack_size', 'net_weight', 'gross_weight', 'barcode',
            'shelf_life_days', 'standard_cost', 'status',
            'created_at', 'updated_at',
        ]


class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = [
            'id', 'material_code', 'material_name', 'material_type',
            'unit_of_measure', 'density', 'standard_cost',
            'safety_stock', 'reorder_level', 'shelf_life_days',
            'created_at', 'updated_at',
        ]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'supplier_name', 'contact_person', 'phone', 'email',
            'payment_terms', 'currency', 'lead_time_days', 'rating',
            'created_at', 'updated_at',
        ]


class WarehouseSerializer(serializers.ModelSerializer):
    bin_count = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = [
            'id', 'warehouse_name', 'warehouse_type', 'city', 'province',
            'country', 'latitude', 'longitude', 'status', 'bin_count',
            'created_at', 'updated_at',
        ]

    def get_bin_count(self, obj):
        return obj.bins.count()


class WarehouseBinSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)

    class Meta:
        model = WarehouseBin
        fields = [
            'id', 'warehouse_id', 'warehouse_name', 'bin_code',
            'capacity', 'bin_type', 'created_at', 'updated_at',
        ]


class ProductionLineSerializer(serializers.ModelSerializer):
    machine_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductionLine
        fields = [
            'id', 'line_name', 'factory_id', 'line_type',
            'capacity_per_hour', 'status', 'machine_count',
            'created_at', 'updated_at',
        ]

    def get_machine_count(self, obj):
        return obj.machines.count()


class MachineSerializer(serializers.ModelSerializer):
    production_line_name = serializers.CharField(
        source='production_line_id.line_name', read_only=True, default=None
    )

    class Meta:
        model = Machine
        fields = [
            'id', 'machine_name', 'machine_type',
            'production_line_id', 'production_line_name',
            'capacity_per_hour', 'status',
            'created_at', 'updated_at',
        ]
