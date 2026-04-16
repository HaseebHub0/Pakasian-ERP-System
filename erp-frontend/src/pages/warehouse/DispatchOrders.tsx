import React from 'react';
import { Truck, Package, CheckCircle2, Search, FileText, User, MapPin } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const mockDispatchOrders = [
  { 
    id: 'DO-2026-112', 
    picking_ref: 'PICK-2026-001', 
    customer: 'Karachi Distributor', 
    destination: 'Karachi Warehouse',
    status: 'Ready', 
    date: '2026-03-27',
    driver: 'Aslam Khan',
    vehicle: 'LHR-7721',
    items: [
      { item: 'Nimko Mix 200g', qty: 120, batch: 'BN-260312A' },
      { item: 'Potato Chips 50g', qty: 50, batch: 'BN-260315B' },
    ]
  },
  { 
    id: 'DO-2026-115', 
    picking_ref: 'PICK-2026-005', 
    customer: 'Islamabad Retailer', 
    destination: 'Islamabad Hub',
    status: 'Dispatched', 
    date: '2026-03-28',
    driver: 'Sajid Ali',
    vehicle: 'ISL-9920',
    items: [
      { item: 'Palm Oil', qty: 200, batch: 'B-9920' },
    ]
  },
];

export const DispatchOrdersPage: React.FC = () => {
  const [selectedDispatch, setSelectedDispatch] = React.useState<any>(null);
  const [dispatchOrders, setDispatchOrders] = React.useState(mockDispatchOrders);

  const handleDispatch = (id: string) => {
    setDispatchOrders(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'Dispatched' } : d
    ));
    toast.success('Truck dispatched successfully');
    setSelectedDispatch(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dispatch Orders</h2>
          <p className="text-sm text-gray-500">Manage truck loading and nationwide dispatch</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table
          columns={[
            { header: 'Dispatch ID', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Customer', accessor: 'customer' },
            { header: 'Destination', accessor: 'destination', render: (val) => (
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" />
                <span>{val}</span>
              </div>
            )},
            { header: 'Vehicle', accessor: 'vehicle' },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => (
                <Badge color={
                  val === 'Dispatched' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  val === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }>
                  {val}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <button 
                  onClick={() => setSelectedDispatch(row)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Truck size={14} /> {row.status === 'Ready' ? 'Load & Dispatch' : 'View Details'}
                </button>
              )
            }
          ]}
          data={dispatchOrders}
        />
      </div>

      <Modal
        isOpen={!!selectedDispatch}
        onClose={() => setSelectedDispatch(null)}
        title={`Dispatch Order: ${selectedDispatch?.id}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Logistics Info</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="font-medium">Driver: {selectedDispatch?.driver}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={14} className="text-gray-400" />
                  <span className="font-medium">Vehicle: {selectedDispatch?.vehicle}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Destination</p>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-gray-400" />
                <span className="font-medium">{selectedDispatch?.destination}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Ref: {selectedDispatch?.picking_ref}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-primary" /> Loaded Items
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedDispatch?.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium">{item.item}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.batch}</td>
                      <td className="px-4 py-3 text-right font-bold">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setSelectedDispatch(null)} className="btn btn-outline">Close</button>
            {selectedDispatch?.status === 'Ready' && (
              <button 
                onClick={() => handleDispatch(selectedDispatch.id)}
                className="btn btn-primary gap-2"
              >
                <CheckCircle2 size={18} /> Confirm Dispatch
              </button>
            )}
            {selectedDispatch?.status === 'Dispatched' && (
              <button className="btn btn-outline gap-2">
                <FileText size={18} /> Print Gate Pass
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
