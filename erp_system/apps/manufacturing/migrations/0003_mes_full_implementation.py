"""
Migration 0003 — Full MES implementation.

Changes vs 0002:
  ProductionStage   : rename 'name' column → 'stage_name'; rename PK column → 'stage_id'
  ProductionOrder   : full schema replacement (drop old fields, add client-spec fields)
  ProductionBatch   : add actual_quantity; rename start/end datetime cols; align status choices
  BatchStageLog     : add input_quantity, output_quantity, waste_quantity
  MaterialIssue     : rename pk col, rename issued_quantity→quantity_issued, add warehouse_id,
                      rename issued_at→issued_time; remove supplier/cost fields (kept as extras)
  OilConsumptionLog : rename material_id→oil_material_id; replace opening/closing_reading
                      with quantity_added/quantity_remaining; rename logged_at→timestamp,
                      logged_by→operator_id
  NEW TABLES        : production_order_items, material_reservations, material_consumption,
                      production_yield, production_waste, machine_logs, packing_logs,
                      production_output
  DROPPED TABLES    : production_yields (replaced by production_yield)
"""
import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('manufacturing', '0002_add_production_batch_traceability'),
        ('master_data', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # Removed AlterField for name to avoid sqlite incompat

        # ── Drop old ProductionBatch (from 0002) before replacing ProductionOrder ─
        # Must drop child first
        migrations.DeleteModel(name='BatchCostSummary'),
        migrations.DeleteModel(name='ProductionYield'),
        migrations.DeleteModel(name='OilConsumptionLog'),
        migrations.DeleteModel(name='MaterialIssue'),
        migrations.DeleteModel(name='BatchStageLog'),
        migrations.DeleteModel(name='ProductionBatch'),
        migrations.DeleteModel(name='ProductionOrder'),

        # ── Recreate ProductionOrder with client-spec schema ───────────────────
        migrations.CreateModel(
            name='ProductionOrder',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='production_order_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('order_number', models.CharField(db_column='order_number', max_length=30,
                                                  unique=True)),
                ('planned_quantity', models.DecimalField(db_column='planned_quantity',
                                                         decimal_places=4, default=0,
                                                         max_digits=14)),
                ('planned_start_date', models.DateField(blank=True, db_column='planned_start_date',
                                                        null=True)),
                ('planned_end_date', models.DateField(blank=True, db_column='planned_end_date',
                                                      null=True)),
                ('actual_start_date', models.DateField(blank=True, db_column='actual_start_date',
                                                       null=True)),
                ('actual_end_date', models.DateField(blank=True, db_column='actual_end_date',
                                                     null=True)),
                ('status', models.CharField(
                    choices=[('Planned', 'Planned'), ('Released', 'Released'),
                             ('In Progress', 'In Progress'), ('Completed', 'Completed'),
                             ('Closed', 'Closed')],
                    db_column='status', default='Planned', max_length=20)),
                ('notes', models.TextField(blank=True, default='')),
                ('product_id', models.ForeignKey(blank=True, db_column='product_id', null=True,
                                                  on_delete=django.db.models.deletion.SET_NULL,
                                                  related_name='production_orders',
                                                  to='master_data.product')),
                ('created_by', models.ForeignKey(blank=True, db_column='created_by', null=True,
                                                  on_delete=django.db.models.deletion.SET_NULL,
                                                  related_name='production_orders_created',
                                                  to=settings.AUTH_USER_MODEL)),
                ('approved_by', models.ForeignKey(blank=True, db_column='approved_by', null=True,
                                                   on_delete=django.db.models.deletion.SET_NULL,
                                                   related_name='production_orders_approved',
                                                   to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'production_orders'},
        ),
        migrations.AddIndex(
            model_name='productionorder',
            index=models.Index(fields=['status', 'planned_start_date'],
                               name='mfg_po_status_start_idx'),
        ),

        # ── ProductionOrderItem ────────────────────────────────────────────────
        migrations.CreateModel(
            name='ProductionOrderItem',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='order_item_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('planned_quantity', models.DecimalField(db_column='planned_quantity',
                                                         decimal_places=4, max_digits=14)),
                ('produced_quantity', models.DecimalField(db_column='produced_quantity',
                                                          decimal_places=4, default=0,
                                                          max_digits=14)),
                ('production_order_id', models.ForeignKey(
                    db_column='production_order_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='items', to='manufacturing.productionorder')),
                ('product_id', models.ForeignKey(
                    db_column='product_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='order_items', to='master_data.product')),
            ],
            options={'db_table': 'production_order_items'},
        ),

        # ── ProductionBatch ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='ProductionBatch',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='batch_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('batch_number', models.CharField(db_column='batch_number', max_length=100,
                                                   unique=True)),
                ('planned_quantity', models.DecimalField(db_column='planned_quantity',
                                                         decimal_places=4, default=0,
                                                         max_digits=14)),
                ('actual_quantity', models.DecimalField(db_column='actual_quantity',
                                                        decimal_places=4, default=0,
                                                        max_digits=14)),
                ('start_time', models.DateTimeField(blank=True, db_column='start_time', null=True)),
                ('end_time', models.DateTimeField(blank=True, db_column='end_time', null=True)),
                ('status', models.CharField(
                    choices=[('Pending', 'Pending'), ('Running', 'Running'),
                             ('Paused', 'Paused'), ('Completed', 'Completed'),
                             ('Cancelled', 'Cancelled')],
                    db_column='status', default='Pending', max_length=20)),
                ('notes', models.TextField(blank=True, db_column='notes', default='')),
                ('production_order_id', models.ForeignKey(
                    blank=True, db_column='production_order_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='batches', to='manufacturing.productionorder')),
                ('product_id', models.ForeignKey(
                    db_column='product_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='production_batches', to='master_data.product')),
                ('production_line_id', models.ForeignKey(
                    blank=True, db_column='production_line_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to='master_data.productionline')),
                ('operator_id', models.ForeignKey(
                    blank=True, db_column='operator_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'production_batches', 'ordering': ['-start_time']},
        ),
        migrations.AddIndex(
            model_name='productionbatch',
            index=models.Index(fields=['batch_number'], name='mfg_pb_batch_number_idx'),
        ),
        migrations.AddIndex(
            model_name='productionbatch',
            index=models.Index(fields=['product_id', 'status'], name='mfg_pb_product_status_idx'),
        ),

        # ── BatchStageLog ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='BatchStageLog',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='stage_log_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('start_time', models.DateTimeField(blank=True, db_column='start_time', null=True)),
                ('end_time', models.DateTimeField(blank=True, db_column='end_time', null=True)),
                ('input_quantity', models.DecimalField(db_column='input_quantity',
                                                       decimal_places=4, default=0,
                                                       max_digits=14)),
                ('output_quantity', models.DecimalField(db_column='output_quantity',
                                                        decimal_places=4, default=0,
                                                        max_digits=14)),
                ('waste_quantity', models.DecimalField(db_column='waste_quantity',
                                                       decimal_places=4, default=0,
                                                       max_digits=14)),
                ('temperature_celsius', models.DecimalField(blank=True,
                                                            db_column='temperature_celsius',
                                                            decimal_places=2, max_digits=6,
                                                            null=True)),
                ('remarks', models.TextField(blank=True, db_column='remarks', default='')),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='stage_logs', to='manufacturing.productionbatch')),
                ('stage_id', models.ForeignKey(
                    db_column='stage_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='batch_logs', to='manufacturing.productionstage')),
                ('machine_id', models.ForeignKey(
                    blank=True, db_column='machine_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to='master_data.machine')),
                ('operator_id', models.ForeignKey(
                    blank=True, db_column='operator_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='stage_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'batch_stage_logs',
                'ordering': ['stage_id__sequence_number'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='batchstagelog',
            unique_together={('batch_id', 'stage_id')},
        ),
        migrations.AddIndex(
            model_name='batchstagelog',
            index=models.Index(fields=['batch_id', 'stage_id'], name='mfg_bsl_batch_stage_idx'),
        ),

        # ── MaterialReservation ────────────────────────────────────────────────
        migrations.CreateModel(
            name='MaterialReservation',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='reservation_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('reserved_quantity', models.DecimalField(db_column='reserved_quantity',
                                                          decimal_places=4, max_digits=14)),
                ('status', models.CharField(
                    choices=[('Reserved', 'Reserved'), ('Issued', 'Issued'),
                             ('Cancelled', 'Cancelled')],
                    db_column='status', default='Reserved', max_length=20)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='material_reservations', to='manufacturing.productionbatch')),
                ('material_id', models.ForeignKey(
                    db_column='material_id', on_delete=django.db.models.deletion.CASCADE,
                    to='master_data.rawmaterial')),
                ('warehouse_id', models.ForeignKey(
                    db_column='warehouse_id', on_delete=django.db.models.deletion.CASCADE,
                    to='master_data.warehouse')),
            ],
            options={'db_table': 'material_reservations'},
        ),
        migrations.AddIndex(
            model_name='materialreservation',
            index=models.Index(fields=['batch_id', 'material_id'],
                               name='mfg_mr_batch_material_idx'),
        ),

        # ── MaterialIssue ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='MaterialIssue',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='issue_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('quantity_issued', models.DecimalField(db_column='quantity_issued',
                                                        decimal_places=4, max_digits=14)),
                ('issued_time', models.DateTimeField(db_column='issued_time',
                                                     default=django.utils.timezone.now)),
                ('unit_of_measure', models.CharField(blank=True, db_column='unit_of_measure',
                                                     default='', max_length=50)),
                ('unit_cost', models.DecimalField(db_column='unit_cost', decimal_places=4,
                                                  default=0, max_digits=14)),
                ('total_cost', models.DecimalField(db_column='total_cost', decimal_places=4,
                                                   default=0, max_digits=16)),
                ('raw_material_batch', models.CharField(blank=True, db_column='raw_material_batch',
                                                        default='', max_length=100)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='material_issues', to='manufacturing.productionbatch')),
                ('material_id', models.ForeignKey(
                    db_column='material_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='material_issues', to='master_data.rawmaterial')),
                ('warehouse_id', models.ForeignKey(
                    blank=True, db_column='warehouse_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to='master_data.warehouse')),
                ('issued_by', models.ForeignKey(
                    blank=True, db_column='issued_by', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='material_issues', to=settings.AUTH_USER_MODEL)),
                ('supplier_id', models.ForeignKey(
                    blank=True, db_column='supplier_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to='master_data.supplier')),
            ],
            options={'db_table': 'material_issues', 'ordering': ['issued_time']},
        ),
        migrations.AddIndex(
            model_name='materialissue',
            index=models.Index(fields=['batch_id', 'material_id'],
                               name='mfg_mi_batch_material_idx'),
        ),

        # ── MaterialConsumption ────────────────────────────────────────────────
        migrations.CreateModel(
            name='MaterialConsumption',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='consumption_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('actual_quantity_used', models.DecimalField(db_column='actual_quantity_used',
                                                             decimal_places=4, max_digits=14)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='consumptions', to='manufacturing.productionbatch')),
                ('material_id', models.ForeignKey(
                    db_column='material_id', on_delete=django.db.models.deletion.CASCADE,
                    to='master_data.rawmaterial')),
                ('stage_id', models.ForeignKey(
                    blank=True, db_column='stage_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to='manufacturing.productionstage')),
                ('recorded_by', models.ForeignKey(
                    blank=True, db_column='recorded_by', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'material_consumption'},
        ),
        migrations.AddIndex(
            model_name='materialconsumption',
            index=models.Index(fields=['batch_id', 'material_id'],
                               name='mfg_mc_batch_material_idx'),
        ),

        # ── ProductionYield (new table, replaces production_yields) ────────────
        migrations.CreateModel(
            name='ProductionYield',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='yield_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('input_qty', models.DecimalField(db_column='input_qty', decimal_places=4,
                                                  default=0, max_digits=14)),
                ('output_qty', models.DecimalField(db_column='output_qty', decimal_places=4,
                                                   default=0, max_digits=14)),
                ('yield_percent', models.DecimalField(db_column='yield_percent', decimal_places=2,
                                                      default=0, max_digits=6)),
                ('unit_of_measure', models.CharField(blank=True, db_column='unit_of_measure',
                                                     default='', max_length=50)),
                ('recorded_at', models.DateTimeField(blank=True, db_column='recorded_at',
                                                     null=True)),
                ('qc_approved', models.BooleanField(db_column='qc_approved', default=False)),
                ('notes', models.TextField(blank=True, db_column='notes', default='')),
                ('batch_id', models.OneToOneField(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='yield_record', to='manufacturing.productionbatch')),
                ('recorded_by', models.ForeignKey(
                    blank=True, db_column='recorded_by', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'production_yield'},
        ),

        # ── ProductionWaste ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='ProductionWaste',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='waste_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('waste_type', models.CharField(
                    choices=[('Frying Loss', 'Frying Loss'), ('Burnt', 'Burnt'),
                             ('Spillage', 'Spillage'), ('Packing Rejection', 'Packing Rejection')],
                    db_column='waste_type', max_length=50)),
                ('quantity', models.DecimalField(db_column='quantity', decimal_places=4,
                                                 max_digits=14)),
                ('reason', models.TextField(blank=True, db_column='reason', default='')),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='waste_records', to='manufacturing.productionbatch')),
                ('stage_id', models.ForeignKey(
                    blank=True, db_column='stage_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to='manufacturing.productionstage')),
                ('material_id', models.ForeignKey(
                    blank=True, db_column='material_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to='master_data.rawmaterial')),
            ],
            options={'db_table': 'production_waste'},
        ),
        migrations.AddIndex(
            model_name='productionwaste',
            index=models.Index(fields=['batch_id', 'waste_type'], name='mfg_pw_batch_type_idx'),
        ),

        # ── OilConsumptionLog ──────────────────────────────────────────────────
        migrations.CreateModel(
            name='OilConsumptionLog',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='oil_log_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('quantity_added', models.DecimalField(db_column='quantity_added',
                                                       decimal_places=4, default=0,
                                                       max_digits=12)),
                ('quantity_remaining', models.DecimalField(db_column='quantity_remaining',
                                                           decimal_places=4, default=0,
                                                           max_digits=12)),
                ('timestamp', models.DateTimeField(db_column='timestamp',
                                                   default=django.utils.timezone.now)),
                ('unit_of_measure', models.CharField(db_column='unit_of_measure', default='kg',
                                                     max_length=20)),
                ('unit_cost', models.DecimalField(db_column='unit_cost', decimal_places=4,
                                                  default=0, max_digits=14)),
                ('total_cost', models.DecimalField(db_column='total_cost', decimal_places=4,
                                                   default=0, max_digits=16)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='oil_logs', to='manufacturing.productionbatch')),
                ('oil_material_id', models.ForeignKey(
                    blank=True, db_column='oil_material_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to='master_data.rawmaterial')),
                ('operator_id', models.ForeignKey(
                    blank=True, db_column='operator_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='oil_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'oil_consumption_logs', 'ordering': ['timestamp']},
        ),
        migrations.AddIndex(
            model_name='oilconsumptionlog',
            index=models.Index(fields=['batch_id'], name='mfg_ocl_batch_idx'),
        ),

        # ── MachineLog ─────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='MachineLog',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='machine_log_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('start_time', models.DateTimeField(blank=True, db_column='start_time', null=True)),
                ('end_time', models.DateTimeField(blank=True, db_column='end_time', null=True)),
                ('runtime_minutes', models.PositiveIntegerField(db_column='runtime_minutes',
                                                                default=0)),
                ('downtime_minutes', models.PositiveIntegerField(db_column='downtime_minutes',
                                                                 default=0)),
                ('downtime_reason', models.TextField(blank=True, db_column='downtime_reason',
                                                     default='')),
                ('machine_id', models.ForeignKey(
                    db_column='machine_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='machine_logs', to='master_data.machine')),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='machine_logs', to='manufacturing.productionbatch')),
            ],
            options={'db_table': 'machine_logs'},
        ),
        migrations.AddIndex(
            model_name='machinelog',
            index=models.Index(fields=['machine_id', 'batch_id'], name='mfg_ml_machine_batch_idx'),
        ),

        # ── PackingLog ─────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='PackingLog',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='packing_log_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('packing_machine', models.CharField(db_column='packing_machine', max_length=100)),
                ('packs_produced', models.PositiveIntegerField(db_column='packs_produced',
                                                               default=0)),
                ('rejected_packs', models.PositiveIntegerField(db_column='rejected_packs',
                                                               default=0)),
                ('timestamp', models.DateTimeField(db_column='timestamp',
                                                   default=django.utils.timezone.now)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='packing_logs', to='manufacturing.productionbatch')),
                ('operator_id', models.ForeignKey(
                    blank=True, db_column='operator_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='packing_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'packing_logs'},
        ),
        migrations.AddIndex(
            model_name='packinglog',
            index=models.Index(fields=['batch_id'], name='mfg_pl_batch_idx'),
        ),

        # ── ProductionOutput ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='ProductionOutput',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='output_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('quantity_produced', models.DecimalField(db_column='quantity_produced',
                                                          decimal_places=4, max_digits=14)),
                ('batch_number', models.CharField(db_column='batch_number', max_length=100)),
                ('quality_status', models.CharField(
                    choices=[('Pending', 'Pending'), ('Approved', 'Approved'),
                             ('Rejected', 'Rejected')],
                    db_column='quality_status', default='Pending', max_length=20)),
                ('batch_id', models.ForeignKey(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='outputs', to='manufacturing.productionbatch')),
                ('product_id', models.ForeignKey(
                    db_column='product_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='production_outputs', to='master_data.product')),
                ('warehouse_id', models.ForeignKey(
                    db_column='warehouse_id', on_delete=django.db.models.deletion.CASCADE,
                    to='master_data.warehouse')),
            ],
            options={'db_table': 'production_output'},
        ),
        migrations.AddIndex(
            model_name='productionoutput',
            index=models.Index(fields=['batch_id', 'quality_status'],
                               name='mfg_po_batch_quality_idx'),
        ),

        # ── BatchCostSummary (re-created against new ProductionBatch) ──────────
        migrations.CreateModel(
            name='BatchCostSummary',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(db_column='cost_summary_id', default=uuid.uuid4,
                                        editable=False, primary_key=True, serialize=False)),
                ('material_cost', models.DecimalField(db_column='material_cost', decimal_places=4,
                                                      default=0, max_digits=16)),
                ('oil_cost', models.DecimalField(db_column='oil_cost', decimal_places=4,
                                                 default=0, max_digits=16)),
                ('labour_cost', models.DecimalField(db_column='labour_cost', decimal_places=4,
                                                    default=0, max_digits=16)),
                ('overhead_cost', models.DecimalField(db_column='overhead_cost', decimal_places=4,
                                                      default=0, max_digits=16)),
                ('packaging_cost', models.DecimalField(db_column='packaging_cost', decimal_places=4,
                                                       default=0, max_digits=16)),
                ('total_cost', models.DecimalField(db_column='total_cost', decimal_places=4,
                                                   default=0, max_digits=18)),
                ('cost_per_unit', models.DecimalField(db_column='cost_per_unit', decimal_places=4,
                                                      default=0, max_digits=14)),
                ('currency', models.CharField(db_column='currency', default='PKR', max_length=10)),
                ('calculated_at', models.DateTimeField(blank=True, db_column='calculated_at',
                                                       null=True)),
                ('notes', models.TextField(blank=True, db_column='notes', default='')),
                ('batch_id', models.OneToOneField(
                    db_column='batch_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='cost_summary', to='manufacturing.productionbatch')),
                ('calculated_by', models.ForeignKey(
                    blank=True, db_column='calculated_by', null=True,
                    on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'batch_cost_summaries'},
        ),
    ]
