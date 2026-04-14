from rest_framework import serializers
from .models import (
    InventoryLedger, BatchTable, InventorySummary, StockTransfer,
    TransferItem, StockReservation, WarehousePicking, PickingItem, InventoryAdjustment
)

class InventoryLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryLedger
        fields = '__all__'
        read_only_fields = [f.name for f in InventoryLedger._meta.fields]


class BatchTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchTable
        fields = '__all__'


class InventorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventorySummary
        fields = '__all__'
        read_only_fields = [f.name for f in InventorySummary._meta.fields]


class TransferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferItem
        fields = '__all__'
        read_only_fields = ['transfer_id']

class StockTransferSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True, required=False)

    class Meta:
        model = StockTransfer
        fields = '__all__'


class StockReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockReservation
        fields = '__all__'


class PickingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickingItem
        fields = '__all__'
        read_only_fields = ['picking_id']

class WarehousePickingSerializer(serializers.ModelSerializer):
    items = PickingItemSerializer(many=True, required=False)

    class Meta:
        model = WarehousePicking
        fields = '__all__'


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryAdjustment
        fields = '__all__'
