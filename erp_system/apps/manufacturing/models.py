import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Production Stages  (seeded: 1=Mixing 2=Frying 3=Oil Draining
#                        4=Seasoning 5=Cooling 6=Packing)
# ─────────────────────────────────────────────────────────────────────────────
class ProductionStage(models.Model):
    """Ordered stages of the manufacturing process."""
    id                         = models.BigAutoField(primary_key=True)
    name                       = models.CharField(max_length=100, unique=True)
    sequence_number            = models.PositiveSmallIntegerField(unique=True)
    description                = models.TextField(blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(default=0)
    is_active                  = models.BooleanField(default=True)

    class Meta:
        db_table = 'production_stages'
        ordering = ['sequence_number']

    def __str__(self):
        return f"{self.sequence_number}. {self.name}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Production Order
# ─────────────────────────────────────────────────────────────────────────────
class ProductionOrder(BaseModel):
    STATUS_CHOICES = [
        ('Planned',     'Planned'),
        ('Released',    'Released'),
        ('In Progress', 'In Progress'),
        ('Completed',   'Completed'),
        ('Closed',      'Closed'),
    ]

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                          editable=False, db_column='production_order_id')
    order_number       = models.CharField(max_length=30, unique=True,
                                          help_text='Auto: PR-YYYY-NNNN')
    product_id         = models.ForeignKey(
        'master_data.Product', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='product_id',
        related_name='production_orders',
    )
    planned_quantity   = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    planned_start_date = models.DateField(null=True, blank=True)
    planned_end_date   = models.DateField(null=True, blank=True)
    actual_start_date  = models.DateField(null=True, blank=True)
    actual_end_date    = models.DateField(null=True, blank=True)
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planned')
    created_by         = models.ForeignKey(
        'authentication.SystemUser',
        on_delete=models.SET_NULL, null=True, blank=True,
        db_column='created_by', related_name='production_orders_created',
    )
    approved_by        = models.ForeignKey(
        'authentication.SystemUser',
        null=True, blank=True, on_delete=models.SET_NULL,
        db_column='approved_by', related_name='production_orders_approved',
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'production_orders'
        indexes  = [models.Index(fields=['status', 'planned_start_date'])]

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = _generate_order_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PO {self.order_number} — {self.status}"


def _generate_order_number() -> str:
    """PR-YYYY-NNNN, race-safe sequential counter per year."""
    year  = timezone.now().year
    count = ProductionOrder.objects.filter(
        order_number__startswith=f'PR-{year}-'
    ).count()
    return f'PR-{year}-{count + 1:04d}'


# ─────────────────────────────────────────────────────────────────────────────
# 3. Production Order Items
# ─────────────────────────────────────────────────────────────────────────────
class ProductionOrderItem(BaseModel):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                           editable=False, db_column='order_item_id')
    production_order_id = models.ForeignKey(
        ProductionOrder, on_delete=models.CASCADE,
        db_column='production_order_id', related_name='items',
    )
    product_id          = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='order_items',
    )
    planned_quantity    = models.DecimalField(max_digits=14, decimal_places=4)
    produced_quantity   = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta:
        db_table = 'production_order_items'

    def __str__(self):
        return f"{self.production_order_id.order_number} — {self.product_id.sku_code}"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Production Batch
