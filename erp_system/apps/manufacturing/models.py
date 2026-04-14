import uuid
from django.db import models
from apps.core.models import BaseModel


class ProductionStage(models.Model):
    """Ordered stages of the manufacturing process (Mixing → Packing)."""
    name = models.CharField(max_length=100, unique=True)
    sequence = models.PositiveSmallIntegerField(unique=True, help_text='Display / execution order')
    description = models.TextField(blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(
        default=0,
        help_text='Expected time for this stage in minutes',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'production_stages'
        ordering = ['sequence']

    def __str__(self):
        return f"{self.sequence}. {self.name}"


class ProductionOrder(BaseModel):
    """A production run against a finished-goods product."""
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    reference = models.CharField(max_length=100, unique=True)
    planned_qty = models.DecimalField(max_digits=12, decimal_places=3)
    actual_qty = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    planned_start = models.DateField(null=True, blank=True)
    planned_end = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'production_orders'

    def __str__(self):
        return f"PO {self.reference} — {self.status}"
