import React from 'react';
import { Plus, Play, Split, Calendar, Package, CheckCircle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor, formatCurrency } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useManufacturingStore, ProductionOrder } from '@/store/useManufacturingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const ProductionOrdersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<ProductionOrder | null>(null);
  const [numBatches, setNumBatches] = React.useState('4');
  const [selectedLine, setSelectedLine] = React.useState('Nimko Production Line');
  
  const { orders, addOrder, updateOrderStatus, createBatches } = useManufacturingStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);
  const navigate = useNavigate();
  const methods = useForm();

  const onSubmit = (data: any) => {
    if (!user) return;

    const productName = data.productId === 'PN-100' ? 'Nimko Mix (Standard)' : 'Potato Chips (Salted)';

    addOrder({
      productId: data.productId,
      productName: productName,
      plannedQty: parseInt(data.quantity),
      startDate: data.start_date,
      endDate: data.end_date,
      createdBy: user.name,
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_PRODUCTION_ORDER',
      module: 'Manufacturing',
      details: `Created Production Order for ${productName} - Qty: ${data.quantity}`,
      status: 'success'
    });

    toast.success('Production order created');
    setIsModalOpen(false);
    methods.reset();
  };

  const handleApprove = (id: string) => {
    if (!user) return;
    updateOrderStatus(id, 'Released', user.name);
    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'APPROVE_PRODUCTION_ORDER',
      module: 'Manufacturing',
      details: `Approved Production Order ${id}`,
      status: 'success'
    });
    toast.success('Order released for production');
  };

  const handleSplit = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsSplitModalOpen(true);
  };

  const handleGenerateBatches = () => {
    if (!selectedOrder || !user) return;
    
    const count = parseInt(numBatches);
    if (isNaN(count) || count <= 0) {
      toast.error('Invalid number of batches');
      return;
    }

    createBatches(selectedOrder.id, count, selectedLine);
    
    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'GENERATE_BATCHES',
      module: 'Manufacturing',
      details: `Generated ${count} batches for order ${selectedOrder.id}`,
      status: 'success'
    });

    toast.success(`${count} batches generated successfully`);
    setIsSplitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Production Orders</h2>
          <p className="text-sm text-gray-500">Plan and schedule manufacturing runs</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table
          columns={[
            { header: 'Order ID', accessor: 'id' },
            { header: 'Product', accessor: 'productName' },
            { header: 'Target Qty', accessor: 'plannedQty', render: (val) => `${val.toLocaleString()} Units` },
            { header: 'Planned Date', accessor: 'startDate', render: (val) => formatDate(val) },
            { header: 'Batches', accessor: 'batches', render: (val) => val.length },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge>
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  {row.status === 'Planned' && (
                    <button 
                      onClick={() => handleApprove(row.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded flex items-center gap-1 text-xs font-medium"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  {row.status === 'Released' && (
                    <button 
                      onClick={() => handleSplit(row)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-xs font-medium"
                    >
                      <Split size={14} /> Create Batches
                    </button>
                  )}
                  {row.status === 'In Progress' && (
                    <button 
                      onClick={() => navigate(`/manufacturing/batch-execution`)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded flex items-center gap-1 text-xs font-medium"
                    >
                      <Play size={14} /> Execute
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={orders}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Production Order"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
              name="productId" 
              label="Product" 
              type="select" 
              options={[
                { label: 'Nimko Mix (Standard)', value: 'PN-100' },
                { label: 'Potato Chips (Salted)', value: 'PC-200' },
              ]} 
              required 
            />
            <FormField name="quantity" label="Total Quantity" placeholder="e.g. 20000" required />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="start_date" label="Start Date" type="date" required />
              <FormField name="end_date" label="End Date" type="date" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Create Order</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      <Modal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        title={`Create Batches: ${selectedOrder?.id}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border mb-4">
            <p className="text-sm text-gray-500">Total Quantity</p>
            <p className="text-xl font-bold">{selectedOrder?.plannedQty.toLocaleString()} Units</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Number of Batches</label>
              <input 
                type="number" 
                value={numBatches}
                onChange={(e) => setNumBatches(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g. 4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Production Line</label>
              <select 
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="Nimko Production Line">Nimko Production Line</option>
                <option value="Potato Chips Line">Potato Chips Line</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-bold uppercase mb-2">Batch Preview</p>
            <div className="space-y-1 text-sm text-blue-800">
              {Array.from({ length: Math.min(parseInt(numBatches) || 0, 4) }).map((_, i) => (
                <p key={i}>Batch {String.fromCharCode(65 + i)}: {(selectedOrder ? selectedOrder.plannedQty / (parseInt(numBatches) || 1) : 0).toFixed(0)} Units</p>
              ))}
              {(parseInt(numBatches) || 0) > 4 && <p>...</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsSplitModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button 
              type="button" 
              onClick={handleGenerateBatches} 
              className="btn btn-primary"
            >
              Generate Batches
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
