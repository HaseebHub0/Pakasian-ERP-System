from .models import BatchTable, InventorySummary


def get_fifo_batch(product_id, warehouse_id, material_id=None):
    """Returns the oldest available batch (FIFO) that has stock in the given warehouse."""
    filters = {'warehouse_id': warehouse_id, 'available_stock__gt': 0}
    if product_id:
        filters['product_id'] = product_id
    if material_id:
        filters['material_id'] = material_id

    summaries    = InventorySummary.objects.filter(**filters)
    batch_numbers = summaries.values_list('batch_number', flat=True)

    return BatchTable.objects.filter(
        batch_number__in=batch_numbers,
        status='Approved',
    ).order_by('production_date', 'expiry_date').first()


# ─────────────────────────────────────────────────────────────────────────────
# Inventory movement types accepted by post_ledger_entry
# ─────────────────────────────────────────────────────────────────────────────
_MOVEMENT_MAP = {
    # Human-readable name  →  ledger movement_type code
    'Production Issue':  'PRODUCTION',
    'Production Output': 'GRN',
    'GRN':               'GRN',
    'Dispatch':          'DISPATCH',
    'Transfer':          'TRANSFER',
    'Adjustment':        'ADJUSTMENT',
    'Return':            'RETURN',
    'Expired':           'EXPIRED',
}


class InventoryService:
    """
    Thin façade over InventoryLedger for cross-app writes.

    Usage:
        InventoryService.post_ledger_entry(
            movement_type = 'Production Issue',
            item_type     = 'material',       # 'material' | 'product'
            item_id       = <RawMaterial|Product instance>,
            warehouse_id  = <Warehouse instance>,
            qty_out       = Decimal('50'),
            reference_id  = batch.pk,
            user          = request.user,
        )
    """

    @staticmethod
    def post_ledger_entry(
        movement_type: str,
        item_type: str,          # 'material' | 'product'
        item_id,                 # RawMaterial or Product instance
        warehouse_id=None,
        qty_in=0,
        qty_out=0,
        batch_number: str = '',
        reference_type: str = '',
        reference_id=None,
        user=None,
    ):
        """
        Write a single row to InventoryLedger.

        movement_type accepts both short codes ('GRN') and human-readable
        names ('Production Issue') — it is mapped before insertion.
        """
        from .models import InventoryLedger

        code = _MOVEMENT_MAP.get(movement_type, movement_type)

        InventoryLedger.objects.create(
            item_type      = 'Material' if item_type == 'material' else 'Product',
            material_id    = item_id if item_type == 'material' else None,
            product_id     = item_id if item_type == 'product'   else None,
            warehouse_id   = warehouse_id,
            movement_type  = code,
            quantity_in    = qty_in,
            quantity_out   = qty_out,
            batch_number   = batch_number,
            reference_type = reference_type or movement_type,
            reference_id   = reference_id,
            user_id        = user,
        )
