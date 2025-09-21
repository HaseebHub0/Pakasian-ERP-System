'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateSale() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    product_name: '',
    quantity: '',
    unit: 'pieces',
    sale_price: '',
    total_amount: '',
    sale_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Sales record created successfully!');
        router.push('/accounting/sales');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error creating sales record');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sales record');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const salePrice = parseFloat(formData.sale_price) || 0;
    const total = quantity * salePrice;
    setFormData({...formData, total_amount: total.toFixed(2)});
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-black">Create Sales Record</h1>
              <p className="text-gray-600 text-lg">Record finished goods sale and customer invoice</p>
            </div>
            <Link
              href="/accounting/sales"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold border-2 border-gray-700"
            >
              ← Back to Sales
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                  placeholder="e.g., SAL-2024-001"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                  placeholder="e.g., Potato Chips, Corn Snacks, etc."
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({...formData, quantity: e.target.value});
                    calculateTotal();
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Unit *
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                >
                  <option value="pieces">Pieces</option>
                  <option value="boxes">Boxes</option>
                  <option value="bags">Bags</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Sale Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sale_price}
                  onChange={(e) => {
                    setFormData({...formData, sale_price: e.target.value});
                    calculateTotal();
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Total Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black bg-gray-100"
                  placeholder="0.00"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Sale Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.sale_date}
                  onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-lg font-bold text-black mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-black"
                placeholder="Additional notes about this sale"
              />
            </div>

            <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4">
              <h3 className="text-lg font-bold text-black mb-3">Sales Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-bold text-black">Product:</span>
                  <p className="text-gray-600">{formData.product_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-bold text-black">Quantity:</span>
                  <p className="text-gray-600">{formData.quantity || '0'} {formData.unit}</p>
                </div>
                <div>
                  <span className="font-bold text-black">Sale Price:</span>
                  <p className="text-gray-600">${formData.sale_price || '0.00'}</p>
                </div>
                <div>
                  <span className="font-bold text-black">Total Amount:</span>
                  <p className="text-green-600 font-bold">${formData.total_amount || '0.00'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <button
                type="button"
                onClick={() => router.push('/accounting/sales')}
                className="px-8 py-3 border-2 border-gray-400 text-black rounded-lg hover:bg-gray-100 font-bold text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg border-2 border-green-700"
              >
                {loading ? 'Creating...' : 'Create Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
