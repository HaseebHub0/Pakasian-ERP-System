
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from apps.core.models import BaseModel


class Role(BaseModel):
    role_name = models.CharField(
        max_length=100, unique=True, db_column='role_name')
    permissions = models.TextField(blank=True, db_column='permissions')
    description = models.CharField(
        max_length=255, blank=True, db_column='description')

    class Meta:
        db_table = 'roles'


class Permission(BaseModel):
    module = models.CharField(max_length=100, db_column='module')
    action = models.CharField(max_length=100, db_column='action')
    description = models.CharField(max_length=255, db_column='description')

    class Meta:
        db_table = 'permissions'


class RolePermission(models.Model):
    role_id = models.ForeignKey(
        Role, on_delete=models.CASCADE, db_column='role_id')
    permission_id = models.ForeignKey(
        Permission, on_delete=models.CASCADE, db_column='permission_id')

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role_id', 'permission_id')


class SystemUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field must be set")
        user = self.model(username=username, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user


class SystemUser(AbstractBaseUser, BaseModel):
    username = models.CharField(
        max_length=150, unique=True, db_column='username')
    password = models.CharField(max_length=128, db_column='password_hash')
    role_id = models.ForeignKey(
        Role, on_delete=models.PROTECT, db_column='role_id', null=True)
    is_active = models.BooleanField(default=True, db_column='is_active')

    objects = SystemUserManager()

    USERNAME_FIELD = 'username'

    class Meta:
        db_table = 'system_users'




class ApiToken(BaseModel):
    user_id = models.ForeignKey(
        SystemUser, on_delete=models.CASCADE, db_column='user_id')
    token = models.TextField(unique=True, db_column='token')
    expiry_time = models.DateTimeField(db_column='expiry_time')

    class Meta:
        db_table = 'api_tokens'
