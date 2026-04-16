import React from 'react';
import { RotateCcw, Package, AlertCircle, Search, CheckCircle2, Trash2, Clock, Plus } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSalesStore, ReturnCondition } from '@/store/useSalesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const ReturnsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { orders, returns, addReturn } = useSalesStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);

  const methods = useForm({
    defaultValues: {
      orderId: '',
      items: [{ productId: '', quantity: '', condition: 'Resellable' as ReturnCondition }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items"
  });

  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  const onSubmit = (data: any) => {
    if (!user) return;

    const order = orders.find(o => o.id === data.orderId);
    if (!order) return;

    addReturn({
      orderId: data.orderId,
      customerName: order.customerName,
      items: data.items.map((item: any) => ({
        ...item,
        productName: item.productId === '1' ? 'Nimko Mix 200g' : 'Potato Chips 50g',
        quantity: parseFloat(item.quantity)
      }))
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'PROCESS_SALES_RETURN',
      module: 'Sales',
      details: `Processed Return for Order ${data.orderId}`,
      status: 'success'
    });

    toast.success('Sales return processed successfully');
    
    // Logic for inventory based on condition
    data.items.forEach((item: any) => {
      if (item.condition === 'Resellable') {
        toast.success(`Stock for ${item.productId} returned to Salable Inventory`, { icon: '🔄' });
      } else {
        toast.error(`Stock for ${item.productId} moved to ${item.condition} Quarantine`, { icon: '⚠️' });
      }
    });

    toast.success('Finance: Revenue reversal posted', { icon: '💰' });

    setIsModalOpen(false);
    methods.reset();
  };

  const selectedOrderId = methods.watch('orderId');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Returns</h2>
          <p className="text-sm text-gray-500">Handle customer returns and stock adjustments</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <RotateCcw size={18} />
          Process Return
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search returns..." className="w-full pl-10 pr-4 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <Table
          columns={[
            { header: 'Return ID', accessor: 'id' },
            { header: 'Order Ref', accessor: 'orderId' },
            { header: 'Customer', accessor: 'customerName' },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { 
              header: 'Items', 
              accessor: 'items', 
              render: (items: any[]) => (
                <div className="text-xs">
                  {items.map((it, i) => (
                    <div key={i}>{it.productName} ({it.quantity}) - <span className="font-bold">{it.condition}</span></div>
                  ))}
                </div>
              )
            },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => <Badge color="bg-green-100 text-green-800 border-green-200">{val}</Badge> 
            }
          ]}
          data={returns}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Sales Return"
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="orderId" 
                label="Select Delivered Order" 
                type="select" 
                options={deliveredOrders.map(o => ({
                  label: `${o.id} (${o.customerName})`,
                  value: o.id
                }))} 
                required 
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Package size={16} /> Return Items
              </h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                    <FormField 
                      name={`items.${index}.productId`} 
                      label="Product" 
                      type="select" 
                      className="flex-1"
                      options={selectedOrder?.items.map(it => ({
                        label: it.productName,
                        value: it.productId
                      })) || []} 
                    />
                    <FormField name={`items.${index}.quantity`} label="Qty" className="w-24" />
                    <FormField 
                      name={`items.${index}.condition`} 
                      label="Condition" 
                      type="select"
                      className="w-40"
                      options={[
                        { label: 'Resellable', value: 'Resellable' },
                        { label: 'Damaged', value: 'Damaged' },
                        { label: 'Expired', value: 'Expired' },
                      ]} 
                    />
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded mb-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => append({ productId: '', quantity: '', condition: 'Resellable' })}
                className="btn btn-outline btn-sm gap-2"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Process Return</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
