from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MRPPlanViewSet, MRPRunViewSet, SeasonalConfigViewSet

router = DefaultRouter()
router.register(r'plans', MRPPlanViewSet, basename='mrp-plans')
router.register(r'runs', MRPRunViewSet, basename='mrp-runs')
router.register(r'seasonal-config', SeasonalConfigViewSet, basename='seasonal-config')

urlpatterns = [
    path('', include(router.urls)),
]
