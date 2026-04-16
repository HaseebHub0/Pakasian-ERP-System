import React from 'react';
import { Plus, Package, MapPin, CheckCircle, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useProcurementStore, GRN } from '@/store/useProcurementStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const GRNPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { grns, addGRN, purchaseOrders, updatePOStatus } = useProcurementStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);

  const methods = useForm({
    defaultValues: {
      poId: '',
      deliveryChallan: '',
      items: [{ materialId: '', materialName: '', orderedQty: 0, receivedQty: 0, acceptedQty: 0, rejectedQty: 0, binId: '', batchNumber: '' }]
    }
  });

  const { fields, replace } = useFieldArray({
    control: methods.control,
    name: "items"
  });

  const selectedPOId = methods.watch('poId');

  React.useEffect(() => {
    const po = purchaseOrders.find(p => p.id === selectedPOId);
    if (po) {
      replace(po.items.map(item => ({
        materialId: item.materialId,
        materialName: item.materialName,
        orderedQty: item.quantity,
        receivedQty: item.quantity,
        acceptedQty: item.quantity,
        rejectedQty: 0,
        binId: 'A1',
        batchNumber: `B-${new Date().getTime().toString().slice(-6)}`
      })));
    }
  }, [selectedPOId, purchaseOrders, replace]);

  const onSubmit = (data: any) => {
    if (!user) return;

    const po = purchaseOrders.find(p => p.id === data.poId);
    if (!po) return;

    addGRN({
      poId: data.poId,
      supplierName: po.supplierName,
      date: new Date().toISOString(),
      deliveryChallan: data.deliveryChallan,
      items: data.items.map((item: any) => ({
        ...item,
        receivedQty: parseFloat(item.receivedQty),
        acceptedQty: parseFloat(item.acceptedQty),
        rejectedQty: parseFloat(item.rejectedQty)
      })),
      receivedBy: user.name,
    });

    updatePOStatus(data.poId, 'Received');

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_GRN',
      module: 'Procurement',
      details: `Created GRN for PO ${data.poId} - Challan: ${data.deliveryChallan}`,
      status: 'success'
    });

    toast.success('GRN Created successfully. QC Inspections triggered.');
    toast.success('Automatic Journal Entry: Inventory Dr / Accounts Payable Cr', { icon: '📝' });
    setIsModalOpen(false);
    methods.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Goods Receipt Note (GRN)</h2>
          <p className="text-sm text-gray-500">Record incoming material deliveries</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Receive Against PO
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table
          columns={[
            { header: 'GRN Number', accessor: 'id' },
            { header: 'PO Number', accessor: 'poId' },
            { header: 'Supplier', accessor: 'supplierName' },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { header: 'Items', accessor: 'items', render: (val) => val.length },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
            },
          ]}
          data={grns}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Receive Goods Against PO"
        size="xl"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="poId" 
                label="Select Purchase Order" 
                type="select" 
                options={purchaseOrders.filter(p => p.status === 'Sent' || p.status === 'Approved').map(p => ({
                  label: `${p.id} (${p.supplierName})`,
                  value: p.id
                }))} 
                required 
              />
              <FormField name="deliveryChallan" label="Delivery Challan #" placeholder="DC-..." required />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Package size={16} /> Material Lines
              </h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{field.materialName}</span>
                      <span className="text-xs text-gray-500">Ordered: {field.orderedQty}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <FormField name={`items.${index}.receivedQty`} label="Received Qty" required />
                      <FormField name={`items.${index}.acceptedQty`} label="Accepted Qty" required />
                      <FormField name={`items.${index}.rejectedQty`} label="Rejected Qty" required />
                      <FormField 
                        name={`items.${index}.binId`} 
                        label="Bin Location" 
                        type="select"
                        options={[
                          { label: 'BIN-A1', value: 'A1' },
                          { label: 'BIN-A2', value: 'A2' },
                          { label: 'BIN-B1', value: 'B1' },
                        ]}
                        required 
                      />
                    </div>
                    <FormField name={`items.${index}.batchNumber`} label="Batch Number" required />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <CheckCircle size={18} /> Complete GRN
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
