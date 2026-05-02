import uuid
from django.db import models
from apps.core.models import BaseModel


class SeasonalConfig(models.Model):
    """Demand multipliers applied during named seasonal periods for MRP forecasting."""
    season = models.CharField(max_length=100, unique=True)
    multiplier = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='e.g. 1.35 means 35% uplift in demand during this season',
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'seasonal_configs'

    def __str__(self):
        return f"{self.season} (×{self.multiplier})"


class MRPRun(BaseModel):
    """Audit record of each MRP engine execution."""
    run_date = models.DateTimeField(auto_now_add=True)
    horizon_days = models.PositiveIntegerField(default=30)
    status = models.CharField(max_length=20, default='Pending')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'mrp_runs'

    def __str__(self):
        return f"MRPRun {self.id} — {self.status}"


class MRPPlan(BaseModel):
    """
    MRP output plan per product.
    Formula: Required Production = Forecast Demand + Safety Stock - Current Inventory - Scheduled Production
    """
    plan_id              = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_column='plan_id')
    product_id           = models.ForeignKey('master_data.Product', on_delete=models.CASCADE, db_column='product_id', related_name='mrp_plans')
    forecast_qty         = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='forecast_qty')
    current_inventory    = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='current_inventory')
    safety_stock         = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='safety_stock')
    scheduled_production = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='scheduled_production')
    required_production  = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='required_production')
    planned_production_date = models.DateField(db_column='planned_production_date')
    mrp_run              = models.ForeignKey(MRPRun, null=True, blank=True, on_delete=models.SET_NULL, related_name='plans', db_column='mrp_run_id')

    class Meta:
        db_table = 'mrp_plans'
        ordering = ['planned_production_date']

    def save(self, *args, **kwargs):
        # Formula: forecast + safety_stock - current_inventory - scheduled_production
        self.required_production = max(
            self.forecast_qty + self.safety_stock - self.current_inventory - self.scheduled_production,
            0
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"MRPPlan {self.product_id} — {self.planned_production_date}"
