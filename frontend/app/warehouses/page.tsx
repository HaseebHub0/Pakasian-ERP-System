'use client'

import { useAuth } from '@/hooks/useAuth'

export default function WarehousesPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <p className="text-gray-600">View warehouse locations and information</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Warehouse Information</h3>
        <ul className="text-purple-800 space-y-1">
          <li>• View warehouse locations</li>
          <li>• Check warehouse capacity</li>
          <li>• Monitor storage zones</li>
          <li>• View warehouse status</li>
          <li>• Track inventory by location</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page provides read-only access to warehouse information. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
