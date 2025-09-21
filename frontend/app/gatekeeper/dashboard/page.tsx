'use client'

import { useAuth } from '@/hooks/useAuth'

export default function GatekeeperDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Gate Control</h1>
        <p className="text-gray-600">Control access to warehouse facilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900">Active Trucks</h3>
          <p className="text-2xl font-bold text-red-700">12</p>
          <p className="text-sm text-red-600">Currently on site</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900">Completed Today</h3>
          <p className="text-2xl font-bold text-green-700">28</p>
          <p className="text-sm text-green-600">Trucks processed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">Waiting Queue</h3>
          <p className="text-2xl font-bold text-blue-700">5</p>
          <p className="text-sm text-blue-600">Trucks waiting</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Warehouse Gate Features</h3>
        <ul className="text-red-800 space-y-1">
          <li>• Monitor incoming/outgoing vehicles</li>
          <li>• Track truck movements and timing</li>
          <li>• Manage gate access permissions</li>
          <li>• Generate gate pass reports</li>
          <li>• Control warehouse security</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the warehouse gate control interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
