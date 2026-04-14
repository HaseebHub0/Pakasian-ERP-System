import logging
from decimal import Decimal
from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import (
    BatchTable,
    InventoryLedger,
    InventorySummary,
    StockReservation,
    StockTransfer,
    TransferItem,
)

logger = logging.getLogger(__name__)


class InventoryService:

    # -------------------------------------------------------------------------
    # Ledger
    # -------------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def post_ledger_entry(
        item_type,
        item_id,
        warehouse_id,
        bin_id,
        batch_number,
        movement_type,
        qty_in,
        qty_out,
        reference_type,
        reference_id,
        user_id,
    ):
        """
        Insert an InventoryLedger row and update InventorySummary.

        Uses bulk_create to bypass the immutability guard in InventoryLedger.save()
        (which raises on UPDATE) and its auto-InventorySummary side-effect.
        InventorySummary is updated manually here so all logic is in one place.

        Args:
            item_type   : 'Product' | 'Material'
            item_id     : Product or RawMaterial FK instance (or pk)
            warehouse_id: Warehouse FK instance (or pk)
            bin_id      : WarehouseBin FK instance / pk / None
            batch_number: str or ''
            movement_type: one of MOVEMENT_TYPES keys
            qty_in / qty_out: numeric
            reference_type / reference_id: source document type & UUID
            user_id     : SystemUser FK instance or pk or None

        Returns:
            The created InventoryLedger instance.
        """
        batch_number = batch_number or ''
        qty_in = Decimal(str(qty_in))
        qty_out = Decimal(str(qty_out))

        # Build the item-specific filter for querying previous ledger balance
        if item_type == 'Product':
            item_filter = {'product_id': item_id}
        else:
            item_filter = {'material_id': item_id}

        # Lock the most-recent ledger row for this item+warehouse+batch so that
        # concurrent writes serialise at the DB level before we compute the new balance.
        prev = (
            InventoryLedger.objects
            .filter(warehouse_id=warehouse_id, batch_number=batch_number, **item_filter)
            .select_for_update()
            .order_by('-timestamp')
            .first()
        )
        prev_balance = prev.balance_after if prev else Decimal('0')
        balance_after = prev_balance + qty_in - qty_out

        # Construct the entry (FK fields accept model instances directly)
        entry = InventoryLedger(
            item_type=item_type,
            product_id=item_id if item_type == 'Product' else None,
            material_id=item_id if item_type == 'Material' else None,
            warehouse_id=warehouse_id,
            bin_id=bin_id,
            batch_number=batch_number,
            movement_type=movement_type,
            quantity_in=qty_in,
            quantity_out=qty_out,
            balance_after=balance_after,
            reference_type=reference_type or '',
            reference_id=reference_id,
            user_id=user_id,
        )
        # bulk_create bypasses save() — so no accidental InventorySummary double-update
        created_list = InventoryLedger.objects.bulk_create([entry])
        created = created_list[0]

        # Manually sync InventorySummary (mirrors what InventoryLedger.save() would do)
        summary_filter = {
            'warehouse_id': warehouse_id,
            'batch_number': batch_number,
            'product_id': item_id if item_type == 'Product' else None,
            'material_id': item_id if item_type == 'Material' else None,
        }
        summary, _ = InventorySummary.objects.get_or_create(
            **summary_filter,
            defaults={
                'total_stock': Decimal('0'),
                'reserved_stock': Decimal('0'),
                'available_stock': Decimal('0'),
                'in_transit_stock': Decimal('0'),
            },
        )
        summary.total_stock += qty_in - qty_out
        summary.save()  # save() auto-recalculates available_stock

        return created

    # -------------------------------------------------------------------------
    # Stock queries
    # -------------------------------------------------------------------------

    @staticmethod
    def get_available_stock(item_id, warehouse_id, batch_number=None):
        """
        Return available_stock from InventorySummary.

        Tries product_id first, then material_id (item_id can be either FK).
        Returns Decimal('0') when no summary row exists.
        """
        qs = InventorySummary.objects.filter(warehouse_id=warehouse_id)
        if batch_number is not None:
            qs = qs.filter(batch_number=batch_number)

        summary = (
            qs.filter(product_id=item_id).first()
            or qs.filter(material_id=item_id).first()
        )
        return summary.available_stock if summary else Decimal('0')

    # -------------------------------------------------------------------------
    # Reservations
    # -------------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def reserve_stock(order_id, product_id, batch_number, warehouse_id, qty):
        """
        Reserve *qty* units for an order.

        Raises ValidationError if available_stock is insufficient.
        Returns the created StockReservation.
        """
        qty = Decimal(str(qty))
        batch_number = batch_number or ''

        summary = (
            InventorySummary.objects
            .select_for_update()
            .filter(
                warehouse_id=warehouse_id,
                product_id=product_id,
                batch_number=batch_number,
            )
            .first()
        )
        available = summary.available_stock if summary else Decimal('0')
        if available < qty:
            raise ValidationError(
                f"Insufficient stock: {available} available, {qty} requested."
            )

        reservation = StockReservation.objects.create(
            order_id=order_id,
            product_id=product_id,
            batch_number=batch_number,
            warehouse_id=warehouse_id,
            reserved_quantity=qty,
            reservation_status='Reserved',
        )

        if summary:
            summary.reserved_stock += qty
            summary.save()  # recalculates available_stock

        return reservation

    @staticmethod
    @transaction.atomic
    def release_reservation(reservation_id):
        """
        Mark a StockReservation as Released and free its reserved_stock.

        Raises ValidationError if the reservation is not in 'Reserved' state.
        """
        reservation = (
            StockReservation.objects
            .select_for_update()
            .get(pk=reservation_id)
        )
        if reservation.reservation_status != 'Reserved':
            raise ValidationError(
                f"Cannot release reservation with status '{reservation.reservation_status}'."
            )

        reservation.reservation_status = 'Released'
        reservation.save(update_fields=['reservation_status', 'updated_at'])

        summary = (
            InventorySummary.objects
            .select_for_update()
            .filter(
                warehouse_id=reservation.warehouse_id,
                product_id=reservation.product_id,
                batch_number=reservation.batch_number,
            )
            .first()
        )
        if summary:
            summary.reserved_stock = max(
                Decimal('0'),
                summary.reserved_stock - reservation.reserved_quantity,
            )
            summary.save()

    # -------------------------------------------------------------------------
    # FIFO batch selection
    # -------------------------------------------------------------------------

    @staticmethod
    def get_fifo_batch(product_id, warehouse_id):
        """
        Return the oldest Approved batch for *product_id* in *warehouse_id*
        that still has available stock (FIFO order by production_date ASC).

        Returns None when no qualifying batch exists.
        """
        approved_batches = (
            BatchTable.objects
            .filter(product_id=product_id, status='Approved')
            .order_by('production_date')
        )
        for batch in approved_batches:
            has_stock = InventorySummary.objects.filter(
                product_id=product_id,
                warehouse_id=warehouse_id,
                batch_number=batch.batch_number,
                available_stock__gt=0,
            ).exists()
            if has_stock:
                return batch
        return None

    # -------------------------------------------------------------------------
    # Stock transfers
    # -------------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def create_stock_transfer(source_wh, dest_wh, items, user):
        """
        Create a StockTransfer with TransferItems, post Transfer-Out ledger
        entries for the source warehouse, and increment in_transit_stock on
        the destination InventorySummary rows.

        Args:
            source_wh: Warehouse instance
            dest_wh  : Warehouse instance
            items    : list of dicts with keys:
                         item_type ('Product'|'Material'),
                         product_id or material_id (FK instance),
                         batch_number (str, optional),
                         quantity (numeric)
            user     : SystemUser instance or None

        Returns:
            The created StockTransfer.
        """
        transfer = StockTransfer.objects.create(
            source_warehouse=source_wh,
            destination_warehouse=dest_wh,
            status='Dispatched',
        )

        for item_data in items:
            item_type = item_data.get('item_type', 'Product')
            product_id = item_data.get('product_id')
            material_id = item_data.get('material_id')
            item_id = product_id if item_type == 'Product' else material_id
            batch_number = item_data.get('batch_number', '')
            qty = Decimal(str(item_data['quantity']))

            TransferItem.objects.create(
                transfer_id=transfer,
                product_id=product_id,
                material_id=material_id,
                batch_number=batch_number or '',
                quantity=qty,
            )

            # Transfer-Out entry for source warehouse
            InventoryService.post_ledger_entry(
                item_type=item_type,
                item_id=item_id,
                warehouse_id=source_wh,
                bin_id=None,
                batch_number=batch_number,
                movement_type='TRANSFER',
                qty_in=Decimal('0'),
                qty_out=qty,
                reference_type='StockTransfer',
                reference_id=transfer.id,
                user_id=user,
            )

            # Increment in_transit_stock on destination summary
            dest_filter = {
                'warehouse_id': dest_wh,
                'batch_number': batch_number or '',
                'product_id': product_id,
                'material_id': material_id,
            }
            dest_summary, _ = InventorySummary.objects.get_or_create(
                **dest_filter,
                defaults={
                    'total_stock': Decimal('0'),
                    'reserved_stock': Decimal('0'),
                    'available_stock': Decimal('0'),
                    'in_transit_stock': Decimal('0'),
                },
            )
            dest_summary.in_transit_stock += qty
            dest_summary.save()

        return transfer

    @staticmethod
    @transaction.atomic
    def receive_stock_transfer(transfer_id, user):
        """
        Receive a StockTransfer: post Transfer-In ledger entries for the
        destination warehouse and decrement in_transit_stock.

        Raises ValidationError if the transfer is not 'In Transit'.
        """
        transfer = (
            StockTransfer.objects
            .select_for_update()
            .get(pk=transfer_id)
        )
        if transfer.status != 'In Transit':
            raise ValidationError(
                f"Cannot receive transfer with status '{transfer.status}'. "
                "Expected 'In Transit'."
            )

        for item in transfer.items.all():
            item_type = 'Product' if item.product_id else 'Material'
            item_id = item.product_id if item_type == 'Product' else item.material_id

            InventoryService.post_ledger_entry(
                item_type=item_type,
                item_id=item_id,
                warehouse_id=transfer.destination_warehouse,
                bin_id=None,
                batch_number=item.batch_number,
                movement_type='TRANSFER',
                qty_in=item.quantity,
                qty_out=Decimal('0'),
                reference_type='StockTransfer',
                reference_id=transfer.id,
                user_id=user,
            )

            # Decrement in_transit_stock on destination summary
            dest_filter = {
                'warehouse_id': transfer.destination_warehouse,
                'batch_number': item.batch_number or '',
                'product_id': item.product_id,
                'material_id': item.material_id,
            }
            summary = InventorySummary.objects.filter(**dest_filter).first()
            if summary:
                summary.in_transit_stock = max(
                    Decimal('0'),
                    summary.in_transit_stock - item.quantity,
                )
                summary.save()

        transfer.status = 'Received'
        transfer.received_date = timezone.now().date()
        transfer.save(update_fields=['status', 'received_date', 'updated_at'])

    # -------------------------------------------------------------------------
    # Expiry alerting (called by Celery task daily at 6 AM)
    # -------------------------------------------------------------------------

    @staticmethod
    def check_expiry_and_alert():
        """
        Query BatchTable for Approved batches expiring within EXPIRY_ALERT_DAYS.
        Batches already past today are marked Expired; upcoming ones are flagged
        for notification (TODO: create Notification records once that app exists).

        Returns dict {'expired': N, 'flagged': M}.
        """
        alert_days = int(getattr(settings, 'EXPIRY_ALERT_DAYS', 60))
        threshold = timezone.now().date() + timedelta(days=alert_days)
        today = timezone.now().date()

        expiring = BatchTable.objects.filter(
            expiry_date__lte=threshold,
            status='Approved',
        )

        expired_ids, flagged_ids = [], []

        with transaction.atomic():
            for batch in expiring:
                if batch.expiry_date <= today:
                    batch.status = 'Expired'
                    batch.save(update_fields=['status', 'updated_at'])
                    expired_ids.append(str(batch.pk))
                    logger.warning(
                        "Batch %s (id=%s) expired on %s — status set to Expired",
                        batch.batch_number, batch.pk, batch.expiry_date,
                    )
                else:
                    flagged_ids.append(str(batch.pk))
                    logger.info(
                        "Batch %s expiring on %s (%d days remaining)",
                        batch.batch_number,
                        batch.expiry_date,
                        (batch.expiry_date - today).days,
                    )
                    # TODO: create Notification record once notification app is ready

        logger.info(
            "check_expiry_and_alert: expired=%d, flagged=%d",
            len(expired_ids), len(flagged_ids),
        )
        return {'expired': len(expired_ids), 'flagged': len(flagged_ids)}
