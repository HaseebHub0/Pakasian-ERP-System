'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StockValuation() {
  const { user } = useAuth();
  const [stockData, setStockData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort_by: 'value_desc'
  });

  useEffect(() => {
    if (user && user.role === 'accountant') {
      fetchStockValuation();
    }
  }, [user, filters]);

  const fetchStockValuation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        search: filters.search,
        category: filters.category,
        sort_by: filters.sort_by
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/stock-valuation?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStockData(data.products || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching stock valuation:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightedAverage = (product: any) => {
    if (!product.purchases || product.purchases.length === 0) return 0;
    
    let totalCost = 0;
    let totalQuantity = 0;
    
    product.purchases.forEach((purchase: any) => {
      totalCost += purchase.quantity * purchase.unit_cost;
      totalQuantity += purchase.quantity;
    });
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  const calculateCurrentValue = (product: any) => {
    const weightedAvg = calculateWeightedAverage(product);
    return product.current_stock * weightedAvg;
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
              <h1 className="text-3xl font-bold text-black">Stock Valuation</h1>
              <p className="text-gray-600 text-lg">Current inventory value using weighted average method</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/accounting"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/accounting/stock-valuation/details"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold border-2 border-blue-700"
              >
                Detailed Report
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-gray-500 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Total Value</h3>
              <p className="text-3xl font-bold text-gray-600">${summary.total_value?.toLocaleString() || '0'}</p>
              <p className="text-sm text-gray-600">Current Inventory</p>
            </div>

            <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Total Items</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.total_items || '0'}</p>
              <p className="text-sm text-gray-600">Products in Stock</p>
            </div>

            <div className="bg-white border-2 border-green-500 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Avg Value</h3>
              <p className="text-3xl font-bold text-green-600">
                ${summary.average_value ? summary.average_value.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-600">Per Product</p>
            </div>

            <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Low Stock</h3>
              <p className="text-3xl font-bold text-red-600">{summary.low_stock_items || '0'}</p>
              <p className="text-sm text-gray-600">Items Below Threshold</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Search Product
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg text-black"
                placeholder="Product name or SKU"
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg text-black"
              >
                <option value="">All Categories</option>
                <option value="raw_materials">Raw Materials</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="packaging">Packaging</option>
                <option value="supplies">Supplies</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg text-black"
              >
                <option value="value_desc">Value (High to Low)</option>
                <option value="value_asc">Value (Low to High)</option>
                <option value="name_asc">Name (A to Z)</option>
                <option value="name_desc">Name (Z to A)</option>
                <option value="stock_desc">Stock (High to Low)</option>
                <option value="stock_asc">Stock (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stock Valuation Table */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              Product Valuation ({stockData.length} items)
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Loading stock valuation...</p>
              </div>
            ) : stockData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No products found</h3>
                <p className="text-gray-600 text-lg">No products match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Current Stock
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Weighted Avg Cost
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Current Value
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Last Purchase
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-300">
                    {stockData.map((product: any) => {
                      const weightedAvg = calculateWeightedAverage(product);
                      const currentValue = calculateCurrentValue(product);
                      const isLowStock = product.current_stock < (product.min_stock || 10);
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-300">
                            <div>
                              <div className="text-lg font-bold text-black">{product.name}</div>
                              <div className="text-sm text-gray-600">{product.sku || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                            <span className="px-3 py-1 bg-gray-100 border-2 border-gray-400 rounded-full text-sm font-bold">
                              {product.category || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                            <div className="flex items-center">
                              <span className="font-bold">{product.current_stock || 0}</span>
                              <span className="text-gray-600 ml-1">{product.unit || 'units'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                            <span className="font-bold">${weightedAvg.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-600 border-r-2 border-gray-300">
                            ${currentValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                            {product.last_purchase_date ? 
                              new Date(product.last_purchase_date).toLocaleDateString() : 
                              'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${
                              isLowStock 
                                ? 'bg-red-100 text-red-600 border-red-400' 
                                : 'bg-green-100 text-green-600 border-green-400'
                            }`}>
                              {isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Valuation Summary */}
        {summary && (
          <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">Valuation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold text-black mb-4">Method: Weighted Average Cost</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <span className="font-bold text-black">Total Inventory Value</span>
                    <span className="text-gray-600 font-bold text-lg">${summary.total_value?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <span className="font-bold text-black">Number of Products</span>
                    <span className="text-blue-600 font-bold text-lg">{summary.total_items || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <span className="font-bold text-black">Average Value per Product</span>
                    <span className="text-green-600 font-bold text-lg">
                      ${summary.average_value ? summary.average_value.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-black mb-4">Stock Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <span className="font-bold text-black">Products in Stock</span>
                    <span className="text-green-600 font-bold text-lg">
                      {(summary.total_items || 0) - (summary.low_stock_items || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                    <span className="font-bold text-black">Low Stock Items</span>
                    <span className="text-red-600 font-bold text-lg">{summary.low_stock_items || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <span className="font-bold text-black">Stock Health</span>
                    <span className={`font-bold text-lg ${
                      (summary.low_stock_items || 0) === 0 ? 'text-green-600' : 
                      (summary.low_stock_items || 0) < (summary.total_items || 0) * 0.2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(summary.low_stock_items || 0) === 0 ? 'Excellent' : 
                       (summary.low_stock_items || 0) < (summary.total_items || 0) * 0.2 ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
