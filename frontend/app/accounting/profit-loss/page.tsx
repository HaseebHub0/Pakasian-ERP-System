'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfitLoss() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: 'monthly'
  });

  useEffect(() => {
    if (user && user.role === 'accountant') {
      fetchProfitLossData();
    }
  }, [user, filters]);

  const fetchProfitLossData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        period: filters.period
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/profit-loss?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching profit loss data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitMargin = () => {
    if (!reportData || reportData.total_sales === 0) return 0;
    return ((reportData.net_profit / reportData.total_sales) * 100).toFixed(2);
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
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-black">Profit & Loss Report</h1>
              <p className="text-gray-600 text-lg">Financial analysis and profit calculations</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/accounting"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/accounting/profit-loss/charts"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold border-2 border-blue-700"
              >
                View Charts
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Period
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({...filters, period: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-lg text-gray-600">Loading financial data...</p>
          </div>
        ) : reportData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border-2 border-green-500 rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Total Sales</h3>
                <p className="text-3xl font-bold text-green-600">${reportData.total_sales?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">Revenue</p>
              </div>

              <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Total Purchases</h3>
                <p className="text-3xl font-bold text-red-600">${reportData.total_purchases?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">Cost of Goods</p>
              </div>

              <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Net Profit</h3>
                <p className={`text-3xl font-bold ${(reportData.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${reportData.net_profit?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Profit/Loss</p>
              </div>

              <div className="bg-white border-2 border-gray-500 rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Profit Margin</h3>
                <p className={`text-3xl font-bold ${parseFloat(calculateProfitMargin()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateProfitMargin()}%
                </p>
                <p className="text-sm text-gray-600">Margin</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold text-black mb-6 text-center">Financial Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-black mb-4">Revenue Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                      <span className="font-bold text-black">Total Sales Revenue</span>
                      <span className="text-green-600 font-bold text-lg">${reportData.total_sales?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <span className="font-bold text-black">Number of Sales</span>
                      <span className="text-blue-600 font-bold text-lg">{reportData.sales_count || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold text-black">Average Sale Value</span>
                      <span className="text-gray-600 font-bold text-lg">
                        ${reportData.sales_count > 0 ? (reportData.total_sales / reportData.sales_count).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-black mb-4">Cost Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                      <span className="font-bold text-black">Total Purchase Costs</span>
                      <span className="text-red-600 font-bold text-lg">${reportData.total_purchases?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                      <span className="font-bold text-black">Number of Purchases</span>
                      <span className="text-orange-600 font-bold text-lg">{reportData.purchases_count || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold text-black">Average Purchase Value</span>
                      <span className="text-gray-600 font-bold text-lg">
                        ${reportData.purchases_count > 0 ? (reportData.total_purchases / reportData.purchases_count).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-100 border-2 border-gray-400 rounded-lg">
                <h4 className="text-xl font-bold text-black mb-4 text-center">Profit & Loss Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-black mb-2">Period</p>
                    <p className="text-gray-600">
                      {new Date(filters.start_date).toLocaleDateString()} - {new Date(filters.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-black mb-2">Net Profit</p>
                    <p className={`text-2xl font-bold ${(reportData.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${reportData.net_profit?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-black mb-2">Profit Margin</p>
                    <p className={`text-2xl font-bold ${parseFloat(calculateProfitMargin()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateProfitMargin()}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-2">No data available</h3>
            <p className="text-gray-600 text-lg">No financial data found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
