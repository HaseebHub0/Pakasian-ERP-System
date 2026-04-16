export type Role = 
  | 'admin' 
  | 'production_manager' 
  | 'warehouse_manager' 
  | 'procurement_manager' 
  | 'finance_manager' 
  | 'sales_manager';

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'approve';
  subject: string;
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  production_manager: [
    'dashboard',
    'master-data:products',
    'master-data:machines',
    'manufacturing:*',
    'mrp',
    'sensors:*'
  ],
  warehouse_manager: [
    'dashboard',
    'master-data:warehouses',
    'inventory:*',
    'warehouse:*'
  ],
  procurement_manager: [
    'dashboard',
    'master-data:suppliers',
    'master-data:raw-materials',
    'procurement:*',
    'inventory:stock'
  ],
  finance_manager: [
    'dashboard',
    'finance:*',
    'costing:*'
  ],
  sales_manager: [
    'dashboard',
    'master-data:customers',
    'sales:*',
    'warehouse:dispatch'
  ]
};

export const hasPermission = (userRole: Role, permission: string): boolean => {
  const role = userRole.toLowerCase();
  if (role === 'admin') return true;
  const permissions = ROLE_PERMISSIONS[role as Role] || [];
  
  return permissions.some(p => {
    if (p === '*') return true;
    if (p.endsWith(':*')) {
      const prefix = p.slice(0, -2);
      return permission.startsWith(prefix);
    }
    return p === permission;
  });
};
