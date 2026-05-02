from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApprovalWorkflowViewSet, PaymentTermViewSet,
    SupplierMaterialViewSet, SupplierPriceHistoryViewSet,
    PurchaseRequisitionViewSet, RequestForQuotationViewSet,
    QuotationViewSet, PurchaseOrderViewSet,
    GoodsReceiptViewSet, RawMaterialBatchViewSet,
    QcInspectionViewSet, PurchaseReturnViewSet,
    AccountsPayableViewSet, ReorderRuleViewSet,
    procurement_analytics,
)

router = DefaultRouter()
router.register(r'approval-workflows',      ApprovalWorkflowViewSet,      basename='approval-workflow')
router.register(r'payment-terms',           PaymentTermViewSet,            basename='payment-term')
router.register(r'supplier-materials',      SupplierMaterialViewSet,       basename='supplier-material')
router.register(r'supplier-price-history',  SupplierPriceHistoryViewSet,   basename='supplier-price-history')
router.register(r'purchase-requisitions',   PurchaseRequisitionViewSet,    basename='purchase-requisition')
router.register(r'rfqs',                    RequestForQuotationViewSet,    basename='rfq')
router.register(r'quotations',              QuotationViewSet,              basename='quotation')
router.register(r'purchase-orders',         PurchaseOrderViewSet,          basename='purchase-order')
router.register(r'goods-receipts',          GoodsReceiptViewSet,           basename='goods-receipt')
router.register(r'raw-material-batches',    RawMaterialBatchViewSet,       basename='raw-material-batch')
router.register(r'qc-inspections',          QcInspectionViewSet,           basename='qc-inspection')
router.register(r'purchase-returns',        PurchaseReturnViewSet,         basename='purchase-return')
router.register(r'accounts-payable',        AccountsPayableViewSet,        basename='accounts-payable')
router.register(r'reorder-rules',           ReorderRuleViewSet,            basename='reorder-rule')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', procurement_analytics, name='procurement-analytics'),
]
