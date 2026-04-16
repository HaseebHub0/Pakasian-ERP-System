import uuid
from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Batch Material Cost
#    Covers both raw-material consumption AND oil top-ups (both sourced from
#    MaterialConsumption / OilConsumptionLog and written here by the service).
# ─────────────────────────────────────────────────────────────────────────────
class BatchMaterialCost(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='batch_material_cost_id')
    batch_id      = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='material_costs',
    )
    material_id   = models.ForeignKey(
        'master_data.RawMaterial', on_delete=models.CASCADE,
        db_column='material_id', related_name='batch_material_costs',
    )
    quantity_used = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    unit_cost     = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_cost    = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    currency      = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table = 'batch_material_cost'
        indexes  = [models.Index(fields=['batch_id', 'material_id'])]

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.quantity_used)) * Decimal(str(self.unit_cost))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"MatCost Batch={self.batch_id_id} Mat={self.material_id_id}: {self.total_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Labour Log
# ─────────────────────────────────────────────────────────────────────────────
class LabourLog(BaseModel):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                     editable=False, db_column='labour_log_id')
    batch_id     = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='labour_logs',
    )
    stage_id     = models.ForeignKey(
        'manufacturing.ProductionStage', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='stage_id',
        related_name='labour_logs',
    )
    worker_count = models.PositiveSmallIntegerField(default=1)
    hours_worked = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    hourly_rate  = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    total_cost   = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    shift_date   = models.DateField(default=timezone.now)
    currency     = models.CharField(max_length=10, default='PKR')
    remarks      = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'labour_logs'
        ordering = ['shift_date']
        indexes  = [models.Index(fields=['batch_id', 'shift_date'])]

    def save(self, *args, **kwargs):
        self.total_cost = (
            Decimal(str(self.worker_count))
            * Decimal(str(self.hours_worked))
            * Decimal(str(self.hourly_rate))
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Labour Batch={self.batch_id_id}: "
            f"{self.worker_count}×{self.hours_worked}h = {self.total_cost}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 3. Machine Cost Rate  (standard hourly rate per machine)
# ─────────────────────────────────────────────────────────────────────────────
class MachineCostRate(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='machine_rate_id')
    machine_id    = models.ForeignKey(
        'master_data.Machine', on_delete=models.CASCADE,
        db_column='machine_id', related_name='cost_rates',
    )
    cost_per_hour = models.DecimalField(max_digits=12, decimal_places=4)
    effective_from = models.DateField()
    effective_to  = models.DateField(null=True, blank=True)
    currency      = models.CharField(max_length=10, default='PKR')
    notes         = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'machine_cost_rates'
        ordering = ['-effective_from']
        indexes  = [models.Index(fields=['machine_id', 'effective_from'])]

    def __str__(self):
        return f"Rate {self.machine_id_id}: {self.cost_per_hour}/h from {self.effective_from}"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Batch Machine Cost  (runtime_hours × cost_per_hour per batch per machine)
# ─────────────────────────────────────────────────────────────────────────────
class BatchMachineCost(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='batch_machine_cost_id')
    batch_id      = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='machine_costs',
    )
    machine_id    = models.ForeignKey(
        'master_data.Machine', on_delete=models.CASCADE,
        db_column='machine_id', related_name='batch_machine_costs',
    )
    runtime_hours = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    hourly_rate   = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    total_cost    = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    currency      = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table = 'batch_machine_cost'
        indexes  = [models.Index(fields=['batch_id', 'machine_id'])]

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.runtime_hours)) * Decimal(str(self.hourly_rate))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"MachineCost Batch={self.batch_id_id} Machine={self.machine_id_id}: {self.total_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Factory Overhead  (periodic overhead definitions — rent, depreciation…)
# ─────────────────────────────────────────────────────────────────────────────
class FactoryOverhead(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='overhead_id')
    name          = models.CharField(max_length=100)
    overhead_type = models.CharField(max_length=50, blank=True, default='',
                                     help_text='e.g. Rent, Depreciation, Insurance')
    monthly_cost  = models.DecimalField(max_digits=18, decimal_places=4)
    currency      = models.CharField(max_length=10, default='PKR')
    is_active     = models.BooleanField(default=True)

    class Meta:
        db_table = 'factory_overheads'
        ordering = ['name']
        indexes  = [models.Index(fields=['is_active'])]

    def __str__(self):
        return f"Overhead: {self.name} — {self.monthly_cost}/month"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Batch Overhead Cost  (machine-hours-basis allocation per batch)
# ─────────────────────────────────────────────────────────────────────────────
class BatchOverheadCost(BaseModel):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                       editable=False, db_column='batch_overhead_cost_id')
    batch_id       = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='overhead_costs',
    )
    overhead_id    = models.ForeignKey(
        FactoryOverhead, on_delete=models.CASCADE,
        db_column='overhead_id', related_name='batch_allocations',
    )
    allocated_cost = models.DecimalField(max_digits=16, decimal_places=4, default=0)
    currency       = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table = 'batch_overhead_cost'
        indexes  = [models.Index(fields=['batch_id', 'overhead_id'])]

    def __str__(self):
        return f"OverheadCost Batch={self.batch_id_id}: {self.overhead_id_id}={self.allocated_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# 7. Batch Waste Cost  (monetary value of waste per batch)
