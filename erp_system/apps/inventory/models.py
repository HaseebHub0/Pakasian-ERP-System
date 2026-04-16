import uuid
import datetime
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Base Inventory Choices
# ─────────────────────────────────────────────────────────────────────────────
MOVEMENT_TYPES = [
    ('GRN', 'Goods Receipt Note'),
    ('DISPATCH', 'Customer Dispatch'),
    ('TRANSFER', 'Warehouse Transfer'),
    ('PRODUCTION', 'Production Consumption'),
    ('ADJUSTMENT', 'Stock Adjustment'),
    ('RETURN', 'Customer Return'),
    ('EXPIRED', 'Expired Write-off'),
]

BATCH_STATUS_CHOICES = [
    ('In Production', 'In Production'),
    ('Quality Hold', 'Quality Hold'),
    ('Approved', 'Approved'),
    ('Blocked', 'Blocked'),
    ('Expired', 'Expired')
]

TRANSFER_STATUS_CHOICES = [
    ('Draft', 'Draft'),
    ('Dispatched', 'Dispatched'),
    ('In Transit', 'In Transit'),
    ('Received', 'Received'),
    ('Cancelled', 'Cancelled')
]

RESERVATION_STATUS_CHOICES = [
    ('Reserved', 'Reserved'),
    ('Released', 'Released'),
    ('Dispatched', 'Dispatched'),
    ('Cancelled', 'Cancelled')
]

PICKING_STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('In Progress', 'In Progress'),
    ('Completed', 'Completed'),
    ('Cancelled', 'Cancelled')
]

ADJUSTMENT_TYPES = [
    ('Shrinkage', 'Shrinkage'),
    ('Found', 'Found'),
    ('Damaged', 'Damaged'),
    ('Correction', 'Correction')
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. Inventory Ledger
# ─────────────────────────────────────────────────────────────────────────────
class InventoryLedger(BaseModel):
    """
    Immutable double-entry ledger for all stock movements.
    """
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='ledger_id')
    timestamp      = models.DateTimeField(default=timezone.now, db_column='timestamp')
    item_type      = models.CharField(max_length=50, choices=[('Material', 'Material'), ('Product', 'Product')], db_column='item_type')
    material_id    = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id     = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    warehouse_id   = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    bin_id         = models.ForeignKey('master_data.WarehouseBin', null=True, blank=True, on_delete=models.SET_NULL, db_column='bin_id')
    batch_number   = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    movement_type  = models.CharField(max_length=50, choices=MOVEMENT_TYPES, db_column='movement_type')
    quantity_in    = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='quantity_in')
    quantity_out   = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='quantity_out')
    balance_after  = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='balance_after')
    reference_type = models.CharField(max_length=100, blank=True, default='', help_text="e.g. PurchaseOrder, ProductionOrder", db_column='reference_type')
    reference_id   = models.UUIDField(null=True, blank=True, help_text="Source document UUID", db_column='reference_id')
    user_id        = models.ForeignKey('authentication.SystemUser', null=True, blank=True, on_delete=models.SET_NULL, db_column='user_id')

    class Meta:
        db_table = 'inventory_ledger'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['material_id', 'product_id', 'warehouse_id', 'batch_number']),
            models.Index(fields=['movement_type', 'timestamp']),
        ]

    def save(self, *args, **kwargs):
        if self._state.adding is False:
            raise ValueError("inventory_ledger is immutable — only INSERTs allowed")
        
        from django.db import transaction
        
        with transaction.atomic():
            summary, created = InventorySummary.objects.select_for_update().get_or_create(
                warehouse_id=self.warehouse_id,
                material_id=self.material_id,
                product_id=self.product_id,
                batch_number=self.batch_number,
                defaults={
                    'total_stock': 0, 'reserved_stock': 0, 'available_stock': 0, 'in_transit_stock': 0
                }
            )
            
            # Simple aggregation logic equivalent to the intended trigger
            change = self.quantity_in - self.quantity_out
            summary.total_stock += change
            
            # Compute balance_after
            self.balance_after = summary.total_stock
            
            super().save(*args, **kwargs)
            summary.save()

    def __str__(self):
        item = self.product_id if self.item_type == 'Product' else self.material_id
        return f"{self.movement_type} | Item={item} | in={self.quantity_in} out={self.quantity_out}"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Batch Table
# ─────────────────────────────────────────────────────────────────────────────
class BatchTable(BaseModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='batch_id')
    batch_number    = models.CharField(max_length=100, unique=True, db_column='batch_number')
    material_id     = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id      = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    production_date = models.DateField(default=datetime.date.today, db_column='production_date')
    expiry_date     = models.DateField(null=True, blank=True, db_column='expiry_date')
    status          = models.CharField(max_length=50, choices=BATCH_STATUS_CHOICES, default='Quality Hold', db_column='status')

    class Meta:
        db_table = 'batch_table'

    def __str__(self):
        return self.batch_number


# ─────────────────────────────────────────────────────────────────────────────
# 4. Inventory Summary
# ─────────────────────────────────────────────────────────────────────────────
class InventorySummary(BaseModel):
    warehouse_id     = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    material_id      = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id       = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    batch_number     = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    total_stock      = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='total_stock')
    reserved_stock   = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='reserved_stock')
    available_stock  = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='available_stock')
    in_transit_stock = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='in_transit_stock')

    class Meta:
        db_table = 'inventory_summary'
        unique_together = [('warehouse_id', 'material_id', 'product_id', 'batch_number')]
        indexes = [
            models.Index(fields=['warehouse_id', 'material_id', 'product_id']),
        ]

    def save(self, *args, **kwargs):
        self.available_stock = self.total_stock - self.reserved_stock
        super().save(*args, **kwargs)

    def __str__(self):
        return f"WH={self.warehouse_id} | Avail={self.available_stock}"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Stock Transfers
