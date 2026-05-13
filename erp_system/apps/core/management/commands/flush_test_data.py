"""
Management command: flush_test_data
Deletes ALL rows from every app table EXCEPT the SystemUser rows.

Usage:
    python manage.py flush_test_data
    python manage.py flush_test_data --noinput   (skip confirmation prompt)
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction


# Tables in correct FK dependency order (children before parents)
ORDERED_TABLES = [
    # Costing
    "batch_cost_items",
    "batch_costs",
    "sku_profitability",
    "process_costing",

    # Finance
    "journal_entry_lines",
    "journal_entries",
    "balance_sheet_snapshots",

    # Sales
    "sales_return_items",
    "sales_returns",
    "dispatch_order_items",
    "dispatch_orders",
    "sales_order_items",
    "sales_orders",
    "incentive_redemptions",
    "promotions",

    # Warehouse
    "stock_transfer_items",
    "stock_transfers",
    "picking_list_items",
    "picking_lists",

    # Manufacturing
    "batch_material_consumption",
    "production_batch_outputs",
    "production_batches",
    "production_order_items",
    "production_orders",

    # MRP
    "mrp_demand_forecasts",
    "mrp_plans",

    # Procurement
    "qc_inspections",
    "goods_receipt_items",
    "goods_receipts",
    "accounts_payable",
    "purchase_returns",
    "raw_material_batches",
    "quotations",
    "request_for_quotations",
    "purchase_order_items",
    "purchase_orders",
    "purchase_requisition_items",
    "purchase_requisitions",
    "supplier_price_history",
    "supplier_materials",
    "reorder_rules",
    "approval_workflows",
    "payment_terms",

    # Inventory
    "inventory_adjustments",
    "stock_ledger",
    "inventory_batches",
    "stock_levels",

    # Master Data
    "supplier_materials_mapping",
    "packaging_materials",
    "warehouse_bins",
    "machines",
    "production_lines",
    "products",
    "product_category",
    "raw_materials",
    "warehouses",
    "customers",
    "vehicles",
    "suppliers",

    # Core
    "audit_logs",
]


class Command(BaseCommand):
    help = "Flush all data from every table while keeping user accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            action="store_true",
            help="Skip the confirmation prompt.",
        )

    def handle(self, *args, **options):
        if not options["noinput"]:
            confirm = input(
                "\nWARNING: This will DELETE all data from every table "
                "(users are preserved).\nType 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                self.stdout.write("Aborted.")
                return

        deleted_counts = {}
        errors = []

        with transaction.atomic():
            with connection.cursor() as cursor:
                db_engine = connection.vendor
                if db_engine == "sqlite":
                    cursor.execute("PRAGMA foreign_keys = OFF;")
                elif db_engine == "postgresql":
                    cursor.execute("SET session_replication_role = replica;")

                for table in ORDERED_TABLES:
                    try:
                        cursor.execute(f"DELETE FROM {table};")
                        deleted_counts[table] = cursor.rowcount
                    except Exception as exc:
                        errors.append(f"  SKIP {table}: {exc}")

                if db_engine == "sqlite":
                    cursor.execute("PRAGMA foreign_keys = ON;")
                elif db_engine == "postgresql":
                    cursor.execute("SET session_replication_role = DEFAULT;")

        # Print summary using ASCII only (Windows cp1252 safe)
        sep = "-" * 55
        self.stdout.write("\n" + sep)
        self.stdout.write("FLUSH COMPLETE\n")

        total_deleted = 0
        for tbl, cnt in deleted_counts.items():
            if cnt and cnt > 0:
                self.stdout.write(f"  DELETED  {tbl:<40} {cnt:>4} rows")
                total_deleted += cnt

        self.stdout.write(f"\n  Total rows deleted: {total_deleted}")

        if errors:
            self.stdout.write("\nTables skipped (may not exist yet):")
            for e in errors:
                self.stdout.write(e)

        self.stdout.write("\nAll user accounts preserved.")
        self.stdout.write(sep + "\n")
