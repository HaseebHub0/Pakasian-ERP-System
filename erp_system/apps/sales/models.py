"""
Module 6 — Sales & Distribution
Models with EXACT field names from the client spec.
"""
import uuid
from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Customer
# ─────────────────────────────────────────────────────────────────────────────
class Customer(BaseModel):
    REGION_CHOICES = [
        ('Punjab',      'Punjab'),
        ('Sindh',       'Sindh'),
        ('KP',          'Khyber Pakhtunkhwa'),
        ('Balochistan', 'Balochistan'),
        ('AJK',         'Azad Jammu & Kashmir'),
        ('GB',          'Gilgit-Baltistan'),
        ('ICT',         'Islamabad Capital Territory'),
    ]
    STATUS_CHOICES = [
        ('active',    'Active'),
        ('inactive',  'Inactive'),
        ('suspended', 'Suspended'),
    ]
    PAYMENT_TERMS_CHOICES = [
        ('NET7',    'Net 7 Days'),
        ('NET15',   'Net 15 Days'),
        ('NET30',   'Net 30 Days'),
        ('NET60',   'Net 60 Days'),
        ('COD',     'Cash on Delivery'),
        ('ADVANCE', 'Advance Payment'),
    ]

    CUSTOMER_TYPE_CHOICES = [
        ('retailer',     'Retailer'),
        ('distributor',  'Distributor'),
        ('wholesaler',   'Wholesaler'),
        ('modern_trade', 'Modern Trade'),
        ('institutional','Institutional'),
    ]

    id                = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='customer_id',
    )
    customer_name     = models.CharField(max_length=255, db_column='customer_name')
    customer_type     = models.CharField(
        max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='retailer',
        db_column='customer_type',
    )
    contact_person    = models.CharField(max_length=150, blank=True, default='', db_column='contact_person')
    phone             = models.CharField(max_length=50, blank=True, default='', db_column='phone')
    email             = models.EmailField(blank=True, default='', db_column='email')
    address           = models.TextField(blank=True, default='', db_column='address')
    region            = models.CharField(
        max_length=20, choices=REGION_CHOICES, db_column='region',
    )
    city              = models.CharField(max_length=100, db_column='city')
    latitude          = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, db_column='latitude',
    )
    longitude         = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, db_column='longitude',
    )
    delivery_priority = models.PositiveSmallIntegerField(
        default=3,
        help_text='1=Highest, 5=Lowest',
        db_column='delivery_priority',
    )
    credit_limit      = models.DecimalField(
        max_digits=18, decimal_places=4, default=0, db_column='credit_limit',
    )
    payment_terms     = models.CharField(
        max_length=20, choices=PAYMENT_TERMS_CHOICES, default='NET30',
        db_column='payment_terms',
    )
    status            = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active', db_column='status',
    )

    class Meta:
        db_table = 'customers'
        ordering = ['customer_name']
        indexes  = [
            models.Index(fields=['region'],        name='customers_region_idx'),
            models.Index(fields=['status'],        name='customers_status_idx'),
            models.Index(fields=['delivery_priority'], name='customers_priority_idx'),
        ]

    def __str__(self):
        return f"{self.customer_name} — {self.city}, {self.region}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Sales Order
# ─────────────────────────────────────────────────────────────────────────────
class SalesOrder(BaseModel):
    SOURCE_CHOICES = [
        ('sales_app',          'Sales App'),
        ('manual_entry',       'Manual Entry'),
        ('distributor_portal', 'Distributor Portal'),
    ]
    STATUS_CHOICES = [
        ('Draft',      'Draft'),
        ('Confirmed',  'Confirmed'),
        ('Approved',   'Approved'),
        ('Dispatched', 'Dispatched'),
        ('Delivered',  'Delivered'),
        ('Cancelled',  'Cancelled'),
        ('Returned',   'Returned'),
    ]
    PAYMENT_TYPE_CHOICES = [
        ('Cash',   'Cash'),
        ('Credit', 'Credit'),
        ('Cheque', 'Cheque'),
        ('Online', 'Online Transfer'),
    ]

    id            = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='order_id',
    )
    order_source  = models.CharField(
        max_length=30, choices=SOURCE_CHOICES, default='manual_entry',
        db_column='order_source',
    )
    order_number  = models.CharField(max_length=50, unique=True, db_column='order_number')
    customer_id   = models.ForeignKey(
        Customer, on_delete=models.PROTECT,
        db_column='customer_id', related_name='sales_orders',
    )
    warehouse_id  = models.ForeignKey(
        'master_data.Warehouse', on_delete=models.PROTECT,
        db_column='warehouse_id', related_name='sales_orders',
    )
    order_date    = models.DateField(default=timezone.now, db_column='order_date')
    order_status  = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Draft',
        db_column='order_status',
    )
    payment_type  = models.CharField(
        max_length=20, choices=PAYMENT_TYPE_CHOICES, default='Credit',
        db_column='payment_type',
    )
    total_amount  = models.DecimalField(
        max_digits=20, decimal_places=4, default=0, db_column='total_amount',
    )

    class Meta:
        db_table = 'sales_orders'
        ordering = ['-order_date', 'order_number']
        indexes  = [
            models.Index(fields=['customer_id', 'order_date'], name='so_customer_date_idx'),
            models.Index(fields=['order_status'],              name='so_status_idx'),
            models.Index(fields=['order_number'],              name='so_number_idx'),
        ]

    def __str__(self):
        return f"SO#{self.order_number} — {self.customer_id.customer_name} [{self.order_status}]"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Sales Order Item
