'use client';

import { DirectorOnly } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

export default function DirectorDashboard() {
  const { user } = useAuth();

  return (
    <DirectorOnly fallback={<div className="text-center text-red-600">Access Denied - Director Only</div>}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Executive Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome, {user?.name}! Read-only access to business performance metrics and strategic reports.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-900">₹50M</h3>
              <p className="text-blue-700">Total Revenue</p>
              <span className="text-sm text-green-600">+12% from last quarter</span>
            </div>

            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-900">₹8M</h3>
              <p className="text-green-700">Net Profit</p>
              <span className="text-sm text-green-600">16% margin</span>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-900">2.5M</h3>
              <p className="text-purple-700">Packets Produced</p>
              <span className="text-sm text-green-600">+8% from last month</span>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-orange-900">15%</h3>
              <p className="text-orange-700">Market Share</p>
              <span className="text-sm text-green-600">+2% from last year</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Reports</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Market Analysis</span>
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Growth Projections</span>
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Competitor Analysis</span>
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Financial Performance</span>
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-green-600">4.2/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee Retention</span>
                  <span className="font-semibold text-green-600">95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Production Efficiency</span>
                  <span className="font-semibold text-green-600">87%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold text-green-600">98.5%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Read-Only Access</h3>
            <p className="text-yellow-800">
              As a Director, you have read-only access to business performance data and strategic reports. 
              Contact the Administrator for any system modifications.
            </p>
          </div>
        </div>
      </div>
    </DirectorOnly>
  );
}
