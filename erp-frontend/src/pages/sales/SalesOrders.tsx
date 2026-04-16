import React from 'react';
import { Plus, ShoppingBag, CheckCircle, AlertCircle, User, Calendar, Search, CreditCard, Warehouse } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSalesStore, SalesOrder } from '@/store/useSalesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const SalesOrdersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(null);
  const [creditCheck, setCreditCheck] = React.useState<{ ok: boolean; limit: number; balance: number } | null>(null);
  
  const { orders, addOrder, updateOrderStatus } = useSalesStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);

  const methods = useForm({
    defaultValues: {
      customerId: '',
      warehouseId: 'WH-MAIN',
      paymentType: 'Credit',
      source: 'manual_entry',
      items: [{ productId: '', quantity: '', unitPrice: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items"
  });

  const onSubmit = (data: any) => {
    if (!user) return;

    const customerName = data.customerId === 'imtiaz' ? 'Imtiaz Super Market' : 
                        data.customerId === 'metro' ? 'Metro Cash & Carry' : 'Chase Up';

    const totalAmount = data.items.reduce((acc: number, item: any) => 
      acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0
    );

    addOrder({
      customerId: data.customerId,
      customerName: customerName,
      warehouseId: data.warehouseId,
      paymentType: data.paymentType,
      source: data.source,
      items: data.items.map((item: any) => ({
        ...item,
        productName: item.productId === '1' ? 'Nimko Mix 200g' : 'Potato Chips 50g',
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice)
      })),
      totalAmount: totalAmount,
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_SALES_ORDER',
      module: 'Sales',
      details: `Created Sales Order for ${customerName} - Total: ${formatCurrency(totalAmount)}`,
      status: 'success'
    });

    toast.success('Sales order created successfully');
    setIsModalOpen(false);
    setCreditCheck(null);
    methods.reset();
  };

  const handleConfirmOrder = (order: SalesOrder) => {
    if (!user) return;

    // 1. Credit Check
    const isCreditOk = order.customerId !== 'metro'; // Metro has exceeded limit for demo
    const limit = 500000;
    const balance = isCreditOk ? 120000 : 550000;

    if (!isCreditOk) {
      toast.error(`Credit Check Failed: ${order.customerName} has exceeded their limit of ${formatCurrency(limit)}`);
      addLog({
        userId: user.id.toString(),
        userName: user.name,
        action: 'CREDIT_CHECK_FAILED',
        module: 'Sales',
        details: `Credit check failed for ${order.customerName} on order ${order.id}`,
        status: 'failure'
      });
      return;
    }

    toast.success('Credit Check Approved');

    // 2. Stock Reservation
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Reserving stock in warehouse...',
        success: 'Stock reserved successfully',
        error: 'Stock unavailable',
      }
    ).then(() => {
      updateOrderStatus(order.id, 'Stock Reserved');
      addLog({
        userId: user.id.toString(),
        userName: user.name,
        action: 'STOCK_RESERVED',
        module: 'Sales',
        details: `Stock reserved for order ${order.id}`,
        status: 'success'
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Orders</h2>
          <p className="text-sm text-gray-500">Manage customer orders and sales channels</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search orders..." className="w-full pl-10 pr-4 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <Table
          columns={[
            { header: 'Order ID', accessor: 'id' },
            { header: 'Customer', accessor: 'customerName' },
            { header: 'Date', accessor: 'createdAt', render: (val) => formatDate(val) },
            { header: 'Total', accessor: 'totalAmount', render: (val) => formatCurrency(val) },
            { 
              header: 'Source', 
              accessor: 'source', 
              render: (val) => (
                <Badge color={val === 'sales_app' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                  {val.replace('_', ' ')}
                </Badge>
              )
            },
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
                  {row.status === 'Received' && (
                    <button 
                      onClick={() => handleConfirmOrder(row)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Confirm & Reserve
                    </button>
                  )}
                  {row.status === 'Stock Reserved' && (
                    <button 
                      onClick={() => toast.success('Picking list generated')}
                      className="text-green-600 text-sm font-medium hover:underline"
                    >
                      Generate Picking
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
        title="Create Sales Order"
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="customerId" 
                label="Select Customer" 
                type="select" 
                options={[
                  { label: 'Imtiaz Super Market', value: 'imtiaz' },
                  { label: 'Metro Cash & Carry', value: 'metro' },
                  { label: 'Chase Up', value: 'chase' },
                ]} 
                required 
              />
              <FormField 
                name="warehouseId" 
                label="Dispatch Warehouse" 
                type="select" 
                options={[
                  { label: 'Main Warehouse', value: 'WH-MAIN' },
                  { label: 'Regional - Lahore', value: 'WH-LHR' },
                ]} 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="paymentType" 
                label="Payment Type" 
                type="select" 
                options={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Credit', value: 'Credit' },
                  { label: 'Cheque', value: 'Cheque' },
                ]} 
                required 
              />
              <FormField 
                name="source" 
                label="Order Source" 
                type="select" 
                options={[
                  { label: 'Sales App', value: 'sales_app' },
                  { label: 'Manual Entry', value: 'manual_entry' },
                  { label: 'Distributor Portal', value: 'distributor_portal' },
                ]} 
                required 
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag size={16} /> Order Items
              </h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                    <FormField 
                      name={`items.${index}.productId`} 
                      label="Product" 
                      type="select" 
                      className="flex-1"
                      options={[
                        { label: 'Nimko Mix 200g', value: '1' },
                        { label: 'Potato Chips 50g', value: '2' },
                      ]} 
                    />
                    <FormField name={`items.${index}.quantity`} label="Qty" className="w-24" />
                    <FormField name={`items.${index}.unitPrice`} label="Price" className="w-32" />
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded mb-1"
                    >
                      <AlertCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => append({ productId: '', quantity: '', unitPrice: '' })}
                className="btn btn-outline btn-sm gap-2"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Create Order</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
