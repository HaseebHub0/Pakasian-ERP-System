from celery import shared_task
from django.db import transaction
from .models import ReorderRule, PurchaseRequisition, PurchaseRequisitionItem
from apps.inventory.models import InventorySummary

@shared_task
def check_reorder_rules():
    """
    Checks all ReorderRules against InventorySummary.
    If total_stock < minimum_stock, it auto-creates a PurchaseRequisition for the reorder_quantity.
    """
    rules = ReorderRule.objects.all()
    created_prs = []

    for rule in rules:
        summary = InventorySummary.objects.filter(
            warehouse_id=rule.warehouse_id_id,
            product_id=rule.material_id_id
        ).first()

        current_stock = summary.available_stock if summary else 0

        if current_stock < rule.minimum_stock:
            with transaction.atomic():
                pr = PurchaseRequisition.objects.create(
                    department="Auto-Reorder (System)",
                    status="Draft"
                )
                PurchaseRequisitionItem.objects.create(
                    requisition_id=pr,
                    material_id_id=rule.material_id_id,
                    warehouse_id_id=rule.warehouse_id_id,
                    requested_quantity=rule.reorder_quantity,
                    remarks=f"Auto-generated because stock ({current_stock}) is below minimum ({rule.minimum_stock})."
                )
                created_prs.append(pr.requisition_number)
                
    return f"Created {len(created_prs)} Auto-Reorder PRs: {', '.join(created_prs)}"
