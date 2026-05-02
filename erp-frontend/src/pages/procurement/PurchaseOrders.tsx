import React from 'react';
import { Plus, CheckCircle, Send, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const PurchaseOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: pos = [], isLoading } = useQuery({ queryKey: ['purchase-orders'], queryFn: procurementAPI.getPurchaseOrders });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: masterDataAPI.getWarehouses });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });
  const { data: paymentTerms = [] } = useQuery({ queryKey: ['payment-terms'], queryFn: procurementAPI.getPaymentTerms });

  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouse_name, value: w.id }));
  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));
  const paymentTermOptions = paymentTerms.map((p: any) => ({ label: p.term_name, value: p.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('PO created');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const approveMutation = useMutation({
    mutationFn: procurementAPI.approvePO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('PO approved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Approve failed'),
  });

  const sendMutation = useMutation({
    mutationFn: procurementAPI.sendPOToSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('PO sent to supplier');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Send failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: procurementAPI.deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('PO cancelled');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Delete failed'),
  });

  const methods = useForm({
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      payment_terms: '',
      expected_delivery: '',
      currency: 'PKR',
      items: [{ material_id: '', ordered_quantity: '', unit_price: '', tax_rate: '0', discount: '0' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'items' });

  const onSubmit = (data: any) => {
    const payload: any = {
      supplier_id: data.supplier_id,
      warehouse_id: data.warehouse_id || null,
      payment_terms: data.payment_terms || null,
      expected_delivery: data.expected_delivery || null,
      currency: data.currency,
      status: 'Draft',
      items: data.items
        .filter((i: any) => i.material_id)
        .map((i: any) => ({
          material_id: i.material_id,
          ordered_quantity: parseFloat(i.ordered_quantity || 0),
          unit_price: parseFloat(i.unit_price || 0),
          tax_rate: parseFloat(i.tax_rate || 0),
          discount: parseFloat(i.discount || 0),
        })),
    };
    createMutation.mutate(payload);
  };

  const filtered = pos.filter((p: any) =>
    p.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-sm text-gray-500">Formal purchase orders issued to suppliers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Create PO
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search PO number..." />
        </div>
        <Table
          columns={[
            { header: 'PO Number', accessor: 'po_number' },
            { header: 'Supplier', accessor: 'supplier_name' },
            { header: 'Order Date', accessor: 'order_date', render: (v) => formatDate(v) },
            { header: 'Expected', accessor: 'expected_delivery', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Total', accessor: 'total_amount', render: (v) => formatCurrency(v) },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  {row.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(row.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(row.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {row.status === 'Approved' && (
                    <button
                      onClick={() => sendMutation.mutate(row.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Send to Supplier"
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Order" size="xl">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="warehouse_id" label="Warehouse" type="select" options={warehouseOptions} />
              <FormField name="payment_terms" label="Payment Terms" type="select" options={paymentTermOptions} />
              <FormField name="expected_delivery" label="Expected Delivery" type="date" />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Items (note: items are added via detail view after saving)</h4>
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 bg-gray-50 rounded border grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <FormField name={`items.${idx}.material_id`} label="Material" type="select" options={materialOptions} />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.ordered_quantity`} label="Qty" />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.unit_price`} label="Unit Price" />
                  </div>
                  <div className="col-span-1">
                    <FormField name={`items.${idx}.tax_rate`} label="Tax %" />
                  </div>
                  <div className="col-span-1">
                    <FormField name={`items.${idx}.discount`} label="Disc %" />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ material_id: '', ordered_quantity: '', unit_price: '', tax_rate: '0', discount: '0' })}
                className="btn btn-outline btn-sm gap-2"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                Save PO (Draft)
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
