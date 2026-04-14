import uuid
from django.db import models

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class AuditLog(models.Model):
    audit_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(null=True, blank=True)
    action = models.CharField(max_length=20)
    entity_type = models.CharField(max_length=100)
    entity_id = models.UUIDField()
    timestamp = models.DateTimeField(auto_now_add=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'audit_logs'

class BackgroundJob(BaseModel):
    name = models.CharField(max_length=100)
    payload = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Pending')
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'background_jobs'
