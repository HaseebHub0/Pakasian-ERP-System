import React from 'react';
import { Database, Search, Plus, Filter, Download } from 'lucide-react';
import { Table, Badge } from '@/components/ui/Shared';
import toast from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency } from '@/utils/formatters';

export const ChartOfAccountsPage: React.FC = () => {
  const { accounts } = useFinanceStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chart of Accounts</h2>
          <p className="text-sm text-gray-500">Master list of all financial accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.success('COA exported to Excel')}
            className="btn btn-outline gap-2"
          >
            <Download size={18} /> Export COA
          </button>
          <button 
            onClick={() => toast.error('Account creation requires senior accountant approval')}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} /> Add Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search accounts..." className="pl-10 pr-4 py-2 border rounded-md text-sm w-64" />
            </div>
          </div>
        </div>
        <Table
          columns={[
            { header: 'Code', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Account Name', accessor: 'name' },
            { 
              header: 'Type', 
              accessor: 'type',
              render: (val) => (
                <Badge color={
                  val === 'Asset' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  val === 'Liability' ? 'bg-red-100 text-red-800 border-red-200' :
                  val === 'Equity' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                  val === 'Revenue' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }>
                  {val}
                </Badge>
              )
            },
            { header: 'Category', accessor: 'category' },
            { 
              header: 'Balance', 
              accessor: 'balance', 
              render: (val) => (
                <span className="font-bold">
                  {formatCurrency(val)}
                </span>
              )
            },
          ]}
          data={accounts}
        />
      </div>
    </div>
  );
};
