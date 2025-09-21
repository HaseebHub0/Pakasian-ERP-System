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
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="bg-indigo-600 text-white px-3 py-2 rounded-lg mr-3">
              <span className="font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Pakasian ERP System
              </h1>
              <span className="text-xs text-gray-500">
                Snacks Manufacturing
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
              Home
            </Link>
            
            {!user ? (
              <>
                <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                  Login
                </Link>
              </>
            ) : (
              <>
                {/* Admin Only */}
                <AdminOnly>
                  <Link href="/admin/users" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Users
                  </Link>
                  <Link href="/admin/products" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Products
                  </Link>
                  <Link href="/admin/warehouses" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Warehouses
                  </Link>
                  <Link href="/admin/audit-logs" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Audit Logs
                  </Link>
                </AdminOnly>

                {/* Director Only */}
                <DirectorOnly>
                  <Link href="/director/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Executive Dashboard
                  </Link>
                  <Link href="/director/reports" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Strategic Reports
                  </Link>
                </DirectorOnly>

                {/* Accountant Only */}
                <AccountantOnly>
                  <Link href="/accounting/reports" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Financial Reports
                  </Link>
                  <Link href="/accounting/invoices" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Invoices
                  </Link>
                  <Link href="/accounting/sales" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Sales
                  </Link>
                  <Link href="/accounting/purchases" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Purchases
                  </Link>
                </AccountantOnly>

                {/* Gatekeeper Only */}
                <GatekeeperOnly>
                  <Link href="/gatekeeper/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Warehouse Gate
                  </Link>
                  <Link href="/gatekeeper/movements" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Stock Movements
                  </Link>
                  <Link href="/gatekeeper/trucks" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Truck Management
                  </Link>
                </GatekeeperOnly>

                {/* Shared Access */}
                <ReadOnlyAccess>
                  <Link href="/products" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Products
                  </Link>
                  <Link href="/warehouses" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    Warehouses
                  </Link>
                </ReadOnlyAccess>

                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm text-gray-700 font-medium">
                      {user.name} ({user.role})
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
