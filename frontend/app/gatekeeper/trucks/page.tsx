'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TruckManagement() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('inside')
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'inside',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user && user.role === 'gatekeeper') {
      fetchTrucks()
    }
  }, [user, filters])

  const fetchTrucks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setTrucks(data.trucks || [])
    } catch (error) {
      console.error('Error fetching trucks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExit = async (truckId: any) => {
    if (!confirm('Are you sure you want to log this truck exit?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks/${truckId}/exit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exit_time: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Truck exit logged successfully!')
        fetchTrucks()
      } else {
        alert(data.message || 'Error logging truck exit')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error logging truck exit')
    }
  }

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'inside':
        return 'bg-green-100 text-green-800'
      case 'exited':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: any) => {
    switch (status) {
      case 'inside':
        return 'Inside'
      case 'exited':
        return 'Exited'
      default:
        return status
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
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-black">Truck Management</h1>
              <p className="text-gray-600 text-lg">Track and manage vehicle movements</p>
            </div>
            <Link 
              href="/gatekeeper" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-bold border-2 border-gray-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                >
                  <option value="">All Status</option>
                  <option value="inside">Inside</option>
                  <option value="exited">Exited</option>
                </select>
              </div>
              
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
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
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={fetchTrucks}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg border-2 border-green-700"
                >
                  {loading ? 'Loading...' : 'Apply Filters'}
                </button>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="border-b-2 border-gray-300">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('inside')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'inside'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                Trucks Inside ({trucks.filter(t => t.status === 'inside').length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'all'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                All Trucks ({trucks.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Trucks Inside Tab */}
            {activeTab === 'inside' && (
              <div>
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Trucks Currently Inside ({trucks.filter(t => t.status === 'inside').length})
                  </h3>
                  <p className="text-gray-600 text-lg">Trucks that are currently inside the premises</p>
                </div>

              {trucks.filter(t => t.status === 'inside').length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No trucks inside</h3>
                  <p className="mt-1 text-sm text-gray-500">All trucks have exited the premises.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Truck Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trucks.filter(t => t.status === 'inside').map((truck: any) => {
                        const entryTime = new Date(truck.entry_time)
                        const now = new Date()
                        const duration = Math.floor((now.getTime() - entryTime.getTime()) / (1000 * 60 * 60)) // hours
                        
                        return (
                          <tr key={truck.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {truck.truck_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{truck.driver_name}</div>
                                <div className="text-gray-500">{truck.driver_cnic}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {truck.purpose}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entryTime.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                duration > 8 ? 'bg-red-100 text-red-800' : 
                                duration > 4 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {duration}h
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleExit(truck.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md"
                              >
                                Log Exit
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* All Trucks Tab */}
          {activeTab === 'all' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Trucks ({trucks.length})
                </h3>
                <p className="text-gray-600">Complete history of truck movements</p>
              </div>

              {trucks.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No trucks found</h3>
                  <p className="mt-1 text-sm text-gray-500">No trucks match your current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Truck Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exit Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trucks.map((truck) => (
                        <tr key={truck.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {truck.truck_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{truck.driver_name}</div>
                              <div className="text-gray-500">{truck.driver_cnic}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {truck.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(truck.entry_time).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {truck.exit_time ? new Date(truck.exit_time).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(truck.status)}`}>
                              {getStatusText(truck.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {truck.status === 'inside' ? (
                              <button
                                onClick={() => handleExit(truck.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md"
                              >
                                Log Exit
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}