import uuid
import datetime
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# 1. Payment Terms
# ─────────────────────────────────────────────────────────────────────────────
class PaymentTerm(BaseModel):
    term_name   = models.CharField(max_length=100, db_column='term_name')
    days        = models.IntegerField(default=0, db_column='days')
    description = models.TextField(blank=True, default='', db_column='description')

    class Meta:
        db_table = 'payment_terms'
        ordering = ['days']

    def __str__(self):
        return f"{self.term_name} ({self.days} days)"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Approval Workflows
# ─────────────────────────────────────────────────────────────────────────────
class ApprovalWorkflow(BaseModel):
    ENTITY_TYPE_CHOICES = [
        ('PR', 'Purchase Requisition'),
        ('PO', 'Purchase Order'),
    ]
    entity_type   = models.CharField(max_length=10, choices=ENTITY_TYPE_CHOICES, db_column='entity_type')
    min_amount    = models.DecimalField(max_digits=15, decimal_places=2, db_column='min_amount')
    max_amount    = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, db_column='max_amount')
    approver_role = models.CharField(max_length=100, db_column='approver_role')

    class Meta:
        db_table = 'approval_workflows'
        ordering = ['entity_type', 'min_amount']

    def __str__(self):
        return f"{self.entity_type} {self.min_amount} -> {self.approver_role}"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Supplier ↔ Material Catalogue
# ─────────────────────────────────────────────────────────────────────────────
class SupplierMaterial(BaseModel):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    supplier_id            = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    material_id            = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    supplier_material_code = models.CharField(max_length=100, blank=True, default='', db_column='supplier_material_code')
    lead_time_days         = models.IntegerField(default=7, db_column='lead_time_days')
    minimum_order_qty      = models.DecimalField(max_digits=14, decimal_places=3, default=0, db_column='minimum_order_qty')
    standard_price         = models.DecimalField(max_digits=14, decimal_places=4, db_column='standard_price')
    currency               = models.CharField(max_length=10, default='PKR', db_column='currency')
    preferred_supplier     = models.BooleanField(default=False, db_column='preferred_supplier')
    status                 = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_column='status')

    class Meta:
        db_table = 'supplier_materials'
        unique_together = [('supplier_id', 'material_id')]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_price = None

        if not is_new:
            try:
                old_instance = SupplierMaterial.objects.get(pk=self.pk)
                old_price = old_instance.standard_price
            except SupplierMaterial.DoesNotExist:
                pass
                
        super().save(*args, **kwargs)
        
        # If new or price changed, update history
        if is_new or (old_price is not None and old_price != self.standard_price):
            from django.utils import timezone
            now_date = timezone.now().date()
            
            # Close previous open history if exists
            open_history = SupplierPriceHistory.objects.filter(
                supplier_id=self.supplier_id,
                material_id=self.material_id,
                valid_to__isnull=True
            ).exclude(price=self.standard_price)
            
            for hist in open_history:
                hist.valid_to = now_date
                hist.save(update_fields=['valid_to', 'updated_at'])
                
            # Create new history entry
            SupplierPriceHistory.objects.create(
                supplier_id=self.supplier_id,
                material_id=self.material_id,
                price=self.standard_price,
                currency=self.currency,
                valid_from=now_date
            )



# ─────────────────────────────────────────────────────────────────────────────
# 4. Supplier Price History
# ─────────────────────────────────────────────────────────────────────────────
class SupplierPriceHistory(BaseModel):
    supplier_id = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    material_id = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    price       = models.DecimalField(max_digits=14, decimal_places=4, db_column='price')
    currency    = models.CharField(max_length=10, default='PKR', db_column='currency')
    valid_from  = models.DateField(db_column='valid_from')
    valid_to    = models.DateField(null=True, blank=True, db_column='valid_to')
    created_by  = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, null=True, blank=True, db_column='created_by')

    class Meta:
        db_table = 'supplier_price_history'
        ordering = ['-valid_from']


