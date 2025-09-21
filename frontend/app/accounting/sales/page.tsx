'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    customer: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user && user.role === 'accountant') {
      fetchSales();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        search: filters.search,
        customer: filters.customer,
        start_date: filters.start_date,
        end_date: filters.end_date
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/sales?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: any) => {
    if (!confirm('Are you sure you want to delete this sales record?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/sales/${saleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSales(); // Refresh the list
        alert('Sales record deleted successfully');
      } else {
        alert('Error deleting sales record');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sales record');
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filters]);

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
              <h1 className="text-3xl font-bold text-black">Sales Management</h1>
              <p className="text-gray-600 text-lg">Manage finished goods sales and customer invoices</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/accounting"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/accounting/sales/create"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold border-2 border-green-700"
              >
                + Add Sale
              </Link>
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
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                placeholder="Product or customer name"
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Customer
              </label>
              <input
                type="text"
                value={filters.customer}
                onChange={(e) => setFilters({...filters, customer: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                placeholder="Filter by customer"
              />
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
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              Sales Records ({sales.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Loading sales...</p>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No sales found</h3>
                <p className="text-gray-600 text-lg">No sales records match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Invoice #
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Sale Price
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-300">
                    {sales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-black border-r-2 border-gray-300">
                          {sale.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {sale.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {sale.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {sale.quantity} {sale.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          ${sale.sale_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-600 border-r-2 border-gray-300">
                          ${sale.total_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                          <div className="flex space-x-2">
                            <Link
                              href={`/accounting/sales/edit/${sale.id}`}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold text-sm border-2 border-blue-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-bold text-sm border-2 border-red-700"
                            >
                              Delete
                            </button>
                          </div>
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