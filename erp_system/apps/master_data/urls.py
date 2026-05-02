from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, ProductCategoryViewSet, RawMaterialViewSet,
    PackagingMaterialViewSet, SupplierViewSet, WarehouseViewSet,
    WarehouseBinViewSet, MachineViewSet, ProductionLineViewSet,
)
from apps.sales.views import CustomerViewSet

router = DefaultRouter()
router.register(r'products',            ProductViewSet,           basename='product')
router.register(r'product-categories',  ProductCategoryViewSet,   basename='product-category')
router.register(r'raw-materials',       RawMaterialViewSet,       basename='raw-material')
router.register(r'packaging-materials', PackagingMaterialViewSet, basename='packaging-material')
router.register(r'suppliers',           SupplierViewSet,          basename='supplier')
router.register(r'customers',           CustomerViewSet,          basename='md-customer')
router.register(r'warehouses',          WarehouseViewSet,         basename='warehouse')
router.register(r'warehouse-bins',      WarehouseBinViewSet,      basename='warehouse-bin')
router.register(r'production-lines',    ProductionLineViewSet,    basename='production-line')
router.register(r'machines',            MachineViewSet,           basename='machine')

urlpatterns = [
    path('', include(router.urls)),
]