# ─────────────────────────────────────────────────────────────────────────────
class SalesOrderItem(BaseModel):
    id          = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='order_item_id',
    )
    order_id    = models.ForeignKey(
        SalesOrder, on_delete=models.CASCADE,
        db_column='order_id', related_name='items',
    )
    product_id  = models.ForeignKey(
        'master_data.Product', on_delete=models.PROTECT,
        db_column='product_id', related_name='sales_order_items',
    )
    quantity    = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='quantity')
    unit_price  = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='unit_price')
    discount    = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text='Discount percentage (0–100)',
        db_column='discount',
    )
    tax         = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text='Tax percentage (0–100)',
        db_column='tax',
    )
    total_price = models.DecimalField(max_digits=18, decimal_places=4, default=0, db_column='total_price')

    class Meta:
        db_table = 'sales_order_items'
        indexes  = [
            models.Index(fields=['order_id'],   name='soi_order_idx'),
            models.Index(fields=['product_id'], name='soi_product_idx'),
        ]

    def save(self, *args, **kwargs):
        """
        total_price = (quantity × unit_price) × (1 − discount/100) × (1 + tax/100)
        """
        qty        = Decimal(str(self.quantity))
        price      = Decimal(str(self.unit_price))
        discount   = Decimal(str(self.discount))
        tax        = Decimal(str(self.tax))
        subtotal   = qty * price
        after_disc = subtotal * (1 - discount / Decimal('100'))
        self.total_price = after_disc * (1 + tax / Decimal('100'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Item {self.product_id.sku_code} × {self.quantity} on SO#{self.order_id.order_number}"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Customer Credit Ledger
# ─────────────────────────────────────────────────────────────────────────────
class CustomerCreditLedger(BaseModel):
    ENTRY_TYPE_CHOICES = [
        ('Invoice',     'Invoice'),        # order dispatched → debit
        ('Payment',     'Payment'),        # payment received → credit
        ('Credit Note', 'Credit Note'),    # return accepted → credit
        ('Adjustment',  'Adjustment'),     # manual
    ]

    id                = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='credit_id',
    )
    customer_id       = models.ForeignKey(
        Customer, on_delete=models.CASCADE,
        db_column='customer_id', related_name='credit_ledger',
    )
    transaction_date  = models.DateField(default=timezone.now, db_column='transaction_date')
    entry_type        = models.CharField(
        max_length=20, choices=ENTRY_TYPE_CHOICES, default='Invoice',
        db_column='entry_type',
    )
    invoice_amount    = models.DecimalField(
        max_digits=20, decimal_places=4, default=0,
        help_text='Positive = amount billed / owed',
        db_column='invoice_amount',
    )
    payment_received  = models.DecimalField(
        max_digits=20, decimal_places=4, default=0,
        help_text='Positive = amount paid',
        db_column='payment_received',
    )
    balance           = models.DecimalField(
        max_digits=20, decimal_places=4, default=0,
        help_text='Running outstanding balance after this entry',
        db_column='balance',
    )
    reference_id      = models.UUIDField(
        null=True, blank=True,
        help_text='UUID of the SalesOrder or SalesReturn that generated this entry',
        db_column='reference_id',
    )
    notes             = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'customer_credit_ledger'
        ordering = ['customer_id', 'transaction_date']
        indexes  = [
            models.Index(fields=['customer_id', 'transaction_date'], name='ccl_customer_date_idx'),
        ]

    def __str__(self):
        return f"Ledger {self.customer_id.customer_name} [{self.entry_type}] balance={self.balance}"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Dispatch Order
# ─────────────────────────────────────────────────────────────────────────────
class DispatchOrder(BaseModel):
    STATUS_CHOICES = [
        ('Pending',     'Pending'),
        ('In Transit',  'In Transit'),
        ('Delivered',   'Delivered'),
        ('Failed',      'Failed'),
        ('Returned',    'Returned'),
    ]

    id            = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='dispatch_id',
    )
    order_id      = models.ForeignKey(
        SalesOrder, on_delete=models.PROTECT,
        db_column='order_id', related_name='dispatch_orders',
    )
    warehouse_id  = models.ForeignKey(
        'master_data.Warehouse', on_delete=models.PROTECT,
        db_column='warehouse_id', related_name='dispatch_orders',
    )
    vehicle_id    = models.ForeignKey(
        'master_data.Vehicle', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='vehicle_id', related_name='dispatch_orders',
    )
    driver_name   = models.CharField(max_length=150, db_column='driver_name')
    dispatch_date = models.DateField(default=timezone.now, db_column='dispatch_date')
    status        = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Pending',
        db_column='status',
    )

    class Meta:
        db_table = 'dispatch_orders'
        ordering = ['-dispatch_date']
        indexes  = [
            models.Index(fields=['order_id'],  name='do_order_idx'),
            models.Index(fields=['status'],    name='do_status_idx'),
        ]

    def __str__(self):
        return f"Dispatch#{self.pk} for SO#{self.order_id.order_number} [{self.status}]"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Dispatch Item
