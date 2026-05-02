from rest_framework import serializers
from .models import (
    Product, ProductCategory, RawMaterial, PackagingMaterial, Supplier,
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
            'shelf_life_days', 'standard_cost', 'selling_price', 'status',
            'created_at', 'updated_at',
        ]


class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = [
            'id', 'material_code', 'material_name', 'material_type',
            'unit_of_measure', 'density', 'standard_cost',
            'safety_stock', 'reorder_level', 'current_stock', 'shelf_life_days', 'status',
            'created_at', 'updated_at',
        ]


class SupplierSerializer(serializers.ModelSerializer):
    supplied_materials = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=RawMaterial.objects.all(),
        required=False
    )

    class Meta:
        model = Supplier
        fields = [
            'id', 'supplier_name', 'contact_person', 'phone', 'email', 'city', 'address',
            'payment_terms', 'currency', 'lead_time_days', 'rating', 'status',
            'supplied_materials', 'created_at', 'updated_at',
        ]


class WarehouseSerializer(serializers.ModelSerializer):
    bin_count = serializers.SerializerMethodField()
    capacity_stats = serializers.SerializerMethodField()
    bin_list = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = [
            'id', 'warehouse_name', 'warehouse_type', 'city', 'province',
            'country', 'latitude', 'longitude', 'status', 'bin_count',
            'capacity_stats', 'bin_list',
            'created_at', 'updated_at',
        ]

    def get_bin_count(self, obj):
        return obj.bins.count()

    def get_bin_list(self, obj):
        return [bin.bin_code for bin in obj.bins.all()]

    def get_capacity_stats(self, obj):
        # Calculate Mock Capacity for now based on Bins
        total = sum(bin.capacity for bin in obj.bins.all())
        # We don't have Inventory transactional data hooked up yet in Master Data
        # but we can show the capacity as a string
        return {
            'total_capacity': float(total),
            'usage_percentage': '0%' # Logic for usage will come from Inventory module
        }

    def create(self, validated_data):
        # Extract bin names if provided in the context or extra data
        # Note: DRF doesn't pass extra fields in validated_data if not in Meta.fields
        # So we check self.initial_data
        bin_names = self.initial_data.get('bin_names', '')
        instance = super().create(validated_data)
        
        if bin_names:
            names = [b.strip() for b in bin_names.split(',') if b.strip()]
            for name in names:
                WarehouseBin.objects.create(
                    warehouse_id=instance,
                    bin_code=name,
                    capacity=100.0 # Default capacity per bin for now
                )
        return instance

    def update(self, instance, validated_data):
        bin_names = self.initial_data.get('bin_names', '')
        instance = super().update(instance, validated_data)
        
        if 'bin_names' in self.initial_data:
            # Simple approach: clear and re-add for now to keep it easy for master data setup
            instance.bins.all().delete()
            names = [b.strip() for b in bin_names.split(',') if b.strip()]
            for name in names:
                WarehouseBin.objects.create(
                    warehouse_id=instance,
                    bin_code=name,
                    capacity=100.0
                )
        return instance


class PackagingMaterialSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True, default=None)

    class Meta:
        model = PackagingMaterial
        fields = [
            'id', 'material_code', 'material_name', 'material_type',
            'unit_of_measure', 'standard_cost', 'safety_stock',
            'reorder_level', 'current_stock', 'supplier', 'supplier_name',
            'status', 'created_at', 'updated_at',
        ]


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
    factory_name = serializers.CharField(source='factory.warehouse_name', read_only=True)

    class Meta:
        model = ProductionLine
        fields = [
            'id', 'line_name', 'factory', 'factory_name', 'line_type',
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
            'capacity_per_hour', 'cost_per_hour',
            'maintenance_cost', 'depreciation',
            'status', 'created_at', 'updated_at',
        ]
