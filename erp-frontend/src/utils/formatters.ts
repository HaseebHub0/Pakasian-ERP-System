import { format } from 'date-fns';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

export const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (['approved', 'completed', 'active', 'delivered', 'good', 'grn', 'success'].includes(s)) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (['pending', 'submitted', 'warning', 'conditional', 'in-progress', 'draft'].includes(s)) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (['rejected', 'cancelled', 'critical', 'damage', 'error', 'change oil now'].includes(s)) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (['dispatched', 'sales dispatch', 'processing'].includes(s)) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  return 'bg-gray-100 text-gray-800 border-gray-200';
};