# ─────────────────────────────────────────────────────────────────────────────
class ProductionBatch(BaseModel):
    STATUS_CHOICES = [
        ('Pending',   'Pending'),
        ('Running',   'Running'),
        ('Paused',    'Paused'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                           editable=False, db_column='batch_id')
    production_order_id = models.ForeignKey(
        ProductionOrder, null=True, blank=True,
        on_delete=models.SET_NULL, db_column='production_order_id',
        related_name='batches',
    )
    batch_number        = models.CharField(max_length=100, unique=True,
                                           help_text='Auto: PN{YYMMDD}{A-Z}')
    planned_quantity    = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    actual_quantity     = models.DecimalField(max_digits=14, decimal_places=4,
                                              null=True, blank=True)
    production_line_id  = models.ForeignKey(
        'master_data.ProductionLine', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='production_line_id',
    )
    start_time          = models.DateTimeField(null=True, blank=True)
    end_time            = models.DateTimeField(null=True, blank=True)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    product_id          = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='production_batches',
    )
    operator_id         = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id',
    )
    notes               = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'production_batches'
        ordering = ['-start_time']
        indexes  = [
            models.Index(fields=['batch_number']),
            models.Index(fields=['product_id', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.batch_number:
            product_sku = getattr(self.product_id, 'sku_code', '')
            self.batch_number = _generate_batch_number(product_sku, timezone.now().date())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Batch {self.batch_number} — {self.status}"


def _generate_batch_number(product_sku: str, batch_date) -> str:
    """PN{YYMMDD}{A-Z}, e.g. PN260312A.  Rolls suffix per day."""
    date_str = batch_date.strftime('%y%m%d')
    count    = ProductionBatch.objects.filter(
        batch_number__startswith=f'PN{date_str}'
    ).count()
    suffix   = chr(ord('A') + (count % 26))
    return f'PN{date_str}{suffix}'


# ─────────────────────────────────────────────────────────────────────────────
# 5. Batch Stage Log
# ─────────────────────────────────────────────────────────────────────────────
class BatchStageLog(BaseModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                       editable=False, db_column='stage_log_id')
    batch_id        = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='stage_logs',
    )
    stage_id        = models.ForeignKey(
        ProductionStage, on_delete=models.CASCADE,
        db_column='stage_id', related_name='batch_logs',
    )
    machine_id      = models.ForeignKey(
        'master_data.Machine', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='machine_id',
    )
    operator_id     = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id',
        related_name='stage_logs',
    )
    start_time      = models.DateTimeField(null=True, blank=True)
    end_time        = models.DateTimeField(null=True, blank=True)
    input_quantity  = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    output_quantity = models.DecimalField(max_digits=14, decimal_places=4,
                                          null=True, blank=True)
    waste_quantity  = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    remarks         = models.TextField(blank=True, default='')

    class Meta:
        db_table        = 'batch_stage_logs'
        ordering        = ['stage_id__sequence_number']
        unique_together = [('batch_id', 'stage_id')]
        indexes         = [models.Index(fields=['batch_id', 'stage_id'])]

    def clean(self):
        super().clean()
        # Enforce sequential execution: previous stage must be complete before this one starts
        if self.start_time and self.stage_id_id and self.batch_id_id:
            seq = self.stage_id.sequence_number
            if seq > 1:
                prev_stage = ProductionStage.objects.filter(
                    sequence_number=seq - 1, is_active=True
                ).first()
                if prev_stage:
                    prev_log = BatchStageLog.objects.filter(
                        batch_id=self.batch_id_id,
                        stage_id=prev_stage,
                    ).first()
                    if not prev_log or not prev_log.end_time:
                        raise ValidationError(
                            f"Stage '{prev_stage.name}' must be completed before "
                            f"starting '{self.stage_id.name}'."
                        )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Batch {self.batch_id.batch_number} | Stage {self.stage_id.name}"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Material Reservations
# ─────────────────────────────────────────────────────────────────────────────
class MaterialReservation(BaseModel):
    STATUS_CHOICES = [
        ('Reserved',  'Reserved'),
        ('Issued',    'Issued'),
        ('Cancelled', 'Cancelled'),
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                         editable=False, db_column='reservation_id')
    batch_id          = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='material_reservations',
    )
    material_id       = models.ForeignKey(
        'master_data.RawMaterial', on_delete=models.CASCADE,
        db_column='material_id',
    )
    reserved_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    warehouse_id      = models.ForeignKey(
        'master_data.Warehouse', on_delete=models.CASCADE,
        db_column='warehouse_id',
    )
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Reserved')

    class Meta:
        db_table = 'material_reservations'
        indexes  = [models.Index(fields=['batch_id', 'material_id'])]

    def __str__(self):
        return f"Reservation: {self.material_id} for Batch {self.batch_id.batch_number}"


