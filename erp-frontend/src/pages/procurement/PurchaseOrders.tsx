import React from 'react';
import { FileText, Truck, Clock, CheckCircle, Package, Plus, Search, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useAuditStore } from '@/store/useAuditStore';
import { useProcurementStore, PurchaseOrder } from '@/store/useProcurementStore';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';

export const PurchaseOrdersPage: React.FC = () => {
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { user } = useAuthStore();
  const { purchaseOrders, addPO, updatePOStatus, requisitions, updatePRStatus } = useProcurementStore();
  const addApprovalRequest = useApprovalStore(state => state.addRequest);
  const addLog = useAuditStore(state => state.addLog);

  const methods = useForm({
    defaultValues: {
      supplierId: '',
      supplierName: '',
      expectedDelivery: '',
      prId: '',
      items: [{ materialId: '', materialName: '', quantity: 0, unit: '', price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items"
  });

  const onSubmit = (data: any) => {
    if (!user) return;

    const totalAmount = data.items.reduce((acc: number, item: any) => 
      acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0
    );

    addPO({
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      date: new Date().toISOString(),
      expectedDelivery: data.expectedDelivery,
      prId: data.prId,
      items: data.items.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.quantity) * parseFloat(item.price)
      })),
      totalAmount,
      createdBy: user.name,
    });

    if (data.prId) {
      updatePRStatus(data.prId, 'Converted');
    }

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_PO',
      module: 'Procurement',
      details: `Created PO for ${data.supplierName} - Amount: ${formatCurrency(totalAmount)}`,
      status: 'success'
    });

    toast.success('Purchase Order created as Draft');
    setIsModalOpen(false);
    methods.reset();
  };

  const sendToSupplier = (po: PurchaseOrder) => {
    if (!user) return;
    updatePOStatus(po.id, 'Sent');
    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'SEND_PO',
      module: 'Procurement',
      details: `Sent PO ${po.id} to supplier ${po.supplierName}`,
      status: 'success'
    });
    toast.success('PO sent to supplier');
    if (selectedPO?.id === po.id) {
      setSelectedPO({ ...po, status: 'Sent' });
    }
  };

  const handleConvertPR = (pr: any) => {
    methods.reset({
      prId: pr.id,
      supplierId: '',
      supplierName: '',
      expectedDelivery: '',
      items: pr.items.map((item: any) => ({
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.estimatedCost
      }))
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-sm text-gray-500">Manage external procurement and vendor tracking</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
            <Plus size={18} />
            Create PO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <SearchBar onSearch={() => {}} placeholder="Search POs..." />
            </div>
            <Table
              columns={[
                { header: 'PO Number', accessor: 'id' },
                { header: 'Supplier', accessor: 'supplierName' },
                { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
                { header: 'Items', accessor: 'items', render: (val) => val.length },
                { header: 'Total', accessor: 'totalAmount', render: (val) => formatCurrency(val) },
                { 
                  header: 'Status', 
                  accessor: 'status', 
                  render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
                },
              ]}
              data={purchaseOrders}
              onRowClick={(row) => setSelectedPO(row)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <FileText size={18} /> Approved PRs
            </h4>
            <div className="space-y-3">
              {requisitions.filter(pr => pr.status === 'Approved').map(pr => (
                <div key={pr.id} className="p-3 border rounded-lg hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleConvertPR(pr)}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">{pr.id}</span>
                    <Badge color="bg-green-100 text-green-800 text-[10px]">Approved</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{pr.department}</p>
                  <p className="text-xs font-medium mt-1">{formatCurrency(pr.totalAmount)}</p>
                  <button className="w-full mt-2 btn btn-outline btn-sm py-1 text-[10px]">Convert to PO</button>
                </div>
              ))}
              {requisitions.filter(pr => pr.status === 'Approved').length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 italic">No approved PRs pending</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPO && (
        <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title={`PO Details: ${selectedPO.id}`} size="xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedPO.supplierName}</h3>
                <p className="text-sm text-gray-500">PO Date: {formatDate(selectedPO.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedPO.status === 'Draft' && (
                  <button onClick={() => sendToSupplier(selectedPO)} className="btn btn-primary btn-sm py-1">
                    Send to Supplier
                  </button>
                )}
                <Badge color={getStatusColor(selectedPO.status)} className="px-4 py-1 text-sm">
                  {selectedPO.status}
                </Badge>
              </div>
            </div>

            <Table
              columns={[
                { header: 'Material', accessor: 'materialName' },
                { header: 'Quantity', accessor: 'quantity' },
                { header: 'Unit', accessor: 'unit' },
                { header: 'Price', accessor: 'price', render: (val) => formatCurrency(val) },
                { header: 'Total', accessor: 'total', render: (val) => formatCurrency(val) },
              ]}
              data={selectedPO.items}
            />

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedPO.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Order" size="xl">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="supplierName" label="Supplier Name" required />
              <FormField name="expectedDelivery" label="Expected Delivery" type="date" required />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-sm">PO Items</h4>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="col-span-2">
                    <FormField name={`items.${index}.materialName`} label="Material" />
                  </div>
                  <FormField name={`items.${index}.quantity`} label="Qty" />
                  <FormField name={`items.${index}.price`} label="Price" />
                  <div className="flex items-end justify-center pb-2">
                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => append({ materialId: '', materialName: '', quantity: 0, unit: '', price: 0 })} className="btn btn-outline btn-sm">
                + Add Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Create PO</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
