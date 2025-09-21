'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUser() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'gatekeeper',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('User created successfully!');
        router.push('/admin/users');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-black">Create New User</h1>
              <p className="text-gray-600 text-lg">Add a new user to the system</p>
            </div>
            <Link
              href="/admin/users"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
            >
              ← Back to Users
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                >
                  <option value="gatekeeper">Gatekeeper</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-lg font-bold text-black mb-3">
                Role Description
              </label>
              <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-bold text-red-600 mr-2">Admin:</span>
                    <span>Full system access, user management, all reports</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-blue-600 mr-2">Accountant:</span>
                    <span>Financial records, invoices, expenses, financial reports</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-green-600 mr-2">Gatekeeper:</span>
                    <span>Truck management, stock movements, gate operations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-8 py-3 border-2 border-gray-400 text-black rounded-lg hover:bg-gray-100 font-bold text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg border-2 border-green-700"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
