'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Reports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    dailyStockSummary: {
      stockIn: 0,
      stockOut: 0,
      netChange: 0
    },
    weeklyStockSummary: {
      stockIn: 0,
      stockOut: 0,
      netChange: 0
    },
    truckSummary: {
      totalEntries: 0,
      currentlyInside: 0,
      averageStayTime: 0
    },
    topProducts: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchReportData();
    }
  }, [user, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/download?period=${selectedPeriod}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `erp-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error downloading report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
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
              <h1 className="text-3xl font-bold text-black">Reports & Analytics</h1>
              <p className="text-gray-600 text-lg">Generate comprehensive reports and analytics</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => handleDownloadReport('pdf')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold border-2 border-red-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Report Period</h3>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-6 py-3 rounded-lg font-bold border-2 ${
                selectedPeriod === 'today'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-gray-100 text-black border-gray-400 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-6 py-3 rounded-lg font-bold border-2 ${
                selectedPeriod === 'week'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-gray-100 text-black border-gray-400 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-6 py-3 rounded-lg font-bold border-2 ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-gray-100 text-black border-gray-400 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Stock Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-6 text-center">Stock Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <span className="text-lg font-bold text-black">Stock In:</span>
                <span className="text-2xl font-bold text-green-600">
                  {loading ? '...' : selectedPeriod === 'today' ? reportData.dailyStockSummary.stockIn : reportData.weeklyStockSummary.stockIn}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <span className="text-lg font-bold text-black">Stock Out:</span>
                <span className="text-2xl font-bold text-red-600">
                  {loading ? '...' : selectedPeriod === 'today' ? reportData.dailyStockSummary.stockOut : reportData.weeklyStockSummary.stockOut}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <span className="text-lg font-bold text-black">Net Change:</span>
                <span className={`text-2xl font-bold ${
                  (selectedPeriod === 'today' ? reportData.dailyStockSummary.netChange : reportData.weeklyStockSummary.netChange) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {loading ? '...' : selectedPeriod === 'today' ? reportData.dailyStockSummary.netChange : reportData.weeklyStockSummary.netChange}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-6 text-center">Truck Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <span className="text-lg font-bold text-black">Total Entries:</span>
                <span className="text-2xl font-bold text-gray-600">{loading ? '...' : reportData.truckSummary.totalEntries}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <span className="text-lg font-bold text-black">Currently Inside:</span>
                <span className="text-2xl font-bold text-green-600">{loading ? '...' : reportData.truckSummary.currentlyInside}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <span className="text-lg font-bold text-black">Avg Stay Time:</span>
                <span className="text-2xl font-bold text-blue-600">{loading ? '...' : reportData.truckSummary.averageStayTime} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Top Products by Movement</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg text-gray-600">Loading product data...</p>
            </div>
          ) : reportData.topProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No product data</h3>
              <p className="text-gray-600 text-lg">No product movements recorded for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                      Total In
                    </th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                      Total Out
                    </th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                      Net Movement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-gray-300">
                  {reportData.topProducts.map((product: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-black border-r-2 border-gray-300">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-green-600 border-r-2 border-gray-300">
                        {product.totalIn} {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-red-600 border-r-2 border-gray-300">
                        {product.totalOut} {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                        <span className={`font-bold ${
                          product.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.netMovement} {product.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Recent Activities</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg text-gray-600">Loading activities...</p>
            </div>
          ) : reportData.recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No recent activities</h3>
              <p className="text-gray-600 text-lg">No activities recorded for this period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.recentActivities.map((activity: any, index: number) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black">{activity.title}</h3>
                    <p className="text-gray-600">{activity.description}</p>
                    <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download Options */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Download Reports</h2>
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => handleDownloadReport('pdf')}
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 font-bold text-lg border-2 border-red-700"
            >
              Download PDF Report
            </button>
            <button
              onClick={() => handleDownloadReport('csv')}
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-bold text-lg border-2 border-green-700"
            >
              Download CSV Data
            </button>
            <button
              onClick={() => handleDownloadReport('excel')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg border-2 border-blue-700"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
