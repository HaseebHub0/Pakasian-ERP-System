import React from 'react';
import { ArrowLeftRight, Package, CheckCircle2, Search, MapPin, Plus } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';

const mockTransfers = [
  { 
    id: 'TRF-2026-001', 
    from: 'Lahore Factory', 
    to: 'Karachi Warehouse', 
    item: 'Besan (Gram Flour)', 
    qty: 1000, 
    status: 'In-Transit', 
    date: '2026-03-27' 
  },
  { 
    id: 'TRF-2026-002', 
    from: 'Karachi Warehouse', 
    to: 'City Outlet', 
    item: 'Nimko Mix 200g', 
    qty: 500, 
    status: 'Completed', 
    date: '2026-03-28' 
  },
];

export const StockTransfersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [transfers, setTransfers] = React.useState(mockTransfers);
  const methods = useForm();

  const onSubmit = (data: any) => {
    const newTransfer = {
      id: `TRF-2026-${(transfers.length + 1).toString().padStart(3, '0')}`,
      from: data.from_warehouse,
      to: data.to_warehouse,
      item: data.item,
      qty: parseInt(data.quantity),
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    setTransfers([newTransfer, ...transfers]);
    toast.success('Stock transfer initiated');
    setIsModalOpen(false);
    methods.reset();
  };

  const handleReceive = (id: string) => {
    setTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'Completed' } : t
    ));
    toast.success('Stock received and inventory updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stock Transfers</h2>
          <p className="text-sm text-gray-500">Coordinate stock movement between nationwide warehouses</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          New Transfer
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table
          columns={[
            { header: 'Transfer ID', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Item', accessor: 'item' },
            { header: 'Quantity', accessor: 'qty', render: (val) => <span className="font-bold">{val.toLocaleString()}</span> },
            { 
              header: 'Route', 
              accessor: 'id', 
              render: (_, row) => (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">{row.from}</span>
                  <ArrowLeftRight size={14} className="text-primary" />
                  <span className="text-gray-900 font-medium">{row.to}</span>
                </div>
              )
            },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => (
                <Badge color={
                  val === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  val === 'In-Transit' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }>
                  {val}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (val, row) => (
                row.status === 'In-Transit' ? (
                  <button 
                    onClick={() => handleReceive(val)}
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Mark Received
                  </button>
                ) : null
              )
            }
          ]}
          data={transfers}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Stock Transfer"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="from_warehouse" 
                label="From Warehouse" 
                type="select" 
                options={[
                  { label: 'Lahore Factory', value: 'Lahore Factory' },
                  { label: 'Karachi Warehouse', value: 'Karachi Warehouse' },
                ]} 
                required 
              />
              <FormField 
                name="to_warehouse" 
                label="To Warehouse" 
                type="select" 
                options={[
                  { label: 'Karachi Warehouse', value: 'Karachi Warehouse' },
                  { label: 'Islamabad Hub', value: 'Islamabad Hub' },
                  { label: 'City Outlet', value: 'City Outlet' },
                ]} 
                required 
              />
            </div>
            <FormField name="item" label="Item/SKU" placeholder="Search product..." required />
            <FormField name="quantity" label="Transfer Quantity" placeholder="e.g. 500" required />
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Initiate Transfer</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
