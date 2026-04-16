from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/master_data/', include('apps.master_data.urls')),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/manufacturing/', include('apps.manufacturing.urls')),
    path('api/costing/', include('apps.costing.urls')),
    path('api/sales/',   include('apps.sales.urls')),
    path('api/finance/', include('apps.finance.urls')),
    path('api/warehouse/', include('apps.warehouse.urls')),
    path('api/mrp/', include('apps.mrp.urls')),
]
