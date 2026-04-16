import client from './client';

export const inventoryAPI = {
  // Inventory Ledger
  getLedger: async () => {
    const response = await client.get('/api/inventory/ledger/');
    return response.data;
  },

  // Stock Summary
  getSummary: async () => {
    const response = await client.get('/api/inventory/summary/');
    return response.data;
  },

  // Stock Transfers
  getTransfers: async () => {
    const response = await client.get('/api/inventory/stock-transfers/');
    return response.data;
  },
  createTransfer: async (data: any) => {
    const response = await client.post('/api/inventory/stock-transfers/', data);
    return response.data;
  },

  // Inventory Adjustments
  getAdjustments: async () => {
    const response = await client.get('/api/inventory/adjustments/');
    return response.data;
  },
  createAdjustment: async (data: any) => {
    const response = await client.post('/api/inventory/adjustments/', data);
    return response.data;
  }
};
