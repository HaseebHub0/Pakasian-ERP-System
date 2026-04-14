import uuid
from django.db import models
from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Production Stages  (pre-existing — unchanged)
# ─────────────────────────────────────────────────────────────────────────────
class ProductionStage(models.Model):
    """Ordered stages of the manufacturing process (Mixing → Packing)."""
    name                       = models.CharField(max_length=100, unique=True)
    sequence_number            = models.PositiveSmallIntegerField(
        unique=True, help_text='Display / execution order'
    )
    description                = models.TextField(blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(
        default=0, help_text='Expected time for this stage in minutes'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'production_stages'
        ordering  = ['sequence_number']

    def __str__(self):
        return f"{self.sequence_number}. {self.name}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Production Order  (pre-existing — unchanged)
# ─────────────────────────────────────────────────────────────────────────────
class ProductionOrder(BaseModel):
    """A production run against a finished-goods product."""
    STATUS_CHOICES = [
        ('Draft',       'Draft'),
        ('In Progress', 'In Progress'),
        ('Completed',   'Completed'),
        ('Cancelled',   'Cancelled'),
    ]

    reference    = models.CharField(max_length=100, unique=True)
    planned_qty  = models.DecimalField(max_digits=12, decimal_places=3)
    actual_qty   = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    planned_start = models.DateField(null=True, blank=True)
    planned_end   = models.DateField(null=True, blank=True)
    notes         = models.TextField(blank=True)

    class Meta:
        db_table = 'production_orders'

    def __str__(self):
        return f"PO {self.reference} — {self.status}"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Production Batch  — one batch per BatchTable.batch_number
# ─────────────────────────────────────────────────────────────────────────────
class ProductionBatch(BaseModel):
    """
    The actual execution record for a production batch.
    batch_number must match BatchTable.batch_number (inventory side).
    """
    STATUS_CHOICES = [
        ('In Progress', 'In Progress'),
        ('Completed',   'Completed'),
        ('Cancelled',   'Cancelled'),
        ('On Hold',     'On Hold'),
    ]

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                          db_column='production_batch_id')
    batch_number       = models.CharField(max_length=100, unique=True, db_column='batch_number',
                                          help_text='Must match inventory.BatchTable.batch_number')
    production_order_id = models.ForeignKey(
        ProductionOrder, null=True, blank=True,
        on_delete=models.SET_NULL, db_column='production_order_id',
        related_name='batches',
    )
    product_id         = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='production_batches',
    )
    production_line_id = models.ForeignKey(
        'master_data.ProductionLine', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='production_line_id',
    )
    planned_quantity   = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                             db_column='planned_quantity')
    start_datetime     = models.DateTimeField(null=True, blank=True, db_column='start_datetime')
    end_datetime       = models.DateTimeField(null=True, blank=True, db_column='end_datetime')
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                          default='In Progress', db_column='status')
    operator_id        = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id',
    )
    notes              = models.TextField(blank=True, default='', db_column='notes')

    class Meta:
        db_table = 'production_batches'
        ordering = ['-start_datetime']
        indexes  = [
            models.Index(fields=['batch_number']),
            models.Index(fields=['product_id', 'status']),
        ]

    def __str__(self):
        return f"Batch {self.batch_number} — {self.status}"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Material Issue  — raw materials consumed per batch