# ─────────────────────────────────────────────────────────────────────────────
# 5. Purchase Requisition
# ─────────────────────────────────────────────────────────────────────────────
class PurchaseRequisition(BaseModel):
    STATUS_CHOICES = [
        ('Draft',     'Draft'),
        ('Submitted', 'Submitted'),
        ('Approved',  'Approved'),
        ('Rejected',  'Rejected'),
        ('Converted', 'Converted to PO'),
    ]
    APPROVAL_STATUS_CHOICES = [
        ('Pending',  'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    requisition_number = models.CharField(max_length=50, unique=True, blank=True, db_column='requisition_number')
    created_date       = models.DateField(default=datetime.date.today, db_column='created_date')
    requested_by       = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, null=True, blank=True, db_column='requested_by')
    department         = models.CharField(max_length=100, blank=True, default='', db_column='department')
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft', db_column='status')
    approval_status    = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='Pending', db_column='approval_status')

    class Meta:
        db_table = 'purchase_requisitions'
        ordering = ['-created_date']

    def save(self, *args, **kwargs):
        if not self.requisition_number:
            from apps.core.utils.number_generator import generate_pr_number
            self.requisition_number = generate_pr_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PR {self.requisition_number} — {self.status}"


class PurchaseRequisitionItem(BaseModel):
    requisition_id     = models.ForeignKey(PurchaseRequisition, on_delete=models.CASCADE, db_column='requisition_id', related_name='items')
    material_id        = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    requested_quantity = models.DecimalField(max_digits=14, decimal_places=3, db_column='requested_quantity')
    required_date      = models.DateField(null=True, blank=True, db_column='required_date')
    warehouse_id       = models.ForeignKey('master_data.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, db_column='warehouse_id')
    remarks            = models.TextField(blank=True, default='', db_column='remarks')

    class Meta:
        db_table = 'purchase_requisition_items'


# ─────────────────────────────────────────────────────────────────────────────
# 6. Request for Quotation & Quotations
# ─────────────────────────────────────────────────────────────────────────────
class RequestForQuotation(BaseModel):
    STATUS_CHOICES = [
        ('Draft',    'Draft'),
        ('Sent',     'Sent to Supplier'),
        ('Received', 'Quotation Received'),
        ('Closed',   'Closed'),
    ]
    rfq_number     = models.CharField(max_length=50, unique=True, blank=True, db_column='rfq_number')
    requisition_id = models.ForeignKey(PurchaseRequisition, on_delete=models.SET_NULL, null=True, blank=True, db_column='requisition_id')
    supplier_id    = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    material_id    = models.ForeignKey('master_data.RawMaterial', on_delete=models.SET_NULL, null=True, blank=True, db_column='material_id')
    quantity       = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True, db_column='quantity')
    required_date  = models.DateField(null=True, blank=True, db_column='required_date')
    notes          = models.TextField(blank=True, default='', db_column='notes')
    rfq_date       = models.DateField(default=datetime.date.today, db_column='rfq_date')
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft', db_column='status')

    class Meta:
        db_table = 'request_for_quotations'

    def save(self, *args, **kwargs):
        if not self.rfq_number:
            from apps.core.utils.number_generator import generate_rfq_number
            self.rfq_number = generate_rfq_number()
        super().save(*args, **kwargs)


class Quotation(BaseModel):
    rfq_id        = models.ForeignKey(RequestForQuotation, on_delete=models.CASCADE, db_column='rfq_id', related_name='quotations')
    supplier_id   = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    material_id   = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    quoted_price  = models.DecimalField(max_digits=14, decimal_places=4, db_column='quoted_price')
    currency      = models.CharField(max_length=10, default='PKR', db_column='currency')
    delivery_days = models.IntegerField(default=7, db_column='delivery_days')
    valid_until   = models.DateField(null=True, blank=True, db_column='valid_until')

    class Meta:
        db_table = 'quotations'


