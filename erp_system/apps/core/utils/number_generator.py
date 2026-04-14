from django.apps import apps
from django.db import transaction
from django.utils import timezone

def _generate_number(model_string, prefix, field_name):
    year = timezone.now().year
    
    with transaction.atomic():
        model = apps.get_model(model_string)
        # Lock for update to prevent race conditions during generation
        last_obj = model.objects.select_for_update().filter(
            **{f"{field_name}__startswith": f"{prefix}-{year}-"}
        ).order_by(f"-{field_name}").first()

        if last_obj:
            last_number_str = getattr(last_obj, field_name)
            try:
                last_seq = int(last_number_str.split('-')[-1])
                new_seq = last_seq + 1
            except ValueError:
                new_seq = 1
        else:
            new_seq = 1

        return f"{prefix}-{year}-{new_seq:04d}"

def generate_pr_number():
    return _generate_number('procurement.PurchaseRequisition', 'PR', 'requisition_number')

def generate_po_number():
    return _generate_number('procurement.PurchaseOrder', 'PO', 'po_number')

def generate_grn_number():
    return _generate_number('procurement.GoodsReceipt', 'GRN', 'grn_number')

def generate_so_number():
    return _generate_number('sales.SalesOrder', 'SO', 'so_number')

def generate_journal_number():
    return _generate_number('finance.JournalEntry', 'JE', 'journal_number')
