import json
from django.db.models.signals import post_save, post_delete
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from django.apps import apps
from apps.core.models import AuditLog
from apps.core.middleware import get_current_user

def audit_log_handler(sender, instance, created=False, **kwargs):
    user = get_current_user()
    user_id = user.id if user and user.is_authenticated else None

    action = 'DELETE' if kwargs.get('signal') == post_delete else ('INSERT' if created else 'UPDATE')
    entity_type = sender._meta.db_table
    entity_id = instance.pk

    try:
        if action == 'DELETE':
            old_value = json.loads(json.dumps(model_to_dict(instance), cls=DjangoJSONEncoder))
            new_value = None
        else:
            new_value = json.loads(json.dumps(model_to_dict(instance), cls=DjangoJSONEncoder))
            old_value = None  # Accurate diffing requires tracking state before save
    except Exception:
        old_value = None
        new_value = None

    AuditLog.objects.create(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value
    )

def register_audit_signals():
    """Register post_save/post_delete audit hooks for models that exist.
    Models from not-yet-built modules are skipped silently via LookupError.
    Add new entries here as each module is implemented.
    """
    models_to_audit = [
        # Core
        ('authentication', 'SystemUser'),
        # Master data — now built
        ('master_data', 'Product'),
        ('master_data', 'Supplier'),
        ('master_data', 'Warehouse'),
        ('master_data', 'RawMaterial'),
        # Procurement
        ('procurement', 'PurchaseRequisition'),
        ('procurement', 'PurchaseOrder'),
        ('procurement', 'GoodsReceipt'),
        ('procurement', 'AccountsPayable'),
        # Finance
        ('finance', 'JournalEntry'),
        # Manufacturing
        ('manufacturing', 'ProductionOrder'),
        # Sales — add when sales module models are built
        # ('sales', 'SalesOrder'),
    ]

    for app_label, model_name in models_to_audit:
        try:
            model = apps.get_model(app_label, model_name)
            post_save.connect(audit_log_handler, sender=model)
            post_delete.connect(audit_log_handler, sender=model)
        except LookupError:
            # Model not yet defined — safe to skip during initial scaffold
            pass
