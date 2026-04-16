import React from 'react';
import { Calculator, PieChart as PieChartIcon, TrendingDown, DollarSign } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Table } from '@/components/ui/Shared';
import { formatCurrency } from '@/utils/formatters';
import { useManufacturingStore } from '@/store/useManufacturingStore';

export const BatchCostPage: React.FC = () => {
  const { batches } = useManufacturingStore();
  const [selectedBatchId, setSelectedBatchId] = React.useState(batches[0]?.id || '');

  const batch = batches.find(b => b.id === selectedBatchId);

  const costBreakdown = [
    { name: 'Material Cost', value: (batch?.totalCost || 0) * 0.6, color: '#1B3A6B' },
    { name: 'Packaging Cost', value: (batch?.totalCost || 0) * 0.15, color: '#2E75B6' },
    { name: 'Labour Cost', value: (batch?.totalCost || 0) * 0.1, color: '#1A7A4A' },
    { name: 'Machine Cost', value: (batch?.totalCost || 0) * 0.05, color: '#B8860B' },
    { name: 'Energy Cost', value: (batch?.totalCost || 0) * 0.04, color: '#6366f1' },
    { name: 'Overhead Cost', value: (batch?.totalCost || 0) * 0.04, color: '#94a3b8' },
    { name: 'Waste Cost', value: (batch?.totalCost || 0) * 0.02, color: '#ef4444' },
  ];

  const totalCost = batch?.totalCost || 0;
  const unitsProduced = batch?.actualQty || 0;
  const unitCost = unitsProduced > 0 ? totalCost / unitsProduced : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Batch Cost Analysis</h2>
          <p className="text-sm text-gray-500">Detailed cost breakdown per production run</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm bg-white font-medium"
          >
            {batches.filter(b => b.status === 'Completed').map(b => (
              <option key={b.id} value={b.id}>{b.id} - {b.productName}</option>
            ))}
            {batches.filter(b => b.status === 'Completed').length === 0 && (
              <option value="">No completed batches</option>
            )}
          </select>
          <button className="btn btn-primary gap-2">
            <Calculator size={18} /> Recalculate
          </button>
        </div>
      </div>

      {!batch ? (
        <div className="bg-white p-12 rounded-xl border shadow-sm text-center text-gray-500">
          Please select a completed batch to view cost analysis.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="font-bold text-gray-800">Cost Breakdown: {batch.id}</h3>
              </div>
              <Table
                columns={[
                  { header: 'Cost Component', accessor: 'name', render: (val) => <span className="font-medium">{val}</span> },
                  { header: 'Amount', accessor: 'value', render: (val) => formatCurrency(val) },
                  { 
                    header: 'Percentage', 
                    accessor: 'value', 
                    render: (val) => `${totalCost > 0 ? ((val / totalCost) * 100).toFixed(1) : 0}%` 
                  },
                ]}
                data={costBreakdown}
              />
              <div className="p-6 bg-primary text-white flex justify-between items-center">
                <span className="text-lg font-bold">Total Batch Cost</span>
                <span className="text-2xl font-bold">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Units Produced</p>
                    <p className="text-xl font-bold">{unitsProduced.toLocaleString()} Packs</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Unit Cost per Pack</p>
                    <p className="text-xl font-bold">{formatCurrency(unitCost)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <PieChartIcon size={18} className="text-primary" />
                Cost Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-2">
                {costBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-bold">{totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
