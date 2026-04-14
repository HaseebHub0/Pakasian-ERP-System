import logging
import traceback

from celery import shared_task
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Job dispatcher — extend this dict as new job types are added
# ---------------------------------------------------------------------------

JOB_HANDLERS: dict = {}


def dispatch_job(job):
    """Route a BackgroundJob to its registered handler by job.name."""
    handler = JOB_HANDLERS.get(job.name)
    if handler is None:
        logger.warning("No handler registered for job type '%s' (id=%s)", job.name, job.job_id)
        return
    handler(job)


# ---------------------------------------------------------------------------
# Scheduled tasks
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    name='apps.core.tasks.check_expiring_batches',
    max_retries=3,
    default_retry_delay=300,   # 5-minute back-off
    soft_time_limit=120,
    ignore_result=False,
)
def check_expiring_batches(self):
    """Runs daily at 6 AM — flags batches expiring within EXPIRY_ALERT_DAYS."""
    from apps.inventory.services import InventoryService

    logger.info("check_expiring_batches: starting")
    try:
        result = InventoryService.check_expiry_and_alert()
        logger.info(
            "check_expiring_batches: expired=%d, expiry_flagged=%d",
            result['expired'],
            result['flagged'],
        )
        return result
    except Exception as exc:
        logger.exception("check_expiring_batches failed: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='apps.core.tasks.run_mrp_engine',
    max_retries=2,
    default_retry_delay=600,
    soft_time_limit=1800,  # MRP can be long-running; 30 min cap
    ignore_result=False,
)
def run_mrp_engine(self):
    """Runs every Sunday 11 PM — calculates production requirements."""
    from apps.mrp.services import MRPService

    logger.info("run_mrp_engine: starting full MRP calculation")
    try:
        MRPService.run_full_mrp()
        logger.info("run_mrp_engine: completed successfully")
    except Exception as exc:
        logger.exception("run_mrp_engine failed: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='apps.core.tasks.check_reorder_rules',
    max_retries=3,
    default_retry_delay=300,
    soft_time_limit=180,
    ignore_result=False,
)
def check_reorder_rules(self):
    """Runs daily at 7 AM — auto-creates PRs for materials below minimum_stock."""
    from apps.procurement.services import ReorderService

    logger.info("check_reorder_rules: starting reorder evaluation")
    try:
        ReorderService.check_all_rules()
        logger.info("check_reorder_rules: completed successfully")
    except Exception as exc:
        logger.exception("check_reorder_rules failed: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='apps.core.tasks.process_background_jobs',
    max_retries=0,       # Do not retry the poller itself
    soft_time_limit=90,
    ignore_result=True,
)
def process_background_jobs(self):
    """Polls background_jobs table every 60 seconds for pending jobs."""
    from apps.core.models import BackgroundJob

    pending = BackgroundJob.objects.filter(status='Pending').order_by('created_at')[:10]
    processed, failed = 0, 0

    for job in pending:
        # Mark as Running first so concurrent pollers skip it
        updated = BackgroundJob.objects.filter(
            pk=job.pk, status='Pending'
        ).update(status='Running')

        if not updated:
            # Another worker already claimed this job
            continue

        job.refresh_from_db()

        try:
            dispatch_job(job)
            job.status = 'Completed'
            processed += 1
        except Exception:
            job.status = 'Failed'
            job.payload = {
                **(job.payload or {}),
                '_error': traceback.format_exc(),
            }
            failed += 1
            logger.error(
                "process_background_jobs: job %s (%s) failed\n%s",
                job.pk,
                job.name,
                traceback.format_exc(),
            )

        job.processed_at = timezone.now()
        job.save(update_fields=['status', 'processed_at', 'payload'])

    logger.info(
        "process_background_jobs: processed=%d, failed=%d",
        processed,
        failed,
    )
    return {'processed': processed, 'failed': failed}
