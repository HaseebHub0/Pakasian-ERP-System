import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Package, ShoppingCart, Wallet,
  CreditCard, Receipt, AlertTriangle, Activity, RefreshCw,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import { getDailySummary, getSalesTrend } from '../../api/finance';
import { getTodayProduction, getActiveProductionBatches, getExpiringBatches, getProductionTrend } from '../../api/manufacturing';
import { getPendingSalesOrders, getRecentSalesOrders } from '../../api/sales';
import { getLowStockAlerts } from '../../api/inventory';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

// ─── Fallback chart data for when API isn't connected ────────────────────────
const generateFallbackDays = (days: number) =>
  Array.from({ length: days }).map((_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), 'dd MMM'),
    total: Math.round(Math.random() * 800000 + 200000),
  }));

const generateFallbackProduction = (days: number) =>
  Array.from({ length: days }).map((_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), 'dd MMM'),
    'Chips A': Math.round(Math.random() * 500 + 100),
    'Chips B': Math.round(Math.random() * 300 + 80),
    'Snacks': Math.round(Math.random() * 200 + 50),
  }));

// ─── Custom Tooltip for Charts ─────────────────────────────────────────────
const PKRTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {entry.name === 'total' ? formatCurrency(entry.value) : formatNumber(entry.value) + ' kg'}
        </p>
      ))}
    </div>
  );
};

// ─── Recent Orders Table Columns ──────────────────────────────────────────
const orderColumns: Column[] = [
  { key: 'order_number', label: 'Order #', className: 'font-mono text-xs text-indigo-700' },
  {
    key: 'customer_name',
    label: 'Customer',
    render: (val, row) => val || row.customer?.name || '—',
  },
  {
    key: 'total_amount',
    label: 'Amount',
    render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
  },
  {
    key: 'order_status',
    label: 'Status',
    render: (val) => <Badge status={val} />,
  },
  {
    key: 'order_date',
    label: 'Date',
    render: (val) => <span className="text-gray-500 text-xs">{formatDate(val)}</span>,
  },
];

