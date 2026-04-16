import React from 'react';
import { ClipboardList, CheckCircle2, MapPin, Package, Search } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const mockPickingLists = [
  { 
    id: 'PICK-2026-001', 
    order_ref: 'SO-2026-112', 
    warehouse: 'Lahore Factory', 
    status: 'Pending', 
    date: '2026-03-27',
    items: [
      { item: 'Nimko Mix 200g', qty: 120, bin: 'A-12-3', batch: 'BN-260312A', picked: 0 },
      { item: 'Potato Chips 50g', qty: 50, bin: 'B-04-1', batch: 'BN-260315B', picked: 0 },
    ]
  },
  { 
    id: 'PICK-2026-002', 
    order_ref: 'SO-2026-115', 
    warehouse: 'Lahore Factory', 
    status: 'In-Progress', 
    date: '2026-03-28',
    items: [
      { item: 'Palm Oil', qty: 200, bin: 'OIL-01', batch: 'B-9920', picked: 150 },
    ]
  },
];

export const PickingListsPage: React.FC = () => {
  const [selectedPick, setSelectedPick] = React.useState<any>(null);
  const [pickingLists, setPickingLists] = React.useState(mockPickingLists);

  const handlePickItem = (pickId: string, itemIdx: number) => {
    setPickingLists(prev => prev.map(p => {
      if (p.id === pickId) {
        const newItems = [...p.items];
        newItems[itemIdx] = { ...newItems[itemIdx], picked: newItems[itemIdx].qty };
        
        // Check if all items picked
        const allPicked = newItems.every(i => i.picked === i.qty);
        return { ...p, items: newItems, status: allPicked ? 'Completed' : 'In-Progress' };
      }
      return p;
    }));
    toast.success('Item picked successfully');
  };

  const handleCompletePicking = (pickId: string) => {
    setPickingLists(prev => prev.map(p => 
      p.id === pickId ? { ...p, status: 'Completed' } : p
    ));
    toast.success('Picking completed. Ready for dispatch.');
    setSelectedPick(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Warehouse Picking</h2>
          <p className="text-sm text-gray-500">Manage picking lists and bin locations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table
          columns={[
            { header: 'Picking ID', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Order Ref', accessor: 'order_ref' },
            { header: 'Warehouse', accessor: 'warehouse' },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { 
              header: 'Items', 
              accessor: 'items', 
              render: (items: any[]) => (
                <span className="text-sm">
                  {items.filter(i => i.picked === i.qty).length} / {items.length} Picked
                </span>
              )
            },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => (
                <Badge color={
                  val === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  val === 'In-Progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
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
                  onClick={() => setSelectedPick(row)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <ClipboardList size={14} /> Start Picking
                </button>
              )
            }
          ]}
          data={pickingLists}
        />
      </div>

      <Modal
        isOpen={!!selectedPick}
        onClose={() => setSelectedPick(null)}
        title={`Picking List: ${selectedPick?.id}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Order Reference</p>
              <p className="text-lg font-bold text-gray-900">{selectedPick?.order_ref}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold">Warehouse</p>
              <p className="text-lg font-bold text-gray-900">{selectedPick?.warehouse}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-primary" /> Items to Pick
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Bin Location</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPick?.items.map((item: any, idx: number) => (
                    <tr key={idx} className={item.picked === item.qty ? "bg-green-50/30" : ""}>
                      <td className="px-4 py-3 font-medium">{item.item}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <MapPin size={14} /> {item.bin}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{item.batch}</td>
                      <td className="px-4 py-3 text-right font-bold">{item.qty}</td>
                      <td className="px-4 py-3 text-right">
                        {item.picked === item.qty ? (
                          <Badge color="bg-green-100 text-green-800 border-green-200">Picked</Badge>
                        ) : (
                          <span className="text-gray-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.picked < item.qty && (
                          <button 
                            onClick={() => handlePickItem(selectedPick.id, idx)}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setSelectedPick(null)} className="btn btn-outline">Close</button>
            {selectedPick?.items.every((i: any) => i.picked === i.qty) && selectedPick?.status !== 'Completed' && (
              <button 
                onClick={() => handleCompletePicking(selectedPick.id)}
                className="btn btn-primary"
              >
                Complete Picking
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
