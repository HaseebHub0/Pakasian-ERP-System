from django.db.models import Q, Sum, Subquery, OuterRef, DecimalField, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Product, ProductCategory, RawMaterial, Supplier,
    Warehouse, WarehouseBin, Machine, ProductionLine,
)
from .serializers import (
    ProductSerializer, ProductCategorySerializer, RawMaterialSerializer,
    SupplierSerializer, WarehouseSerializer, WarehouseBinSerializer,
    MachineSerializer, ProductionLineSerializer,
)


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.prefetch_related('subcategories').all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['parent_category']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.products.exists():
            return Response(
                {'error': 'Cannot delete a category that has products assigned to it.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if instance.subcategories.exists():
            return Response(
                {'error': 'Cannot delete a category that has sub-categories.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category_id').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'brand', 'category_id']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — set status=inactive instead of removing the row."""
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response(
            {'message': f"Product '{instance.sku_code}' deactivated."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        GET /api/master_data/products/search/?q=<term>

        Full-text search across product_name, sku_code, and barcode.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response(
                {'error': 'Query parameter "q" is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(
            Q(product_name__icontains=q) |
            Q(sku_code__icontains=q) |
            Q(barcode__icontains=q)
        ).order_by('product_name')
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(queryset, many=True).data)


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['material_type']

    def destroy(self, request, *args, **kwargs):
        """Hard delete — raw materials can be removed if not referenced."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='low_stock')
    def low_stock(self, request):
        """
        GET /api/master_data/raw-materials/low_stock/

        Returns raw materials where total available inventory (summed across
        all warehouses in InventorySummary) is below the material's reorder_level.
        """
        from apps.inventory.models import InventorySummary
        from django.db.models import F

        # Subquery: sum available_stock for this material across all warehouse bins
        stock_subq = (
            InventorySummary.objects
            .filter(product_id=OuterRef('pk'))
            .values('product_id')
            .annotate(total=Sum('available_stock'))
            .values('total')[:1]
        )

        queryset = (
            RawMaterial.objects
            .annotate(
                available_stock=Coalesce(
                    Subquery(stock_subq, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                )
            )
            .filter(available_stock__lt=F('reorder_level'))
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(queryset, many=True).data)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['currency', 'payment_terms']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.prefetch_related('bins').all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'warehouse_type', 'city', 'province']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — deactivate rather than wipe warehouse records."""
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response(
            {'message': f"Warehouse '{instance.warehouse_name}' deactivated."},
            status=status.HTTP_200_OK,
        )


class WarehouseBinViewSet(viewsets.ModelViewSet):
    queryset = WarehouseBin.objects.select_related('warehouse_id').all()
    serializer_class = WarehouseBinSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['warehouse_id', 'bin_type']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductionLineViewSet(viewsets.ModelViewSet):
    queryset = ProductionLine.objects.prefetch_related('machines').all()
    serializer_class = ProductionLineSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'line_type']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — set status=inactive."""
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response(
            {'message': f"Production line '{instance.line_name}' deactivated."},
            status=status.HTTP_200_OK,
        )


class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.select_related('production_line_id').all()
    serializer_class = MachineSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'machine_type', 'production_line_id']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — set status=inactive."""
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response(
            {'message': f"Machine '{instance.machine_name}' deactivated."},
            status=status.HTTP_200_OK,
        )
