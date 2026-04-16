import React from 'react';
import { 
  Activity, 
  Droplets, 
  Weight, 
  AlertTriangle, 
  Clock, 
  Zap,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/Shared';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const flowData: any[] = [];

export const FryerMonitorPage: React.FC = () => {
  const [activeFryer, setActiveFryer] = React.useState('Fryer 02');
  const [lastUpdated, setLastUpdated] = React.useState(0);
  const [isManual, setIsManual] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(prev => (prev + 1) % 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tpmValue = 0;
  const isWarning = tpmValue > 24;
  const isCritical = tpmValue > 27;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fryer Real-time Monitor</h2>
          <p className="text-sm text-gray-500">IoT sensor dashboard for industrial fryers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
            <Clock size={14} />
            Last updated: {lastUpdated}s ago
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-gray-500 uppercase">Manual Entry</span>
            <div 
              onClick={() => setIsManual(!isManual)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                isManual ? "bg-primary" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                isManual ? "left-6" : "left-1"
              )} />
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border w-fit">
        {['Fryer 01', 'Fryer 02', 'Fryer 03'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFryer(f)}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-md transition-all",
              activeFryer === f 
                ? "bg-primary text-white shadow-md" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {(isWarning || isCritical) && (
        <div className={cn(
          "p-4 rounded-xl border flex items-center justify-between animate-pulse",
          isCritical ? "bg-red-600 border-red-700 text-white" : "bg-amber-500 border-amber-600 text-white"
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h4 className="font-black uppercase tracking-wider">
                {isCritical ? 'CRITICAL ALERT: CHANGE OIL NOW' : 'WARNING: OIL QUALITY DEGRADING'}
              </h4>
              <p className="text-sm opacity-90">
                Current TPM reading is {tpmValue}%. {isCritical ? 'Production must stop for oil replacement.' : 'Monitor closely and prepare for change.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => toast.success('Alert acknowledged')}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm shadow-lg"
          >
            Acknowledge
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Flow Meters */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Droplets size={18} className="text-blue-500" />
              Flow Meters
            </h3>
            <Badge color="bg-blue-50 text-blue-600 border-blue-100">Live</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Inlet Flow</p>
              <p className="text-2xl font-black text-gray-900">0.0 <span className="text-sm font-normal text-gray-500">L/min</span></p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Outlet Flow</p>
              <p className="text-2xl font-black text-gray-900">0.0 <span className="text-sm font-normal text-gray-500">L/min</span></p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-bold uppercase">Net Absorption</p>
              <p className="text-xl font-black text-blue-900">0.0 <span className="text-sm font-normal">L/min</span></p>
            </div>
            <TrendingUp className="text-blue-400" size={24} />
          </div>

          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flowData}>
                <Line type="monotone" dataKey="inlet" stroke="#2E75B6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outlet" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Load Cells */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Weight size={18} className="text-primary" />
              Load Cells (Oil Weight)
            </h3>
            <Badge color="bg-green-50 text-green-600 border-green-100">Stable</Badge>
          </div>

          <div className="text-center py-4">
            <p className="text-5xl font-black text-gray-900">0.0 <span className="text-xl font-normal text-gray-500">kg</span></p>
            <p className="text-sm text-gray-500 mt-2">Current Oil Weight in Fryer</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase text-gray-500">
              <span>Target Weight: 500kg</span>
              <span>0.0%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border">
              <div className="h-full bg-primary" style={{ width: '0%' }} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 0, 0, 0].map((val, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded border text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">LC{i+1}</p>
                <p className="text-xs font-bold">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: TPM Meter */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              TPM Meter
            </h3>
            <Badge color={isCritical ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
              {isCritical ? 'Critical' : 'Warning'}
            </Badge>
          </div>

          <div className="relative h-48 flex items-center justify-center">
            {/* Simple Gauge SVG */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                fill="none" 
                stroke={isCritical ? '#ef4444' : '#f59e0b'} 
                strokeWidth="12" 
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * (tpmValue / 30))}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-gray-900">{tpmValue}%</p>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Polar Materials</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="h-1 bg-green-500 rounded-full" />
              <p className="text-[10px] font-bold text-gray-400">GOOD</p>
              <p className="text-xs font-medium">0-24%</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-amber-500 rounded-full" />
              <p className="text-[10px] font-bold text-gray-400">WARN</p>
              <p className="text-xs font-medium">24-27%</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-red-500 rounded-full" />
              <p className="text-[10px] font-bold text-gray-400">CHANGE</p>
              <p className="text-xs font-medium">27%+</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800">Sensor Health Status</h3>
          <button 
            onClick={() => toast.loading('Running system diagnostics...', { duration: 2000 })}
            className="text-sm font-bold text-primary flex items-center gap-1"
          >
            Run Diagnostics <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'Flow Meter A', status: 'Online', signal: '98%' },
            { name: 'Flow Meter B', status: 'Online', signal: '95%' },
            { name: 'Load Cell Array', status: 'Online', signal: '100%' },
            { name: 'TPM Probe', status: 'Online', signal: '88%' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-bold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.status} • Signal: {s.signal}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