# ─────────────────────────────────────────────────────────────────────────────
# 7. Purchase Order 
# ─────────────────────────────────────────────────────────────────────────────
class PurchaseOrder(BaseModel):
    STATUS_CHOICES = [
        ('Draft',               'Draft'),
        ('Approved',            'Approved'),
        ('Sent',                'Sent to Supplier'),
        ('Partially Received',  'Partially Received'),
        ('Completed',           'Completed'),
        ('Cancelled',           'Cancelled'),
    ]

    po_number         = models.CharField(max_length=50, unique=True, blank=True, db_column='po_number')
    supplier_id       = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    order_date        = models.DateField(default=datetime.date.today, db_column='order_date')
    expected_delivery = models.DateField(null=True, blank=True, db_column='expected_delivery')
    warehouse_id      = models.ForeignKey('master_data.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, db_column='warehouse_id')
    payment_terms     = models.ForeignKey(PaymentTerm, on_delete=models.SET_NULL, null=True, blank=True, db_column='payment_terms')
    currency          = models.CharField(max_length=10, default='PKR', db_column='currency')
    total_amount      = models.DecimalField(max_digits=15, decimal_places=2, default=0, db_column='total_amount')
    status            = models.CharField(max_length=25, choices=STATUS_CHOICES, default='Draft', db_column='status')
    created_by        = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, related_name='po_created', null=True, blank=True, db_column='created_by')
    approved_by       = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, related_name='po_approved', null=True, blank=True, db_column='approved_by')

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-order_date']

    def save(self, *args, **kwargs):
        if not self.po_number:
            from apps.core.utils.number_generator import generate_po_number
            self.po_number = generate_po_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PO {self.po_number} — {self.status}"


class PurchaseOrderItem(BaseModel):
    po_id            = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, db_column='po_id', related_name='items')
    material_id      = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    ordered_quantity = models.DecimalField(max_digits=14, decimal_places=3, db_column='ordered_quantity')
    unit_price       = models.DecimalField(max_digits=14, decimal_places=4, db_column='unit_price')
    tax_rate         = models.DecimalField(max_digits=5, decimal_places=2, default=0, db_column='tax_rate')
    discount         = models.DecimalField(max_digits=5, decimal_places=2, default=0, db_column='discount')
    total_price      = models.DecimalField(max_digits=15, decimal_places=2, default=0, db_column='total_price')

    class Meta:
        db_table = 'purchase_order_items'

    def save(self, *args, **kwargs):
        base = self.ordered_quantity * self.unit_price
        after_tax      = base * (Decimal('1') + self.tax_rate / Decimal('100'))
        after_discount = after_tax * (Decimal('1') - self.discount / Decimal('100'))
        self.total_price = after_discount.quantize(Decimal('0.01'))
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Goods Receipt (GRN)
# ─────────────────────────────────────────────────────────────────────────────
class GoodsReceipt(BaseModel):
    STATUS_CHOICES = [
        ('Draft',     'Draft'),
        ('Confirmed', 'Confirmed'),
        ('Inspected', 'QC Inspected'),
    ]

    grn_number    = models.CharField(max_length=50, unique=True, blank=True, db_column='grn_number')
    po_id         = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, db_column='po_id', related_name='grns')
    supplier_id   = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    warehouse_id  = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    received_date = models.DateField(default=datetime.date.today, db_column='received_date')
    received_by   = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, null=True, blank=True, db_column='received_by')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft', db_column='status')

    class Meta:
        db_table = 'goods_receipts'
        ordering = ['-received_date']

    def save(self, *args, **kwargs):
        if not self.grn_number:
            from apps.core.utils.number_generator import generate_grn_number
            self.grn_number = generate_grn_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"GRN {self.grn_number} — {self.status}"


class GoodsReceiptItem(BaseModel):
    grn_id       = models.ForeignKey(GoodsReceipt, on_delete=models.CASCADE, db_column='grn_id', related_name='items')
    material_id  = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    ordered_qty  = models.DecimalField(max_digits=14, decimal_places=3, default=0, db_column='ordered_qty')
    received_qty = models.DecimalField(max_digits=14, decimal_places=3, db_column='received_qty')
    accepted_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0, db_column='accepted_qty')
    rejected_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0, db_column='rejected_qty')
    batch_number = models.CharField(max_length=100, blank=True, default='', db_column='batch_number')
    bin_id       = models.ForeignKey('master_data.WarehouseBin', on_delete=models.SET_NULL, null=True, blank=True, db_column='bin_id')

    class Meta:
        db_table = 'goods_receipt_items'