# ─────────────────────────────────────────────────────────────────────────────
# 7. Material Issues  (writes inventory ledger entry on save)
# ─────────────────────────────────────────────────────────────────────────────
class MaterialIssue(BaseModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                       editable=False, db_column='issue_id')
    batch_id        = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='material_issues',
    )
    material_id     = models.ForeignKey(
        'master_data.RawMaterial', on_delete=models.CASCADE,
        db_column='material_id', related_name='material_issues',
    )
    quantity_issued = models.DecimalField(max_digits=14, decimal_places=4)
    warehouse_id    = models.ForeignKey(
        'master_data.Warehouse', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='warehouse_id',
    )
    issued_by       = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='issued_by',
        related_name='material_issues',
    )
    issued_time     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'material_issues'
        ordering = ['issued_time']
        indexes  = [models.Index(fields=['batch_id', 'material_id'])]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Post debit to inventory ledger
        try:
            from apps.inventory.services import InventoryService
            InventoryService.post_ledger_entry(
                movement_type = 'Production Issue',
                item_type     = 'material',
                item_id       = self.material_id,
                warehouse_id  = self.warehouse_id,
                qty_out       = self.quantity_issued,
                reference_id  = self.batch_id.pk,
                user          = self.issued_by,
            )
        except Exception:
            pass   # inventory app unavailable in test environments

    def __str__(self):
        return f"Issue: {self.material_id} → Batch {self.batch_id.batch_number}"


# ─────────────────────────────────────────────────────────────────────────────
# 8. Material Consumption  (actual vs issued variance per stage)
# ─────────────────────────────────────────────────────────────────────────────
class MaterialConsumption(BaseModel):
    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                            editable=False, db_column='consumption_id')
    batch_id             = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='consumptions',
    )
    material_id          = models.ForeignKey(
        'master_data.RawMaterial', on_delete=models.CASCADE,
        db_column='material_id',
    )
    actual_quantity_used = models.DecimalField(max_digits=14, decimal_places=4)
    stage_id             = models.ForeignKey(
        ProductionStage, null=True, blank=True,
        on_delete=models.SET_NULL, db_column='stage_id',
    )
    recorded_by          = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='recorded_by',
    )

    class Meta:
        db_table = 'material_consumption'
        indexes  = [models.Index(fields=['batch_id', 'material_id'])]

    def __str__(self):
        return f"Consumption: {self.material_id} in Batch {self.batch_id.batch_number}"


