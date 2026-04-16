from rest_framework import serializers

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


# ─── Customer ────────────────────────────────────────────────────────────────

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = '__all__'


# ─── Sales Order ─────────────────────────────────────────────────────────────

class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    sku_code     = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = SalesOrderItem
        fields = '__all__'


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name    = serializers.CharField(source='customer_id.customer_name', read_only=True)
    warehouse_name   = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)
    items            = SalesOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = SalesOrder
        fields = '__all__'


class SalesOrderWriteSerializer(serializers.ModelSerializer):
    """Write-only serializer (no nested expansion)."""
    class Meta:
        model  = SalesOrder
        fields = '__all__'


# ─── Credit Ledger ───────────────────────────────────────────────────────────

class CustomerCreditLedgerSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer_id.customer_name', read_only=True)

    class Meta:
        model  = CustomerCreditLedger
        fields = '__all__'


# ─── Dispatch ────────────────────────────────────────────────────────────────

class DispatchItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    sku_code     = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = DispatchItem
        fields = '__all__'


class DispatchOrderSerializer(serializers.ModelSerializer):
    order_number   = serializers.CharField(source='order_id.order_number',       read_only=True)
    customer_name  = serializers.CharField(source='order_id.customer_id.customer_name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse_id.warehouse_name', read_only=True)
    vehicle_reg    = serializers.SerializerMethodField()
    items          = DispatchItemSerializer(many=True, read_only=True)

    def get_vehicle_reg(self, obj):
        if obj.vehicle_id:
            return getattr(obj.vehicle_id, 'registration_number', None)
        return None

    class Meta:
        model  = DispatchOrder
        fields = '__all__'


class DispatchOrderWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DispatchOrder
        fields = '__all__'


# ─── Delivery Confirmation ───────────────────────────────────────────────────

class DeliveryConfirmationSerializer(serializers.ModelSerializer):
    dispatch_status = serializers.CharField(source='dispatch_id.status', read_only=True)

    class Meta:
        model  = DeliveryConfirmation
        fields = '__all__'


# ─── Sales Return ────────────────────────────────────────────────────────────

class SalesReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    sku_code     = serializers.CharField(source='product_id.sku_code',     read_only=True)

    class Meta:
        model  = SalesReturnItem
        fields = '__all__'


class SalesReturnSerializer(serializers.ModelSerializer):
    order_number  = serializers.CharField(source='order_id.order_number',       read_only=True)
    customer_name = serializers.CharField(source='customer_id.customer_name',   read_only=True)
    items         = SalesReturnItemSerializer(many=True, read_only=True)

    class Meta:
        model  = SalesReturn
        fields = '__all__'


class SalesReturnWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SalesReturn
        fields = '__all__'
