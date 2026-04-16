from django.contrib import admin

from .models import (
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


class SalesOrderItemInline(admin.TabularInline):
    model  = SalesOrderItem
    extra  = 0
    fields = ('product_id', 'quantity', 'unit_price', 'discount', 'tax', 'total_price')
    readonly_fields = ('total_price',)


class DispatchItemInline(admin.TabularInline):
    model  = DispatchItem
    extra  = 0
    fields = ('product_id', 'batch_number', 'quantity')


class SalesReturnItemInline(admin.TabularInline):
    model  = SalesReturnItem
    extra  = 0
    fields = ('product_id', 'batch_number', 'quantity', 'condition')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display  = ('customer_name', 'region', 'city', 'credit_limit', 'payment_terms', 'status')
    list_filter   = ('region', 'status', 'payment_terms')
    search_fields = ('customer_name', 'city')


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display  = ('order_number', 'customer_id', 'order_date', 'order_status', 'total_amount', 'payment_type')
    list_filter   = ('order_status', 'order_source', 'payment_type')
    search_fields = ('order_number', 'customer_id__customer_name')
    inlines       = [SalesOrderItemInline]


@admin.register(CustomerCreditLedger)
class CustomerCreditLedgerAdmin(admin.ModelAdmin):
    list_display  = ('customer_id', 'transaction_date', 'entry_type', 'invoice_amount', 'payment_received', 'balance')
    list_filter   = ('entry_type',)
    search_fields = ('customer_id__customer_name',)


@admin.register(DispatchOrder)
class DispatchOrderAdmin(admin.ModelAdmin):
    list_display  = ('pk', 'order_id', 'warehouse_id', 'driver_name', 'dispatch_date', 'status')
    list_filter   = ('status',)
    inlines       = [DispatchItemInline]


@admin.register(DeliveryConfirmation)
class DeliveryConfirmationAdmin(admin.ModelAdmin):
    list_display = ('pk', 'dispatch_id', 'delivered_by', 'delivery_time', 'status')
    list_filter  = ('status',)


@admin.register(SalesReturn)
class SalesReturnAdmin(admin.ModelAdmin):
    list_display  = ('pk', 'order_id', 'customer_id', 'return_date', 'status')
    list_filter   = ('status',)
    inlines       = [SalesReturnItemInline]
