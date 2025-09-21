'use client';

import { AdminOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminOnly fallback={<div className="text-center text-red-600">Access Denied - Admin Only</div>}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome, {user?.name}! You have full system access to manage users, products, and warehouses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">User Management</h3>
              <p className="text-blue-700 mb-4">Manage system users and their roles</p>
              <ul className="text-sm text-blue-600">
                <li>• Create new users</li>
                <li>• Assign roles and permissions</li>
                <li>• Deactivate user accounts</li>
                <li>• View user activity</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Product Management</h3>
              <p className="text-green-700 mb-4">Manage Pakasian Foods products</p>
              <ul className="text-sm text-green-600">
                <li>• Add new snack products</li>
                <li>• Update product information</li>
                <li>• Manage batch numbers</li>
                <li>• Set expiry dates</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Warehouse Management</h3>
              <p className="text-purple-700 mb-4">Manage warehouse locations</p>
              <ul className="text-sm text-purple-600">
                <li>• Add new warehouses</li>
                <li>• Update warehouse details</li>
                <li>• Assign warehouse managers</li>
                <li>• Monitor capacity</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add User
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add Product
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Add Warehouse
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
