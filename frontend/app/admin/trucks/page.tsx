'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TruckLogs() {
  const { user } = useAuth();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchTrucks();
    }
  }, [user]);

  const fetchTrucks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        start_date: filters.start_date,
        end_date: filters.end_date
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/trucks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrucks(data);
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        start_date: filters.start_date,
        end_date: filters.end_date,
        format: format
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/trucks/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `truck-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error exporting data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inside':
        return 'bg-green-100 text-green-800 border-2 border-green-600';
      case 'exited':
        return 'bg-gray-100 text-gray-800 border-2 border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'inside':
        return 'INSIDE';
      case 'exited':
        return 'EXITED';
      default:
        return 'UNKNOWN';
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [filters]);

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
              <h1 className="text-3xl font-bold text-black">Truck Logs</h1>
              <p className="text-gray-600 text-lg">Track all vehicle movements and entries</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => handleExport('csv')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold border-2 border-green-700"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold border-2 border-red-700"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                placeholder="Truck number or driver name"
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
              >
                <option value="all">All Status</option>
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
          </div>
        </div>

        {/* Trucks Table */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              Truck Logs ({trucks.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Loading truck logs...</p>
              </div>
            ) : trucks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No truck logs found</h3>
                <p className="text-gray-600 text-lg">No trucks match your search criteria.</p>
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
                        CNIC
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Purpose
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Entry Time
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Exit Time
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-300">
                    {trucks.map((truck: any) => (
                      <tr key={truck.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-black border-r-2 border-gray-300">
                          {truck.truck_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {truck.driver_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {truck.driver_cnic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {truck.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {new Date(truck.entry_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {truck.exit_time ? new Date(truck.exit_time).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(truck.status)}`}>
                            {getStatusText(truck.status)}
                          </span>
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
