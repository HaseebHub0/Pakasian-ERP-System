'use client'

import { useAuth } from '@/hooks/useAuth'

export default function FinancialReports() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600">Financial statements and accounting reports</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-emerald-900 mb-2">Financial Reports Features</h3>
        <ul className="text-emerald-800 space-y-1">
          <li>• Profit & Loss statements</li>
          <li>• Balance sheets</li>
          <li>• Cash flow reports</li>
          <li>• Budget vs actual analysis</li>
          <li>• Tax reports and compliance</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the financial reports interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
