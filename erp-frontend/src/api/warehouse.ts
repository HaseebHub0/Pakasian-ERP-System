import client from './client';

export const warehouseAPI = {
  // Picking Lists
  getPickingLists: async () => {
    const response = await client.get('/api/warehouse/picking-lists/');
    return response.data;
  },
  createPickingList: async (data: any) => {
    const response = await client.post('/api/warehouse/picking-lists/', data);
    return response.data;
  },
  updatePickingList: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/warehouse/picking-lists/${id}/`, data);
    return response.data;
  },

  // Dispatch Orders
  getDispatchOrders: async () => {
    const response = await client.get('/api/warehouse/dispatch/');
    return response.data;
  },
  createDispatchOrder: async (data: any) => {
    const response = await client.post('/api/warehouse/dispatch/', data);
    return response.data;
  },

  // Stock Transfers
  getStockTransfers: async () => {
    const response = await client.get('/api/warehouse/transfers/');
    return response.data;
  }
};
