import { useAuthStore } from '@/store/useAuthStore';

/**
 * Returns role-based capability flags derived from the logged-in user's role.
 * Roles are stored as lowercase strings in the auth store (e.g. "admin",
 * "procurement manager", "finance manager", "warehouse manager").
 */
export function useRole() {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role ?? '').toLowerCase();

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    /** Can approve / reject Purchase Requisitions and Purchase Orders */
    canApproveProcurement: isAdmin || role === 'procurement manager',
    /** Can mark Accounts Payable invoices as paid */
    canMarkPaid: isAdmin || role === 'finance manager',
    /** Can confirm GRNs and manage warehouse batches */
    canManageWarehouse: isAdmin || role === 'warehouse manager',
  };
}
