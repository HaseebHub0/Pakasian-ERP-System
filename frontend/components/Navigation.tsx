'use client';

import { useAuth } from '@/hooks/useAuth';
import { AdminOnly, DirectorOnly, AccountantOnly, GatekeeperOnly, ReadOnlyAccess } from './RoleGuard';
import Link from 'next/link';

export function Navigation() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Pakasian ERP System
            </h1>
            <span className="ml-2 text-sm text-gray-500">
              Snacks Manufacturing
            </span>
          </div>
          
          <nav className="flex space-x-8">
            <Link href="/" className="text-gray-500 hover:text-gray-900">
              Home
            </Link>
            
            {!user ? (
              <>
                <Link href="/login" className="text-gray-500 hover:text-gray-900">
                  Login
                </Link>
              </>
            ) : (
              <>
                {/* Admin Only */}
                <AdminOnly>
                  <Link href="/admin/users" className="text-gray-500 hover:text-gray-900">
                    Users
                  </Link>
                  <Link href="/admin/products" className="text-gray-500 hover:text-gray-900">
                    Products
                  </Link>
                  <Link href="/admin/warehouses" className="text-gray-500 hover:text-gray-900">
                    Warehouses
                  </Link>
                </AdminOnly>

                {/* Director Only */}
                <DirectorOnly>
                  <Link href="/director/dashboard" className="text-gray-500 hover:text-gray-900">
                    Executive Dashboard
                  </Link>
                  <Link href="/director/reports" className="text-gray-500 hover:text-gray-900">
                    Strategic Reports
                  </Link>
                </DirectorOnly>

                {/* Accountant Only */}
                <AccountantOnly>
                  <Link href="/accounting/reports" className="text-gray-500 hover:text-gray-900">
                    Financial Reports
                  </Link>
                  <Link href="/accounting/invoices" className="text-gray-500 hover:text-gray-900">
                    Invoices
                  </Link>
                  <Link href="/accounting/sales" className="text-gray-500 hover:text-gray-900">
                    Sales
                  </Link>
                  <Link href="/accounting/purchases" className="text-gray-500 hover:text-gray-900">
                    Purchases
                  </Link>
                </AccountantOnly>

                {/* Gatekeeper Only */}
                <GatekeeperOnly>
                  <Link href="/gatekeeper/dashboard" className="text-gray-500 hover:text-gray-900">
                    Warehouse Gate
                  </Link>
                  <Link href="/gatekeeper/movements" className="text-gray-500 hover:text-gray-900">
                    Stock Movements
                  </Link>
                  <Link href="/gatekeeper/trucks" className="text-gray-500 hover:text-gray-900">
                    Truck Management
                  </Link>
                </GatekeeperOnly>

                {/* Shared Access */}
                <ReadOnlyAccess>
                  <Link href="/products" className="text-gray-500 hover:text-gray-900">
                    Products
                  </Link>
                  <Link href="/warehouses" className="text-gray-500 hover:text-gray-900">
                    Warehouses
                  </Link>
                </ReadOnlyAccess>

                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