# ─────────────────────────────────────────────────────────────────────────────
class StockTransfer(BaseModel):
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='transfer_id')
    source_warehouse      = models.ForeignKey('master_data.Warehouse', related_name='transfers_out', on_delete=models.CASCADE, db_column='source_warehouse')
    destination_warehouse = models.ForeignKey('master_data.Warehouse', related_name='transfers_in', on_delete=models.CASCADE, db_column='destination_warehouse')
    status                = models.CharField(max_length=50, choices=TRANSFER_STATUS_CHOICES, default='Draft', db_column='status')
    created_date          = models.DateField(default=datetime.date.today, db_column='created_date')
    dispatched_date       = models.DateField(null=True, blank=True, db_column='dispatched_date')
    received_date         = models.DateField(null=True, blank=True, db_column='received_date')

    class Meta:
        db_table = 'stock_transfers'

    def __str__(self):
        return str(self.transfer_id)


class TransferItem(BaseModel):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='transfer_item_id')
    transfer_id      = models.ForeignKey(StockTransfer, on_delete=models.CASCADE, related_name='items', db_column='transfer_id')
    material_id      = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id       = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    batch_number     = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    quantity         = models.DecimalField(max_digits=14, decimal_places=4, db_column='quantity')

    class Meta:
        db_table = 'transfer_items'

    def __str__(self):
        return str(self.transfer_item_id)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Stock Reservations
# ─────────────────────────────────────────────────────────────────────────────
class StockReservation(BaseModel):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='reservation_id')
    order_id           = models.UUIDField(null=True, blank=True, help_text="Sales Order or Production Order ID", db_column='order_id')
    material_id        = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id         = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    batch_number       = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    warehouse_id       = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    reserved_quantity  = models.DecimalField(max_digits=14, decimal_places=4, db_column='reserved_quantity')
    reservation_status = models.CharField(max_length=50, choices=RESERVATION_STATUS_CHOICES, default='Reserved', db_column='reservation_status')
    
    # created_at is strictly in BaseModel already, but we'll use BaseModel.created_at
    class Meta:
        db_table = 'stock_reservations'

    def clean(self):
        super().clean()
        if self.reservation_status == 'Reserved' and self.reserved_quantity:
            from apps.inventory.models import InventorySummary
            summary = InventorySummary.objects.filter(
                warehouse_id=self.warehouse_id_id if hasattr(self, 'warehouse_id_id') else self.warehouse_id,
                product_id=self.product_id_id if hasattr(self, 'product_id_id') else self.product_id,
                material_id=self.material_id_id if hasattr(self, 'material_id_id') else self.material_id,
                batch_number=self.batch_number
            ).first()
            avail = summary.available_stock if summary else 0
            
            # If modifying an existing reservation, consider difference
            if not self._state.adding:
                orig = StockReservation.objects.get(pk=self.pk)
                avail += orig.reserved_quantity
                
            if self.reserved_quantity > avail:
                from django.core.exceptions import ValidationError
                raise ValidationError("insufficient stock")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Warehouse Picking
# ─────────────────────────────────────────────────────────────────────────────
class WarehousePicking(BaseModel):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='picking_id')
    order_id       = models.UUIDField(null=True, blank=True, help_text="Sales Order or Production Order ID", db_column='order_id')
    warehouse_id   = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    picker_id      = models.ForeignKey('authentication.SystemUser', null=True, blank=True, on_delete=models.SET_NULL, db_column='picker_id')
    picking_status = models.CharField(max_length=50, choices=PICKING_STATUS_CHOICES, default='Pending', db_column='picking_status')
    start_time     = models.DateTimeField(null=True, blank=True, db_column='start_time')
    end_time       = models.DateTimeField(null=True, blank=True, db_column='end_time')

    class Meta:
        db_table = 'warehouse_picking'


class PickingItem(BaseModel):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='picking_item_id')
    picking_id       = models.ForeignKey(WarehousePicking, on_delete=models.CASCADE, related_name='items', db_column='picking_id')
    material_id      = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id       = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    batch_number     = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    bin_id           = models.ForeignKey('master_data.WarehouseBin', null=True, blank=True, on_delete=models.SET_NULL, db_column='bin_id')
    quantity         = models.DecimalField(max_digits=14, decimal_places=4, db_column='quantity')

    class Meta:
        db_table = 'picking_items'


# ─────────────────────────────────────────────────────────────────────────────
# 8. Inventory Adjustments
# ─────────────────────────────────────────────────────────────────────────────
class InventoryAdjustment(BaseModel):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='adjustment_id')
    warehouse_id    = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    material_id     = models.ForeignKey('master_data.RawMaterial', null=True, blank=True, on_delete=models.CASCADE, db_column='material_id')
    product_id      = models.ForeignKey('master_data.Product', null=True, blank=True, on_delete=models.CASCADE, db_column='product_id')
    batch_number    = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    adjustment_type = models.CharField(max_length=50, choices=ADJUSTMENT_TYPES, db_column='adjustment_type')
    quantity        = models.DecimalField(max_digits=14, decimal_places=4, db_column='quantity', help_text="Can be positive or negative depending on context.")
    reason          = models.TextField(db_column='reason')

    class Meta:
        db_table = 'inventory_adjustments'
