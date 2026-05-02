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

export const PurchaseReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: returns_ = [], isLoading } = useQuery({
    queryKey: ['purchase-returns'],
    queryFn: procurementAPI.getPurchaseReturns,
  });
  const { data: grns = [] } = useQuery({ queryKey: ['grns'], queryFn: procurementAPI.getGRNs });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });

  const grnOptions = grns.map((g: any) => ({ label: g.grn_number, value: g.id }));
  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createPurchaseReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      toast.success('Return recorded');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const methods = useForm({
    defaultValues: {
      grn_id: '',
      material_id: '',
      quantity: '',
      reason: '',
      return_date: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      grn_id: data.grn_id || null,
      material_id: data.material_id,
      quantity: parseFloat(data.quantity),
      reason: data.reason,
      return_date: data.return_date,
      status: 'Pending',
    });
  };

  const filtered = returns_.filter((r: any) =>
    (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Returns</h2>
          <p className="text-sm text-gray-500">Materials returned to suppliers after QC rejection</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Record Return
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search by reason..." />
        </div>
        <Table
          columns={[
            { header: 'Return Date', accessor: 'return_date', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'GRN', accessor: 'grn_number', render: (v) => v || '—' },
            { header: 'Material', accessor: 'material_name' },
            { header: 'Quantity', accessor: 'quantity' },
            { header: 'Reason', accessor: 'reason' },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Purchase Return" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="grn_id" label="GRN (optional)" type="select" options={grnOptions} />
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="quantity" label="Return Quantity" required />
              <FormField name="return_date" label="Return Date" type="date" required />
            </div>
            <FormField name="reason" label="Reason" type="textarea" />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>Save Return</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
