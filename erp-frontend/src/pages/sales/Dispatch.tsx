import React from 'react';
import { Truck, Package, MapPin, CheckCircle, Search, User, ClipboardList, XCircle, AlertTriangle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor, formatCurrency } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useSalesStore, DispatchStatus } from '@/store/useSalesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const DispatchPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('In Transit');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = React.useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = React.useState<string | null>(null);
  
  const { orders, dispatches, addDispatch, confirmDelivery } = useSalesStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);

  const methods = useForm();
  const deliveryMethods = useForm();

  const tabs = ['In Transit', 'Delivered', 'Partially Delivered', 'Rejected'];

  const reservedOrders = orders.filter(o => o.status === 'Stock Reserved');

  const onSubmitDispatch = (data: any) => {
    if (!user) return;

    const order = orders.find(o => o.id === data.orderId);
    if (!order) return;

    addDispatch({
      orderId: data.orderId,
      customerName: order.customerName,
      vehicleId: data.vehicleId,
      driverName: data.driverName,
      dispatchDate: data.dispatchDate,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        orderedQty: item.quantity
      }))
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_DISPATCH',
      module: 'Sales',
      details: `Created Dispatch for Order ${data.orderId} - Vehicle: ${data.vehicleId}`,
      status: 'success'
    });

    toast.success('Dispatch plan created and stock moved to transit');
    setIsModalOpen(false);
    methods.reset();
  };

  const onConfirmDelivery = (data: any) => {
    if (!user || !selectedDispatchId) return;

    const dispatch = dispatches.find(d => d.id === selectedDispatchId);
    if (!dispatch) return;

    const deliveredItems = dispatch.items.map(item => ({
      productId: item.productId,
      deliveredQty: parseFloat(data[`qty_${item.productId}`]) || item.orderedQty
    }));

    confirmDelivery(selectedDispatchId, data.status as DispatchStatus, deliveredItems);

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CONFIRM_DELIVERY',
      module: 'Sales',
      details: `Confirmed Delivery for Dispatch ${selectedDispatchId} - Status: ${data.status}`,
      status: 'success'
    });

    toast.success(`Delivery confirmed as ${data.status}`);
    toast.success('Sales Invoice auto-generated', { icon: '📄' });
    toast.success('Finance: AR Dr / Revenue Cr posted', { icon: '💰' });
    
    setIsDeliveryModalOpen(false);
    setSelectedDispatchId(null);
    deliveryMethods.reset();
  };

  const selectedOrderId = methods.watch('orderId');
  const selectedOrderForPicking = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dispatch & Logistics</h2>
          <p className="text-sm text-gray-500">Manage vehicle loading and delivery tracking</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Truck size={18} />
          New Dispatch
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === tab 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table
            columns={[
              { header: 'Dispatch ID', accessor: 'id' },
              { header: 'Order Ref', accessor: 'orderId' },
              { header: 'Customer', accessor: 'customerName' },
              { header: 'Vehicle', accessor: 'vehicleId' },
              { header: 'Driver', accessor: 'driverName' },
              { header: 'Date', accessor: 'dispatchDate', render: (val) => formatDate(val) },
              { 
                header: 'Status', 
                accessor: 'status', 
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
              },
              {
                header: 'Actions',
                accessor: 'id',
                render: (id, row) => (
                  row.status === 'In Transit' ? (
                    <button 
                      onClick={() => {
                        setSelectedDispatchId(id);
                        setIsDeliveryModalOpen(true);
                      }}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Confirm Delivery
                    </button>
                  ) : null
                )
              }
            ]}
            data={dispatches.filter(d => d.status === activeTab)}
          />
        </div>
      </div>

      {/* New Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Dispatch Plan"
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmitDispatch)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="orderId" 
                label="Select Sales Order" 
                type="select" 
                options={reservedOrders.map(o => ({
                  label: `${o.id} (${o.customerName})`,
                  value: o.id
                }))} 
                required 
              />
              <FormField name="dispatchDate" label="Dispatch Date" type="date" required />
              <FormField name="vehicleId" label="Vehicle Number" placeholder="e.g. KAE-1234" required />
              <FormField name="driverName" label="Driver Name" placeholder="e.g. Muhammad Ali" required />
            </div>

            {selectedOrderForPicking && (
              <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <ClipboardList size={16} /> Picking List (FIFO)
                </h4>
                <div className="space-y-2">
                  {selectedOrderForPicking.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded border text-sm">
                      <div>
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={12} /> BIN-{i === 0 ? 'A1' : 'B2'} (Factory)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.quantity} Units</p>
                        <p className="text-[10px] text-primary uppercase font-bold">Batch: PN260312A</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <CheckCircle size={18} /> Confirm Dispatch
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Confirm Delivery Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Confirm Delivery"
        size="lg"
      >
        <FormProvider {...deliveryMethods}>
          <form onSubmit={deliveryMethods.handleSubmit(onConfirmDelivery)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="status" 
                label="Delivery Status" 
                type="select" 
                options={[
                  { label: 'Delivered', value: 'Delivered' },
                  { label: 'Partially Delivered', value: 'Partially Delivered' },
                  { label: 'Rejected', value: 'Rejected' },
                ]} 
                required 
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Package size={16} /> Delivered Quantities
              </h4>
              <div className="space-y-3">
                {dispatches.find(d => d.id === selectedDispatchId)?.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">Ordered: {item.orderedQty}</p>
                    </div>
                    <div className="w-32">
                      <FormField 
                        name={`qty_${item.productId}`} 
                        label="Delivered Qty" 
                        placeholder={item.orderedQty.toString()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Delivery</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