# ─────────────────────────────────────────────────────────────────────────────
class DispatchItem(BaseModel):
    id            = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='dispatch_item_id',
    )
    dispatch_id   = models.ForeignKey(
        DispatchOrder, on_delete=models.CASCADE,
        db_column='dispatch_id', related_name='items',
    )
    product_id    = models.ForeignKey(
        'master_data.Product', on_delete=models.PROTECT,
        db_column='product_id', related_name='dispatch_items',
    )
    batch_number  = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    quantity      = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='quantity')

    class Meta:
        db_table = 'dispatch_items'
        indexes  = [
            models.Index(fields=['dispatch_id'], name='di_dispatch_idx'),
        ]

    def __str__(self):
        return f"DispatchItem {self.product_id.sku_code} × {self.quantity} on Dispatch#{self.dispatch_id_id}"


# ─────────────────────────────────────────────────────────────────────────────
# 7. Delivery Confirmation
# ─────────────────────────────────────────────────────────────────────────────
class DeliveryConfirmation(BaseModel):
    STATUS_CHOICES = [
        ('Delivered',  'Delivered'),
        ('Partially',  'Partially Delivered'),
        ('Rejected',   'Rejected'),
    ]

    id                 = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='delivery_id',
    )
    dispatch_id        = models.OneToOneField(
        DispatchOrder, on_delete=models.CASCADE,
        db_column='dispatch_id', related_name='delivery_confirmation',
    )
    delivered_by       = models.CharField(max_length=150, db_column='delivered_by')
    delivery_time      = models.DateTimeField(default=timezone.now, db_column='delivery_time')
    customer_signature = models.TextField(
        blank=True, default='',
        help_text='Base64 image or signature reference',
        db_column='customer_signature',
    )
    status             = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Delivered',
        db_column='status',
    )

    class Meta:
        db_table = 'delivery_confirmations'
        indexes  = [
            models.Index(fields=['dispatch_id'], name='dc_dispatch_idx'),
        ]

    def __str__(self):
        return f"Delivery#{self.pk} [{self.status}] for Dispatch#{self.dispatch_id_id}"


# ─────────────────────────────────────────────────────────────────────────────
# 8. Sales Return
# ─────────────────────────────────────────────────────────────────────────────
class SalesReturn(BaseModel):
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('Approved',  'Approved'),
        ('Rejected',  'Rejected'),
        ('Completed', 'Completed'),
    ]

    id            = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='return_id',
    )
    order_id      = models.ForeignKey(
        SalesOrder, on_delete=models.PROTECT,
        db_column='order_id', related_name='sales_returns',
    )
    customer_id   = models.ForeignKey(
        Customer, on_delete=models.PROTECT,
        db_column='customer_id', related_name='sales_returns',
    )
    return_date   = models.DateField(default=timezone.now, db_column='return_date')
    return_reason = models.TextField(db_column='return_reason')
    status        = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Requested',
        db_column='status',
    )

    class Meta:
        db_table = 'sales_returns'
        ordering = ['-return_date']
        indexes  = [
            models.Index(fields=['order_id'],    name='sr_order_idx'),
            models.Index(fields=['customer_id'], name='sr_customer_idx'),
            models.Index(fields=['status'],      name='sr_status_idx'),
        ]

    def __str__(self):
        return f"Return#{self.pk} for SO#{self.order_id.order_number} [{self.status}]"


# ─────────────────────────────────────────────────────────────────────────────
# 9. Sales Return Item
# ─────────────────────────────────────────────────────────────────────────────
class SalesReturnItem(BaseModel):
    CONDITION_CHOICES = [
        ('Resellable', 'Resellable'),
        ('Damaged',    'Damaged'),
        ('Expired',    'Expired'),
    ]

    id           = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        db_column='return_item_id',
    )
    return_id    = models.ForeignKey(
        SalesReturn, on_delete=models.CASCADE,
        db_column='return_id', related_name='items',
    )
    product_id   = models.ForeignKey(
        'master_data.Product', on_delete=models.PROTECT,
        db_column='product_id', related_name='return_items',
    )
    batch_number = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    quantity     = models.DecimalField(max_digits=14, decimal_places=4, default=0, db_column='quantity')
    condition    = models.CharField(
        max_length=20, choices=CONDITION_CHOICES, default='Resellable',
        db_column='condition',
    )

    class Meta:
        db_table = 'sales_return_items'
        indexes  = [
            models.Index(fields=['return_id'],   name='sri_return_idx'),
            models.Index(fields=['product_id'],  name='sri_product_idx'),
        ]

    def __str__(self):
        return f"ReturnItem {self.product_id.sku_code} × {self.quantity} [{self.condition}]"