# ─────────────────────────────────────────────────────────────────────────────
class MaterialIssue(BaseModel):
    """
    Raw materials issued / consumed for a production batch.
    Captures the actual supplier used at the time of issuance so
    batch_trace can expose material + supplier traceability.
    """
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                      db_column='material_issue_id')
    batch_id       = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='material_issues',
    )
    material_id    = models.ForeignKey(
        'master_data.RawMaterial', on_delete=models.CASCADE,
        db_column='material_id', related_name='material_issues',
    )
    supplier_id    = models.ForeignKey(
        'master_data.Supplier', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='supplier_id',
        help_text='Actual supplier from whom this material was sourced for this batch',
    )
    issued_quantity    = models.DecimalField(max_digits=14, decimal_places=4, db_column='issued_quantity')
    unit_of_measure    = models.CharField(max_length=50, blank=True, default='', db_column='unit_of_measure')
    unit_cost          = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='unit_cost')
    total_cost         = models.DecimalField(max_digits=16, decimal_places=4, default=0, db_column='total_cost')
    issued_at          = models.DateTimeField(null=True, blank=True, db_column='issued_at')
    issued_by          = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='issued_by', related_name='material_issues',
    )
    raw_material_batch = models.CharField(
        max_length=100, blank=True, default='', db_column='raw_material_batch',
        help_text='Supplier lot / batch number of the raw material',
    )

    class Meta:
        db_table = 'material_issues'
        ordering = ['issued_at']
        indexes  = [
            models.Index(fields=['batch_id', 'material_id']),
        ]

    def save(self, *args, **kwargs):
        if self.issued_quantity and self.unit_cost:
            self.total_cost = self.issued_quantity * self.unit_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Issue: {self.material_id} → Batch {self.batch_id.batch_number}"
            f" ({self.issued_quantity} {self.unit_of_measure})"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Batch Stage Log  — step-by-step execution log per batch
# ─────────────────────────────────────────────────────────────────────────────
class BatchStageLog(BaseModel):
    """
    Records the execution of each production stage for a batch.
    Ordered by stage_id__sequence_number for full process traceability.
    """
    STATUS_CHOICES = [
        ('Pending',     'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed',   'Completed'),
        ('Skipped',     'Skipped'),
        ('Failed',      'Failed'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                   db_column='stage_log_id')
    batch_id    = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='stage_logs',
    )
    stage_id    = models.ForeignKey(
        ProductionStage, on_delete=models.CASCADE,
        db_column='stage_id', related_name='batch_logs',
    )
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                   default='Pending', db_column='status')
    start_time  = models.DateTimeField(null=True, blank=True, db_column='start_time')
    end_time    = models.DateTimeField(null=True, blank=True, db_column='end_time')
    operator_id = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id', related_name='stage_logs',
    )
    machine_id  = models.ForeignKey(
        'master_data.Machine', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='machine_id',
    )
    temperature_celsius = models.DecimalField(max_digits=6, decimal_places=2,
                                              null=True, blank=True, db_column='temperature_celsius')
    remarks     = models.TextField(blank=True, default='', db_column='remarks')

    class Meta:
        db_table    = 'batch_stage_logs'
        ordering    = ['stage_id__sequence_number']
        unique_together = [('batch_id', 'stage_id')]
        indexes     = [
            models.Index(fields=['batch_id', 'stage_id']),
        ]

    def __str__(self):
        return f"Batch {self.batch_id.batch_number} | {self.stage_id.name} | {self.status}"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Production Yield  — final output per batch
# ─────────────────────────────────────────────────────────────────────────────
class ProductionYield(BaseModel):
    """
    Actual vs planned output recorded at end of a production batch.
    One-to-one: each batch has at most one yield record.
    """
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        db_column='yield_id')
    batch_id         = models.OneToOneField(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='yield_record',
    )
    planned_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                           db_column='planned_quantity')
    actual_quantity  = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                           db_column='actual_quantity')
    waste_quantity   = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                           db_column='waste_quantity')
    yield_percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0,
                                           db_column='yield_percentage',
                                           help_text='actual / planned × 100')
    unit_of_measure  = models.CharField(max_length=50, blank=True, default='', db_column='unit_of_measure')
    recorded_at      = models.DateTimeField(null=True, blank=True, db_column='recorded_at')
    recorded_by      = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='recorded_by',
    )
    qc_approved      = models.BooleanField(default=False, db_column='qc_approved')
    notes            = models.TextField(blank=True, default='', db_column='notes')

    class Meta:
        db_table = 'production_yields'

    def save(self, *args, **kwargs):
        if self.planned_quantity and self.planned_quantity > 0:
            self.yield_percentage = (self.actual_quantity / self.planned_quantity) * 100
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Yield {self.batch_id.batch_number}: {self.actual_quantity} ({self.yield_percentage}%)"