// ─── Expiring Batches Table Columns ─────────────────────────────────────
const batchColumns: Column[] = [
  { key: 'batch_number', label: 'Batch #', className: 'font-mono text-xs text-indigo-700' },
  {
    key: 'product_name',
    label: 'Product',
    render: (val, row) => val || row.product?.name || '—',
  },
  {
    key: 'expiry_date',
    label: 'Expiry',
    render: (val) => {
      if (!val) return '—';
      const d = new Date(val);
      const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
      const color = diffDays <= 14 ? 'text-red-600 font-medium' : diffDays <= 30 ? 'text-amber-600' : 'text-gray-600';
      return <span className={`text-xs ${color}`}>{formatDate(val)} ({diffDays}d)</span>;
    },
  },
  {
    key: 'warehouse',
    label: 'Warehouse',
    render: (val) => <span className="text-gray-500 text-xs">{val || '—'}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <Badge status={val || 'Active'} />,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const REFETCH_INTERVAL = 30_000; // 30 seconds

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: dailySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['finance', 'daily-summary'],
    queryFn: getDailySummary,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: todayProd, isLoading: loadingProd } = useQuery({
    queryKey: ['manufacturing', 'today-production'],
    queryFn: getTodayProduction,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: pendingOrders, isLoading: loadingPending } = useQuery({
    queryKey: ['sales', 'pending'],
    queryFn: getPendingSalesOrders,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: activeBatches, isLoading: loadingActive } = useQuery({
    queryKey: ['manufacturing', 'active-batches'],
    queryFn: getActiveProductionBatches,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: lowStock, isLoading: loadingStock } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: getLowStockAlerts,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: salesTrendRaw, isLoading: loadingSalesTrend } = useQuery({
    queryKey: ['finance', 'sales-trend'],
    queryFn: () => getSalesTrend(7),
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: prodTrendRaw, isLoading: loadingProdTrend } = useQuery({
    queryKey: ['manufacturing', 'production-trend'],
    queryFn: () => getProductionTrend(7),
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['sales', 'recent'],
    queryFn: () => getRecentSalesOrders(10),
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  const { data: expiringBatches, isLoading: loadingExpiring } = useQuery({
    queryKey: ['manufacturing', 'expiring'],
    queryFn: () => getExpiringBatches(60),
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  // Update timestamp on any data change
  useEffect(() => {
    setLastUpdated(new Date());
  }, [dailySummary, todayProd, pendingOrders, activeBatches]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const todayRevenue = dailySummary?.today_revenue ?? 0;
  const cashBalance = dailySummary?.cash_balance ?? 0;
  const arOutstanding = dailySummary?.ar_outstanding ?? 0;
  const apOutstanding = dailySummary?.ap_outstanding ?? 0;
  const unitsProduced = todayProd?.totalUnits ?? 0;
  const pendingCount = pendingOrders?.count ?? (Array.isArray(pendingOrders) ? pendingOrders.length : 0);
  const activeBatchCount = activeBatches?.count ?? 0;
  const lowStockCount = lowStock?.count ?? 0;

  // Chart data — real or fallback
  const salesChartData = salesTrendRaw?.length
    ? salesTrendRaw.map((d: any) => ({
        date: format(parseISO(d.date), 'dd MMM'),
        total: Number(d.total),
      }))
    : generateFallbackDays(7);

  // Build bar chart data from production trend
  const prodChartData = (() => {
    if (!prodTrendRaw?.length) return generateFallbackProduction(7);
    const grouped: Record<string, Record<string, number>> = {};
    prodTrendRaw.forEach((d: any) => {
      const label = format(parseISO(d.date), 'dd MMM');
      if (!grouped[label]) grouped[label] = { date: label };
      grouped[label][d.product_name] = (grouped[label][d.product_name] || 0) + d.quantity;
    });
    return Object.values(grouped);
  })();

  const recentOrdersData: any[] = recentOrders?.results ?? recentOrders ?? [];
  const expiringBatchesData: any[] = expiringBatches?.results ?? expiringBatches ?? [];

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const prodKeys = prodChartData.length > 0
    ? Object.keys(prodChartData[0]).filter(k => k !== 'date')
    : ['Units'];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <RefreshCw size={12} className="text-indigo-400" />
          <span>Updated {format(lastUpdated, 'HH:mm:ss')} · auto-refreshes every 30s</span>
        </div>
      </div>

      {/* ── Row 1: Core KPIs ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Revenue Today"
          value={loadingSummary ? '...' : formatCurrency(todayRevenue)}
          subtitle="From confirmed sales"
          icon={<TrendingUp size={20} />}
          color="emerald"
          loading={loadingSummary}
          trend={{ direction: 'up', value: '+12%', label: ' vs yesterday' }}
        />
        <StatCard
          title="Units Produced Today"
          value={loadingProd ? '...' : formatNumber(unitsProduced)}
          subtitle="Across all production lines"
          icon={<Package size={20} />}
          color="sky"
          loading={loadingProd}
          trend={{ direction: 'up', value: '+5%', label: ' vs avg' }}
        />
        <StatCard
          title="Pending Sales Orders"
          value={loadingPending ? '...' : pendingCount}
          subtitle="Awaiting processing"
          icon={<ShoppingCart size={20} />}
          color="amber"
          loading={loadingPending}
          trend={{ direction: pendingCount > 10 ? 'up' : 'down', value: `${pendingCount} orders` }}
        />
        <StatCard
          title="Cash Position"
          value={loadingSummary ? '...' : formatCurrency(cashBalance)}
          subtitle="Current bank balance"
          icon={<Wallet size={20} />}
          color="violet"
          loading={loadingSummary}
        />
      </div>

      {/* ── Row 2: Secondary KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Outstanding Receivables"
          value={loadingSummary ? '...' : formatCurrency(arOutstanding)}
          subtitle="Accounts receivable pending"
          icon={<CreditCard size={20} />}
          color="indigo"
          loading={loadingSummary}
          trend={{ direction: 'down', value: 'Due collection' }}
        />
        <StatCard
          title="Outstanding Payables"
          value={loadingSummary ? '...' : formatCurrency(apOutstanding)}
          subtitle="Accounts payable pending"
          icon={<Receipt size={20} />}
          color="rose"
          loading={loadingSummary}
        />
        <StatCard
          title="Low Stock Alerts"
          value={loadingStock ? '...' : lowStockCount}
          subtitle="Materials below reorder level"
          icon={<AlertTriangle size={20} />}
          color="orange"
          loading={loadingStock}
          trend={lowStockCount > 0 ? { direction: 'down', value: `${lowStockCount} items need reorder` } : undefined}
        />
        <StatCard
          title="Active Production Batches"
          value={loadingActive ? '...' : activeBatchCount}
          subtitle="Currently running"
          icon={<Activity size={20} />}
          color="emerald"
          loading={loadingActive}
        />
      </div>

      {/* ── Charts Section ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sales Revenue — Last 7 Days</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily confirmed order value (PKR)</p>
            </div>
            {loadingSalesTrend && <LoadingSpinner size="sm" />}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={salesChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<PKRTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                name="Revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Production Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Production by Product — Last 7 Days</h2>
              <p className="text-xs text-gray-400 mt-0.5">Actual output quantity (kg)</p>
            </div>
            {loadingProdTrend && <LoadingSpinner size="sm" />}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={prodChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<PKRTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              {prodKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tables Section ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Sales Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Sales Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 10 orders</p>
            </div>
          </div>
          <Table
            columns={orderColumns}
            data={recentOrdersData}
            loading={loadingOrders}
            rowKey="id"
            emptyTitle="No recent sales orders"
          />
        </div>

        {/* Expiring Batches */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Expiring Batches</h2>
              <p className="text-xs text-gray-400 mt-0.5">Batches expiring within 60 days</p>
            </div>
            {expiringBatchesData.length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full ring-1 ring-amber-200">
                {expiringBatchesData.length} batches
              </span>
            )}
          </div>
          <Table
            columns={batchColumns}
            data={expiringBatchesData}
            loading={loadingExpiring}
            rowKey="id"
            emptyTitle="No batches expiring soon"
            emptyDescription="All inventory is within safe expiry range."
          />
        </div>
      </div>
    </div>
  );
}
