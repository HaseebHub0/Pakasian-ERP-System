import client from './client';

export const getInventoryLedger = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/inventory/ledger/', { params });
  return data;
};

export const getStockSummary = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/inventory/stock-summary/', { params });
  return data;
};

export const getLowStockAlerts = async () => {
  const { data } = await client.get('/api/inventory/stock-summary/', {
    params: { below_reorder: true, page_size: 1000 },
  });
  const results = data?.results ?? data ?? [];
  return { results, count: data?.count ?? results.length };
};

export const getBatches = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/inventory/batches/', { params });
  return data;
};

export const getInventorySummary = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/inventory/summary/', { params });
  return data;
};
