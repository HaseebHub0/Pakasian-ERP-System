import React from 'react';
import { MapPin, Truck, Navigation, Fuel, Clock, CheckCircle2, AlertCircle, ArrowRight, Play, Sparkles } from 'lucide-react';
import { Table, Badge } from '@/components/ui/Shared';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

const mockPendingOrders: any[] = [];
const mockVehicles: any[] = [];
const mockOptimizedRoute: any[] = [];

export const RouteOptimizationPage: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [showRoute, setShowRoute] = React.useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    toast.loading('AI Engine: Clustering orders by geography...', { id: 'route-opt' });
    
    setTimeout(() => {
      toast.loading('AI Engine: Calculating shortest path (TSP Algorithm)...', { id: 'route-opt' });
      setTimeout(() => {
        toast.loading('AI Engine: Checking truck capacity and time windows...', { id: 'route-opt' });
        setTimeout(() => {
          setIsOptimizing(false);
          setShowRoute(true);
          toast.success('Route optimized! 60km saved (PKR 2,250 fuel savings)', { id: 'route-opt' });
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="text-primary" /> Route Optimization
          </h2>
          <p className="text-sm text-gray-500">AI-driven delivery planning to minimize fuel and time</p>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="btn btn-primary gap-2 px-8 shadow-lg shadow-primary/20"
        >
          {isOptimizing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI Routing...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Optimize Delivery Routes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Orders */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                Pending Deliveries (Lahore Region)
              </h3>
              <Badge color="bg-blue-100 text-blue-800 border-blue-200">5 Orders</Badge>
            </div>
            <Table
              columns={[
                { header: 'Order ID', accessor: 'id' },
                { header: 'Customer', accessor: 'customer' },
                { header: 'City', accessor: 'city' },
                { header: 'Weight (kg)', accessor: 'weight' },
                { header: 'Time Window', accessor: 'timeWindow' },
              ]}
              data={mockPendingOrders}
            />
          </div>

          {/* Optimized Route Visualization */}
          {showRoute && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Truck size={18} className="text-primary" />
                  Optimized Trip: TRIP-2026-001
                </h3>
                <div className="flex gap-2">
                  <Badge color="bg-green-100 text-green-800 border-green-200">180 km Total</Badge>
                  <Badge color="bg-amber-100 text-amber-800 border-amber-200">Fuel: PKR 6,750</Badge>
                </div>
              </div>
              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                  <div className="space-y-6">
                    {mockOptimizedRoute.map((stop, i) => (
                      <div key={i} className="relative pl-10">
                        <div className={cn(
                          "absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10",
                          stop.action === 'Start' || stop.action === 'End' ? "bg-primary border-primary text-white" : "bg-white border-primary text-primary"
                        )}>
                          {stop.stop}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{stop.location}</p>
                            <p className="text-xs text-gray-500">{stop.action}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-primary flex items-center gap-1">
                              <Clock size={12} /> {stop.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button className="btn btn-outline">Print Manifest</button>
                  <button className="btn btn-primary gap-2">
                    <Play size={16} /> Dispatch Driver
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Fuel Savings Insight */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
            <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
              <Fuel size={18} /> Fuel Savings Analysis
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Standard Route</span>
                <span className="text-sm font-bold text-gray-500 line-through">240 km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 font-bold">AI Optimized</span>
                <span className="text-sm font-bold text-green-800">180 km</span>
              </div>
              <div className="pt-4 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700 font-bold">Total Savings</span>
                  <span className="text-lg font-bold text-green-800">PKR 2,250</span>
                </div>
                <p className="text-[10px] text-green-600 mt-1">Based on PKR 300/L fuel price and 8km/L efficiency</p>
              </div>
            </div>
          </div>

          {/* Vehicle Availability */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-primary" /> Vehicle Status
            </h4>
            <div className="space-y-3">
              {mockVehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{v.id}</p>
                    <p className="text-xs text-gray-500">{v.type} • {v.capacity}kg</p>
                  </div>
                  <Badge color={v.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {v.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* AI Constraints */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" /> Optimization Constraints
            </h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>Geographic Clustering (TSP Algorithm)</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>Truck Weight Capacity (Max 2,500kg)</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>Customer Time Windows (08:00 - 17:00)</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>Driver Working Hours (Max 10 hrs)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
