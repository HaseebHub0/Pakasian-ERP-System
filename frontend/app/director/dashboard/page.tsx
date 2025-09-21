'use client'

import { useAuth } from '@/hooks/useAuth'

export default function DirectorDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-600">High-level business metrics and KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-indigo-900">Revenue</h3>
          <p className="text-2xl font-bold text-indigo-700">PKR 2.5M</p>
          <p className="text-sm text-indigo-600">+12% from last month</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900">Orders</h3>
          <p className="text-2xl font-bold text-green-700">1,247</p>
          <p className="text-sm text-green-600">+8% from last month</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">Inventory</h3>
          <p className="text-2xl font-bold text-blue-700">15,432</p>
          <p className="text-sm text-blue-600">Items in stock</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-900">Efficiency</h3>
          <p className="text-2xl font-bold text-orange-700">94%</p>
          <p className="text-sm text-orange-600">Production efficiency</p>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">Executive Dashboard Features</h3>
        <ul className="text-indigo-800 space-y-1">
          <li>• Real-time business metrics</li>
          <li>• Financial performance indicators</li>
          <li>• Production and sales analytics</li>
          <li>• Strategic planning tools</li>
          <li>• Executive reports and summaries</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the executive dashboard interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
