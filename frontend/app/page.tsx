'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Redirect users to their role-specific dashboard
  useEffect(() => {
    if (user && !isLoading) {
      switch (user.role) {
        case 'admin':
          router.push('/admin')
          break
        case 'accountant':
          router.push('/accounting')
          break
        case 'gatekeeper':
          router.push('/gatekeeper')
          break
        case 'director':
          router.push('/director')
          break
        default:
          // Stay on general dashboard for unknown roles
          break
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Pakasian ERP System
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please log in to continue
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Pakasian ERP System
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            You are logged in as: <span className="font-semibold text-indigo-600">{user.role}</span>
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {user.role === 'admin' && (
            <>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">User Management</h3>
                <p className="text-blue-700 text-sm">Manage system users and permissions</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Products</h3>
                <p className="text-green-700 text-sm">Manage product catalog and inventory</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Warehouses</h3>
                <p className="text-purple-700 text-sm">Manage warehouse locations and settings</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Audit Logs</h3>
                <p className="text-orange-700 text-sm">View system activity and security logs</p>
              </div>
            </>
          )}
          
          {user.role === 'director' && (
            <>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Executive Dashboard</h3>
                <p className="text-indigo-700 text-sm">High-level business metrics and KPIs</p>
              </div>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-teal-900 mb-2">Strategic Reports</h3>
                <p className="text-teal-700 text-sm">Business intelligence and analytics</p>
              </div>
            </>
          )}
          
          {user.role === 'accountant' && (
            <>
              <div className="bg-emerald-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">Financial Reports</h3>
                <p className="text-emerald-700 text-sm">Financial statements and accounting reports</p>
              </div>
              <div className="bg-cyan-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-900 mb-2">Invoices</h3>
                <p className="text-cyan-700 text-sm">Manage customer and vendor invoices</p>
              </div>
              <div className="bg-lime-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-lime-900 mb-2">Sales</h3>
                <p className="text-lime-700 text-sm">Track sales transactions and revenue</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Purchases</h3>
                <p className="text-amber-700 text-sm">Manage purchase orders and expenses</p>
              </div>
            </>
          )}
          
          {user.role === 'gatekeeper' && (
            <>
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Warehouse Gate</h3>
                <p className="text-red-700 text-sm">Control access to warehouse facilities</p>
              </div>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-pink-900 mb-2">Stock Movements</h3>
                <p className="text-pink-700 text-sm">Track inventory movements and transfers</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-rose-900 mb-2">Truck Management</h3>
                <p className="text-rose-700 text-sm">Manage incoming and outgoing vehicles</p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Use the sidebar navigation to access your role-specific features.</p>
        </div>
      </div>
    </div>
  )
}