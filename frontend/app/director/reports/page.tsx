'use client'

import { useAuth } from '@/hooks/useAuth'

export default function StrategicReports() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Strategic Reports</h1>
        <p className="text-gray-600">Business intelligence and analytics</p>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-teal-900 mb-2">Strategic Reports Features</h3>
        <ul className="text-teal-800 space-y-1">
          <li>• Market analysis and trends</li>
          <li>• Financial forecasting</li>
          <li>• Performance benchmarking</li>
          <li>• Strategic planning reports</li>
          <li>• Competitive analysis</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the strategic reports interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
