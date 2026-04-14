from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryLedgerViewSet, BatchTableViewSet, InventorySummaryViewSet,
    StockTransferViewSet, StockReservationViewSet, WarehousePickingViewSet,
    InventoryAdjustmentViewSet
)

router = DefaultRouter()
router.register(r'ledger', InventoryLedgerViewSet, basename='inventory-ledger')
router.register(r'batch-table', BatchTableViewSet, basename='batch-table')
router.register(r'summary', InventorySummaryViewSet, basename='inventory-summary')
router.register(r'stock-transfers', StockTransferViewSet, basename='stock-transfer')
router.register(r'stock-reservations', StockReservationViewSet, basename='stock-reservation')
router.register(r'warehouse-picking', WarehousePickingViewSet, basename='warehouse-picking')
router.register(r'adjustments', InventoryAdjustmentViewSet, basename='inventory-adjustment')

urlpatterns = [
    path('', include(router.urls)),
]
