"""
Migration 0004 — Align schema with exact client spec.

Changes vs 0003:
  ProductionBatch.actual_quantity   → null=True, blank=True  (was default=0)
  BatchStageLog.output_quantity     → null=True, blank=True  (was default=0)
  BatchStageLog                     → remove temperature_celsius (not in spec)
  MaterialIssue.issued_time         → auto_now_add=True (was default=timezone.now)
  MaterialIssue                     → remove supplier_id, unit_of_measure,
                                        unit_cost, total_cost, raw_material_batch
  OilConsumptionLog.timestamp       → auto_now_add=True (was default=timezone.now)
  OilConsumptionLog                 → remove unit_of_measure, unit_cost, total_cost
  ProductionYield.batch_id          → ForeignKey unique=True (was OneToOneField)
  PackingLog.timestamp              → auto_now_add=True (was default=timezone.now)
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('manufacturing', '0003_mes_full_implementation'),
        ('master_data', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # ── ProductionBatch.actual_quantity → nullable ─────────────────────────
        migrations.AlterField(
            model_name='productionbatch',
            name='actual_quantity',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=14, null=True),
        ),

        # ── ProductionBatch: fix status choices ────────────────────────────────
        migrations.AlterField(
            model_name='productionbatch',
            name='status',
            field=models.CharField(
                choices=[('Pending', 'Pending'), ('Running', 'Running'),
                         ('Paused', 'Paused'), ('Completed', 'Completed'),
                         ('Cancelled', 'Cancelled')],
                default='Pending', max_length=20,
            ),
        ),

        # ── BatchStageLog.output_quantity → nullable ───────────────────────────
        migrations.AlterField(
            model_name='batchstagelog',
            name='output_quantity',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=14, null=True),
        ),

        # ── BatchStageLog: remove temperature_celsius ──────────────────────────
        migrations.RemoveField(model_name='batchstagelog', name='temperature_celsius'),

        # ── MaterialIssue: issued_time → auto_now_add ──────────────────────────
        migrations.AlterField(
            model_name='materialissue',
            name='issued_time',
            field=models.DateTimeField(auto_now_add=True),
        ),

        # ── MaterialIssue: remove extra costing fields (not in spec) ──────────
        migrations.RemoveField(model_name='materialissue', name='supplier_id'),
        migrations.RemoveField(model_name='materialissue', name='unit_of_measure'),
        migrations.RemoveField(model_name='materialissue', name='unit_cost'),
        migrations.RemoveField(model_name='materialissue', name='total_cost'),
        migrations.RemoveField(model_name='materialissue', name='raw_material_batch'),

        # ── OilConsumptionLog: timestamp → auto_now_add ────────────────────────
        migrations.AlterField(
            model_name='oilconsumptionlog',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True),
        ),

        # ── OilConsumptionLog: remove costing extras ───────────────────────────
        migrations.RemoveField(model_name='oilconsumptionlog', name='unit_of_measure'),
        migrations.RemoveField(model_name='oilconsumptionlog', name='unit_cost'),
        migrations.RemoveField(model_name='oilconsumptionlog', name='total_cost'),

        # ── ProductionYield: OneToOneField → ForeignKey(unique=True) ──────────
        # Drop the old table, recreate with FK unique constraint.
        # (Structurally identical at DB level; migration updates Django state.)
        migrations.DeleteModel(name='ProductionYield'),
        migrations.CreateModel(
            name='ProductionYield',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='yield_id', default=__import__('uuid').uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('input_qty',  models.DecimalField(decimal_places=4, default=0, max_digits=14)),
                ('output_qty', models.DecimalField(decimal_places=4, default=0, max_digits=14)),
                ('yield_percent', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='yield_records',
                    to='manufacturing.productionbatch',
                    unique=True,
                )),
            ],
            options={'db_table': 'production_yield'},
        ),

        # ── PackingLog: timestamp → auto_now_add ───────────────────────────────
        migrations.AlterField(
            model_name='packinglog',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
