"""
SalesService — Module 6 business logic
=======================================

Key operations
--------------
1. create_order          — validate + persist SalesOrder + items, recompute total
2. credit_check          — compare order total vs available credit
3. approve_order         — credit check → status Approved
4. dispatch_order        — create DispatchOrder + items, post invoice ledger entry
5. confirm_delivery      — create DeliveryConfirmation, update dispatch/order status
6. process_return        — create SalesReturn + items, post credit-note ledger entry,
                           reverse inventory for Resellable items
"""
import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class CreditCheckResult:
    def __init__(self, *, approved: bool, credit_limit, outstanding, available, order_total):
        self.approved     = approved
        self.credit_limit = credit_limit
        self.outstanding  = outstanding
        self.available    = available
        self.order_total  = order_total

    def as_dict(self):
        return {
            'approved':     self.approved,
            'credit_limit': str(self.credit_limit),
            'outstanding':  str(self.outstanding),
            'available':    str(self.available),
            'order_total':  str(self.order_total),
        }


class SalesService:

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Create Sales Order
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def create_order(
        *,
        order_number: str,
        customer_id: str,
        warehouse_id: str,
        items: list,            # [{'product_id': str, 'quantity': Decimal, 'unit_price': Decimal, 'discount': Decimal, 'tax': Decimal}]
        order_source: str = 'manual_entry',
        payment_type:  str = 'Credit',
        order_date=None,
    ):
        """
        Creates a SalesOrder with items.  total_amount is summed from item totals.
        Returns the saved SalesOrder instance.
        """
        from .models import SalesOrder, SalesOrderItem

        order = SalesOrder.objects.create(
            order_number = order_number,
            customer_id_id = customer_id,
            warehouse_id_id = warehouse_id,
            order_source  = order_source,
            payment_type  = payment_type,
            order_status  = 'Draft',
            order_date    = order_date or now().date(),
            total_amount  = Decimal('0'),
        )

        for item_data in items:
            SalesOrderItem.objects.create(
                order_id   = order,
                product_id_id = str(item_data['product_id']),
                quantity   = Decimal(str(item_data.get('quantity',   0))),
                unit_price = Decimal(str(item_data.get('unit_price', 0))),
                discount   = Decimal(str(item_data.get('discount',   0))),
                tax        = Decimal(str(item_data.get('tax',        0))),
            )

        # Recompute total from saved items (save() auto-computed total_price)
        total = order.items.aggregate(s=Sum('total_price'))['s'] or Decimal('0')
        order.total_amount = total
        order.save(update_fields=['total_amount', 'updated_at'])

        logger.info("SalesService: created order %s total=%s", order.order_number, total)
        return order

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Credit Check
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def credit_check(customer_id: str, order_total: Decimal) -> CreditCheckResult:
        """
        available_credit = credit_limit − sum(outstanding_invoices − payments)
        Returns CreditCheckResult with approved=True/False.
        """
        from .models import Customer, CustomerCreditLedger

        customer = Customer.objects.get(pk=customer_id)

        agg = CustomerCreditLedger.objects.filter(
            customer_id=customer_id,
        ).aggregate(
            total_invoiced = Sum('invoice_amount'),
            total_paid     = Sum('payment_received'),
        )
        total_invoiced = agg['total_invoiced'] or Decimal('0')
        total_paid     = agg['total_paid']     or Decimal('0')
        outstanding    = total_invoiced - total_paid
        available      = Decimal(str(customer.credit_limit)) - outstanding
        approved       = available >= order_total

        return CreditCheckResult(
            approved     = approved,
            credit_limit = customer.credit_limit,
            outstanding  = outstanding,
            available    = available,
            order_total  = order_total,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Approve Order
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def approve_order(order_id: str):
        """
        Runs credit check then moves status Draft → Confirmed → Approved.
        Raises ValueError if credit is insufficient or order is not in Draft/Confirmed.
        """
        from .models import SalesOrder

        order = SalesOrder.objects.select_related('customer_id').get(pk=order_id)
        if order.order_status not in ('Draft', 'Confirmed'):
            raise ValueError(
                f"Cannot approve order in status '{order.order_status}'"
            )

        result = SalesService.credit_check(
            str(order.customer_id_id), order.total_amount
        )
        if not result.approved:
            raise ValueError(
                f"Credit check failed: available={result.available}, "
                f"order_total={result.order_total}"
            )

        order.order_status = 'Approved'
        order.save(update_fields=['order_status', 'updated_at'])
        logger.info("SalesService: order %s approved", order.order_number)
        return order

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Dispatch Order
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def dispatch_order(
        order_id:    str,
        warehouse_id: str,
        driver_name: str,
        items: list,         # [{'product_id': str, 'batch_number': str, 'quantity': Decimal}]
        vehicle_id:  str = None,
        dispatch_date=None,
    ):
        """
        Creates DispatchOrder + DispatchItems, posts invoice ledger entry,
        and moves SalesOrder → Dispatched.
        Returns the saved DispatchOrder.
        """
        from .models import SalesOrder, DispatchOrder, DispatchItem

        order = SalesOrder.objects.select_related('customer_id').get(pk=order_id)
        if order.order_status != 'Approved':
            raise ValueError(
                f"Cannot dispatch order in status '{order.order_status}' — must be Approved first"
            )

        dispatch = DispatchOrder.objects.create(
            order_id_id     = order_id,
            warehouse_id_id = warehouse_id,
            vehicle_id_id   = vehicle_id,
            driver_name     = driver_name,
            dispatch_date   = dispatch_date or now().date(),
            status          = 'Pending',
        )

        for item_data in items:
            DispatchItem.objects.create(
                dispatch_id  = dispatch,
                product_id_id = str(item_data['product_id']),
                batch_number = item_data.get('batch_number', ''),
                quantity     = Decimal(str(item_data.get('quantity', 0))),
            )

        # Post invoice ledger entry (creates a running balance)
        SalesService._post_ledger_entry(
            customer_id    = str(order.customer_id_id),
            entry_type     = 'Invoice',
            invoice_amount = order.total_amount,
            reference_id   = order.pk,
        )

        order.order_status = 'Dispatched'
        order.save(update_fields=['order_status', 'updated_at'])

        logger.info(
            "SalesService: dispatched order %s via dispatch %s",
            order.order_number, dispatch.pk,
        )
        return dispatch

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Confirm Delivery
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def confirm_delivery(
        dispatch_id: str,
        delivered_by: str,
        status: str = 'Delivered',
        customer_signature: str = '',
        delivery_time=None,
    ):
        """
        Creates DeliveryConfirmation, updates DispatchOrder status, and moves
        the parent SalesOrder to Delivered (if fully delivered) or Dispatched.
        Returns the saved DeliveryConfirmation.
        """
        from .models import DispatchOrder, DeliveryConfirmation

        dispatch = DispatchOrder.objects.select_related('order_id').get(pk=dispatch_id)

        confirmation = DeliveryConfirmation.objects.create(
            dispatch_id        = dispatch,
            delivered_by       = delivered_by,
            delivery_time      = delivery_time or now(),
            customer_signature = customer_signature,
            status             = status,
        )

        # Update dispatch status to match delivery outcome
        dispatch.status = (
            'Delivered' if status == 'Delivered'
            else 'Returned' if status == 'Rejected'
            else 'In Transit'
        )
        dispatch.save(update_fields=['status', 'updated_at'])

        # Propagate to parent sales order
        if status == 'Delivered':
            order = dispatch.order_id
            order.order_status = 'Delivered'
            order.save(update_fields=['order_status', 'updated_at'])

        logger.info(
            "SalesService: delivery confirmed dispatch=%s status=%s",
            dispatch_id, status,
        )
        return confirmation

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Process Return
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def process_return(
        order_id:     str,
        customer_id:  str,
        return_reason: str,
        items: list,         # [{'product_id': str, 'batch_number': str, 'quantity': Decimal, 'condition': str}]
        return_date=None,
    ):
        """
        Creates SalesReturn + items, posts credit-note ledger entry.
        Resellable items are restocked via inventory (best-effort).
        Returns the saved SalesReturn.
        """
        from .models import SalesReturn, SalesReturnItem, SalesOrder

        order = SalesOrder.objects.get(pk=order_id)

        sales_return = SalesReturn.objects.create(
            order_id_id   = order_id,
            customer_id_id = customer_id,
            return_reason = return_reason,
            return_date   = return_date or now().date(),
            status        = 'Approved',
        )

        return_total = Decimal('0')
        for item_data in items:
            qty = Decimal(str(item_data.get('quantity', 0)))
            sri = SalesReturnItem.objects.create(
                return_id   = sales_return,
                product_id_id = str(item_data['product_id']),
                batch_number = item_data.get('batch_number', ''),
                quantity    = qty,
                condition   = item_data.get('condition', 'Resellable'),
            )

            # Restock resellable items into inventory (best-effort)
            if sri.condition == 'Resellable':
                SalesService._restock_item(sri, order)

            # Approximate credit = qty × original order line unit_price
            unit_price = SalesService._get_unit_price(order, str(item_data['product_id']))
            return_total += qty * unit_price

        # Post credit note entry
        SalesService._post_ledger_entry(
            customer_id     = customer_id,
            entry_type      = 'Credit Note',
            payment_received = return_total,
            reference_id    = sales_return.pk,
            notes           = f"Return#{sales_return.pk} — {return_reason}",
        )

        order.order_status = 'Returned'
        order.save(update_fields=['order_status', 'updated_at'])

        logger.info(
            "SalesService: return %s for order %s, credit=%.4f",
            sales_return.pk, order.order_number, return_total,
        )
        return sales_return

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _post_ledger_entry(
        customer_id: str,
        entry_type:  str,
        invoice_amount:   Decimal = Decimal('0'),
        payment_received: Decimal = Decimal('0'),
        reference_id=None,
        notes: str = '',
    ):
        from .models import CustomerCreditLedger

        # Running balance = last balance + invoice − payment_received
        last = (
            CustomerCreditLedger.objects
            .filter(customer_id=customer_id)
            .order_by('-transaction_date', '-created_at')
            .values_list('balance', flat=True)
            .first()
        )
        prev_balance = Decimal(str(last)) if last is not None else Decimal('0')
        new_balance  = prev_balance + invoice_amount - payment_received

        return CustomerCreditLedger.objects.create(
            customer_id_id   = customer_id,
            transaction_date = now().date(),
            entry_type       = entry_type,
            invoice_amount   = invoice_amount,
            payment_received = payment_received,
            balance          = new_balance,
            reference_id     = reference_id,
            notes            = notes,
        )

    @staticmethod
    def _get_unit_price(order, product_id: str) -> Decimal:
        """Get original unit_price from the order line for the given product."""
        item = order.items.filter(product_id_id=product_id).first()
        return Decimal(str(item.unit_price)) if item else Decimal('0')

    @staticmethod
    def _restock_item(return_item, order):
        """
        Best-effort: post a positive stock adjustment back into inventory.
        Calls inventory.services if available; swallows errors silently.
        """
        try:
            from apps.inventory.services import InventoryService
            warehouse_id = str(order.warehouse_id_id)
            InventoryService.post_ledger_entry(
                product_id   = str(return_item.product_id_id),
                warehouse_id = warehouse_id,
                movement_type = 'Return',
                quantity     = return_item.quantity,
                batch_number = return_item.batch_number,
                reference    = f"SalesReturn#{return_item.return_id_id}",
            )
        except Exception as exc:
            logger.warning(
                "SalesService._restock_item: inventory post skipped — %s", exc
            )
