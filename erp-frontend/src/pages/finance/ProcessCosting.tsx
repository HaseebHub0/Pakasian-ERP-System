import React from 'react';
import { Calculator, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const mockBatchCosts: any[] = [];

export const ProcessCostingPage: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = React.useState<any>(null);

  const totalProductionValue = mockBatchCosts.reduce((acc, curr) => acc + curr.total_cost, 0);
  const avgMargin = mockBatchCosts.reduce((acc, curr) => acc + curr.margin, 0) / mockBatchCosts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Process Costing</h2>
          <p className="text-sm text-gray-500">Analyze production costs and SKU profitability</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline gap-2">
            <Calculator size={18} /> Update Standards
          </button>
          <button className="btn btn-primary gap-2">
            <TrendingUp size={18} /> Profitability Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Batch Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalProductionValue)}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <ArrowDownRight size={12} /> 2.4% vs last month
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Avg. Gross Margin</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <ArrowUpRight size={12} /> 1.2% improvement
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Cost Variance</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">+4.2%</p>
          <p className="text-xs text-amber-600 mt-1">Above standard cost</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PieChartIcon size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Waste Impact</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(16100)}</p>
          <p className="text-xs text-red-600 mt-1">3.6% of total cost</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Batch Cost Summary</h3>
        </div>
        <Table
          columns={[
            { header: 'Batch ID', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Product', accessor: 'product' },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { header: 'Units', accessor: 'units', render: (val) => val.toLocaleString() },
            { header: 'Total Cost', accessor: 'total_cost', render: (val) => formatCurrency(val) },
            { header: 'Unit Cost', accessor: 'unit_cost', render: (val) => <span className="font-bold">{formatCurrency(val)}</span> },
            { 
              header: 'Margin', 
              accessor: 'margin', 
              render: (val) => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-xs font-bold text-green-700">{val}%</span>
                </div>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <button 
                  onClick={() => setSelectedBatch(row)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  View Breakdown
                </button>
              )
            }
          ]}
          data={mockBatchCosts}
        />
      </div>

      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={`Cost Breakdown: ${selectedBatch?.id}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={selectedBatch?.breakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(selectedBatch?.breakdown || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 border-b pb-2">Cost Components</h4>
              <div className="space-y-3">
                {(selectedBatch?.breakdown || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex items-center justify-between font-bold text-lg">
                  <span>Total Cost</span>
                  <span>{formatCurrency(selectedBatch?.total_cost)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Units Produced</p>
              <p className="text-xl font-bold text-blue-900">{selectedBatch?.units.toLocaleString()}</p>
            </div>
            <div className="text-center border-x border-blue-200">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Unit Cost</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedBatch?.unit_cost)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Profit Margin</p>
              <p className="text-xl font-bold text-green-600">{selectedBatch?.margin}%</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setSelectedBatch(null)} className="btn btn-primary">Close Breakdown</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
