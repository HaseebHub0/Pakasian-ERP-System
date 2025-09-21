'use client'

import { useAuth } from '@/hooks/useAuth'

export default function ProductsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600">Manage product catalog and inventory</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Product Management Features</h3>
        <ul className="text-green-800 space-y-1">
          <li>• Add new products to catalog</li>
          <li>• Edit product information and pricing</li>
          <li>• Manage product categories</li>
          <li>• Track inventory levels</li>
          <li>• Set up product variants and SKUs</li>
        </ul>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            This page will contain the product management interface. 
            Currently logged in as: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
          </div>
    </div>
  )
}
