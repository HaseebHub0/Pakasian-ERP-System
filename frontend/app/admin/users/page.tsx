'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: any) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        alert('User deleted successfully');
      } else {
        alert('Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleResetPassword = async (userId: any) => {
    if (!confirm('Reset password for this user? A new password will be generated.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Password reset successful. New password: ${data.newPassword}`);
      } else {
        alert('Error resetting password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-2 border-red-600';
      case 'accountant':
        return 'bg-blue-100 text-blue-800 border-2 border-blue-600';
      case 'gatekeeper':
        return 'bg-green-100 text-green-800 border-2 border-green-600';
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-600';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
              <h1 className="text-3xl font-bold text-black">User Management</h1>
              <p className="text-gray-600 text-lg">Manage system users and their roles</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/users/create"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold border-2 border-green-700"
              >
                + Add New User
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-black mb-6 text-center">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Search Users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                placeholder="Search by name or email..."
              />
            </div>
            <div>
              <label className="block text-lg font-bold text-black mb-3">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="gatekeeper">Gatekeeper</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              All Users ({filteredUsers.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No users found</h3>
                <p className="text-gray-600 text-lg">No users match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-300 border-2 border-gray-400">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider border-r-2 border-gray-300">
                        Last Login
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-black uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-300">
                    {filteredUsers.map((userData: any) => (
                      <tr key={userData.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-300">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-100 border-2 border-gray-400 rounded-full flex items-center justify-center mr-4">
                              <span className="font-bold text-black text-lg">
                                {userData.name?.charAt(0) || userData.email?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-black">{userData.name || 'No Name'}</div>
                              <div className="text-sm text-gray-600">{userData.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-300">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getRoleColor(userData.role)}`}>
                            {userData.role?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-300">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                            userData.is_active ? 'bg-green-100 text-green-800 border-2 border-green-600' : 'bg-red-100 text-red-800 border-2 border-red-600'
                          }`}>
                            {userData.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black border-r-2 border-gray-300">
                          {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/users/edit/${userData.id}`}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold text-sm border-2 border-blue-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleResetPassword(userData.id)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 font-bold text-sm border-2 border-yellow-700"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userData.id)}
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