# ─────────────────────────────────────────────────────────────────────────────
# 7. Oil Consumption Log  — FMCG frying/cooking oil tracking per batch
# ─────────────────────────────────────────────────────────────────────────────
class OilConsumptionLog(BaseModel):
    """
    Tracks oil (frying / cooking) consumption per production batch.
    Critical variable cost in crisps / snacks FMCG manufacturing.
    """
    OIL_TYPE_CHOICES = [
        ('Palm',      'Palm Oil'),
        ('Sunflower', 'Sunflower Oil'),
        ('Canola',    'Canola Oil'),
        ('Blended',   'Blended Oil'),
        ('Other',     'Other'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                       db_column='oil_log_id')
    batch_id        = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='oil_logs',
    )
    material_id     = models.ForeignKey(
        'master_data.RawMaterial', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='material_id',
        help_text='Oil raw-material master record',
    )
    oil_type        = models.CharField(max_length=50, choices=OIL_TYPE_CHOICES,
                                       default='Palm', db_column='oil_type')
    opening_reading = models.DecimalField(max_digits=12, decimal_places=4, default=0,
                                          db_column='opening_reading',
                                          help_text='Tank level or meter reading at batch start')
    closing_reading = models.DecimalField(max_digits=12, decimal_places=4, default=0,
                                          db_column='closing_reading',
                                          help_text='Tank level or meter reading at batch end')
    consumed        = models.DecimalField(max_digits=12, decimal_places=4, default=0,
                                          db_column='consumed',
                                          help_text='Auto-computed: opening − closing')
    unit_of_measure = models.CharField(max_length=20, default='kg', db_column='unit_of_measure')
    unit_cost       = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                          db_column='unit_cost')
    total_cost      = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                          db_column='total_cost')
    logged_at       = models.DateTimeField(null=True, blank=True, db_column='logged_at')
    logged_by       = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='logged_by',
    )

    class Meta:
        db_table = 'oil_consumption_logs'
        ordering = ['logged_at']
        indexes  = [
            models.Index(fields=['batch_id']),
        ]

    def save(self, *args, **kwargs):
        self.consumed   = max(self.opening_reading - self.closing_reading, 0)
        self.total_cost = self.consumed * self.unit_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Oil [{self.oil_type}] — Batch {self.batch_id.batch_number}:"
            f" {self.consumed} {self.unit_of_measure}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 8. Batch Cost Summary  — rolled-up costing per batch
# ─────────────────────────────────────────────────────────────────────────────
class BatchCostSummary(BaseModel):
    """
    Aggregates material, oil, labour, overhead, and packaging costs
    into a single per-batch cost record.
    """
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        db_column='cost_summary_id')
    batch_id         = models.OneToOneField(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='cost_summary',
    )
    material_cost    = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                           db_column='material_cost')
    oil_cost         = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                           db_column='oil_cost')
    labour_cost      = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                           db_column='labour_cost')
    overhead_cost    = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                           db_column='overhead_cost')
    packaging_cost   = models.DecimalField(max_digits=16, decimal_places=4, default=0,
                                           db_column='packaging_cost')
    total_cost       = models.DecimalField(max_digits=18, decimal_places=4, default=0,
                                           db_column='total_cost')
    cost_per_unit    = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                           db_column='cost_per_unit')
    currency         = models.CharField(max_length=10, default='PKR', db_column='currency')
    calculated_at    = models.DateTimeField(null=True, blank=True, db_column='calculated_at')
    calculated_by    = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='calculated_by',
    )
    notes            = models.TextField(blank=True, default='', db_column='notes')

    class Meta:
        db_table = 'batch_cost_summaries'

    def save(self, *args, **kwargs):
        self.total_cost = (
            self.material_cost + self.oil_cost
            + self.labour_cost + self.overhead_cost + self.packaging_cost
        )
        try:
            actual_qty = self.batch_id.yield_record.actual_quantity
            if actual_qty and actual_qty > 0:
                self.cost_per_unit = self.total_cost / actual_qty
        except Exception:
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Cost — Batch {self.batch_id.batch_number}: {self.total_cost} {self.currency}"
