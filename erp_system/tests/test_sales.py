"""
Module 6 — Sales & Distribution
Test Cases T6.1 – T6.6

Run:
    cd erp_system
    pytest tests/test_sales.py -v
    pytest tests/test_sales.py -v --tb=short
"""
from datetime import date
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.authentication.models import SystemUser
from apps.master_data.models import Product, Warehouse, Vehicle
from apps.sales.models import (
    Customer,
    SalesOrder,
    SalesOrderItem,
    CustomerCreditLedger,
    DispatchOrder,
    DispatchItem,
    DeliveryConfirmation,
    SalesReturn,
    SalesReturnItem,
)
from apps.sales.services import SalesService

pytestmark = pytest.mark.django_db


# ─────────────────────────────────────────────────────────────────────────────
# Shared fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def operator(db):
    return SystemUser.objects.create_user(
        username='sales_tester_t6',
        password='testpass123',
        email='sales_t6@test.com',
    )


@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        warehouse_name='Lahore Factory T6',
        warehouse_type='Factory',
        city='Lahore',
        province='Punjab',
    )


@pytest.fixture
def vehicle(db):
    return Vehicle.objects.create(
        registration_number='LHR-T6-001',
        vehicle_type='Truck',
        capacity_kg=Decimal('5000.00'),
        driver_name='Ali Driver',
    )


@pytest.fixture
def product(db):
    return Product.objects.create(
        sku_code='CN-SALES-T6',
        product_name='Cheese Nachos 50g T6',
        pack_size='50g',
        net_weight=Decimal('0.050'),
        gross_weight=Decimal('0.055'),
        barcode='T6-BARCODE-001',
        shelf_life_days=180,
        standard_cost=Decimal('38.00'),
        selling_price=Decimal('60.00'),
    )


@pytest.fixture
def customer_with_credit(db):
    """Customer with PKR 500,000 credit limit."""
    return Customer.objects.create(
        customer_name='Lahore Distributor T6',
        region='Punjab',
        city='Lahore',
        credit_limit=Decimal('500000.00'),
        payment_terms='NET30',
        delivery_priority=1,
    )


@pytest.fixture
def approved_order(db, customer_with_credit, warehouse, product):
    """Pre-built Approved order with 1,000 units × PKR 60 = PKR 60,000."""
    order = SalesOrder.objects.create(
        order_number='SO-2026-T601',
        customer_id=customer_with_credit,
        warehouse_id=warehouse,
        order_source='sales_app',
        payment_type='Credit',
        order_status='Approved',
        total_amount=Decimal('60000.00'),
    )
    SalesOrderItem.objects.create(
        order_id=order,
        product_id=product,
        quantity=Decimal('1000'),
        unit_price=Decimal('60.00'),
        discount=Decimal('0'),
        tax=Decimal('0'),
    )
    return order


# ─────────────────────────────────────────────────────────────────────────────
# T6.1  SalesOrderItem.total_price auto-calculation
#       qty=1000, price=60, discount=10%, tax=5%
#       → subtotal=60,000  after_disc=54,000  total=56,700
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_1_OrderItemPricing:

    def test_total_price_with_discount_and_tax(self, approved_order, product):
        """total_price = qty × price × (1 − disc%) × (1 + tax%)."""
        item = SalesOrderItem.objects.create(
            order_id=approved_order,
            product_id=product,
            quantity=Decimal('1000'),
            unit_price=Decimal('60.00'),
            discount=Decimal('10'),   # 10 %
            tax=Decimal('5'),         # 5 %
        )
        # 1000 × 60 = 60,000 → ×0.90 = 54,000 → ×1.05 = 56,700
        assert item.total_price == Decimal('56700.0000'), \
            f"Expected 56,700; got {item.total_price}"

    def test_total_price_no_discount_no_tax(self, approved_order, product):
        """Baseline: discount=0, tax=0 → total_price = qty × price."""
        item = SalesOrderItem.objects.create(
            order_id=approved_order,
            product_id=product,
            quantity=Decimal('500'),
            unit_price=Decimal('60.00'),
            discount=Decimal('0'),
            tax=Decimal('0'),
        )
        assert item.total_price == Decimal('30000.0000'), \
            f"Expected 30,000; got {item.total_price}"

    def test_total_price_discount_only(self, approved_order, product):
        """Only discount, no tax."""
        item = SalesOrderItem.objects.create(
            order_id=approved_order,
            product_id=product,
            quantity=Decimal('200'),
            unit_price=Decimal('50.00'),
            discount=Decimal('20'),   # 20 %
            tax=Decimal('0'),
        )
        # 200 × 50 × 0.80 = 8,000
        assert item.total_price == Decimal('8000.0000'), \
            f"Expected 8,000; got {item.total_price}"


