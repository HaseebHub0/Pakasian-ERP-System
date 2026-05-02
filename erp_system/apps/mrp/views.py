from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MRPPlan, MRPRun, SeasonalConfig
from .serializers import MRPPlanSerializer, MRPRunSerializer, SeasonalConfigSerializer


class MRPPlanViewSet(viewsets.ModelViewSet):
    queryset = MRPPlan.objects.select_related('product_id', 'mrp_run').all()
    serializer_class = MRPPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        product = self.request.query_params.get('product_id')
        mrp_run = self.request.query_params.get('mrp_run')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if product:
            qs = qs.filter(product_id=product)
        if mrp_run:
            qs = qs.filter(mrp_run=mrp_run)
        if date_from:
            qs = qs.filter(planned_production_date__gte=date_from)
        if date_to:
            qs = qs.filter(planned_production_date__lte=date_to)
        return qs


class MRPRunViewSet(viewsets.ModelViewSet):
    queryset = MRPRun.objects.prefetch_related('plans').all()
    serializer_class = MRPRunSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def plans(self, request, pk=None):
        run = self.get_object()
        serializer = MRPPlanSerializer(run.plans.all(), many=True)
        return Response(serializer.data)


class SeasonalConfigViewSet(viewsets.ModelViewSet):
    queryset = SeasonalConfig.objects.all()
    serializer_class = SeasonalConfigSerializer
    permission_classes = [IsAuthenticated]
