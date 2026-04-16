from rest_framework.routers import DefaultRouter

from .views import (
    CustomerViewSet,
    SalesOrderViewSet,
    SalesOrderItemViewSet,
    CustomerCreditLedgerViewSet,
    DispatchOrderViewSet,
    DispatchItemViewSet,
    DeliveryConfirmationViewSet,
    SalesReturnViewSet,
    SalesReturnItemViewSet,
)

router = DefaultRouter()
router.register(r'customers',           CustomerViewSet,              basename='customer')
router.register(r'orders',              SalesOrderViewSet,            basename='sales-order')
router.register(r'order-items',         SalesOrderItemViewSet,        basename='sales-order-item')
router.register(r'credit-ledger',       CustomerCreditLedgerViewSet,  basename='credit-ledger')
router.register(r'dispatches',          DispatchOrderViewSet,         basename='dispatch-order')
router.register(r'dispatch-items',      DispatchItemViewSet,          basename='dispatch-item')
router.register(r'deliveries',          DeliveryConfirmationViewSet,  basename='delivery-confirmation')
router.register(r'returns',             SalesReturnViewSet,           basename='sales-return')
router.register(r'return-items',        SalesReturnItemViewSet,       basename='sales-return-item')

urlpatterns = router.urls
