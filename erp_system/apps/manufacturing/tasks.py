"""
Celery tasks for the manufacturing app.

Triggered from:
  - ProductionOutput._on_approved()  →  calculate_batch_cost, print_batch_labels
"""
from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def calculate_batch_cost(self, batch_id: str):
    """
    Roll up material + oil costs from issue / oil-log records and
    save a BatchCostSummary for the given batch.
    """
    try:
        from .models import ProductionBatch
        from .services import ManufacturingService
        batch = ProductionBatch.objects.get(pk=batch_id)
        ManufacturingService.calculate_cost(batch)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def print_batch_labels(self, batch_id: str):
    """
    Stub task for Zebra label printing integration.

    Replace the body with a real ZebraLabelService call when the
    hardware integration is available.
    """
    import logging
    log = logging.getLogger(__name__)
    log.info("[ZebraLabel] Printing labels for batch %s", batch_id)
    # TODO: integrate ZebraLabelService.print_batch_labels(batch_id)
