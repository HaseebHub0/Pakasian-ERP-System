'use client'

import { useAuth } from '@/hooks/useAuth'

export default function InvoicesPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600">Manage customer and vendor invoices</p>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-cyan-900 mb-2">Invoice Management Features</h3>
        <ul className="text-cyan-800 space-y-1">
          <li>• Create and send invoices</li>
          <li>• Track payment status</li>
          <li>• Manage recurring invoices</li>
          <li>• Generate invoice reports</li>
          <li>• Handle invoice disputes</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the invoice management interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
