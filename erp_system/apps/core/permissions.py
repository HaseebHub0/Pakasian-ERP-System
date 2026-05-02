from rest_framework.permissions import BasePermission

# ── Role hierarchy ────────────────────────────────────────────────────────────
# Higher number = more authority.  All comparisons are case-insensitive.
ROLE_LEVELS = {
    'admin': 100,
    'procurement manager': 80,
    'finance manager': 75,
    'warehouse manager': 65,
    'sales manager': 65,
    'procurement officer': 40,
    'sales officer': 40,
    'viewer': 10,
}


def _user_level(user) -> int:
    """Return the numeric authority level for request.user (0 = unauthenticated / no role)."""
    if not user or not user.is_authenticated:
        return 0
    role = getattr(user, 'role_id', None)
    if role is None:
        return 0
    return ROLE_LEVELS.get(role.role_name.lower(), 0)


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


# ── Convenience role-level permission classes ─────────────────────────────────
# These work without any Permission / RolePermission rows in the DB.
# They simply compare the user's role_name against the ROLE_LEVELS hierarchy.

class CanApproveProcurement(BasePermission):
    """Procurement Manager (level 80+) or Admin can approve/reject PRs and POs."""
    message = "Only Procurement Managers or Admins can approve procurement documents."

    def has_permission(self, request, view):
        return _user_level(request.user) >= ROLE_LEVELS['procurement manager']


class CanMarkPaid(BasePermission):
    """Finance Manager (level 75+) or Admin can mark invoices as paid."""
    message = "Only Finance Managers or Admins can mark invoices as paid."

    def has_permission(self, request, view):
        return _user_level(request.user) >= ROLE_LEVELS['finance manager']


class CanManageWarehouse(BasePermission):
    """Warehouse Manager (level 65+) can confirm GRNs and manage batches."""
    message = "Only Warehouse Managers or above can perform this action."

    def has_permission(self, request, view):
        return _user_level(request.user) >= ROLE_LEVELS['warehouse manager']
