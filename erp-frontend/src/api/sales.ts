import client from './client';

export interface SalesOrder {
  id: number;
  order_number: string;
  customer_name?: string;
  customer?: { name: string };
  total_amount: number;
  order_status: string;
  order_date: string;
}

export const getSalesOrders = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/sales/orders/', { params });
  return data;
};

export const getPendingSalesOrders = async () => {
  const { data } = await client.get('/api/sales/orders/', {
    params: { order_status: 'Received', page_size: 10 },
  });
  return data;
};

export const getRecentSalesOrders = async (limit = 10) => {
  const { data } = await client.get('/api/sales/orders/', {
    params: { page_size: limit, ordering: '-order_date' },
  });
  return data;
};

export const getDispatches = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/sales/dispatches/', { params });
  return data;
};

export const getReturns = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/sales/returns/', { params });
  return data;
};
