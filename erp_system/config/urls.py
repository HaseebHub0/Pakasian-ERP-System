from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/master_data/', include('apps.master_data.urls')),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
]
