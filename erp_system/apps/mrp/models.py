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
        return f"MRPRun {self.run_id} — {self.status}"
