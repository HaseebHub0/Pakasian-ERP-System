import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def calculate_batch_cost(self, batch_id: str, user_id: str = None):
    """
    Celery task — full process-costing pipeline for one production batch.

    Triggered automatically from:
      • ProductionOutput._on_approved()  (step 4 of the approval side-effects)
      • ManufacturingService.complete_batch()

    Can also be triggered manually via:
      POST /api/costing/batch-summary/{batch_id}/recalculate/

    user_id  (optional) — UUID string of the SystemUser who triggered the run;
    stored on BatchCostSummary.calculated_by for audit trail.
    """
    from .services import CostingService

    user = None
    if user_id:
        try:
            from apps.authentication.models import SystemUser
            user = SystemUser.objects.get(pk=user_id)
        except Exception:
            pass

    try:
        summary = CostingService.calculate_batch_cost(batch_id, user=user)
        logger.info(
            "[Costing] batch=%s total=%s currency=%s",
            batch_id, summary.total_batch_cost, summary.currency,
        )
        return {
            'batch_id':        batch_id,
            'total_batch_cost': str(summary.total_batch_cost),
            'currency':         summary.currency,
        }
    except Exception as exc:
        logger.exception("[Costing] batch=%s FAILED: %s", batch_id, exc)
        raise self.retry(exc=exc)