# ─────────────────────────────────────────────────────────────────────────────
# T6.2  Credit check logic
#       credit_limit=500,000  outstanding=200,000  available=300,000
#       order_total=250,000 → APPROVED
#       order_total=350,000 → REJECTED
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_2_CreditCheck:

    def _post_invoice(self, customer, amount):
        CustomerCreditLedger.objects.create(
            customer_id=customer,
            transaction_date=date.today(),
            entry_type='Invoice',
            invoice_amount=amount,
            payment_received=Decimal('0'),
            balance=amount,
        )

    def test_credit_approved_within_limit(self, customer_with_credit):
        """250,000 order against 300,000 available → approved."""
        self._post_invoice(customer_with_credit, Decimal('200000'))
        result = SalesService.credit_check(
            str(customer_with_credit.pk), Decimal('250000')
        )
        assert result.approved is True
        assert result.available == Decimal('300000.0000'), \
            f"Available expected 300,000; got {result.available}"

    def test_credit_rejected_over_limit(self, customer_with_credit):
        """350,000 order against 300,000 available → rejected."""
        self._post_invoice(customer_with_credit, Decimal('200000'))
        result = SalesService.credit_check(
            str(customer_with_credit.pk), Decimal('350000')
        )
        assert result.approved is False

    def test_credit_full_limit_available_when_no_ledger(self, customer_with_credit):
        """No prior ledger entries → full credit_limit is available."""
        result = SalesService.credit_check(
            str(customer_with_credit.pk), Decimal('100000')
        )
        assert result.approved is True
        assert result.available == Decimal('500000.00'), \
            f"Expected full limit; got {result.available}"


# ─────────────────────────────────────────────────────────────────────────────
# T6.3  Dispatch flow
#       Approved order → dispatch_order() → status=Dispatched
#       + DispatchItem created + Invoice ledger entry posted
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_3_DispatchFlow:

    def test_dispatch_creates_dispatch_order(self, approved_order, warehouse, vehicle, product):
        """Dispatching an Approved order creates a DispatchOrder."""
        dispatch = SalesService.dispatch_order(
            order_id     = str(approved_order.pk),
            warehouse_id = str(warehouse.pk),
            driver_name  = 'Ali Driver',
            vehicle_id   = str(vehicle.pk),
            items=[{
                'product_id':   str(product.pk),
                'batch_number': 'PN260415T6',
                'quantity':     Decimal('1000'),
            }],
        )
        assert dispatch.status == 'Pending'
        assert dispatch.driver_name == 'Ali Driver'
        assert DispatchItem.objects.filter(dispatch_id=dispatch).count() == 1

    def test_dispatch_updates_order_status(self, approved_order, warehouse, product):
        """Order status moves to Dispatched."""
        SalesService.dispatch_order(
            order_id     = str(approved_order.pk),
            warehouse_id = str(warehouse.pk),
            driver_name  = 'Test Driver',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('1000'),
            }],
        )
        approved_order.refresh_from_db()
        assert approved_order.order_status == 'Dispatched'

    def test_dispatch_posts_invoice_ledger_entry(self, approved_order, warehouse, product):
        """Dispatching posts an Invoice entry in CustomerCreditLedger."""
        SalesService.dispatch_order(
            order_id     = str(approved_order.pk),
            warehouse_id = str(warehouse.pk),
            driver_name  = 'Test Driver',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('1000'),
            }],
        )
        entry = CustomerCreditLedger.objects.filter(
            customer_id=approved_order.customer_id,
            entry_type='Invoice',
        ).last()
        assert entry is not None
        assert entry.invoice_amount == approved_order.total_amount

    def test_cannot_dispatch_non_approved_order(self, customer_with_credit, warehouse, product):
        """Dispatching a Draft order raises ValueError."""
        draft_order = SalesOrder.objects.create(
            order_number='SO-2026-T603D',
            customer_id=customer_with_credit,
            warehouse_id=warehouse,
            order_status='Draft',
            total_amount=Decimal('10000'),
        )
        with pytest.raises(ValueError, match='must be Approved'):
            SalesService.dispatch_order(
                order_id     = str(draft_order.pk),
                warehouse_id = str(warehouse.pk),
                driver_name  = 'Driver',
                items=[],
            )


