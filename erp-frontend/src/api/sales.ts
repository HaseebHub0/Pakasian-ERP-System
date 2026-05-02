import client from './client';

export const salesAPI = {
  // Customers
  getCustomers: async () => {
    const response = await client.get('/api/sales/customers/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createCustomer: async (data: any) => {
    const response = await client.post('/api/sales/customers/', data);
    return response.data;
  },
  updateCustomer: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/sales/customers/${id}/`, data);
    return response.data;
  },
  deleteCustomer: async (id: number | string) => {
    const response = await client.delete(`/api/sales/customers/${id}/`);
    return response.data;
  },

  // Sales Orders
  getOrders: async () => {
    const response = await client.get('/api/sales/orders/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createOrder: async (data: any) => {
    const response = await client.post('/api/sales/orders/', data);
    return response.data;
  },

  // Dispatch
  getDispatches: async () => {
    const response = await client.get('/api/sales/dispatch/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createDispatch: async (data: any) => {
    const response = await client.post('/api/sales/dispatch/', data);
    return response.data;
  },

  // Returns
  getReturns: async () => {
    const response = await client.get('/api/sales/returns/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createReturn: async (data: any) => {
    const response = await client.post('/api/sales/returns/', data);
    return response.data;
  }
};
