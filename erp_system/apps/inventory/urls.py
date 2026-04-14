from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BatchTableViewSet,
    InventoryAdjustmentViewSet,
    InventoryLedgerViewSet,
    InventorySummaryViewSet,
    StockReservationViewSet,
    StockTransferViewSet,
    WarehousePickingViewSet,
)

router = DefaultRouter()

# Core inventory read endpoints
router.register(r'ledger',       InventoryLedgerViewSet,     basename='inventory-ledger')
router.register(r'summary',      InventorySummaryViewSet,    basename='inventory-summary')

# Batch traceability — detail routes keyed by batch_number (not UUID pk)
router.register(r'batches',      BatchTableViewSet,          basename='batch-table')

# Transfer workflow:  /transfers/{id}/dispatch/  and  /transfers/{id}/receive/
router.register(r'transfers',    StockTransferViewSet,       basename='stock-transfer')

# Reservation workflow:  /reservations/{id}/release/
router.register(r'reservations', StockReservationViewSet,    basename='stock-reservation')

# Adjustments (manager-only)
router.register(r'adjustments',  InventoryAdjustmentViewSet, basename='inventory-adjustment')

# Warehouse picking operations
router.register(r'warehouse-picking', WarehousePickingViewSet, basename='warehouse-picking')

urlpatterns = [
    path('', include(router.urls)),
]
