import React from 'react';
import { FileText, Filter, ChevronDown, ChevronUp, DollarSign, Lock, Unlock } from 'lucide-react';
import { Table, Badge } from '@/components/ui/Shared';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useFinanceStore } from '@/store/useFinanceStore';
import toast from 'react-hot-toast';

export const JournalsPage: React.FC = () => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const { journals, isPeriodClosed, closePeriod } = useFinanceStore();

  const handleClosePeriod = () => {
    if (window.confirm('Are you sure you want to close the accounting period? This will prevent any further entries.')) {
      closePeriod();
      toast.success('Accounting period closed successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial Journals</h2>
          <p className="text-sm text-gray-500">General ledger entries and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border",
            isPeriodClosed 
              ? "bg-red-50 text-red-700 border-red-200" 
              : "bg-green-50 text-green-700 border-green-200"
          )}>
            {isPeriodClosed ? <Lock size={14} /> : <Unlock size={14} />}
            Period: {isPeriodClosed ? 'CLOSED' : 'OPEN'}
          </div>
          {!isPeriodClosed && (
            <button 
              onClick={handleClosePeriod}
              className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50 gap-2"
            >
              <Lock size={16} /> Close Period
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Filter by reference or ID..." className="w-full pl-10 pr-4 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <select className="px-3 py-2 border rounded-md text-sm bg-white">
            <option>All Types</option>
            <option>GRN</option>
            <option>SALES</option>
            <option>PRODUCTION</option>
            <option>PAYMENT</option>
            <option>RECEIPT</option>
          </select>
        </div>

        <div className="divide-y">
          {journals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No journal entries found. Perform operational tasks to generate entries.</p>
            </div>
          ) : journals.map((jv) => (
            <div key={jv.id} className="group">
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === jv.id ? null : jv.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{jv.id}</h4>
                    <p className="text-xs text-gray-500">{jv.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Reference</p>
                    <p className="text-sm font-medium text-primary">{jv.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Amount</p>
                    <p className="text-sm font-bold">{formatCurrency(jv.total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Date</p>
                    <p className="text-sm font-medium">{formatDate(jv.date)}</p>
                  </div>
                  <Badge color="bg-blue-100 text-blue-800 border-blue-200">{jv.type}</Badge>
                  {expandedId === jv.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              {expandedId === jv.id && (
                <div className="bg-gray-50 p-6 border-t border-b animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b font-bold text-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left">Account Code</th>
                          <th className="px-4 py-3 text-left">Account Name</th>
                          <th className="px-4 py-3 text-right">Debit (PKR)</th>
                          <th className="px-4 py-3 text-right">Credit (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {jv.lines.map((line, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-mono">{line.accountId}</td>
                            <td className="px-4 py-3">{line.accountName}</td>
                            <td className="px-4 py-3 text-right font-medium">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                            <td className="px-4 py-3 text-right font-medium">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold border-t">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right">Totals</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(jv.total)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(jv.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
