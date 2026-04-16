import React from 'react';
import { FileText, Download, Printer, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';

export const BalanceSheetPage: React.FC = () => {
  const { accounts } = useFinanceStore();

  const currentAssets = accounts.filter(a => a.type === 'Asset' && a.category !== 'Fixed Assets');
  const fixedAssets = accounts.filter(a => a.type === 'Asset' && a.category === 'Fixed Assets');
  const currentLiabilities = accounts.filter(a => a.type === 'Liability' && a.category === 'Current Liabilities');
  const longTermLiabilities = accounts.filter(a => a.type === 'Liability' && a.category !== 'Current Liabilities');
  const equity = accounts.filter(a => a.type === 'Equity');

  const totalCurrentAssets = currentAssets.reduce((acc, curr) => acc + curr.balance, 0);
  const totalFixedAssets = fixedAssets.reduce((acc, curr) => acc + curr.balance, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce((acc, curr) => acc + curr.balance, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((acc, curr) => acc + curr.balance, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = equity.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Balance Sheet</h2>
          <p className="text-sm text-gray-500">Financial position as of {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="btn btn-outline gap-2"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={() => toast.success('Balance Sheet exported to PDF')}
            className="btn btn-primary gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden p-8 max-w-4xl mx-auto">
        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">Pakistani Foods (Pvt) Ltd</h1>
          <p className="text-gray-500 font-medium">Balance Sheet</p>
          <p className="text-sm text-gray-400">As of April 09, 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Assets Column */}
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-1 mb-4">ASSETS</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 italic">Current Assets</h4>
                  {currentAssets.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                    <span>Total Current Assets</span>
                    <span>{formatCurrency(totalCurrentAssets)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 italic">Fixed Assets</h4>
                  {fixedAssets.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No fixed assets recorded</p>
                  ) : fixedAssets.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                    <span>Total Fixed Assets</span>
                    <span>{formatCurrency(totalFixedAssets)}</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-between text-lg font-bold bg-primary/5 p-3 rounded-lg text-primary border border-primary/10">
              <span>TOTAL ASSETS</span>
              <span>{formatCurrency(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-red-600 border-b-2 border-red-100 pb-1 mb-4">LIABILITIES</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 italic">Current Liabilities</h4>
                  {currentLiabilities.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                    <span>Total Current Liabilities</span>
                    <span>{formatCurrency(totalCurrentLiabilities)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 italic">Long-term Liabilities</h4>
                  {longTermLiabilities.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No long-term liabilities</p>
                  ) : longTermLiabilities.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                    <span>Total Long-term Liabilities</span>
                    <span>{formatCurrency(totalLongTermLiabilities)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-purple-600 border-b-2 border-purple-100 pb-1 mb-4">EQUITY</h3>
              <div className="space-y-1">
                {equity.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                  <span>Total Equity</span>
                  <span>{formatCurrency(totalEquity)}</span>
                </div>
              </div>
            </section>

            <div className="flex justify-between text-lg font-bold bg-gray-900 p-3 rounded-lg text-white">
              <span className="text-sm uppercase pt-1">Total Liabilities & Equity</span>
              <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dashed text-center">
          <p className="text-xs text-gray-400 italic">This is a system-generated report. No signature required.</p>
        </div>
      </div>
    </div>
  );
};
