'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  sku: string;
  batch_number?: string;
  expiry_date?: string;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

interface StockMovementFormProps {
  movementType: 'in' | 'out';
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export const StockMovementForm: React.FC<StockMovementFormProps> = ({
  movementType,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    batch_number: '',
    vehicle_number: '',
    driver_name: '',
    source: '',
    destination: '',
    unit_cost: '',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/protected/shared/product-info`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/protected/shared/warehouse-status`);
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.batch_number) newErrors.batch_number = 'Batch number is required';
    if (!formData.vehicle_number) newErrors.vehicle_number = 'Vehicle number is required';
    if (!formData.driver_name) newErrors.driver_name = 'Driver name is required';
    
    if (movementType === 'in' && !formData.source) {
      newErrors.source = 'Source is required for inbound movements';
    }
    if (movementType === 'out' && !formData.destination) {
      newErrors.destination = 'Destination is required for outbound movements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = movementType === 'in' 
        ? '/api/protected/gatekeeper/stock-in'
        : '/api/protected/gatekeeper/stock-out';

      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null
      };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      
      if (response.data.success) {
        onSuccess?.(response.data);
        // Reset form
        setFormData({
          product_id: '',
          warehouse_id: '',
          quantity: '',
          batch_number: '',
          vehicle_number: '',
          driver_name: '',
          source: '',
          destination: '',
          unit_cost: '',
          notes: ''
        });
        setErrors({});
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to record stock movement' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectedProduct = products.find(p => p.id.toString() === formData.product_id);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Record {movementType === 'in' ? 'Inbound' : 'Outbound'} Stock Movement
        </h2>
        <p className="text-gray-600">
          {movementType === 'in' 
            ? 'Record goods entering the warehouse from suppliers or production'
            : 'Record goods leaving the warehouse for customers or transfers'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.product_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
            )}
          </div>

          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              name="warehouse_id"
              value={formData.warehouse_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.warehouse_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a warehouse</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
            {errors.warehouse_id && (
              <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              step="0.001"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number *
            </label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.batch_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter batch number"
            />
            {errors.batch_number && (
              <p className="mt-1 text-sm text-red-600">{errors.batch_number}</p>
            )}
          </div>

          {/* Vehicle Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicle_number"
              value={formData.vehicle_number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.vehicle_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., KHI-1234"
            />
            {errors.vehicle_number && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle_number}</p>
            )}
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Name *
            </label>
            <input
              type="text"
              name="driver_name"
              value={formData.driver_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.driver_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter driver name"
            />
            {errors.driver_name && (
              <p className="mt-1 text-sm text-red-600">{errors.driver_name}</p>
            )}
          </div>

          {/* Source (for inbound) or Destination (for outbound) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {movementType === 'in' ? 'Source *' : 'Destination *'}
            </label>
            <input
              type="text"
              name={movementType === 'in' ? 'source' : 'destination'}
              value={movementType === 'in' ? formData.source : formData.destination}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[movementType === 'in' ? 'source' : 'destination'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={movementType === 'in' ? 'Enter source/supplier' : 'Enter destination/customer'}
            />
            {errors[movementType === 'in' ? 'source' : 'destination'] && (
              <p className="mt-1 text-sm text-red-600">{errors[movementType === 'in' ? 'source' : 'destination']}</p>
            )}
          </div>

          {/* Unit Cost (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Cost (Optional)
            </label>
            <input
              type="number"
              name="unit_cost"
              value={formData.unit_cost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter unit cost"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes or comments"
          />
        </div>

        {/* Product Info Display */}
        {selectedProduct && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Product Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">SKU:</span> {selectedProduct.sku}
              </div>
              {selectedProduct.batch_number && (
                <div>
                  <span className="font-medium">Default Batch:</span> {selectedProduct.batch_number}
                </div>
              )}
              {selectedProduct.expiry_date && (
                <div>
                  <span className="font-medium">Expiry Date:</span> {selectedProduct.expiry_date}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : movementType === 'in' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Recording...' : `Record ${movementType === 'in' ? 'Inbound' : 'Outbound'} Movement`}
          </button>
        </div>
      </form>
    </div>
  );
};
