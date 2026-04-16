import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_sales_return(self, return_id: str):
    """
    Async: finalise a SalesReturn — restock resellable items + post credit note.

    Triggered from:
      POST /api/sales/returns/  (when auto_process=true)

    Can also be called manually for re-processing.
    """
    try:
        from .models import SalesReturn
        sales_return = SalesReturn.objects.select_related(
            'order_id', 'customer_id'
        ).prefetch_related('items__product_id').get(pk=return_id)

        if sales_return.status != 'Approved':
            logger.warning(
                "[Sales] return=%s skipped — status is '%s', expected Approved",
                return_id, sales_return.status,
            )
            return {'skipped': True, 'reason': f"status={sales_return.status}"}

        # Restock resellable items
        for item in sales_return.items.filter(condition='Resellable'):
            try:
                from apps.inventory.services import InventoryService
                InventoryService.post_ledger_entry(
                    product_id    = str(item.product_id_id),
                    warehouse_id  = str(sales_return.order_id.warehouse_id_id),
                    movement_type = 'Return',
                    quantity      = item.quantity,
                    batch_number  = item.batch_number,
                    reference     = f"SalesReturn#{return_id}",
                )
            except Exception as e:
                logger.warning("[Sales] restock skipped for item %s: %s", item.pk, e)

        sales_return.status = 'Completed'
        sales_return.save(update_fields=['status', 'updated_at'])

        logger.info("[Sales] return=%s completed", return_id)
        return {'return_id': return_id, 'status': 'Completed'}

    except Exception as exc:
        logger.exception("[Sales] return=%s FAILED: %s", return_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_dispatch_notification(self, dispatch_id: str):
    """
    Async: send dispatch notification to customer (e.g. SMS/email).
    Stub — extend with actual notification provider.
    """
    try:
        from .models import DispatchOrder
        dispatch = DispatchOrder.objects.select_related(
            'order_id__customer_id'
        ).get(pk=dispatch_id)

        customer = dispatch.order_id.customer_id
        logger.info(
            "[Sales] Dispatch notification → customer=%s order=%s dispatch=%s",
            customer.customer_name,
            dispatch.order_id.order_number,
            dispatch_id,
        )
        # TODO: integrate SMS / email provider here
        return {'dispatch_id': dispatch_id, 'customer': customer.customer_name}

    except Exception as exc:
        logger.exception("[Sales] dispatch notification %s FAILED: %s", dispatch_id, exc)
        raise self.retry(exc=exc)
