import client from './client';
import { format } from 'date-fns';

export interface ProductionBatch {
  id: number;
  batch_number: string;
  product_name?: string;
  product?: { name: string };
  actual_quantity: number;
  status: string;
  start_date?: string;
  end_date?: string;
  expiry_date?: string;
  warehouse?: string;
}

export interface ProductionTrend {
  date: string;
  product_name: string;
  quantity: number;
}

export const getProductionBatches = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/manufacturing/production-batches/', { params });
  return data;
};

export const getTodayProduction = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data } = await client.get('/api/manufacturing/production-batches/', {
    params: { date: today, page_size: 1000 },
  });
  const results: ProductionBatch[] = data?.results ?? data ?? [];
  const totalUnits = results.reduce((sum, b) => sum + (Number(b.actual_quantity) || 0), 0);
  return { results, totalUnits };
};

export const getActiveProductionBatches = async () => {
  const { data } = await client.get('/api/manufacturing/production-batches/', {
    params: { status: 'Running', page_size: 1000 },
  });
  const results: ProductionBatch[] = data?.results ?? data ?? [];
  return { results, count: data?.count ?? results.length };
};

export const getProductionTrend = async (days = 7): Promise<ProductionTrend[]> => {
  const { data } = await client.get('/api/manufacturing/reports/production-trend/', {
    params: { days },
  });
  return data;
};

export const getExpiringBatches = async (withinDays = 60) => {
  const { data } = await client.get('/api/manufacturing/production-batches/', {
    params: { expiring_within: withinDays, page_size: 10 },
  });
  return data;
};

export const getProductionOrders = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/manufacturing/production-orders/', { params });
  return data;
};
