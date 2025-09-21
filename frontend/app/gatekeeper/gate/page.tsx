'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function WarehouseGate() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('entry')
  const [trucksInside, setTrucksInside] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    truck_number: '',
    driver_name: '',
    driver_cnic: '',
    entry_type: 'IN',
    purpose: '',
    remarks: ''
  })

  useEffect(() => {
    if (user && user.role === 'gatekeeper') {
      fetchTrucksInside()
    }
  }, [user])

  const fetchTrucksInside = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks/status/inside`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setTrucksInside(data.trucks || [])
    } catch (error) {
      console.error('Error fetching trucks inside:', error)
    }
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          entry_time: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Truck entry logged successfully!')
        setFormData({
          truck_number: '',
          driver_name: '',
          driver_cnic: '',
          entry_type: 'IN',
          purpose: '',
          remarks: ''
        })
        fetchTrucksInside()
      } else {
        alert(data.message || 'Error logging truck entry')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error logging truck entry')
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
        fetchTrucksInside()
      } else {
        alert(data.message || 'Error logging truck exit')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error logging truck exit')
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
              <h1 className="text-3xl font-bold text-black">Warehouse Gate Management</h1>
              <p className="text-gray-600 text-lg">Log vehicle entries and exits</p>
            </div>
            <Link 
              href="/gatekeeper" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-bold border-2 border-gray-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="border-b-2 border-gray-300">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'entry'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                Log Entry/Exit
              </button>
              <button
                onClick={() => setActiveTab('inside')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'inside'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                Trucks Inside ({trucksInside.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Entry Form Tab */}
            {activeTab === 'entry' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Truck Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.truck_number}
                      onChange={(e) => setFormData({...formData, truck_number: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                      placeholder="e.g., KHI-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.driver_name}
                      onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                      placeholder="Driver full name"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Driver CNIC *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.driver_cnic}
                      onChange={(e) => setFormData({...formData, driver_cnic: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                      placeholder="12345-1234567-1"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Entry Type *
                    </label>
                    <select
                      required
                      value={formData.entry_type}
                      onChange={(e) => setFormData({...formData, entry_type: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                    >
                      <option value="IN">Entry (IN)</option>
                      <option value="OUT">Exit (OUT)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-lg font-bold text-black mb-3">
                      Purpose *
                    </label>
                    <select
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                    >
                      <option value="">Select purpose</option>
                      <option value="Raw Material In">Raw Material In</option>
                      <option value="Finished Goods Out">Finished Goods Out</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-lg font-bold text-black mb-3">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                      placeholder="Additional notes or remarks"
                    />
                  </div>
                </div>

                <div className="flex justify-center space-x-6">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      truck_number: '',
                      driver_name: '',
                      driver_cnic: '',
                      entry_type: 'IN',
                      purpose: '',
                      remarks: ''
                    })}
                    className="px-8 py-3 border-2 border-gray-400 text-black rounded-lg hover:bg-gray-100 font-bold text-lg"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg border-2 border-green-700"
                  >
                    {loading ? 'Logging...' : 'Log Entry'}
                  </button>
                </div>
              </form>
            )}

            {/* Trucks Inside Tab */}
            {activeTab === 'inside' && (
              <div>
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Trucks Currently Inside ({trucksInside.length})
                  </h3>
                  <p className="text-gray-600 text-lg">Click "Log Exit" to record when a truck leaves</p>
                </div>

                {trucksInside.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">No trucks inside</h3>
                    <p className="text-gray-600 text-lg">All trucks have exited the premises.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                            Truck Number
                          </th>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                            Driver
                          </th>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                            Purpose
                          </th>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                            Entry Time
                          </th>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y-2 divide-gray-300">
                        {trucksInside.map((truck) => (
                          <tr key={truck.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-black border-r-2 border-gray-300">
                              {truck.truck_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                              <div>
                                <div className="font-bold">{truck.driver_name}</div>
                                <div className="text-gray-600">{truck.driver_cnic}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                              {truck.purpose}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                              {new Date(truck.entry_time).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-lg font-medium">
                              <button
                                onClick={() => handleExit(truck.id)}
                                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-bold border-2 border-red-700"
                              >
                                Log Exit
                              </button>
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
