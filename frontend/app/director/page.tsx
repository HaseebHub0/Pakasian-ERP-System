'use client';

import { DirectorOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardData {
  financialSummary: {
    total_revenue: number;
    total_expenses: number;
    total_purchases: number;
    net_profit: number;
    profit_margin: number;
    total_invoices: number;
    total_expense_entries: number;
  };
  stockLevels: Array<{
    id: number;
    name: string;
    sku: string;
    current_stock: number;
    min_stock_level: number;
    selling_price: number;
    stock_status: 'low' | 'medium' | 'high';
    batch_number: string;
    expiry_date: string;
    supplier_name: string;
  }>;
  lowStockAlerts: Array<any>;
  dailySalesTrend: Array<{
    date: string;
    invoice_count: number;
    total_sales: number;
    paid_amount: number;
    outstanding_amount: number;
  }>;
  monthlyData: Array<{
    month: string;
    monthly_income: number;
    monthly_expenses: number;
  }>;
  topSellingProducts: Array<{
    product_name: string;
    sku: string;
    total_quantity_sold: number;
    total_revenue: number;
    invoice_count: number;
    avg_selling_price: number;
  }>;
}

const DirectorDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/protected/director/executive-dashboard`, {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }
      });
      setDashboardData(response.data.dashboard);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'low': return 'Low Stock';
      case 'medium': return 'Medium Stock';
      case 'high': return 'High Stock';
      default: return 'Unknown';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <DirectorOnly>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading executive dashboard...</div>
          </div>
        </div>
      </DirectorOnly>
    );
  }

  if (error) {
    return (
      <DirectorOnly>
        <div className="container mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error: {error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DirectorOnly>
    );
  }

  return (
    <DirectorOnly>
      <div className="container mx-auto p-4 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Executive Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {user?.name}! Strategic overview and business performance metrics.
              </p>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-900">
                {formatCurrency(dashboardData?.financialSummary.total_revenue || 0)}
              </h3>
              <p className="text-green-700">Total Revenue</p>
              <span className="text-sm text-green-600">
                {dashboardData?.financialSummary.total_invoices || 0} invoices
              </span>
            </div>

            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-red-900">
                {formatCurrency(dashboardData?.financialSummary.total_expenses || 0)}
              </h3>
              <p className="text-red-700">Total Expenses</p>
              <span className="text-sm text-red-600">
                {dashboardData?.financialSummary.total_expense_entries || 0} entries
              </span>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-900">
                {formatCurrency(dashboardData?.financialSummary.total_purchases || 0)}
              </h3>
              <p className="text-blue-700">Total Purchases</p>
              <span className="text-sm text-blue-600">Raw materials</span>
            </div>

            <div className={`p-6 rounded-lg text-center ${
              (dashboardData?.financialSummary.net_profit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className={`text-2xl font-bold ${
                (dashboardData?.financialSummary.net_profit || 0) >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {formatCurrency(dashboardData?.financialSummary.net_profit || 0)}
              </h3>
              <p className={(dashboardData?.financialSummary.net_profit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}>
                Net Profit/Loss
              </p>
              <span className={`text-sm ${
                (dashboardData?.financialSummary.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dashboardData?.financialSummary.profit_margin?.toFixed(1) || 0}% margin
              </span>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-900">
                {dashboardData?.stockLevels?.length || 0}
              </h3>
              <p className="text-purple-700">Active Products</p>
              <span className="text-sm text-purple-600">
                {dashboardData?.lowStockAlerts?.length || 0} low stock
              </span>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Sales Trend */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.dailySalesTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value: string) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tickFormatter={(value: number) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      labelFormatter={(value: string) => format(new Date(value), 'MMM dd, yyyy')}
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_sales" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Income vs Expenses */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value: string) => format(new Date(value), 'MMM yyyy')}
                    />
                    <YAxis tickFormatter={(value: number) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      labelFormatter={(value: string) => format(new Date(value), 'MMMM yyyy')}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'monthly_income' ? 'Income' : 'Expenses'
                      ]}
                    />
                    <Bar dataKey="monthly_income" fill="#10B981" name="Income" />
                    <Bar dataKey="monthly_expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stock Levels and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Current Stock Levels */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Stock Levels</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData?.stockLevels?.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{product.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.stock_status)}`}>
                          {getStockStatusText(product.stock_status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          Stock: {product.current_stock} / Min: {product.min_stock_level}
                        </span>
                        <span className="text-sm text-gray-500">
                          Price: {formatCurrency(product.selling_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Selling Products */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Selling Products</h3>
              <div className="space-y-3">
                {dashboardData?.topSellingProducts?.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{product.product_name}</span>
                        <p className="text-sm text-gray-600">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-600">
                        {product.total_quantity_sold} units
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(product.total_revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {dashboardData?.lowStockAlerts && dashboardData.lowStockAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Low Stock Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.lowStockAlerts.map((product) => (
                  <div key={product.id} className="bg-white border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Low Stock
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                    <div className="text-sm text-gray-500">
                      <p>Current: {product.current_stock} units</p>
                      <p>Minimum: {product.min_stock_level} units</p>
                      <p>Expiry: {formatDate(product.expiry_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Executive Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Financial Performance</h4>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• Revenue: {formatCurrency(dashboardData?.financialSummary.total_revenue || 0)}</li>
                  <li>• Expenses: {formatCurrency(dashboardData?.financialSummary.total_expenses || 0)}</li>
                  <li>• Net Profit: {formatCurrency(dashboardData?.financialSummary.net_profit || 0)}</li>
                  <li>• Profit Margin: {dashboardData?.financialSummary.profit_margin?.toFixed(1) || 0}%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Operational Metrics</h4>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• Total Invoices: {dashboardData?.financialSummary.total_invoices || 0}</li>
                  <li>• Active Products: {dashboardData?.stockLevels?.length || 0}</li>
                  <li>• Low Stock Items: {dashboardData?.lowStockAlerts?.length || 0}</li>
                  <li>• Top Product: {dashboardData?.topSellingProducts?.[0]?.product_name || 'N/A'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DirectorOnly>
  );
};

export default DirectorDashboardPage;