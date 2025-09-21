'use client';

import { AccountantOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

export default function AccountingDashboard() {
  const { user } = useAuth();

  return (
    <AccountantOnly fallback={<div className="text-center text-red-600">Access Denied - Accountant Only</div>}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accounting Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome, {user?.name}! Manage financial records, sales, purchases, and expenses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-900">₹50M</h3>
              <p className="text-green-700">Total Revenue</p>
              <span className="text-sm text-green-600">This month</span>
            </div>

            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-red-900">₹42M</h3>
              <p className="text-red-700">Total Expenses</p>
              <span className="text-sm text-red-600">This month</span>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-900">₹8M</h3>
              <p className="text-blue-700">Net Profit</p>
              <span className="text-sm text-green-600">16% margin</span>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-900">₹12M</h3>
              <p className="text-purple-700">Gross Profit</p>
              <span className="text-sm text-green-600">24% margin</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Reports</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Balance Sheet</span>
                  <button className="text-blue-600 hover:text-blue-800">Generate</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Income Statement</span>
                  <button className="text-blue-600 hover:text-blue-800">Generate</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Cash Flow Statement</span>
                  <button className="text-blue-600 hover:text-blue-800">Generate</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Profit & Loss Report</span>
                  <button className="text-blue-600 hover:text-blue-800">Generate</button>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Record Sale
                </button>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Record Purchase
                </button>
                <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Record Expense
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Create Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Retail Store Chain</span>
                    <p className="text-sm text-gray-600">Protein Nimko 100g</p>
                  </div>
                  <span className="font-semibold text-green-600">₹15,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">SuperMart Karachi</span>
                    <p className="text-sm text-gray-600">Salted Chips 50g</p>
                  </div>
                  <span className="font-semibold text-green-600">₹22,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Food Distributor</span>
                    <p className="text-sm text-gray-600">Spicy Nimko Mix</p>
                  </div>
                  <span className="font-semibold text-green-600">₹18,000</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Electricity Bill</span>
                    <p className="text-sm text-gray-600">Production Facility</p>
                  </div>
                  <span className="font-semibold text-red-600">₹2,300</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Raw Materials</span>
                    <p className="text-sm text-gray-600">Flour & Spices</p>
                  </div>
                  <span className="font-semibold text-red-600">₹8,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Packaging Materials</span>
                    <p className="text-sm text-gray-600">Foil Bags</p>
                  </div>
                  <span className="font-semibold text-red-600">₹3,200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountantOnly>
  );
}
