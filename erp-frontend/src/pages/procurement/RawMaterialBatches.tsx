import React from 'react';
import { Plus } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const RawMaterialBatchesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['raw-material-batches'],
    queryFn: procurementAPI.getRawMaterialBatches,
  });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: masterDataAPI.getWarehouses });

  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));
  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouse_name, value: w.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createRawMaterialBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-material-batches'] });
      toast.success('Batch created');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const methods = useForm({
    defaultValues: {
      material_id: '',
      supplier_id: '',
      warehouse_id: '',
      batch_number: '',
      supplier_batch: '',
      quantity: '',
      manufacture_date: '',
      expiry_date: '',
      status: 'Hold',
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      material_id: data.material_id,
      supplier_id: data.supplier_id || null,
      warehouse_id: data.warehouse_id || null,
      batch_number: data.batch_number,
      supplier_batch: data.supplier_batch || '',
      quantity: parseFloat(data.quantity),
      manufacture_date: data.manufacture_date || null,
      expiry_date: data.expiry_date || null,
      status: data.status,
    });
  };

  const filtered = batches.filter((b: any) =>
    (b.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Raw Material Batches</h2>
          <p className="text-sm text-gray-500">Lot tracking with expiry and QC status</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Create Batch
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search batch number..." />
        </div>
        <Table
          columns={[
            { header: 'Batch #', accessor: 'batch_number' },
            { header: 'Supplier Batch', accessor: 'supplier_batch' },
            { header: 'Material', accessor: 'material_name' },
            { header: 'Quantity', accessor: 'quantity' },
            { header: 'Mfg Date', accessor: 'manufacture_date', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Expiry', accessor: 'expiry_date', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Raw Material Batch" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} />
              <FormField name="warehouse_id" label="Warehouse" type="select" options={warehouseOptions} />
              <FormField name="batch_number" label="Batch Number" required />
              <FormField name="supplier_batch" label="Supplier Batch Ref" />
              <FormField name="quantity" label="Quantity" required />
              <FormField name="manufacture_date" label="Manufacture Date" type="date" />
              <FormField name="expiry_date" label="Expiry Date" type="date" />
              <FormField
                name="status"
                label="Status"
                type="select"
                options={[
                  { label: 'Hold (pending QC)', value: 'Hold' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' },
                  { label: 'Expired', value: 'Expired' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>Save Batch</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
