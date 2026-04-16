from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import (
    MachineCostRateViewSet,
    FactoryOverheadViewSet,
    BatchMaterialCostViewSet,
    LabourLogViewSet,
    BatchMachineCostViewSet,
    BatchOverheadCostViewSet,
    BatchWasteCostViewSet,
    BatchCostSummaryViewSet,
    UnitCostViewSet,
    CostVarianceViewSet,
    SKUProfitabilityViewSet,
    BatchSummaryViewSet,
)

# ── Root router ──────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'machine-rates',      MachineCostRateViewSet,    basename='machine-rate')
router.register(r'overheads',          FactoryOverheadViewSet,    basename='factory-overhead')
router.register(r'material-costs',     BatchMaterialCostViewSet,  basename='batch-material-cost')
router.register(r'labour-logs',        LabourLogViewSet,          basename='labour-log')
router.register(r'machine-costs',      BatchMachineCostViewSet,   basename='batch-machine-cost')
router.register(r'overhead-costs',     BatchOverheadCostViewSet,  basename='batch-overhead-cost')
router.register(r'waste-costs',        BatchWasteCostViewSet,     basename='batch-waste-cost')
router.register(r'summaries',          BatchCostSummaryViewSet,   basename='cost-summary')
router.register(r'unit-costs',         UnitCostViewSet,           basename='unit-cost')
router.register(r'variances',          CostVarianceViewSet,       basename='cost-variance')
router.register(r'sku-profitability',  SKUProfitabilityViewSet,   basename='sku-profitability')
router.register(r'batch-summary',      BatchSummaryViewSet,       basename='batch-summary')

urlpatterns = router.urls
