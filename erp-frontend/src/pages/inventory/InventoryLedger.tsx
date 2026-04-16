import React from 'react';
import { Lock, Filter, Download, Calendar } from 'lucide-react';
import { Table, Badge } from '@/components/ui/Shared';
import { getStatusColor } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const mockLedgerData = [
  { timestamp: '2026-03-27 14:30', item: 'Palm Oil', batch: 'B-9921', warehouse: 'Factory', type: 'GRN', reference: 'GRN-2026-045', qty_in: 500, qty_out: 0, balance: 1500, unit: 'Litre' },
  { timestamp: '2026-03-27 11:15', item: 'Nimko Mix 200g', batch: 'BN-260312A', warehouse: 'Regional', type: 'Sales Dispatch', reference: 'DO-2026-112', qty_in: 0, qty_out: 120, balance: 4380, unit: 'Pack' },
  { timestamp: '2026-03-26 16:45', item: 'Red Chilli Powder', batch: 'B-8812', warehouse: 'Factory', type: 'Production Issue', reference: 'MO-2026-088', qty_in: 0, qty_out: 5, balance: 40, unit: 'Kg' },
  { timestamp: '2026-03-26 09:30', item: 'Potato Chips 50g', batch: 'BN-260315B', warehouse: 'City', type: 'Adjustment', reference: 'ADJ-2026-004', qty_in: 0, qty_out: 12, balance: 11988, unit: 'Pack' },
  { timestamp: '2026-03-25 15:20', item: 'Palm Oil', batch: 'B-9920', warehouse: 'Factory', type: 'Production Issue', reference: 'MO-2026-085', qty_in: 0, qty_out: 200, balance: 1000, unit: 'Litre' },
  { timestamp: '2026-03-25 10:00', item: 'Besan (Gram Flour)', batch: 'B-7715', warehouse: 'Factory', type: 'GRN', reference: 'GRN-2026-042', qty_in: 1000, qty_out: 0, balance: 2500, unit: 'Kg' },
  { timestamp: '2026-03-24 14:00', item: 'Nimko Mix 200g', batch: 'BN-260310C', warehouse: 'Regional', type: 'Return', reference: 'RET-2026-001', qty_in: 25, qty_out: 0, balance: 4500, unit: 'Pack' },
];

export const InventoryLedgerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('All');

  const filteredData = mockLedgerData.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Ledger</h2>
          <p className="text-sm text-gray-500">Immutable, real-time record of every stock movement</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline gap-2">
            <Download size={18} /> Export CSV
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm font-medium">
            <Lock size={16} />
            Ledger is Immutable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Movements (Period)</p>
          <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Inflow</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredData.reduce((acc, curr) => acc + curr.qty_in, 0).toLocaleString()} Units
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Outflow</p>
          <p className="text-2xl font-bold text-red-600">
            {filteredData.reduce((acc, curr) => acc + curr.qty_out, 0).toLocaleString()} Units
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Item, Batch, or Reference..." 
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select 
            className="px-3 py-2 border rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Movement Types</option>
            <option value="GRN">GRN (Inflow)</option>
            <option value="Production Issue">Production Issue (Outflow)</option>
            <option value="Sales Dispatch">Sales Dispatch (Outflow)</option>
            <option value="Return">Return (Inflow)</option>
            <option value="Adjustment">Adjustment (Correction)</option>
          </select>
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50 text-gray-600 text-sm">
            <Calendar size={16} />
            <span>Last 30 Days</span>
          </div>
        </div>

        <Table
          columns={[
            { header: 'Timestamp', accessor: 'timestamp', render: (val) => <span className="text-xs text-gray-500">{val}</span> },
            { 
              header: 'Item', 
              accessor: 'item',
              render: (val, row) => (
                <div>
                  <p className="font-medium text-gray-900">{val}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Batch: {row.batch}</p>
                </div>
              )
            },
            { header: 'Reference', accessor: 'reference', render: (val) => <span className="font-mono text-xs text-primary">{val}</span> },
            { header: 'Warehouse', accessor: 'warehouse' },
            { 
              header: 'Type', 
              accessor: 'type', 
              render: (val) => (
                <Badge color={
                  val === 'GRN' || val === 'Return' ? 'bg-green-100 text-green-800 border-green-200' :
                  val === 'Adjustment' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-blue-100 text-blue-800 border-blue-200'
                }>
                  {val}
                </Badge>
              )
            },
            { 
              header: 'Qty In', 
              accessor: 'qty_in', 
              render: (val, row) => val > 0 ? <span className="text-green-600 font-bold">+{val} {row.unit}</span> : <span className="text-gray-300">-</span>
            },
            { 
              header: 'Qty Out', 
              accessor: 'qty_out', 
              render: (val, row) => val > 0 ? <span className="text-red-600 font-bold">-{val} {row.unit}</span> : <span className="text-gray-300">-</span>
            },
            { 
              header: 'Balance After', 
              accessor: 'balance', 
              render: (val, row) => <span className="font-bold text-gray-900">{val.toLocaleString()} {row.unit}</span> 
            },
          ]}
          data={filteredData}
        />
      </div>
    </div>
  );
};
