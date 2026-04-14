import client from './client';
import { format } from 'date-fns';

export interface DailySummary {
  today_revenue: number;
  cash_balance: number;
  ar_outstanding: number;
  ap_outstanding: number;
  date?: string;
}

export interface SalesTrend {
  date: string;
  total: number;
}

export const getDailySummary = async (): Promise<DailySummary> => {
  const { data } = await client.get('/api/finance/reports/daily-summary/');
  return data;
};

export const getSalesTrend = async (days = 7): Promise<SalesTrend[]> => {
  const { data } = await client.get('/api/finance/reports/sales-trend/', {
    params: { days },
  });
  return data;
};

export const getJournalEntries = async (params?: Record<string, any>) => {
  const { data } = await client.get('/api/finance/journal-entries/', { params });
  return data;
};

export const getChartOfAccounts = async () => {
  const { data } = await client.get('/api/finance/chart-of-accounts/');
  return data;
};
