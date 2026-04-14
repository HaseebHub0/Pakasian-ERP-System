from rest_framework import serializers
from .models import SystemUser, Role, Permission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'module', 'action', 'description']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role_name', 'permissions', 'description']

class SystemUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role_id.role_name', read_only=True)
    role_permissions = serializers.SerializerMethodField()

    class Meta:
        model = SystemUser
        fields = ['id', 'username', 'role_name', 'role_permissions', 'is_active']
        
    def get_role_permissions(self, obj):
        if not obj.role_id:
            return []
        
        # Retrieve all permissions linked through the RolePermission M2M table representation
        perms = Permission.objects.filter(rolepermission__role_id=obj.role_id)
        return PermissionSerializer(perms, many=True).data

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
