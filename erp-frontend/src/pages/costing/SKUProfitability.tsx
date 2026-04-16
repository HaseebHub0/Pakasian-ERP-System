import React from 'react';
import { TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Table } from '@/components/ui/Shared';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const profitabilityData = [
  { product: 'Nimko Mix 200g', price: 180, cost: 120, profit: 60, margin: 33.3 },
  { product: 'Potato Chips 50g', price: 60, cost: 45, profit: 15, margin: 25.0 },
  { product: 'Dal Moong 100g', price: 90, cost: 65, profit: 25, margin: 27.8 },
  { product: 'Salted Peanuts 40g', price: 40, cost: 30, profit: 10, margin: 25.0 },
  { product: 'Spicy Sev 150g', price: 140, cost: 95, profit: 45, margin: 32.1 },
];

export const SKUProfitabilityPage: React.FC = () => {
  const getMarginColor = (margin: number) => {
    if (margin > 30) return 'text-green-600 font-bold';
    if (margin >= 15) return 'text-amber-600 font-bold';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">SKU Profitability</h2>
          <p className="text-sm text-gray-500">Analyze margins and profit performance per product</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table
              columns={[
                { header: 'Product', accessor: 'product', render: (val) => <span className="font-medium">{val}</span> },
                { header: 'Selling Price', accessor: 'price', render: (val) => formatCurrency(val) },
                { header: 'Unit Cost', accessor: 'cost', render: (val) => formatCurrency(val) },
                { 
                  header: 'Profit/Unit', 
                  accessor: 'profit', 
                  render: (val) => (
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                      {formatCurrency(val)}
                      <ArrowUpRight size={14} />
                    </span>
                  )
                },
                { 
                  header: 'Margin %', 
                  accessor: 'margin', 
                  render: (val) => <span className={getMarginColor(val)}>{val}%</span> 
                },
              ]}
              data={profitabilityData}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Margin Comparison (%)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitabilityData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 40]} />
                <YAxis dataKey="product" type="category" width={100} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                  {profitabilityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.margin > 30 ? '#1A7A4A' : entry.margin >= 15 ? '#B8860B' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <p className="text-xs text-green-700 font-bold uppercase mb-1">Highest Margin SKU</p>
          <p className="text-xl font-bold text-green-900">Nimko Mix 200g</p>
          <p className="text-3xl font-black text-green-600 mt-2">33.3%</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-700 font-bold uppercase mb-1">Avg. Portfolio Margin</p>
          <p className="text-xl font-bold text-blue-900">FMCG Standard</p>
          <p className="text-3xl font-black text-blue-600 mt-2">28.4%</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-700 font-bold uppercase mb-1">Lowest Margin SKU</p>
          <p className="text-xl font-bold text-amber-900">Potato Chips 50g</p>
          <p className="text-3xl font-black text-amber-600 mt-2">25.0%</p>
        </div>
      </div>
    </div>
  );
};
