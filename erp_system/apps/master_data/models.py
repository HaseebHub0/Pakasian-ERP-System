import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class ProductCategory(BaseModel):
    """Self-referencing category hierarchy (e.g. Snacks > Crisps > Potato Crisps)."""
    category_name = models.CharField(max_length=255, db_column='category_name')
    parent_category = models.ForeignKey(
        'self',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_column='parent_category',
        related_name='subcategories',
    )

    class Meta:
        db_table = 'product_category'
        ordering = ['category_name']

    def __str__(self):
        return self.category_name


class Product(BaseModel):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    sku_code       = models.CharField(max_length=100, unique=True, db_column='sku_code')
    product_name   = models.CharField(max_length=255, db_column='product_name')
    brand          = models.CharField(max_length=100, blank=True, default='', db_column='brand')
    category_id    = models.ForeignKey(
        ProductCategory,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_column='category_id',
        related_name='products',
    )
    pack_size      = models.CharField(max_length=50, db_column='pack_size')
    net_weight     = models.DecimalField(max_digits=10, decimal_places=3, db_column='net_weight')
    gross_weight   = models.DecimalField(max_digits=10, decimal_places=3, db_column='gross_weight')
    barcode        = models.CharField(max_length=100, unique=True, db_column='barcode')
    shelf_life_days = models.IntegerField(db_column='shelf_life_days')
    standard_cost  = models.DecimalField(max_digits=14, decimal_places=4, db_column='standard_cost')
    selling_price  = models.DecimalField(
        max_digits=14, decimal_places=4, default=0, db_column='selling_price',
        help_text='Retail / distributor selling price used for SKU profitability',
    )
    status         = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_column='status',
    )

    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['sku_code']),
            models.Index(fields=['barcode']),
            models.Index(fields=['category_id']),
        ]

    def __str__(self):
        return f"{self.sku_code} — {self.product_name}"


class RawMaterial(BaseModel):
    MATERIAL_TYPE_CHOICES = [
        ('ingredient', 'Ingredient'),
        ('oil',        'Oil'),
        ('spice',      'Spice'),
        ('packaging',  'Packaging'),
        ('additive',   'Additive'),
    ]

    material_code    = models.CharField(max_length=100, unique=True, db_column='material_code')
    material_name    = models.CharField(max_length=255, db_column='material_name')
    material_type    = models.CharField(max_length=50, choices=MATERIAL_TYPE_CHOICES, db_column='material_type')
    unit_of_measure  = models.CharField(max_length=50, db_column='unit_of_measure')
    density          = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, db_column='density')
    standard_cost    = models.DecimalField(max_digits=14, decimal_places=4, db_column='standard_cost')
    safety_stock     = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='safety_stock')
    reorder_level    = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='reorder_level')
    shelf_life_days  = models.IntegerField(null=True, blank=True, db_column='shelf_life_days')

    class Meta:
        db_table = 'raw_materials'
        ordering = ['material_name']

    def __str__(self):
        return f"{self.material_code} — {self.material_name}"


class Supplier(BaseModel):
    PAYMENT_TERMS_CHOICES = [
        ('NET30',   'Net 30 Days'),
        ('NET60',   'Net 60 Days'),
        ('COD',     'Cash on Delivery'),
        ('ADVANCE', 'Advance Payment'),
    ]

    supplier_name   = models.CharField(max_length=255, db_column='supplier_name')
    contact_person  = models.CharField(max_length=150, blank=True, default='', db_column='contact_person')
    phone           = models.CharField(max_length=50, blank=True, default='', db_column='phone')
    email           = models.EmailField(blank=True, default='', db_column='email')
    payment_terms   = models.CharField(
        max_length=50, blank=True, default='NET30',
        choices=PAYMENT_TERMS_CHOICES,
        db_column='payment_terms',
    )
    currency        = models.CharField(max_length=10, default='PKR', db_column='currency')
    lead_time_days  = models.IntegerField(default=7, db_column='lead_time_days')
    rating          = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_column='rating',
    )

    class Meta:
        db_table = 'suppliers'
        ordering = ['supplier_name']

    def __str__(self):
        return self.supplier_name


