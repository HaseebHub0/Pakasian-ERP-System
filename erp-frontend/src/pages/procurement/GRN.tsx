import React from 'react';
import { Plus, CheckCircle, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const GRNPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: grns = [], isLoading } = useQuery({ queryKey: ['grns'], queryFn: procurementAPI.getGRNs });
  const { data: pos = [] } = useQuery({ queryKey: ['purchase-orders'], queryFn: procurementAPI.getPurchaseOrders });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: masterDataAPI.getWarehouses });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });

  const poOptions = pos.map((p: any) => ({ label: p.po_number, value: p.id }));
  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouse_name, value: w.id }));
  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createGRN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      toast.success('GRN created');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const confirmMutation = useMutation({
    mutationFn: procurementAPI.confirmGRN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('GRN confirmed');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Confirm failed'),
  });

  const methods = useForm({
    defaultValues: {
      po_id: '',
      supplier_id: '',
      warehouse_id: '',
      received_date: new Date().toISOString().slice(0, 10),
      items: [{ material_id: '', ordered_qty: '0', received_qty: '', accepted_qty: '0', rejected_qty: '0', batch_number: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'items' });

  const onSubmit = (data: any) => {
    const payload = {
      po_id: data.po_id || null,
      supplier_id: data.supplier_id,
      warehouse_id: data.warehouse_id,
      received_date: data.received_date,
      status: 'Draft',
      items: data.items.map((i: any) => ({
        material_id: i.material_id,
        ordered_qty: parseFloat(i.ordered_qty || 0),
        received_qty: parseFloat(i.received_qty || 0),
        accepted_qty: parseFloat(i.accepted_qty || 0),
        rejected_qty: parseFloat(i.rejected_qty || 0),
        batch_number: i.batch_number || '',
      })),
    };
    createMutation.mutate(payload);
  };

  const filtered = grns.filter((g: any) => g.grn_number?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Goods Receipt Notes (GRN)</h2>
          <p className="text-sm text-gray-500">Record materials received from suppliers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Create GRN
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search GRN number..." />
        </div>
        <Table
          columns={[
            { header: 'GRN Number', accessor: 'grn_number' },
            { header: 'Received Date', accessor: 'received_date', render: (v) => formatDate(v) },
            { header: 'Supplier', accessor: 'supplier_name' },
            { header: 'PO', accessor: 'po_number', render: (v) => v || '—' },
            { header: 'Items', accessor: 'items', render: (v) => (v ? v.length : 0) },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  {row.status === 'Draft' && (
                    <button
                      onClick={() => confirmMutation.mutate(row.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Confirm GRN"
                    >
                      <CheckCircle size={16} />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Goods Receipt" size="xl">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField name="po_id" label="Purchase Order" type="select" options={poOptions} />
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="warehouse_id" label="Warehouse" type="select" options={warehouseOptions} required />
              <FormField name="received_date" label="Received Date" type="date" required />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Items</h4>
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 bg-gray-50 rounded border grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <FormField name={`items.${idx}.material_id`} label="Material" type="select" options={materialOptions} required />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.received_qty`} label="Received Qty" required />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.accepted_qty`} label="Accepted" />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.rejected_qty`} label="Rejected" />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.batch_number`} label="Batch #" />
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
                onClick={() =>
                  append({ material_id: '', ordered_qty: '0', received_qty: '', accepted_qty: '0', rejected_qty: '0', batch_number: '' })
                }
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
                Save GRN
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
