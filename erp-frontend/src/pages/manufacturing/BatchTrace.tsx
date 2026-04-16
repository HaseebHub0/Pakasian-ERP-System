import React from 'react';
import { Search, History, Package, User, Factory, Truck, ChevronRight, Settings, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Shared';
import { cn } from '@/utils/cn';
import { useManufacturingStore } from '@/store/useManufacturingStore';
import { formatDate, getStatusColor } from '@/utils/formatters';

export const BatchTracePage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [isTraced, setIsTraced] = React.useState(false);
  const { batches } = useManufacturingStore();

  const batch = batches.find(b => b.id.toLowerCase() === search.toLowerCase());

  const handleTrace = () => {
    if (search) setIsTraced(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Batch Traceability</h2>
          <p className="text-sm text-gray-500">End-to-end tracking from raw material to distribution</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter Batch Number (e.g. PN260312A)" 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 transition-all"
            />
          </div>
          <button 
            onClick={handleTrace}
            className="btn btn-primary px-8 rounded-xl"
          >
            Trace Batch
          </button>
        </div>
      </div>

      {isTraced && batch && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Vertical Timeline */}
          <div className="relative pl-8 space-y-12 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            
            {/* 1. Batch Info */}
            <div className="relative">
              <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-white">
                <History size={12} />
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Batch Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Product</p>
                    <p className="font-medium">{batch.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Production Order</p>
                    <p className="font-medium text-primary">{batch.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Created Date</p>
                    <p className="font-medium">{formatDate(batch.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                    <Badge color={getStatusColor(batch.status)}>{batch.status}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Raw Materials */}
            <div className="relative">
              <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white ring-4 ring-white">
                <Package size={12} />
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Raw Materials Used</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Material</th>
                        <th className="px-4 py-2 text-left">Lot/GRN</th>
                        <th className="px-4 py-2 text-left">Supplier</th>
                        <th className="px-4 py-2 text-right">Qty Used</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-3 font-medium">Raw Material A</td>
                        <td className="px-4 py-3 text-primary">GRN-2026-001</td>
                        <td className="px-4 py-3">Supplier X</td>
                        <td className="px-4 py-3 text-right">100 Kg</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Packaging Film</td>
                        <td className="px-4 py-3 text-primary">GRN-2026-005</td>
                        <td className="px-4 py-3">Supplier Y</td>
                        <td className="px-4 py-3 text-right">2 Rolls</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Production Stages */}
            <div className="relative">
              <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white ring-4 ring-white">
                <Factory size={12} />
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Production Stages</h3>
                <div className="space-y-4">
                  {batch.stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white",
                        stage.status === 'Completed' ? "bg-green-500" : "bg-gray-300"
                      )}>
                        {stage.status === 'Completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{stage.name}</p>
                        <p className="text-xs text-gray-500">
                          {stage.startTime ? `${formatDate(stage.startTime)} - ${stage.endTime ? formatDate(stage.endTime) : 'In Progress'}` : 'Not Started'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Output</p>
                        <p className="font-medium text-sm">{stage.outputQty || 0} {i === 5 ? 'Units' : 'Kg'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Distribution */}
            <div className="relative">
              <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white ring-4 ring-white">
                <Truck size={12} />
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Distribution</h3>
                <div className="p-4 bg-gray-50 rounded-lg border text-center text-gray-500 text-sm">
                  {batch.status === 'Completed' ? 'Available for dispatch in Finished Goods Warehouse' : 'Not yet available for distribution'}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {isTraced && !batch && (
        <div className="bg-white p-12 rounded-xl border shadow-sm text-center">
          <p className="text-gray-500">No batch found with ID: <span className="font-bold text-gray-800">{search}</span></p>
        </div>
      )}
    </div>
  );
};
