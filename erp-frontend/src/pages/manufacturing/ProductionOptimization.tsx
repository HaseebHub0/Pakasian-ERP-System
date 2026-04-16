import React from 'react';
import { Zap, Clock, AlertTriangle, CheckCircle2, BarChart3, Settings, ArrowRight, Activity } from 'lucide-react';
import { Table, Badge } from '@/components/ui/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

const mockMachineKPIs: any[] = [];

const mockScheduleData = {
  unoptimized: [],
  optimized: []
};

const mockBottlenecks: any[] = [];

export const ProductionOptimizationPage: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [showOptimized, setShowOptimized] = React.useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    toast.loading('Analyzing changeover patterns...', { id: 'opt' });
    
    setTimeout(() => {
      toast.loading('Minimizing setup times...', { id: 'opt' });
      setTimeout(() => {
        setIsOptimizing(false);
        setShowOptimized(true);
        toast.success('Schedule optimized! Changeovers reduced by 50%', { id: 'opt' });
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="text-amber-500" /> Production Optimization
          </h2>
          <p className="text-sm text-gray-500">Maximize throughput and minimize changeover downtime</p>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="btn btn-primary gap-2 px-6"
        >
          {isOptimizing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Settings size={18} />
          )}
          Optimize Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Visualization */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Changeover Optimization
            </h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Current Schedule (4 Changeovers)</p>
                  <Badge color="bg-red-100 text-red-800">Inefficient</Badge>
                </div>
                <div className="flex gap-1 h-12">
                  {mockScheduleData.unoptimized.map((b, i) => (
                    <div key={i} className={cn("flex-1 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-inner", b.color)}>
                      {b.id}
                    </div>
                  ))}
                </div>
              </div>

              {showOptimized && (
                <div className="animate-in slide-in-from-left duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Optimized Schedule (1 Changeover)</p>
                    <Badge color="bg-green-100 text-green-800">50% Faster</Badge>
                  </div>
                  <div className="flex gap-1 h-12">
                    {mockScheduleData.optimized.map((b, i) => (
                      <div key={i} className={cn("flex-1 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-inner", b.color)}>
                        {b.id}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Sequence optimized by grouping similar products.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Machine KPIs */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Machine Performance (OEE)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMachineKPIs}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="oee" name="OEE %" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="availability" name="Availability %" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bottleneck Alert */}
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} /> Bottleneck Detected
            </h4>
            <p className="text-sm text-red-900/80 mb-4">
              <b>Packing Line 01</b> is operating at 100% capacity while Frying is at 90%. Production is being throttled by packing speed.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-red-800">
                <span>Packing Utilization</span>
                <span>100%</span>
              </div>
              <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
            <button className="w-full mt-4 btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none">
              View Mitigation Plan
            </button>
          </div>

          {/* Capacity Analysis */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Capacity Utilization
            </h4>
            <div className="space-y-4">
              {mockBottlenecks.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-600">{item.stage}</span>
                    <span className="font-bold text-gray-900">{item.utilization}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${item.utilization}%`, 
                        backgroundColor: item.color 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{item.actual} units/hr</span>
                    <span>Cap: {item.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency Tips */}
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Zap size={18} /> Efficiency Insights
            </h4>
            <ul className="space-y-3 text-sm text-blue-900/80">
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <span>Switching from <b>Nimko Mix</b> to <b>Potato Chips</b> takes 45 mins. Grouping batches saves 2 hours daily.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <span>Preventive maintenance on <b>Frying Line 02</b> is due. Schedule it during the next changeover.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