# ─────────────────────────────────────────────────────────────────────────────
# 9. Raw Material Batches
# ─────────────────────────────────────────────────────────────────────────────
class RawMaterialBatch(BaseModel):
    STATUS_CHOICES = [
        ('Approved',  'Approved'),
        ('Rejected',  'Rejected'),
        ('Expired',   'Expired'),
        ('Hold',      'On Hold'),
    ]

    material_id      = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    supplier_id      = models.ForeignKey('master_data.Supplier', on_delete=models.SET_NULL, null=True, blank=True, db_column='supplier_id')
    warehouse_id     = models.ForeignKey('master_data.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, db_column='warehouse_id')
    batch_number     = models.CharField(max_length=100, unique=True, db_column='batch_number')
    supplier_batch   = models.CharField(max_length=100, blank=True, default='', db_column='supplier_batch')
    quantity         = models.DecimalField(max_digits=14, decimal_places=3, default=0, db_column='quantity')
    manufacture_date = models.DateField(null=True, blank=True, db_column='manufacture_date')
    expiry_date      = models.DateField(null=True, blank=True, db_column='expiry_date')
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Hold', db_column='status')

    class Meta:
        db_table = 'raw_material_batches'
        ordering = ['-expiry_date']


# ─────────────────────────────────────────────────────────────────────────────
# 10. QC Inspections
# ─────────────────────────────────────────────────────────────────────────────
class QcInspection(BaseModel):
    RESULT_CHOICES = [
        ('Approved',     'Approved'),
        ('Rejected',     'Rejected'),
        ('Conditional',  'Conditional'),
    ]

    material_id     = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    batch_id        = models.ForeignKey(RawMaterialBatch, on_delete=models.SET_NULL, null=True, blank=True, db_column='batch_id')
    grn_id          = models.ForeignKey(GoodsReceipt, on_delete=models.SET_NULL, null=True, blank=True, db_column='grn_id')
    inspection_date = models.DateField(default=datetime.date.today, db_column='inspection_date')
    inspector       = models.ForeignKey('authentication.SystemUser', on_delete=models.SET_NULL, null=True, blank=True, db_column='inspector')
    result          = models.CharField(max_length=20, choices=RESULT_CHOICES, db_column='result')
    remarks         = models.TextField(blank=True, default='', db_column='remarks')

    class Meta:
        db_table = 'qc_inspections'
        ordering = ['-inspection_date']


# ─────────────────────────────────────────────────────────────────────────────
# 11. Purchase Returns
# ─────────────────────────────────────────────────────────────────────────────
class PurchaseReturn(BaseModel):
    STATUS_CHOICES = [
        ('Draft',     'Draft'),
        ('Pending',   'Pending'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    grn_id      = models.ForeignKey(GoodsReceipt, on_delete=models.SET_NULL, null=True, blank=True, db_column='grn_id')
    material_id = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    quantity    = models.DecimalField(max_digits=14, decimal_places=3, db_column='quantity')
    reason      = models.TextField(db_column='reason')
    return_date = models.DateField(default=datetime.date.today, db_column='return_date')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft', db_column='status')

    class Meta:
        db_table = 'purchase_returns'
        ordering = ['-return_date']


# ─────────────────────────────────────────────────────────────────────────────
# 12. Accounts Payable
# ─────────────────────────────────────────────────────────────────────────────
class AccountsPayable(BaseModel):
    STATUS_CHOICES = [
        ('Pending',  'Pending'),
        ('Paid',     'Paid'),
        ('Overdue',  'Overdue'),
    ]

    supplier_id    = models.ForeignKey('master_data.Supplier', on_delete=models.CASCADE, db_column='supplier_id')
    po_id          = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, db_column='po_id')
    invoice_number = models.CharField(max_length=100, db_column='invoice_number')
    amount         = models.DecimalField(max_digits=15, decimal_places=2, db_column='amount')
    due_date       = models.DateField(null=True, blank=True, db_column='due_date')
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending', db_column='status')

    class Meta:
        db_table = 'accounts_payable'
        ordering = ['due_date']


# ─────────────────────────────────────────────────────────────────────────────
# 13. Reorder Rules
# ─────────────────────────────────────────────────────────────────────────────
class ReorderRule(BaseModel):
    material_id      = models.ForeignKey('master_data.RawMaterial', on_delete=models.CASCADE, db_column='material_id')
    warehouse_id     = models.ForeignKey('master_data.Warehouse', on_delete=models.CASCADE, db_column='warehouse_id')
    minimum_stock    = models.DecimalField(max_digits=14, decimal_places=3, db_column='minimum_stock')
    maximum_stock    = models.DecimalField(max_digits=14, decimal_places=3, db_column='maximum_stock')
    reorder_quantity = models.DecimalField(max_digits=14, decimal_places=3, db_column='reorder_quantity')

    class Meta:
        db_table = 'reorder_rules'
        unique_together = [('material_id', 'warehouse_id')]
