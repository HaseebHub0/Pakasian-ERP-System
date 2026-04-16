import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Wallet, 
  AlertTriangle, 
  Activity, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Layers,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { StatCard, Table, Badge } from '@/components/ui/Shared';
import { LoadingSpinner } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  // Row 1 & 2 Data
  const { data: dailySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        today_revenue: 0,
        cash_balance: 0,
        outstanding_receivables: 0,
        outstanding_payables: 0,
      };
    },
    refetchInterval: 30000,
  });

  React.useEffect(() => {
    if (dailySummary) {
      setLastUpdated(new Date());
    }
  }, [dailySummary]);

  const { data: productionToday, isLoading: loadingProductionToday } = useQuery({
    queryKey: ['production-today'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return [];
    },
    refetchInterval: 30000
  });

  const { data: pendingOrders, isLoading: loadingPendingOrders } = useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
      return { count: 0 };
    },
    refetchInterval: 30000
  });

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['low-stock-count'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { count: 0 };
    },
    refetchInterval: 30000
  });

  const { data: activeBatches, isLoading: loadingActiveBatches } = useQuery({
    queryKey: ['active-batches-count'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 900));
      return { count: 0 };
    },
    refetchInterval: 30000
  });

  const { data: salesTrend, isLoading: loadingSalesTrend } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    refetchInterval: 30000
  });

  const { data: productionTrend, isLoading: loadingProductionTrend } = useQuery({
    queryKey: ['production-trend'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      return [];
    },
    refetchInterval: 30000
  });

  const { data: recentOrders, isLoading: loadingRecentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return [];
    },
    refetchInterval: 30000
  });

  const { data: expiringBatches, isLoading: loadingExpiringBatches } = useQuery({
    queryKey: ['expiring-batches'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1300));
      return [];
    },
    refetchInterval: 30000
  });

  const isLoading = loadingSummary || loadingProductionToday || loadingPendingOrders || 
                    loadingLowStock || loadingActiveBatches || loadingSalesTrend || 
                    loadingProductionTrend || loadingRecentOrders || loadingExpiringBatches;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const unitsProducedToday = Array.isArray(productionToday) 
    ? productionToday.reduce((acc: number, b: any) => acc + (b.actual_quantity || 0), 0)
    : 0;

  const pendingOrdersCount = Array.isArray(pendingOrders) ? pendingOrders.length : (pendingOrders?.count || 0);
  const lowStockCount = Array.isArray(lowStock) ? lowStock.length : (lowStock?.count || 0);
  const activeBatchesCount = Array.isArray(activeBatches) ? activeBatches.length : (activeBatches?.count || 0);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time operational and financial insights for Pakistani Foods.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Calendar size={18} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Sync</p>
            <p className="text-sm font-bold text-slate-700">{lastUpdated.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Row 1: Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <StatCard 
            icon={TrendingUp} 
            label="Daily Revenue" 
            value={formatCurrency(dailySummary?.today_revenue || 0)} 
            trend={{ value: '12.4%', isUp: true }}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={Zap} 
            label="Production Output" 
            value={unitsProducedToday.toLocaleString()} 
            trend={{ value: '5.2%', isUp: true }}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={ShoppingCart} 
            label="Pending Orders" 
            value={pendingOrdersCount.toString()} 
            trend={{ value: '2', isUp: false }}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={Wallet} 
            label="Net Liquidity" 
            value={formatCurrency(dailySummary?.cash_balance || 0)} 
          />
        </motion.div>
      </div>

      {/* Row 2: Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <StatCard 
            icon={ArrowUpRight} 
            label="Accounts Receivable" 
            value={formatCurrency(dailySummary?.outstanding_receivables || 0)} 
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={ArrowDownRight} 
            label="Accounts Payable" 
            value={formatCurrency(dailySummary?.outstanding_payables || 0)} 
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={AlertTriangle} 
            label="Stock Alerts" 
            value={lowStockCount.toString()} 
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            icon={Layers} 
            label="Active Batches" 
            value={activeBatchesCount.toString()} 
          />
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Performance</h3>
              <p className="text-sm text-slate-500">Daily sales revenue trend over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button className="px-3 py-1.5 text-xs font-bold bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200">Revenue</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Orders</button>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })} 
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `PKR ${val/1000}k`} 
                />
                <Tooltip 
                  cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => formatDate(label)}
                  formatter={(val: number) => [formatCurrency(val), 'Revenue']} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Production Mix</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionTrend || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="product_name" 
                  type="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="actual_quantity" name="Quantity" radius={[0, 8, 8, 0]} barSize={24}>
                  {(productionTrend || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Sales</h3>
            <button 
              onClick={() => navigate('/sales/orders')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>
          <Table
            columns={[
              { header: 'Order #', accessor: 'order_number' },
              { header: 'Customer', accessor: 'customer_name' },
              { header: 'Total', accessor: 'total_amount', render: (val) => formatCurrency(val) },
              { 
                header: 'Status', 
                accessor: 'order_status', 
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
              },
            ]}
            data={(recentOrders || []).slice(0, 5)}
          />
        </motion.div>

        <motion.div variants={item} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Expiring Batches</h3>
            <button 
              onClick={() => navigate('/inventory/stock')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Manage Stock
            </button>
          </div>
          <Table
            columns={[
              { header: 'Batch #', accessor: 'batch_number' },
              { header: 'Product', accessor: 'product_name' },
              { header: 'Expiry', accessor: 'expiry_date', render: (val) => formatDate(val) },
              { 
                header: 'Status', 
                accessor: 'status', 
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
              },
            ]}
            data={(expiringBatches || [])}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
