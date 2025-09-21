'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r-2 border-black shadow-xl transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <div className="flex items-center">
            <div className="bg-black text-white px-3 py-2 rounded-lg mr-3 border-2 border-gray-700">
              <span className="font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Pakasian ERP</h1>
              <span className="text-xs text-gray-600">Snacks Manufacturing</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-black hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b-2 border-black">
            <div className="flex items-center">
              <div className="bg-gray-100 border-2 border-gray-400 text-black rounded-full w-10 h-10 flex items-center justify-center mr-3">
                <span className="font-bold text-sm">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-bold text-black text-sm">{user.name}</p>
                <p className="text-xs text-gray-600 capitalize font-medium">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
          <div className="px-4 space-y-2">
            {/* Dashboard */}
            <Link
              href={user?.role === 'admin' ? '/admin' : '/'}
              className="flex items-center px-3 py-2 text-black rounded-lg hover:bg-gray-100 transition-colors font-bold"
              onClick={onClose}
            >
              <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            {!user ? (
              <Link
                href="/login"
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={onClose}
              >
                <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
            ) : (
              <>
                {/* Admin Section - Only for Admin role */}
                {user.role === 'admin' && (
                  <div>
                    <button
                      onClick={() => toggleSection('admin')}
                      className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Administration
                      </div>
                      <svg className={`h-4 w-4 transition-transform ${activeSection === 'admin' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeSection === 'admin' && (
                      <div className="ml-6 mt-2 space-y-1">
                        <Link href="/admin/users" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Users
                        </Link>
                        <Link href="/admin/products" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Products
                        </Link>
                        <Link href="/admin/warehouses" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Warehouses
                        </Link>
                        <Link href="/admin/audit-logs" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Audit Logs
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Director Section - Only for Director role */}
                {user.role === 'director' && (
                  <div>
                    <button
                      onClick={() => toggleSection('director')}
                      className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Executive
                      </div>
                      <svg className={`h-4 w-4 transition-transform ${activeSection === 'director' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeSection === 'director' && (
                      <div className="ml-6 mt-2 space-y-1">
                        <Link href="/director/dashboard" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Dashboard
                        </Link>
                        <Link href="/director/reports" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Strategic Reports
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Accountant Section - Only for Accountant role */}
                {user.role === 'accountant' && (
                  <div>
                    <button
                      onClick={() => toggleSection('accounting')}
                      className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Finance
                      </div>
                      <svg className={`h-4 w-4 transition-transform ${activeSection === 'accounting' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeSection === 'accounting' && (
                      <div className="ml-6 mt-2 space-y-1">
                        <Link href="/accounting/reports" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Financial Reports
                        </Link>
                        <Link href="/accounting/invoices" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Invoices
                        </Link>
                        <Link href="/accounting/sales" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Sales
                        </Link>
                        <Link href="/accounting/purchases" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Purchases
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Gatekeeper Section - Only for Gatekeeper role */}
                {user.role === 'gatekeeper' && (
                  <div>
                    <button
                      onClick={() => toggleSection('gatekeeper')}
                      className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Warehouse
                      </div>
                      <svg className={`h-4 w-4 transition-transform ${activeSection === 'gatekeeper' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeSection === 'gatekeeper' && (
                      <div className="ml-6 mt-2 space-y-1">
                        <Link href="/gatekeeper" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Dashboard
                        </Link>
                        <Link href="/gatekeeper/gate" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Warehouse Gate
                        </Link>
                        <Link href="/gatekeeper/movements" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Stock Movements
                        </Link>
                        <Link href="/gatekeeper/trucks" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
                          Truck Management
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Shared Access - All roles can see these */}
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                  >
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products
                  </Link>
                  <Link
                    href="/warehouses"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                  >
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Warehouses
                  </Link>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Logout Button */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
