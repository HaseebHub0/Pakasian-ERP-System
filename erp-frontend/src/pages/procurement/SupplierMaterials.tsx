import React from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const SupplierMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const [selectedSM, setSelectedSM] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: supplierMaterials = [], isLoading } = useQuery({
    queryKey: ['supplier-materials'],
    queryFn: procurementAPI.getSupplierMaterials,
  });
  const { data: priceHistory = [] } = useQuery({
    queryKey: ['supplier-price-history', selectedSM?.supplier_id, selectedSM?.material_id],
    queryFn: () =>
      procurementAPI.getSupplierPriceHistory({
        supplier_id: selectedSM?.supplier_id,
        material_id: selectedSM?.material_id,
      }),
    enabled: !!selectedSM,
  });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });

  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createSupplierMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-materials'] });
      toast.success('Supplier material linked');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: procurementAPI.deleteSupplierMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-materials'] });
      toast.success('Removed (soft-deleted)');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Delete failed'),
  });

  const methods = useForm({
    defaultValues: {
      supplier_id: '',
      material_id: '',
      standard_price: '',
      lead_time_days: '',
      preferred_supplier: false,
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      supplier_id: data.supplier_id,
      material_id: data.material_id,
      standard_price: parseFloat(data.standard_price),
      lead_time_days: parseInt(data.lead_time_days || 0),
      preferred_supplier: !!data.preferred_supplier,
    });
  };

  const filtered = supplierMaterials.filter(
    (sm: any) =>
      sm.status !== 'inactive' &&
      (sm.supplier_id?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Supplier Materials</h2>
          <p className="text-sm text-gray-500">Manage supplier–material links and standard pricing</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Link Supplier Material
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search..." />
        </div>
        <Table
          columns={[
            { header: 'Supplier', accessor: 'supplier_name' },
            { header: 'Material', accessor: 'material_name' },
            { header: 'Standard Price', accessor: 'standard_price', render: (v) => formatCurrency(v) },
            { header: 'Lead Time', accessor: 'lead_time_days', render: (v) => `${v} days` },
            {
              header: 'Preferred',
              accessor: 'preferred_supplier',
              render: (v) => <Badge color={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge>,
            },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedSM(row); setHistoryModalOpen(true); }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Price History"
                  >
                    <Clock size={16} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(row.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Link Supplier Material" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="standard_price" label="Standard Price (PKR)" required />
              <FormField name="lead_time_days" label="Lead Time (days)" />
              <FormField name="preferred_supplier" label="Preferred Supplier?" type="checkbox" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>Save</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Price History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => { setHistoryModalOpen(false); setSelectedSM(null); }}
        title="Price History"
        size="lg"
      >
        <Table
          columns={[
            { header: 'Valid From', accessor: 'valid_from', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Valid To', accessor: 'valid_to', render: (v) => (v ? formatDate(v) : 'Current') },
            { header: 'Price (PKR)', accessor: 'price', render: (v) => formatCurrency(v) },
            { header: 'Currency', accessor: 'currency' },
          ]}
          data={priceHistory}
        />
        {priceHistory.length === 0 && (
          <p className="text-sm text-gray-400 p-4 text-center">No price changes recorded yet.</p>
        )}
      </Modal>
    </div>
  );
};
