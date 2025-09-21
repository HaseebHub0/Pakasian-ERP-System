'use client';

import { AdminOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_values: string | null;
  new_values: string | null;
  changed_fields: string | null;
  user_id: number;
  user_name: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  activity_type: string;
  activity_category: string;
  activity_description: string;
  sensitive_data: string | null;
  session_id: string | null;
  request_id: string | null;
  metadata: string | null;
  created_at: string;
}

interface AuditSummary {
  period: {
    start_date: string;
    end_date: string;
  };
  activitySummary: Array<{
    activity_type: string;
    activity_category: string;
    count: number;
    unique_users: number;
  }>;
  userActivitySummary: Array<{
    user_name: string;
    role: string;
    activity_type: string;
    activity_count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    activity_type: string;
    count: number;
  }>;
}

const AuditLogsPage = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'summary'>('logs');
  const [filters, setFilters] = useState({
    activity_type: '',
    activity_category: '',
    table_name: '',
    user_id: '',
    start_date: '',
    end_date: '',
    limit: 50,
    offset: 0
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchAuditLogs();
    } else {
      fetchSummary();
    }
  }, [activeTab, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/protected/audit-logs`, {
        params: filters,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setAuditLogs(response.data.data.logs);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/protected/audit-logs/summary`, {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setSummary(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch audit summary:', err);
      setError(err.response?.data?.error || 'Failed to load audit summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'gatekeeper_entry': return 'bg-blue-100 text-blue-800';
      case 'accountant_transaction': return 'bg-green-100 text-green-800';
      case 'admin_action': return 'bg-purple-100 text-purple-800';
      case 'system_action': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'insert': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminOnly>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading audit logs...</div>
          </div>
        </div>
      </AdminOnly>
    );
  }

  if (error) {
    return (
      <AdminOnly>
        <div className="container mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error: {error}</p>
            <button 
              onClick={() => activeTab === 'logs' ? fetchAuditLogs() : fetchSummary()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-4 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Audit Logs & Compliance
              </h1>
              <p className="text-gray-600">
                Monitor all system activities and ensure compliance with audit requirements.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Summary & Analytics
              </button>
            </nav>
          </div>

          {activeTab === 'logs' ? (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                  <select
                    value={filters.activity_type}
                    onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="gatekeeper_entry">Gatekeeper Entry</option>
                    <option value="accountant_transaction">Accountant Transaction</option>
                    <option value="admin_action">Admin Action</option>
                    <option value="system_action">System Action</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Category</label>
                  <select
                    value={filters.activity_category}
                    onChange={(e) => handleFilterChange('activity_category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="stock_movement">Stock Movement</option>
                    <option value="financial">Financial</option>
                    <option value="user_management">User Management</option>
                    <option value="product_management">Product Management</option>
                    <option value="system_config">System Config</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                  <select
                    value={filters.table_name}
                    onChange={(e) => handleFilterChange('table_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Tables</option>
                    <option value="stock_movements">Stock Movements</option>
                    <option value="purchases">Purchases</option>
                    <option value="expenses">Expenses</option>
                    <option value="sales_invoices">Sales Invoices</option>
                    <option value="users">Users</option>
                    <option value="products">Products</option>
                    <option value="warehouses">Warehouses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => handleFilterChange('start_date', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => handleFilterChange('end_date', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table/Record
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                            <div className="text-sm text-gray-500">{log.user_role}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeColor(log.activity_type)}`}>
                            {log.activity_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.table_name} (#{log.record_id})
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.activity_description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found for the selected filters.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {summary && (
                <>
                  {/* Activity Summary */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summary.activitySummary.map((activity, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {activity.activity_type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500">{activity.activity_category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{activity.count}</p>
                              <p className="text-xs text-gray-500">{activity.unique_users} users</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Activity Summary */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Activity Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {summary.userActivitySummary.map((userActivity, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {userActivity.user_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {userActivity.role}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeColor(userActivity.activity_type)}`}>
                                  {userActivity.activity_type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {userActivity.activity_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
};

export default AuditLogsPage;
