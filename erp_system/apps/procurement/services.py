from django.db import transaction
from django.utils import timezone
from decimal import Decimal

from apps.procurement.models import (
    ApprovalWorkflow,
    PurchaseRequisition,
    AccountsPayable,
    PurchaseReturn,
)
from apps.inventory.models import InventoryLedger


class ProcurementService:

    @staticmethod
    def route_for_approval(requisition: PurchaseRequisition) -> str:
        """
        Query ApprovalWorkflow by total amount and return the approver_role.
        Since PurchaseRequisition doesn't have total_amount in spec, 
        we dynamically calculate it from items x standard_cost.
        Note: We are not storing this amount, just using it to route.
        """
        total = Decimal('0')
        for item in requisition.items.all():
            if item.material_id and item.material_id.standard_cost:
                total += item.requested_quantity * item.material_id.standard_cost

        # Find the workflow that covers this amount
        # E.g. PR with min_amount <= total, where max_amount >= total or max_amount runs to infinity.
        # Order by min_amount descending to catch the highest bracket that matches.
        workflows = ApprovalWorkflow.objects.filter(entity_type='PR', min_amount__lte=total).order_by('-min_amount')
        
        for wf in workflows:
            if wf.max_amount is None or wf.max_amount >= total:
                return wf.approver_role
        
        return "admin"  # Fallback if no matching workflow

    @staticmethod
    @transaction.atomic
    def post_grn_to_inventory(grn):
        """
        Create InventoryLedger entry (movement_type='GRN') for each accepted GRN item.
        Also updates InventorySummary via the ledger's save() signal.
        """
        for item in grn.items.all():
            if item.accepted_qty > 0:
                InventoryLedger.objects.create(
                    item_type='Material',
                    material_id=item.material_id,
                    warehouse_id=grn.warehouse_id,
                    movement_type='GRN',
                    quantity_in=item.accepted_qty,
                    quantity_out=0,
                    batch_number=item.batch_number or '',
                    reference_id=grn.id,
                    reference_type='GoodsReceipt',
                )

    @staticmethod
    def create_accounts_payable(grn):
        """
        Auto-create AccountsPayable from GRN
        """
        po = grn.po_id
        if not po:
            return None # Cannot create AP without a PO for pricing context

        # Calculate AP amount based on accepted quantity * PO unit price
        ap_amount = Decimal('0')
        for item in grn.items.all():
            # Find the original PO item to get unit_price, tax, discount
            po_item = po.items.filter(material_id=item.material_id).first()
            if po_item:
                base = item.accepted_qty * po_item.unit_price
                after_tax = base * (Decimal('1') + po_item.tax_rate / Decimal('100'))
                after_discount = after_tax * (Decimal('1') - po_item.discount / Decimal('100'))
                ap_amount += after_discount

        ap_amount = ap_amount.quantize(Decimal('0.01'))

        # Only create if there's a non-zero amount to pay
        if ap_amount > 0:
            return AccountsPayable.objects.create(
                supplier_id=grn.supplier_id,
                po_id=grn.po_id,
                invoice_number=f"INV-{grn.grn_number}",
                amount=ap_amount,
                status='Pending',
                due_date=timezone.now().date() # Adjust based on payment_terms later if needed
            )
        return None

    @staticmethod
    @transaction.atomic
    def handle_qc_result(inspection):
        """
        if Approved -> post_grn_to_inventory() + create_accounts_payable()
        if Rejected -> update batch status (if applicable), create PurchaseReturn
        """
        # Ensure we only process a QC Inspection once
        # (You'd likely track processing status, but for now we look at result)
        
        batch = inspection.batch_id
        grn = inspection.grn_id

        if inspection.result == 'Approved':
            if batch:
                batch.status = 'Approved'
                batch.save(update_fields=['status'])
            
            if grn:
                # We assume standard flow is GRN is received, then QC inspects it
                # So we post to ledger and create AP now
                ProcurementService.post_grn_to_inventory(grn)
                ProcurementService.create_accounts_payable(grn)

        elif inspection.result == 'Rejected':
            if batch:
                batch.status = 'Rejected'
                batch.save(update_fields=['status'])

            if grn:
                # Need to find the rejected quantity for this material
                grn_item = grn.items.filter(material_id=inspection.material_id).first()
                if grn_item and grn_item.rejected_qty > 0: # Note: GRN handler should set rejected_qty
                    qty_to_return = grn_item.rejected_qty
                else:
                    # If not explicitly marked on GRN, assume ordered/received quantity
                    qty_to_return = grn_item.received_qty if grn_item else Decimal('0')

                if qty_to_return > 0:
                    PurchaseReturn.objects.create(
                        grn_id=grn,
                        material_id=inspection.material_id,
                        quantity=qty_to_return,
                        reason=f"QC Rejected: {inspection.remarks or 'No reason provided'}",
                        return_date=timezone.now().date(),
                        status='Pending'
                    )

        # In case of 'Conditional', maybe logic goes here later.