# ─────────────────────────────────────────────────────────────────────────────
# 9. Production Yield
# ─────────────────────────────────────────────────────────────────────────────
class ProductionYield(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                     editable=False, db_column='yield_id')
    batch_id      = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='yield_records',
        unique=True,
    )
    input_qty     = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    output_qty    = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    yield_percent = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    class Meta:
        db_table = 'production_yield'

    def save(self, *args, **kwargs):
        if self.input_qty and self.input_qty > 0:
            self.yield_percent = round(
                (Decimal(str(self.output_qty)) / Decimal(str(self.input_qty))) * 100, 2
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Yield {self.batch_id.batch_number}: {self.output_qty} ({self.yield_percent}%)"

    # Convenience accessor used by legacy code expecting `yield_record`
    @property
    def yield_record(self):
        return self


# ─────────────────────────────────────────────────────────────────────────────
# 10. Production Waste
# ─────────────────────────────────────────────────────────────────────────────
class ProductionWaste(BaseModel):
    WASTE_TYPE_CHOICES = [
        ('Frying Loss',       'Frying Loss'),
        ('Burnt',             'Burnt'),
        ('Spillage',          'Spillage'),
        ('Packing Rejection', 'Packing Rejection'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                   editable=False, db_column='waste_id')
    batch_id    = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='waste_records',
    )
    stage_id    = models.ForeignKey(
        ProductionStage, null=True, blank=True,
        on_delete=models.SET_NULL, db_column='stage_id',
    )
    material_id = models.ForeignKey(
        'master_data.RawMaterial', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='material_id',
    )
    waste_type  = models.CharField(max_length=50, choices=WASTE_TYPE_CHOICES)
    quantity    = models.DecimalField(max_digits=14, decimal_places=4)
    reason      = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'production_waste'
        indexes  = [models.Index(fields=['batch_id', 'waste_type'])]

    def __str__(self):
        return f"Waste [{self.waste_type}] — Batch {self.batch_id.batch_number}: {self.quantity}"


# ─────────────────────────────────────────────────────────────────────────────
# 11. Oil Consumption Logs
# ─────────────────────────────────────────────────────────────────────────────
class OilConsumptionLog(BaseModel):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                          editable=False, db_column='oil_log_id')
    batch_id           = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='oil_logs',
    )
    oil_material_id    = models.ForeignKey(
        'master_data.RawMaterial', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='oil_material_id',
    )
    quantity_added     = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    quantity_remaining = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    operator_id        = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id',
        related_name='oil_logs',
    )
    timestamp          = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'oil_consumption_logs'
        ordering = ['timestamp']
        indexes  = [models.Index(fields=['batch_id'])]

    def __str__(self):
        return f"Oil Log — Batch {self.batch_id.batch_number}: added={self.quantity_added}"


