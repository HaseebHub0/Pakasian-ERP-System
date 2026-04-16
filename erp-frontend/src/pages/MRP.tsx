import React from 'react';
import { Cpu, TrendingUp, Package, Calendar, Play, AlertCircle, Sparkles, ShoppingCart, Factory, ArrowRight } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { formatDate, getStatusColor, formatCurrency } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

const mockSalesHistory = [
  { month: 'Jan', sales: 120000 },
  { month: 'Feb', sales: 135000 },
  { month: 'Mar', sales: 142000 },
  { month: 'Apr', sales: 158000 },
  { month: 'May', sales: 145000 },
  { month: 'Jun', sales: 130000 },
];

const mockSeasonalFactors = [
  { event: 'Ramadan', multiplier: 1.35, impact: 'High Increase', color: 'text-green-600' },
  { event: 'Eid-ul-Fitr', multiplier: 1.25, impact: 'Moderate Increase', color: 'text-blue-600' },
  { event: 'Summer Season', multiplier: 0.90, impact: 'Slight Decrease', color: 'text-amber-600' },
  { event: 'Winter Season', multiplier: 1.10, impact: 'Slight Increase', color: 'text-indigo-600' },
];

const mockMRPResults = [
  { 
    product: 'Nimko Mix 200g', 
    avgSales: 138000, 
    factor: 1.35, 
    forecast: 186300, 
    currentStock: 45000, 
    safetyStock: 20000, 
    required: 161300,
    status: 'Pending'
  },
  { 
    product: 'Potato Chips 50g', 
    avgSales: 85000, 
    factor: 0.90, 
    forecast: 76500, 
    currentStock: 12000, 
    safetyStock: 15000, 
    required: 79500,
    status: 'Pending'
  },
  { 
    product: 'Dal Moong 100g', 
    avgSales: 42000, 
    factor: 1.10, 
    forecast: 46200, 
    currentStock: 8500, 
    safetyStock: 10000, 
    required: 47700,
    status: 'Pending'
  },
];

export const MRPPage: React.FC = () => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState(mockMRPResults);
  const [showResults, setShowResults] = React.useState(false);

  const handleRunMRP = () => {
    setIsRunning(true);
    toast.loading('AI Engine: Analyzing sales patterns...', { id: 'mrp-run' });
    
    setTimeout(() => {
      toast.loading('AI Engine: Applying seasonal factors (Ramadan +35%)...', { id: 'mrp-run' });
      
      setTimeout(() => {
        toast.loading('MRP Engine: Calculating requirements and safety stocks...', { id: 'mrp-run' });
        
        setTimeout(() => {
          setIsRunning(false);
          setShowResults(true);
          toast.success('MRP Engine: Forecast and plans generated successfully!', { id: 'mrp-run' });
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const handleGenerateOrders = () => {
    toast.success('Production Orders and Purchase Requisitions generated automatically!');
    setResults(prev => prev.map(r => ({ ...r, status: 'Generated' })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="text-primary" /> MRP & AI Forecasting
          </h2>
          <p className="text-sm text-gray-500">Predict demand and automate production planning</p>
        </div>
        <button 
          onClick={handleRunMRP}
          disabled={isRunning}
          className="btn btn-primary gap-2 px-8 shadow-lg shadow-primary/20"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI Processing...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Run AI MRP Engine
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Sales History & Trend Analysis
              </h3>
              <Badge color="bg-blue-100 text-blue-800 border-blue-200">Last 6 Months</Badge>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockSalesHistory}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {showResults && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  AI Generated Production Plan
                </h3>
                <button 
                  onClick={handleGenerateOrders}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Factory size={14} /> Auto-Generate Orders
                </button>
              </div>
              <Table
                columns={[
                  { header: 'Product', accessor: 'product' },
                  { 
                    header: 'Forecast Calculation', 
                    accessor: 'forecast',
                    render: (_, row) => (
                      <div className="text-xs">
                        <span className="text-gray-500">{row.avgSales.toLocaleString()}</span>
                        <span className="mx-1 text-primary">×</span>
                        <span className="font-bold text-primary">{row.factor}</span>
                        <span className="mx-1">=</span>
                        <span className="font-bold">{row.forecast.toLocaleString()}</span>
                      </div>
                    )
                  },
                  { 
                    header: 'MRP Formula', 
                    accessor: 'required',
                    render: (_, row) => (
                      <div className="text-xs">
                        <span>{row.forecast.toLocaleString()}</span>
                        <span className="mx-1 text-green-600">+</span>
                        <span>{row.safetyStock.toLocaleString()}</span>
                        <span className="mx-1 text-red-600">-</span>
                        <span>{row.currentStock.toLocaleString()}</span>
                      </div>
                    )
                  },
                  { 
                    header: 'Required Production', 
                    accessor: 'required', 
                    render: (val) => <span className="font-bold text-lg text-primary">{val.toLocaleString()}</span> 
                  },
                  { 
                    header: 'Status', 
                    accessor: 'status', 
                    render: (val) => (
                      <Badge color={val === 'Generated' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                        {val}
                      </Badge>
                    )
                  },
                ]}
                data={results}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Seasonal Factors
            </h4>
            <div className="space-y-4">
              {mockSeasonalFactors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{factor.event}</p>
                    <p className={`text-xs font-medium ${factor.color}`}>{factor.impact}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">×{factor.multiplier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
            <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertCircle size={18} /> AI Planning Insights
            </h4>
            <ul className="space-y-3 text-sm text-amber-900/80">
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5" />
                <span>Ramadan starts in 15 days. AI suggests increasing <b>Nimko Mix</b> production by 35%.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5" />
                <span>Raw material prices for <b>Palm Oil</b> are trending up. AI suggests early procurement.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5" />
                <span>Machine Line 01 maintenance scheduled. AI adjusted plan to utilize Line 02.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Automation Settings
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Auto-Run Frequency</span>
                <span className="font-bold">Every Sunday</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Auto-Generate POs</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Auto-Generate Production</span>
                <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
