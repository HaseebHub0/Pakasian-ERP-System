import { format, isValid } from 'date-fns';

export const formatCurrency = (amount: number | string) => {
  const num = Number(amount);
  if (isNaN(num)) return 'PKR 0';
  
  const formatted = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  
  return formatted.replace('PKR', 'PKR ').trim();
};

export const formatDate = (date: string | Date | number) => {
  if (!date) return '';
  const d = new Date(date);
  return isValid(d) ? format(d, 'dd MMM yyyy') : '';
};

export const formatDateTime = (dt: string | Date | number) => {
  if (!dt) return '';
  const d = new Date(dt);
  return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm') : '';
};

export const formatNumber = (n: number | string) => {
  const num = Number(n);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
  }).format(num);
};

export const getStatusColor = (status: string) => {
  const normStatus = status?.toUpperCase() || '';
  
  switch (normStatus) {
    case 'PENDING':
    case 'DRAFT':
    case 'ON HOLD':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    
    case 'APPROVED':
    case 'COMPLETED':
    case 'RECEIVED':
    case 'ACTIVE':
    case 'DELIVERED':
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200 border';
      
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200 border';
      
    case 'IN PROGRESS':
    case 'PARTIAL':
    case 'SHIPPED':
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800 border-blue-200 border';
      
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 border';
  }
};