# ─────────────────────────────────────────────────────────────────────────────
# 12. Machine Logs
# ─────────────────────────────────────────────────────────────────────────────
class MachineLog(BaseModel):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                        editable=False, db_column='machine_log_id')
    machine_id       = models.ForeignKey(
        'master_data.Machine', on_delete=models.CASCADE,
        db_column='machine_id', related_name='machine_logs',
    )
    batch_id         = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='machine_logs',
    )
    start_time       = models.DateTimeField(null=True, blank=True)
    end_time         = models.DateTimeField(null=True, blank=True)
    runtime_minutes  = models.PositiveIntegerField(default=0)
    downtime_minutes = models.PositiveIntegerField(default=0)
    downtime_reason  = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'machine_logs'
        indexes  = [models.Index(fields=['machine_id', 'batch_id'])]

    def save(self, *args, **kwargs):
        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            total = int(delta.total_seconds() / 60)
            self.runtime_minutes = max(total - self.downtime_minutes, 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Machine {self.machine_id} — Batch {self.batch_id.batch_number}"


# ─────────────────────────────────────────────────────────────────────────────
# 13. Packing Logs
# ─────────────────────────────────────────────────────────────────────────────
class PackingLog(BaseModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                       editable=False, db_column='packing_log_id')
    batch_id        = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='packing_logs',
    )
    packing_machine = models.CharField(max_length=100)
    packs_produced  = models.PositiveIntegerField(default=0)
    rejected_packs  = models.PositiveIntegerField(default=0)
    operator_id     = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='operator_id',
        related_name='packing_logs',
    )
    timestamp       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'packing_logs'
        indexes  = [models.Index(fields=['batch_id'])]

    def __str__(self):
        return (
            f"Packing — Batch {self.batch_id.batch_number}: "
            f"{self.packs_produced} packs, {self.rejected_packs} rejected"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 14. Production Output  (approved → inventory credit + Celery triggers)
# ─────────────────────────────────────────────────────────────────────────────
class ProductionOutput(BaseModel):
    QUALITY_STATUS_CHOICES = [
        ('Pending',  'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                         editable=False, db_column='output_id')
    batch_id          = models.ForeignKey(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='outputs',
    )
    product_id        = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='production_outputs',
    )
    quantity_produced = models.DecimalField(max_digits=14, decimal_places=4)
    batch_number      = models.CharField(max_length=100,
                                         help_text='Inventory batch number for traceability')
    warehouse_id      = models.ForeignKey(
        'master_data.Warehouse', on_delete=models.CASCADE,
        db_column='warehouse_id',
    )
    quality_status    = models.CharField(max_length=20, choices=QUALITY_STATUS_CHOICES,
                                         default='Pending')

    class Meta:
        db_table = 'production_output'
        indexes  = [models.Index(fields=['batch_id', 'quality_status'])]

    def save(self, *args, **kwargs):
        # Detect transition TO Approved
        is_new_approval = self._detect_approval_transition()
        super().save(*args, **kwargs)
        if is_new_approval:
            self._on_approved()

    def _detect_approval_transition(self) -> bool:
        if self.quality_status != 'Approved':
            return False
        if not self.pk:
            return True   # brand-new record saved directly as Approved
        try:
            prev = ProductionOutput.objects.get(pk=self.pk)
            return prev.quality_status != 'Approved'
        except ProductionOutput.DoesNotExist:
            return True

    def _on_approved(self):
        """Side-effects fired when quality_status reaches Approved."""
        # 1. Post inventory credit
        try:
            from apps.inventory.services import InventoryService
            InventoryService.post_ledger_entry(
                movement_type = 'Production Output',
                item_type     = 'product',
                item_id       = self.product_id,
                warehouse_id  = self.warehouse_id,
                qty_in        = self.quantity_produced,
                batch_number  = self.batch_number,
                reference_id  = self.batch_id.pk,
            )
        except Exception:
            pass

        # 2. Create / update BatchTable entry in inventory
        try:
            from apps.inventory.models import BatchTable
            BatchTable.objects.update_or_create(
                batch_number=self.batch_number,
                defaults={
                    'product_id':      self.product_id,
                    'production_date': self.batch_id.start_time.date()
                    if self.batch_id.start_time else None,
                    'status':          'Approved',
                },
            )
        except Exception:
            pass

        # 3. Trigger Celery tasks
        try:
            from .tasks import calculate_batch_cost, print_batch_labels
            calculate_batch_cost.delay(str(self.batch_id.pk))
            print_batch_labels.delay(str(self.batch_id.pk))
        except Exception:
            pass

        # 4. Full process-costing pipeline (Module 5)
        try:
            from apps.costing.tasks import calculate_batch_cost as costing_task
            costing_task.delay(str(self.batch_id.pk))
        except Exception:
            pass

    def __str__(self):
        return (
            f"Output — Batch {self.batch_id.batch_number}: "
            f"{self.quantity_produced} {self.product_id.sku_code}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 15. Batch Cost Summary
# ─────────────────────────────────────────────────────────────────────────────
class BatchCostSummary(BaseModel):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='cost_summary_id')
    batch_id       = models.OneToOneField(
        ProductionBatch, on_delete=models.CASCADE,
        db_column='batch_id', related_name='cost_summary',
    )
    material_cost  = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    oil_cost       = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    labour_cost    = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    overhead_cost  = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    packaging_cost = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    total_cost     = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    cost_per_unit  = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    currency       = models.CharField(max_length=10, default='PKR')
    calculated_at  = models.DateTimeField(null=True, blank=True)
    calculated_by  = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='calculated_by',
    )
    notes          = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'batch_cost_summaries'

    def save(self, *args, **kwargs):
        self.total_cost = (
            self.material_cost + self.oil_cost
            + self.labour_cost + self.overhead_cost + self.packaging_cost
        )
        try:
            yield_rec  = ProductionYield.objects.get(batch_id=self.batch_id)
            output_qty = yield_rec.output_qty
            if output_qty and output_qty > 0:
                self.cost_per_unit = self.total_cost / output_qty
        except ProductionYield.DoesNotExist:
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Cost — Batch {self.batch_id.batch_number}: {self.total_cost} {self.currency}"
