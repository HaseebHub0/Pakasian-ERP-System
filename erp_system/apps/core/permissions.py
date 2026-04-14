from rest_framework.permissions import BasePermission


class HasModulePermission(BasePermission):
    """Check role-based module+action permission via the RolePermission M2M table."""

    def __init__(self, module, action):
        self.module = module
        self.action = action

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            role = request.user.role_id  # ForeignKey to Role
            if role is None:
                return False
            return role.rolepermission_set.filter(
                permission_id__module=self.module,
                permission_id__action=self.action,
            ).exists()
        except AttributeError:
            return False


def require_permission(module, action):
    """Factory that returns a DRF-compatible permission class for a module+action pair."""
    class PermissionClass(HasModulePermission):
        def __init__(self):
            super().__init__(module, action)
    return PermissionClass
