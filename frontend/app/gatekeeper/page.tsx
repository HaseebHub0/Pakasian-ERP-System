'use client';

import { GatekeeperOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

export default function GatekeeperDashboard() {
  const { user } = useAuth();

  return (
    <GatekeeperOnly fallback={<div className="text-center text-red-600">Access Denied - Gatekeeper Only</div>}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Warehouse Gate Control
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome, {user?.name}! Manage truck entries, exits, and stock movements at the warehouse gate.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-900">3</h3>
              <p className="text-blue-700">Pending Trucks</p>
              <span className="text-sm text-blue-600">Waiting for entry</span>
            </div>

            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-900">15</h3>
              <p className="text-green-700">Today's Movements</p>
              <span className="text-sm text-green-600">Inbound & Outbound</span>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-900">75%</h3>
              <p className="text-purple-700">Warehouse Capacity</p>
              <span className="text-sm text-purple-600">Current usage</span>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-orange-900">Active</h3>
              <p className="text-orange-700">Warehouse Status</p>
              <span className="text-sm text-green-600">All systems operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Truck Management</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Record Truck Entry
                </button>
                <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Record Truck Exit
                </button>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Pending Trucks
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Truck History
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movements</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Record Inbound Goods
                </button>
                <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Record Outbound Goods
                </button>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  View Movement History
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Pending Movements
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Truck Entries</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">TRUCK-001</span>
                    <p className="text-sm text-gray-600">Ahmed Khan - KHI-1234</p>
                  </div>
                  <span className="text-sm text-gray-500">09:30</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">TRUCK-002</span>
                    <p className="text-sm text-gray-600">Hassan Ali - KHI-5678</p>
                  </div>
                  <span className="text-sm text-gray-500">11:15</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">TRUCK-003</span>
                    <p className="text-sm text-gray-600">Usman Khan - KHI-9012</p>
                  </div>
                  <span className="text-sm text-gray-500">14:20</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Stock Movements</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-green-600">INB-001</span>
                    <p className="text-sm text-gray-600">Protein Nimko 100g - 500 packets</p>
                  </div>
                  <span className="text-sm text-gray-500">09:30</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-red-600">OUT-001</span>
                    <p className="text-sm text-gray-600">Salted Chips 50g - 200 packets</p>
                  </div>
                  <span className="text-sm text-gray-500">11:15</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-green-600">INB-002</span>
                    <p className="text-sm text-gray-600">Spicy Nimko Mix - 300 packets</p>
                  </div>
                  <span className="text-sm text-gray-500">14:20</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Gatekeeper Responsibilities</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Record all truck entries and exits with driver and license plate information</li>
              <li>• Track inbound goods movements from suppliers</li>
              <li>• Track outbound goods movements to customers</li>
              <li>• Verify batch numbers and expiry dates for food safety</li>
              <li>• Monitor warehouse capacity and status</li>
            </ul>
          </div>
        </div>
      </div>
    </GatekeeperOnly>
  );
}
