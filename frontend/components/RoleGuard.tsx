'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Specific role components for easier use
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function DirectorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'director']} fallback={fallback}>{children}</RoleGuard>;
}

export function AccountantOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'accountant']} fallback={fallback}>{children}</RoleGuard>;
}

export function GatekeeperOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'gatekeeper']} fallback={fallback}>{children}</RoleGuard>;
}

export function ReadOnlyAccess({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'director', 'accountant', 'gatekeeper']} fallback={fallback}>{children}</RoleGuard>;
}