# ─────────────────────────────────────────────────────────────────────────────
# T6.4  Delivery confirmation
#       Delivered → DispatchOrder.status=Delivered, SalesOrder.status=Delivered
#       Rejected  → DispatchOrder.status=Returned
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_4_DeliveryConfirmation:

    def _make_dispatch(self, approved_order, warehouse, product):
        return SalesService.dispatch_order(
            order_id     = str(approved_order.pk),
            warehouse_id = str(warehouse.pk),
            driver_name  = 'Test Driver',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('1000'),
            }],
        )

    def test_delivered_updates_statuses(self, approved_order, warehouse, product):
        """Full delivery → both dispatch and order become Delivered."""
        dispatch = self._make_dispatch(approved_order, warehouse, product)
        SalesService.confirm_delivery(
            dispatch_id  = str(dispatch.pk),
            delivered_by = 'Ali Driver',
            status       = 'Delivered',
        )
        dispatch.refresh_from_db()
        approved_order.refresh_from_db()
        assert dispatch.status             == 'Delivered'
        assert approved_order.order_status == 'Delivered'

    def test_rejected_delivery_marks_dispatch_returned(self, approved_order, warehouse, product):
        """Rejected delivery → dispatch.status=Returned."""
        dispatch = self._make_dispatch(approved_order, warehouse, product)
        SalesService.confirm_delivery(
            dispatch_id  = str(dispatch.pk),
            delivered_by = 'Ali Driver',
            status       = 'Rejected',
        )
        dispatch.refresh_from_db()
        assert dispatch.status == 'Returned'

    def test_delivery_confirmation_record_created(self, approved_order, warehouse, product):
        """DeliveryConfirmation record is persisted with correct fields."""
        dispatch = self._make_dispatch(approved_order, warehouse, product)
        conf = SalesService.confirm_delivery(
            dispatch_id        = str(dispatch.pk),
            delivered_by       = 'Test Rider',
            status             = 'Delivered',
            customer_signature = 'sig_base64==',
        )
        assert DeliveryConfirmation.objects.filter(dispatch_id=dispatch).exists()
        assert conf.customer_signature == 'sig_base64=='
        assert conf.delivered_by == 'Test Rider'


# ─────────────────────────────────────────────────────────────────────────────
# T6.5  Sales return
#       Return 200 units → SalesReturn created, credit note ledger entry
#       order_status becomes Returned
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_5_SalesReturn:

    def _deliver_order(self, approved_order, warehouse, product):
        """Helper: dispatch + confirm delivery so order is in Delivered state."""
        dispatch = SalesService.dispatch_order(
            order_id     = str(approved_order.pk),
            warehouse_id = str(warehouse.pk),
            driver_name  = 'Rider',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('1000'),
            }],
        )
        SalesService.confirm_delivery(
            dispatch_id  = str(dispatch.pk),
            delivered_by = 'Rider',
            status       = 'Delivered',
        )
        approved_order.refresh_from_db()
        return approved_order

    def test_return_creates_sales_return(self, approved_order, warehouse, product):
        """process_return() persists SalesReturn + items."""
        self._deliver_order(approved_order, warehouse, product)

        sales_return = SalesService.process_return(
            order_id      = str(approved_order.pk),
            customer_id   = str(approved_order.customer_id_id),
            return_reason = 'Damaged in transit',
            items=[{
                'product_id':   str(product.pk),
                'batch_number': 'PN260415T6',
                'quantity':     Decimal('200'),
                'condition':    'Damaged',
            }],
        )
        assert SalesReturn.objects.filter(pk=sales_return.pk).exists()
        assert sales_return.items.count() == 1
        assert sales_return.items.first().quantity == Decimal('200')

    def test_return_posts_credit_note(self, approved_order, warehouse, product):
        """Credit note entry is posted to CustomerCreditLedger."""
        self._deliver_order(approved_order, warehouse, product)

        SalesService.process_return(
            order_id      = str(approved_order.pk),
            customer_id   = str(approved_order.customer_id_id),
            return_reason = 'Wrong product',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('100'),
                'condition':  'Resellable',
            }],
        )
        credit_note = CustomerCreditLedger.objects.filter(
            customer_id=approved_order.customer_id,
            entry_type='Credit Note',
        ).last()
        assert credit_note is not None
        # 100 units × PKR 60 (unit_price from the order line) = 6,000
        assert credit_note.payment_received == Decimal('6000.0000'), \
            f"Credit note expected 6,000; got {credit_note.payment_received}"

    def test_return_marks_order_returned(self, approved_order, warehouse, product):
        """SalesOrder.order_status becomes Returned after process_return()."""
        self._deliver_order(approved_order, warehouse, product)

        SalesService.process_return(
            order_id      = str(approved_order.pk),
            customer_id   = str(approved_order.customer_id_id),
            return_reason = 'Expired stock',
            items=[{
                'product_id': str(product.pk),
                'quantity':   Decimal('50'),
                'condition':  'Expired',
            }],
        )
        approved_order.refresh_from_db()
        assert approved_order.order_status == 'Returned'


