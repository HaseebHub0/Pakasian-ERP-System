'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountingDashboard() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState({
    totalSales: 0,
    totalPurchases: 0,
    netProfit: 0,
    currentStockValue: 0,
    monthlySales: 0,
    monthlyPurchases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'accountant') {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'accountant') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need accountant privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-4">
              Accounting Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Welcome, <span className="font-bold text-blue-600">{user?.name}</span>! 
              Manage your financial operations and reporting.
            </p>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-green-600">{loading ? '...' : `$${financialData.totalSales.toLocaleString()}`}</p>
            <p className="text-sm text-gray-600">All Time Revenue</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Total Purchases</h3>
            <p className="text-3xl font-bold text-red-600">{loading ? '...' : `$${financialData.totalPurchases.toLocaleString()}`}</p>
            <p className="text-sm text-gray-600">All Time Expenses</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Net Profit</h3>
            <p className={`text-3xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? '...' : `$${financialData.netProfit.toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-600">Sales - Purchases</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Stock Value</h3>
            <p className="text-3xl font-bold text-gray-600">{loading ? '...' : `$${financialData.currentStockValue.toLocaleString()}`}</p>
            <p className="text-sm text-gray-600">Current Inventory</p>
          </div>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchases Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 border-2 border-red-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Purchases</h2>
                <p className="text-gray-600">Manage raw material purchases and supplier invoices</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/accounting/purchases" className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-bold text-center border-2 border-red-700">
                  View All Purchases
                </Link>
                <Link href="/accounting/purchases/create" className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
                  Add Purchase
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Record supplier invoices and raw material purchases</li>
                <li>• Track purchase costs and quantities</li>
                <li>• Link purchases to stock-in movements</li>
                <li>• Manage supplier relationships</li>
              </ul>
            </div>
          </div>

          {/* Sales Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 border-2 border-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Sales</h2>
                <p className="text-gray-600">Manage finished goods sales and customer invoices</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/accounting/sales" className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
                  View All Sales
                </Link>
                <Link href="/accounting/sales/create" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  Add Sale
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Record customer invoices and finished goods sales</li>
                <li>• Track sales revenue and quantities</li>
                <li>• Link sales to stock-out movements</li>
                <li>• Manage customer relationships</li>
              </ul>
            </div>
          </div>

          {/* Profit & Loss Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 border-2 border-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Profit & Loss</h2>
                <p className="text-gray-600">Financial reports and profit analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/accounting/profit-loss" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  View P&L Report
                </Link>
                <Link href="/accounting/profit-loss/charts" className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
                  View Charts
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Calculate total sales minus total purchases</li>
                <li>• Period-based profit analysis</li>
                <li>• Interactive charts and visualizations</li>
                <li>• Export financial reports</li>
              </ul>
            </div>
          </div>

          {/* Stock Valuation Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 border-2 border-gray-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Stock Valuation</h2>
                <p className="text-gray-600">Current inventory value using weighted average method</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/accounting/stock-valuation" className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
                  View Valuation
                </Link>
                <Link href="/accounting/stock-valuation/details" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  Detailed Report
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Weighted average cost calculation</li>
                <li>• Current stock value assessment</li>
                <li>• Product-wise valuation breakdown</li>
                <li>• Cost tracking and analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/accounting/purchases/create" className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 font-bold text-center border-2 border-red-700">
              Add Purchase
            </Link>
            <Link href="/accounting/sales/create" className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
              Add Sale
            </Link>
            <Link href="/accounting/profit-loss" className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
              View P&L
            </Link>
            <Link href="/accounting/stock-valuation" className="bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
              Stock Value
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}