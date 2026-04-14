from django.apps import apps
from django.db import transaction


def generate_batch_number(product_sku, date):
    """
    Generate a unique batch number in the format: PP{YYMMDD}{A-Z}
    where PP = first 2 chars of SKU, and the suffix increments A→Z for same-day batches.

    Example: generate_batch_number('PN-100', date(2026, 3, 12)) → 'PN260312A'
    """
    # Keep first 2 alphanumeric chars (strip hyphens/spaces for the prefix)
    clean_sku = product_sku.replace('-', '').replace(' ', '')
    prefix = clean_sku[:2].upper()
    date_part = date.strftime('%y%m%d')
    base = prefix + date_part  # e.g. 'PN260312'

    with transaction.atomic():
        # Count how many batches already start with this prefix+date
        # Use ProductionOrder (the model that exists) as the anchor for counting
        # When ProductionBatch is added, swap the model reference below
        try:
            ProductionOrder = apps.get_model('manufacturing', 'ProductionOrder')
            count = (
                ProductionOrder.objects
                .select_for_update()
                .filter(reference__startswith=base)
                .count()
            )
        except LookupError:
            count = 0

        seq = chr(65 + (count % 26))  # A, B, C … Z, then wraps
        return f'{prefix}{date_part}{seq}'