class Warehouse(BaseModel):
    WAREHOUSE_TYPE_CHOICES = [
        ('Factory',  'Factory'),
        ('Regional', 'Regional'),
        ('City',     'City'),
        ('Retail',   'Retail'),
    ]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    warehouse_name  = models.CharField(max_length=255, db_column='warehouse_name')
    warehouse_type  = models.CharField(max_length=50, choices=WAREHOUSE_TYPE_CHOICES, db_column='warehouse_type')
    city            = models.CharField(max_length=100, db_column='city')
    province        = models.CharField(max_length=100, db_column='province')
    country         = models.CharField(max_length=100, default='Pakistan', db_column='country')
    latitude        = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, db_column='latitude')
    longitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, db_column='longitude')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_column='status')

    class Meta:
        db_table = 'warehouses'
        ordering = ['warehouse_name']

    def __str__(self):
        return f"{self.warehouse_name} ({self.warehouse_type})"


class WarehouseBin(BaseModel):
    BIN_TYPE_CHOICES = [
        ('Standard',  'Standard'),
        ('Cold',      'Cold Storage'),
        ('Hazmat',    'Hazardous Materials'),
        ('Overflow',  'Overflow'),
    ]

    warehouse_id = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        db_column='warehouse_id',
        related_name='bins',
    )
    bin_code     = models.CharField(max_length=50, db_column='bin_code')
    capacity     = models.DecimalField(max_digits=12, decimal_places=3, db_column='capacity')
    bin_type     = models.CharField(
        max_length=50,
        choices=BIN_TYPE_CHOICES,
        default='Standard',
        db_column='bin_type',
    )

    class Meta:
        db_table = 'warehouse_bins'
        unique_together = [('warehouse_id', 'bin_code')]

    def __str__(self):
        return f"{self.bin_code} @ {self.warehouse_id.warehouse_name}"


class ProductionLine(BaseModel):
    LINE_TYPE_CHOICES = [
        ('Frying',   'Frying'),
        ('Mixing',   'Mixing'),
        ('Extruder', 'Extruder'),
        ('Packing',  'Packing'),
    ]
    STATUS_CHOICES = [
        ('active',      'Active'),
        ('inactive',    'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]

    line_name        = models.CharField(max_length=255, db_column='line_name')
    factory_id       = models.UUIDField(db_column='factory_id', help_text='UUID of the Factory warehouse this line belongs to')
    line_type        = models.CharField(max_length=50, choices=LINE_TYPE_CHOICES, db_column='line_type')
    capacity_per_hour = models.DecimalField(max_digits=10, decimal_places=3, db_column='capacity_per_hour')
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_column='status')

    class Meta:
        db_table = 'production_lines'
        ordering = ['line_name']

    def __str__(self):
        return f"{self.line_name} ({self.line_type})"


class Machine(BaseModel):
    STATUS_CHOICES = [
        ('active',      'Active'),
        ('inactive',    'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]

    machine_name       = models.CharField(max_length=255, db_column='machine_name')
    machine_type       = models.CharField(max_length=100, db_column='machine_type')
    production_line_id = models.ForeignKey(
        ProductionLine,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_column='production_line_id',
        related_name='machines',
    )
    capacity_per_hour  = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True, db_column='capacity_per_hour')
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_column='status')

    class Meta:
        db_table = 'machines'
        ordering = ['machine_name']

    def __str__(self):
        return f"{self.machine_name} ({self.machine_type})"


# ─────────────────────────────────────────────────────────────────────────────
# Vehicle  (used by sales dispatch_orders.vehicle_id)
# ─────────────────────────────────────────────────────────────────────────────
class Vehicle(BaseModel):
    VEHICLE_TYPE_CHOICES = [
        ('Truck',       'Truck'),
        ('Mini Truck',  'Mini Truck'),
        ('Van',         'Van'),
        ('Motorcycle',  'Motorcycle'),
        ('Rikshaw',     'Rikshaw'),
    ]
    STATUS_CHOICES = [
        ('active',      'Active'),
        ('inactive',    'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]

    registration_number = models.CharField(
        max_length=50, unique=True, db_column='registration_number',
    )
    vehicle_type        = models.CharField(
        max_length=30, choices=VEHICLE_TYPE_CHOICES, default='Truck',
        db_column='vehicle_type',
    )
    capacity_kg         = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        db_column='capacity_kg',
        help_text='Max load capacity in kilograms',
    )
    driver_name         = models.CharField(
        max_length=150, blank=True, default='', db_column='driver_name',
    )
    status              = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active', db_column='status',
    )

    class Meta:
        db_table = 'vehicles'
        ordering = ['registration_number']

    def __str__(self):
        return f"{self.registration_number} ({self.vehicle_type})"
