import React from 'react';
import { BarChart2, TrendingUp, Users, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { formatCurrency } from '@/utils/formatters';

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
);

export const ProcurementAnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['procurement-analytics'],
    queryFn: procurementAPI.getProcurementAnalytics,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load analytics.</div>;

  const monthly: any[] = analytics?.monthly_spend || [];
  const topSuppliers: any[] = analytics?.top_suppliers || [];
  const priceFluctuations: any[] = analytics?.price_fluctuations || [];
  const rejection = analytics?.supplier_rejection_rate || {};

  const totalSpend = monthly.reduce((sum: number, m: any) => sum + parseFloat(m.total || 0), 0);
  const rejectionRate = rejection.rejection_rate_pct ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Procurement Analytics</h2>
        <p className="text-sm text-gray-500">Spend trends, supplier performance, and QC metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart2}
          label="Total Spend (12 mo)"
          value={formatCurrency(totalSpend)}
          sub="Accounts Payable settlements"
          color="bg-indigo-500"
        />
        <StatCard
          icon={Users}
          label="Active Suppliers"
          value={topSuppliers.length}
          sub="With AP transactions"
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Price Fluctuations"
          value={priceFluctuations.length}
          sub="Materials with price changes"
          color="bg-amber-500"
        />
        <StatCard
          icon={ShieldAlert}
          label="QC Rejection Rate"
          value={`${rejectionRate}%`}
          sub={`${rejection.rejected ?? 0} / ${rejection.total_inspections ?? 0} inspections`}
          color={rejectionRate > 10 ? 'bg-red-500' : 'bg-green-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spend Table */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700">Monthly Spend</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Month</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
                )}
                {monthly.map((m: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{m.month}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers Table */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700">Top Suppliers by Spend</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Supplier</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliers.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
                )}
                {topSuppliers.map((s: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{s.supplier_name || s.supplier_id}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Price Fluctuations */}
      {priceFluctuations.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700">Price Fluctuations</h3>
            <p className="text-xs text-gray-400">Materials with multiple price changes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Material</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium">Price Changes</th>
                </tr>
              </thead>
              <tbody>
                {priceFluctuations.map((p: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{p.material_name || p.material_id}</td>
                    <td className="px-4 py-2 text-right text-amber-600 font-medium">{p.changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
