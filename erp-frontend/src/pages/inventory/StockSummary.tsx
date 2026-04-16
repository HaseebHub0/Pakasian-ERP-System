import React from 'react';
import { Package, CheckCircle, Clock, AlertTriangle, History, X } from 'lucide-react';
import { Table, Badge, StatCard } from '@/components/ui/Shared';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const mockStock: any[] = [];
const mockLedger: any[] = [];

export const StockSummaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('All');
  const [selectedItem, setSelectedItem] = React.useState<any>(null);

  const tabs = ['All', 'Factory', 'Regional', 'City', 'Retail'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stock Summary</h2>
          <p className="text-sm text-gray-500">Real-time inventory levels across all warehouses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Stock Value" value={formatCurrency(12500000)} />
        <StatCard icon={CheckCircle} label="Available Items" value="1,240" />
        <StatCard icon={Clock} label="Reserved Stock" value="450" />
        <StatCard icon={AlertTriangle} label="In Transit" value="120" />
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border w-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === tab 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table
              columns={[
                { header: 'Item Name', accessor: 'item' },
                { header: 'Category', accessor: 'category', render: (val) => <Badge>{val}</Badge> },
                { 
                  header: 'Available', 
                  accessor: 'available', 
                  render: (val, row) => (
                    <span className={cn("font-bold", val < 100 ? "text-red-600" : "text-green-600")}>
                      {val} {row.unit}
                    </span>
                  )
                },
                { header: 'Reserved', accessor: 'reserved' },
                { header: 'In Transit', accessor: 'transit' },
                { header: 'Warehouse', accessor: 'warehouse' },
              ]}
              data={mockStock.filter(s => activeTab === 'All' || s.warehouse === activeTab)}
              onRowClick={(row) => setSelectedItem(row)}
            />
          </div>
        </div>

        {selectedItem && (
          <div className="w-96 bg-white rounded-xl border shadow-sm p-6 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Stock Ledger: {selectedItem.item}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-light-blue/20 rounded-lg border border-light-blue/30">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-bold text-primary">{selectedItem.available} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Warehouse</span>
                  <span className="font-medium">{selectedItem.warehouse}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <History size={16} /> Recent Movements
                </h4>
                <div className="space-y-3">
                  {mockLedger.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{entry.type}</span>
                          <span className={cn(
                            "font-bold",
                            entry.qty.startsWith('+') ? "text-green-600" : "text-red-600"
                          )}>
                            {entry.qty}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{entry.ref}</span>
                          <span>{entry.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full btn btn-outline text-primary border-primary hover:bg-primary/5">
                View Full Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
