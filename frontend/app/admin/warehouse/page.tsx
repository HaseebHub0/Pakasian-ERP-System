'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WarehouseOverview() {
  const { user } = useAuth();
  const [warehouseData, setWarehouseData] = useState({
    stockInToday: 0,
    stockOutToday: 0,
    stockInWeek: 0,
    stockOutWeek: 0,
    currentStock: 0,
    lowStockItems: [],
    recentMovements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchWarehouseData();
    }
  }, [user]);

  const fetchWarehouseData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/warehouse/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWarehouseData(data);
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    } finally {
      setLoading(false);
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
              <h1 className="text-3xl font-bold text-black">Warehouse Overview</h1>
              <p className="text-gray-600 text-lg">Monitor stock levels and movements</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/warehouse/movements"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold border-2 border-blue-700"
              >
                View All Movements
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Stock In Today</h3>
            <p className="text-3xl font-bold text-green-600">{loading ? '...' : warehouseData.stockInToday}</p>
            <p className="text-sm text-gray-600">Raw Materials Received</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Stock Out Today</h3>
            <p className="text-3xl font-bold text-red-600">{loading ? '...' : warehouseData.stockOutToday}</p>
            <p className="text-sm text-gray-600">Finished Goods Shipped</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">This Week In</h3>
            <p className="text-3xl font-bold text-blue-600">{loading ? '...' : warehouseData.stockInWeek}</p>
            <p className="text-sm text-gray-600">Weekly Raw Materials</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Current Stock</h3>
            <p className="text-3xl font-bold text-gray-600">{loading ? '...' : warehouseData.currentStock}</p>
            <p className="text-sm text-gray-600">Total Inventory</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        {warehouseData.lowStockItems && warehouseData.lowStockItems.length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 border-2 border-red-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600">Low Stock Alert</h2>
                <p className="text-gray-600">Items running low on inventory</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouseData.lowStockItems.map((item: any, index: number) => (
                <div key={index} className="bg-white border-2 border-red-300 rounded-lg p-4">
                  <h3 className="font-bold text-black text-lg">{item.name}</h3>
                  <p className="text-red-600 font-bold">Current: {item.quantity} {item.unit}</p>
                  <p className="text-sm text-gray-600">Min Required: {item.min_quantity} {item.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Movements */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-black mb-6 text-center">Recent Stock Movements</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Loading movements...</p>
              </div>
            ) : warehouseData.recentMovements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No recent movements</h3>
                <p className="text-gray-600 text-lg">No stock movements recorded recently.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Truck
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-300">
                    {warehouseData.recentMovements.map((movement: any) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-300">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                            movement.movement_type === 'IN' 
                              ? 'bg-green-100 text-green-800 border-2 border-green-600' 
                              : 'bg-red-100 text-red-800 border-2 border-red-600'
                          }`}>
                            {movement.movement_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-black border-r-2 border-gray-300">
                          {movement.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {movement.quantity} {movement.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {movement.truck_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                          {new Date(movement.movement_date).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