# ─────────────────────────────────────────────────────────────────────────────
# T6.6  Running credit balance (ledger integrity)
#       Invoice 300,000 → payment 100,000 → balance = 200,000
#       Second invoice 150,000 → balance = 350,000
# ─────────────────────────────────────────────────────────────────────────────

class TestT6_6_CreditLedgerBalance:

    def test_running_balance_after_invoice_and_payment(self, customer_with_credit):
        """
        Invoice 300,000  → balance = 300,000
        Payment 100,000  → balance = 200,000
        Invoice 150,000  → balance = 350,000
        """
        e1 = SalesService._post_ledger_entry(
            customer_id    = str(customer_with_credit.pk),
            entry_type     = 'Invoice',
            invoice_amount = Decimal('300000'),
        )
        assert e1.balance == Decimal('300000'), \
            f"After first invoice expected 300,000; got {e1.balance}"

        e2 = SalesService._post_ledger_entry(
            customer_id      = str(customer_with_credit.pk),
            entry_type       = 'Payment',
            payment_received = Decimal('100000'),
        )
        assert e2.balance == Decimal('200000'), \
            f"After payment expected 200,000; got {e2.balance}"

        e3 = SalesService._post_ledger_entry(
            customer_id    = str(customer_with_credit.pk),
            entry_type     = 'Invoice',
            invoice_amount = Decimal('150000'),
        )
        assert e3.balance == Decimal('350000'), \
            f"After second invoice expected 350,000; got {e3.balance}"

    def test_credit_check_uses_live_balance(self, customer_with_credit):
        """
        After posting 300,000 invoice: available = 500,000 − 300,000 = 200,000.
        Order of 250,000 → rejected.
        Order of 150,000 → approved.
        """
        SalesService._post_ledger_entry(
            customer_id    = str(customer_with_credit.pk),
            entry_type     = 'Invoice',
            invoice_amount = Decimal('300000'),
        )
        rejected = SalesService.credit_check(str(customer_with_credit.pk), Decimal('250000'))
        approved = SalesService.credit_check(str(customer_with_credit.pk), Decimal('150000'))
        assert rejected.approved is False, "250,000 should be rejected (only 200,000 available)"
        assert approved.approved is True,  "150,000 should be approved"

    def test_credit_note_reduces_balance(self, customer_with_credit):
        """Credit note (payment_received > 0) reduces the running balance."""
        SalesService._post_ledger_entry(
            customer_id    = str(customer_with_credit.pk),
            entry_type     = 'Invoice',
            invoice_amount = Decimal('100000'),
        )
        cn = SalesService._post_ledger_entry(
            customer_id      = str(customer_with_credit.pk),
            entry_type       = 'Credit Note',
            payment_received = Decimal('20000'),
        )
        assert cn.balance == Decimal('80000'), \
            f"After credit note expected 80,000; got {cn.balance}"
