'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GatekeeperDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    trucksInside: 0,
    todayEntries: 0,
    todayExits: 0,
    pendingMovements: 0
  })

  useEffect(() => {
    // Fetch dashboard stats
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      
      // Fetch trucks inside
      const trucksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks/status/inside`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const trucksData = await trucksResponse.json()
      
      // Fetch today's entries
      const today = new Date().toISOString().split('T')[0]
      const entriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks?start_date=${today}&end_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const entriesData = await entriesResponse.json()
      
      setStats({
        trucksInside: trucksData.trucks?.length || 0,
        todayEntries: entriesData.trucks?.filter((t: { entry_type: string }) => t.entry_type === 'IN').length || 0,
        todayExits: entriesData.trucks?.filter((t: { entry_type: string }) => t.entry_type === 'OUT').length || 0,
        pendingMovements: 0 // This would come from stock movements
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (!user || user.role !== 'gatekeeper') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-black mb-2">Welcome Gatekeeper</h1>
              <p className="text-gray-600 text-lg">Manage Trucks and Stock Movements</p>
              <p className="text-gray-500 text-sm mt-1">Logged in as: {user.name}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">{stats.trucksInside}</div>
              <div className="text-gray-600 font-medium">Trucks Inside</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-black">Trucks Inside</p>
                <p className="text-3xl font-bold text-red-600">{stats.trucksInside}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-black">Today's Entries</p>
                <p className="text-3xl font-bold text-red-600">{stats.todayEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-black">Today's Exits</p>
                <p className="text-3xl font-bold text-red-600">{stats.todayExits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-black">Pending Movements</p>
                <p className="text-3xl font-bold text-red-600">{stats.pendingMovements}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Warehouse Gate Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Warehouse Gate</h3>
              <p className="text-gray-600 text-sm mb-4">Vehicle Entry & Exit</p>
              <p className="text-gray-700 text-sm mb-6">
                Log vehicle entries and exits with driver details, purpose, and timestamps.
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href="/gatekeeper/gate" 
                className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-bold border-2 border-green-700"
              >
                Manage Gate
              </Link>
              <Link 
                href="/gatekeeper/gate/logs" 
                className="block w-full bg-white text-green-600 text-center py-3 px-4 rounded-lg hover:bg-green-50 transition-colors font-bold border-2 border-green-600"
              >
                View Logs
              </Link>
            </div>
          </div>

          {/* Stock Movements Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Stock Movements</h3>
              <p className="text-gray-600 text-sm mb-4">Inventory Tracking</p>
              <p className="text-gray-700 text-sm mb-6">
                Record stock movements linked to truck entries for inventory tracking.
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href="/gatekeeper/movements" 
                className="block w-full bg-red-600 text-white text-center py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-bold border-2 border-red-700"
              >
                Manage Movements
              </Link>
              <Link 
                href="/gatekeeper/movements/history" 
                className="block w-full bg-white text-red-600 text-center py-3 px-4 rounded-lg hover:bg-red-50 transition-colors font-bold border-2 border-red-600"
              >
                View History
              </Link>
            </div>
          </div>

          {/* Truck Management Module */}
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gray-100 border-2 border-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Truck Management</h3>
              <p className="text-gray-600 text-sm mb-4">Vehicle Tracking</p>
              <p className="text-gray-700 text-sm mb-6">
                Track truck status, manage entries, and monitor vehicle movements.
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href="/gatekeeper/trucks" 
                className="block w-full bg-black text-white text-center py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-bold border-2 border-gray-700"
              >
                Manage Trucks
              </Link>
              <Link 
                href="/gatekeeper/trucks/status" 
                className="block w-full bg-white text-black text-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-bold border-2 border-gray-600"
              >
                View Status
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/gatekeeper/gate/entry" 
              className="flex items-center justify-center p-4 bg-green-100 border-2 border-green-600 rounded-lg hover:bg-green-200 transition-colors"
            >
              <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-green-700 font-bold">Log Entry</span>
            </Link>
            
            <Link 
              href="/gatekeeper/gate/exit" 
              className="flex items-center justify-center p-4 bg-red-100 border-2 border-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-red-700 font-bold">Log Exit</span>
            </Link>
            
            <Link 
              href="/gatekeeper/movements/new" 
              className="flex items-center justify-center p-4 bg-gray-100 border-2 border-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="h-6 w-6 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-gray-700 font-bold">Record Movement</span>
            </Link>
            
            <Link 
              href="/gatekeeper/trucks/inside" 
              className="flex items-center justify-center p-4 bg-black text-white border-2 border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="h-6 w-6 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-white font-bold">View Inside</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}