'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StockMovements() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('new')
  const [movements, setMovements] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    movement_type: 'IN',
    product_name: '',
    quantity: '',
    unit: 'kg',
    truck_number: '',
    remarks: ''
  })

  useEffect(() => {
    if (user && user.role === 'gatekeeper') {
      fetchMovements()
      fetchTrucks()
    }
  }, [user])

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock-movements?start_date=${today}&end_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setMovements(data.movements || [])
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  const fetchTrucks = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trucks?status=inside`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setTrucks(data.trucks || [])
    } catch (error) {
      console.error('Error fetching trucks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock-movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          movement_date: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Stock movement recorded successfully!')
        setFormData({
          movement_type: 'IN',
          product_name: '',
          quantity: '',
          unit: 'kg',
          truck_number: '',
          remarks: ''
        })
        fetchMovements()
      } else {
        alert(data.message || 'Error recording stock movement')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error recording stock movement')
    } finally {
      setLoading(false)
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
              <h1 className="text-3xl font-bold text-black">Stock Movements</h1>
              <p className="text-gray-600 text-lg">Record and track inventory movements</p>
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
                onClick={() => setActiveTab('new')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'new'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                Record Movement
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-4 font-bold text-lg ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-400'
                }`}
              >
                Today's Movements ({movements.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* New Movement Form Tab */}
            {activeTab === 'new' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Movement Type *
                    </label>
                    <select
                      required
                      value={formData.movement_type}
                      onChange={(e) => setFormData({...formData, movement_type: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                    >
                      <option value="IN">Stock In</option>
                      <option value="OUT">Stock Out</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                      placeholder="e.g., Potato Chips, Corn Flakes"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="lbs">Pounds (lbs)</option>
                      <option value="pieces">Pieces</option>
                      <option value="boxes">Boxes</option>
                      <option value="bags">Bags</option>
                      <option value="liters">Liters</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-black mb-3">
                      Associated Truck Number
                    </label>
                    <select
                      value={formData.truck_number}
                      onChange={(e) => setFormData({...formData, truck_number: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                    >
                      <option value="">Select truck (optional)</option>
                      {trucks.map((truck: any) => (
                        <option key={truck.id} value={truck.truck_number}>
                          {truck.truck_number} - {truck.driver_name}
                        </option>
                      ))}
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
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg text-black"
                      placeholder="Additional notes about this movement"
                    />
                  </div>
                </div>

                <div className="flex justify-center space-x-6">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      movement_type: 'IN',
                      product_name: '',
                      quantity: '',
                      unit: 'kg',
                      truck_number: '',
                      remarks: ''
                    })}
                    className="px-8 py-3 border-2 border-gray-400 text-black rounded-lg hover:bg-gray-100 font-bold text-lg"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold text-lg border-2 border-red-700"
                  >
                    {loading ? 'Recording...' : 'Record Movement'}
                  </button>
                </div>
              </form>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Today's Stock Movements ({movements.length})
                  </h3>
                  <p className="text-gray-600 text-lg">All stock movements recorded today</p>
                </div>

                {movements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">No movements today</h3>
                    <p className="text-gray-600 text-lg">No stock movements have been recorded today.</p>
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
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                            Time
                          </th>
                          <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y-2 divide-gray-300">
                        {movements.map((movement: any) => (
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
                            <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                              {new Date(movement.movement_date).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-lg text-black">
                              {movement.remarks || '-'}
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