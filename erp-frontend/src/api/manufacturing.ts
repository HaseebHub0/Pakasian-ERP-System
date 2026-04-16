import client from './client';

export const manufacturingAPI = {
  // Production Orders
  getOrders: async () => {
    const response = await client.get('/api/manufacturing/orders/');
    return response.data;
  },
  createOrder: async (data: any) => {
    const response = await client.post('/api/manufacturing/orders/', data);
    return response.data;
  },
  updateOrder: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/manufacturing/orders/${id}/`, data);
    return response.data;
  },

  // Batches
  getBatches: async () => {
    const response = await client.get('/api/manufacturing/batches/');
    return response.data;
  },
  createBatch: async (data: any) => {
    const response = await client.post('/api/manufacturing/batches/', data);
    return response.data;
  },
  updateBatch: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/manufacturing/batches/${id}/`, data);
    return response.data;
  },

  // Batch Trace
  getBatchTrace: async (batchNumber: string) => {
    const response = await client.get(`/api/manufacturing/batches/${batchNumber}/trace/`);
    return response.data;
  }
};
