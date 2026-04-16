from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import (
    ProductionStageViewSet,
    ProductionOrderViewSet,
    ProductionOrderItemViewSet,
    ProductionBatchViewSet,
    BatchStageLogViewSet,
    MaterialReservationViewSet,
    MaterialIssueViewSet,
    MaterialConsumptionViewSet,
    ProductionYieldViewSet,
    ProductionWasteViewSet,
    OilConsumptionLogViewSet,
    MachineLogViewSet,
    PackingLogViewSet,
    ProductionOutputViewSet,
    BatchCostSummaryViewSet,
)

# ── Root router ──────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'stages',         ProductionStageViewSet,  basename='stage')
router.register(r'orders',         ProductionOrderViewSet,  basename='production-order')
router.register(r'batches',        ProductionBatchViewSet,  basename='production-batch')
router.register(r'yields',         ProductionYieldViewSet,  basename='production-yield')
router.register(r'cost-summaries', BatchCostSummaryViewSet, basename='batch-cost-summary')

# ── Nested under /orders/{order_pk}/ ────────────────────────────────────────
order_router = nested_routers.NestedDefaultRouter(router, r'orders', lookup='order')
order_router.register(r'items', ProductionOrderItemViewSet, basename='order-item')

# ── Nested under /batches/{batch_pk}/ ───────────────────────────────────────
batch_router = nested_routers.NestedDefaultRouter(router, r'batches', lookup='batch')
batch_router.register(r'stage-logs',   BatchStageLogViewSet,      basename='batch-stage-log')
batch_router.register(r'reservations', MaterialReservationViewSet, basename='material-reservation')
batch_router.register(r'issues',       MaterialIssueViewSet,       basename='material-issue')
batch_router.register(r'consumption',  MaterialConsumptionViewSet, basename='material-consumption')
batch_router.register(r'waste',        ProductionWasteViewSet,     basename='production-waste')
batch_router.register(r'oil-logs',     OilConsumptionLogViewSet,   basename='oil-log')
batch_router.register(r'machine-logs', MachineLogViewSet,          basename='machine-log')
batch_router.register(r'packing-logs', PackingLogViewSet,          basename='packing-log')
batch_router.register(r'outputs',      ProductionOutputViewSet,    basename='production-output')

urlpatterns = router.urls + order_router.urls + batch_router.urls
