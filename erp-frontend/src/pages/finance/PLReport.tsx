import React from 'react';
import { Printer, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';

export const PLReportPage: React.FC = () => {
  const { accounts } = useFinanceStore();

  const getBalance = (id: string) => accounts.find(a => a.id === id)?.balance || 0;

  const revenue = getBalance('4000');
  const rawMaterial = getBalance('5000') * 0.7; // Mock split
  const manufacturingOverhead = getBalance('5100');
  const cogs = getBalance('5000');
  const grossProfit = revenue - cogs;
  
  // Mock expenses for now
  const sellingExp = 50000;
  const adminExp = 120000;
  const utilities = 80000;
  const totalExpenses = sellingExp + adminExp + utilities;
  
  const netProfit = grossProfit - totalExpenses;

  const plTrendData = [
    { month: 'Jan', profit: 450000 },
    { month: 'Feb', profit: 520000 },
    { month: 'Mar', profit: netProfit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profit & Loss Statement</h2>
          <p className="text-sm text-gray-500">Monthly financial performance report</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2">
            <Calendar size={18} className="text-gray-400" />
            <select className="text-sm font-medium bg-transparent focus:outline-none">
              <option>April 2026</option>
              <option>March 2026</option>
              <option>February 2026</option>
            </select>
          </div>
          <button 
            onClick={() => window.print()}
            className="btn btn-outline gap-2"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={() => toast.success('Report exported to Excel')}
            className="btn btn-primary gap-2"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl border shadow-sm space-y-8 print:shadow-none print:border-none">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-primary">Pakistani Foods (Pvt) Ltd.</h3>
              <p className="text-sm text-gray-500">Statement of Profit or Loss</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">For the month ended April 09, 2026</p>
            </div>

            <div className="space-y-6">
              {/* Revenue Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 border-b pb-1">Revenue</h4>
                <div className="flex justify-between text-sm pl-4">
                  <span>Gross Sales</span>
                  <span>{formatCurrency(revenue)}</span>
                </div>
                <div className="flex justify-between text-sm pl-4 text-red-600">
                  <span>Sales Returns & Discounts</span>
                  <span>({formatCurrency(0)})</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Net Revenue</span>
                  <span>{formatCurrency(revenue)}</span>
                </div>
              </div>

              {/* COGS Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 border-b pb-1">Cost of Goods Sold</h4>
                <div className="flex justify-between text-sm pl-4">
                  <span>Raw Material Consumed</span>
                  <span>{formatCurrency(rawMaterial)}</span>
                </div>
                <div className="flex justify-between text-sm pl-4">
                  <span>Direct Labour</span>
                  <span>{formatCurrency(cogs * 0.2)}</span>
                </div>
                <div className="flex justify-between text-sm pl-4">
                  <span>Manufacturing Overheads</span>
                  <span>{formatCurrency(manufacturingOverhead)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Total COGS</span>
                  <span>({formatCurrency(cogs)})</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-black bg-gray-50 p-3 rounded-lg">
                <span>Gross Profit</span>
                <span className="text-primary">{formatCurrency(grossProfit)}</span>
              </div>

              {/* Expenses Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 border-b pb-1">Operating Expenses</h4>
                <div className="flex justify-between text-sm pl-4">
                  <span>Selling & Distribution</span>
                  <span>{formatCurrency(sellingExp)}</span>
                </div>
                <div className="flex justify-between text-sm pl-4">
                  <span>Administrative Expenses</span>
                  <span>{formatCurrency(adminExp)}</span>
                </div>
                <div className="flex justify-between text-sm pl-4">
                  <span>Utilities & Rent</span>
                  <span>{formatCurrency(utilities)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Total Operating Expenses</span>
                  <span>({formatCurrency(totalExpenses)})</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-black bg-primary text-white p-4 rounded-lg shadow-lg">
                <span>Net Profit</span>
                <span>{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Profit Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="profit" fill="#1B3A6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Gross Margin</p>
                <p className="text-xl font-bold text-gray-900">
                  {revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Net Margin</p>
                <p className="text-xl font-bold text-gray-900">
                  {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
