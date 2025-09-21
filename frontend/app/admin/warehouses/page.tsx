'use client'

import { useAuth } from '@/hooks/useAuth'

export default function WarehousesPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
        <p className="text-gray-600">Manage warehouse locations and settings</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Warehouse Management Features</h3>
        <ul className="text-purple-800 space-y-1">
          <li>• Add new warehouse locations</li>
          <li>• Configure warehouse settings</li>
          <li>• Manage storage zones and sections</li>
          <li>• Set up warehouse access controls</li>
          <li>• Monitor warehouse capacity</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the warehouse management interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