# ─────────────────────────────────────────────────────────────────────────────
class BatchWasteCost(BaseModel):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                     editable=False, db_column='batch_waste_cost_id')
    batch_id     = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='waste_costs',
    )
    material_id  = models.ForeignKey(
        'master_data.RawMaterial', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='material_id',
        related_name='batch_waste_costs',
    )
    waste_qty    = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    cost_per_unit = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_cost   = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    currency     = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table = 'batch_waste_cost'
        indexes  = [models.Index(fields=['batch_id'])]

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.waste_qty)) * Decimal(str(self.cost_per_unit))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"WasteCost Batch={self.batch_id_id}: {self.waste_qty} × {self.cost_per_unit} = {self.total_cost}"


# ─────────────────────────────────────────────────────────────────────────────
# 8. Batch Cost Summary  (rolled-up totals per batch)
# ─────────────────────────────────────────────────────────────────────────────
class BatchCostSummary(BaseModel):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                         editable=False, db_column='batch_cost_summary_id')
    batch_id         = models.OneToOneField(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='costing_summary',
    )
    material_cost    = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    labour_cost      = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    machine_cost     = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    overhead_cost    = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    waste_cost       = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    total_batch_cost = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    currency         = models.CharField(max_length=10, default='PKR')
    calculated_at    = models.DateTimeField(null=True, blank=True)
    calculated_by    = models.ForeignKey(
        'authentication.SystemUser', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='calculated_by',
        related_name='costing_summaries',
    )

    class Meta:
        db_table = 'batch_cost_summary'

    def save(self, *args, **kwargs):
        self.total_batch_cost = (
            self.material_cost + self.labour_cost + self.machine_cost
            + self.overhead_cost + self.waste_cost
        )
        if not self.calculated_at:
            self.calculated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"CostSummary Batch={self.batch_id_id}: {self.total_batch_cost} {self.currency}"


# ─────────────────────────────────────────────────────────────────────────────
# 9. Unit Cost  (cost per unit of finished product)
# ─────────────────────────────────────────────────────────────────────────────
class UnitCost(BaseModel):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                          editable=False, db_column='unit_cost_id')
    batch_id          = models.OneToOneField(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='unit_cost',
    )
    product_id        = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='unit_costs',
    )
    total_batch_cost  = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    quantity_produced = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    unit_cost         = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    currency          = models.CharField(max_length=10, default='PKR')
    cost_date         = models.DateField(default=timezone.now)

    class Meta:
        db_table = 'unit_costs'
        indexes  = [models.Index(fields=['product_id', 'cost_date'])]

    def save(self, *args, **kwargs):
        if self.quantity_produced and Decimal(str(self.quantity_produced)) > 0:
            self.unit_cost = round(
                Decimal(str(self.total_batch_cost)) / Decimal(str(self.quantity_produced)), 4
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"UnitCost {self.product_id_id}: {self.unit_cost}/unit"


# ─────────────────────────────────────────────────────────────────────────────
# 10. Cost Variance  (actual unit cost vs product standard cost)
# ─────────────────────────────────────────────────────────────────────────────
class CostVariance(BaseModel):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                      editable=False, db_column='cost_variance_id')
    batch_id      = models.ForeignKey(
        'manufacturing.ProductionBatch', on_delete=models.CASCADE,
        db_column='batch_id', related_name='cost_variances',
    )
    product_id    = models.ForeignKey(
        'master_data.Product', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='product_id',
        related_name='cost_variances',
    )
    actual_cost   = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    standard_cost = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    variance      = models.DecimalField(max_digits=14, decimal_places=4, default=0,
                                        help_text='actual_cost − standard_cost')
    currency      = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table = 'cost_variances'
        indexes  = [models.Index(fields=['batch_id'])]

    def save(self, *args, **kwargs):
        self.variance = Decimal(str(self.actual_cost)) - Decimal(str(self.standard_cost))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Variance Batch={self.batch_id_id}: {self.variance} ({self.actual_cost} vs {self.standard_cost})"


# ─────────────────────────────────────────────────────────────────────────────
# 11. SKU Profitability  (monthly roll-up per product)
# ─────────────────────────────────────────────────────────────────────────────
class SKUProfitability(BaseModel):
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4,
                                              editable=False, db_column='sku_profitability_id')
    product_id            = models.ForeignKey(
        'master_data.Product', on_delete=models.CASCADE,
        db_column='product_id', related_name='sku_profitability',
    )
    period_start          = models.DateField()
    period_end            = models.DateField()
    batches_counted       = models.PositiveIntegerField(default=0)
    total_units_produced  = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    total_production_cost = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    avg_unit_cost         = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_revenue         = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    gross_profit          = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    gross_margin_percent  = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    currency              = models.CharField(max_length=10, default='PKR')

    class Meta:
        db_table        = 'sku_profitability'
        unique_together = [('product_id', 'period_start', 'period_end')]
        ordering        = ['-period_start', 'product_id']
        indexes         = [models.Index(fields=['product_id', 'period_start'])]

    def save(self, *args, **kwargs):
        if self.total_units_produced and Decimal(str(self.total_units_produced)) > 0:
            self.avg_unit_cost = round(
                Decimal(str(self.total_production_cost)) / Decimal(str(self.total_units_produced)), 4
            )
        self.gross_profit = (
            Decimal(str(self.total_revenue)) - Decimal(str(self.total_production_cost))
        )
        if self.total_revenue and Decimal(str(self.total_revenue)) > 0:
            self.gross_margin_percent = round(
                (self.gross_profit / Decimal(str(self.total_revenue))) * 100, 2
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Profitability {self.product_id_id} "
            f"({self.period_start}→{self.period_end}): {self.gross_margin_percent}% margin"
        )
