'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrucks: 0,
    stockInToday: 0,
    stockOutToday: 0,
    trucksInside: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-4">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Welcome, <span className="font-bold text-red-600">{user?.name}</span>! 
              Manage your snacks manufacturing ERP system.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Users</h3>
            <p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.totalUsers}</p>
            <p className="text-sm text-gray-600">Total System Users</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Stock In</h3>
            <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.stockInToday}</p>
            <p className="text-sm text-gray-600">Today's Raw Materials</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Stock Out</h3>
            <p className="text-3xl font-bold text-red-600">{loading ? '...' : stats.stockOutToday}</p>
            <p className="text-sm text-gray-600">Today's Finished Goods</p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Trucks Inside</h3>
            <p className="text-3xl font-bold text-gray-600">{loading ? '...' : stats.trucksInside}</p>
            <p className="text-sm text-gray-600">Currently on Premises</p>
          </div>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 border-2 border-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">User Management</h2>
                <p className="text-gray-600">Manage system users and roles</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/users" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  View All Users
                </Link>
                <Link href="/admin/users/create" className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
                  Add New User
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create, edit, and delete users</li>
                <li>• Assign roles: Admin, Accountant, Gatekeeper</li>
                <li>• Reset passwords and manage permissions</li>
                <li>• View user activity and login history</li>
              </ul>
            </div>
          </div>

          {/* Warehouse Overview */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 border-2 border-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Warehouse Overview</h2>
                <p className="text-gray-600">Monitor stock levels and movements</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/warehouse" className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
                  View Stock Summary
                </Link>
                <Link href="/admin/warehouse/movements" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  Stock Movements
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time stock level monitoring</li>
                <li>• Raw materials in/out tracking</li>
                <li>• Finished goods inventory</li>
                <li>• Low stock alerts and reports</li>
              </ul>
            </div>
          </div>

          {/* Truck Logs */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 border-2 border-red-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Truck Logs</h2>
                <p className="text-gray-600">Track all vehicle movements</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/trucks" className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-bold text-center border-2 border-red-700">
                  View All Logs
                </Link>
                <Link href="/admin/trucks/export" className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
                  Export Data
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete truck entry/exit history</li>
                <li>• Filter by date, driver, or purpose</li>
                <li>• Export to CSV/PDF reports</li>
                <li>• Real-time truck status tracking</li>
              </ul>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 border-2 border-gray-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Reports & Analytics</h2>
                <p className="text-gray-600">Generate comprehensive reports</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/reports" className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
                  View Reports
                </Link>
                <Link href="/admin/reports/analytics" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
                  Analytics
                </Link>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Daily/weekly stock summaries</li>
                <li>• Truck movement analytics</li>
                <li>• Interactive charts and graphs</li>
                <li>• Downloadable PDF reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/users/create" className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 font-bold text-center border-2 border-blue-700">
              Add User
            </Link>
            <Link href="/admin/warehouse" className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-bold text-center border-2 border-green-700">
              View Stock
            </Link>
            <Link href="/admin/trucks" className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 font-bold text-center border-2 border-red-700">
              Truck Logs
            </Link>
            <Link href="/admin/reports" className="bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 font-bold text-center border-2 border-gray-700">
              Generate Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
