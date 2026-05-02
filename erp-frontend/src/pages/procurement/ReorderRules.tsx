import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const ReorderRulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: rules = [], isLoading } = useQuery({ queryKey: ['reorder-rules'], queryFn: procurementAPI.getReorderRules });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: masterDataAPI.getWarehouses });

  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouse_name, value: w.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createReorderRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-rules'] });
      toast.success('Rule created');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => procurementAPI.updateReorderRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-rules'] });
      toast.success('Rule updated');
      setIsModalOpen(false);
      setEditing(null);
      methods.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: procurementAPI.deleteReorderRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-rules'] });
      toast.success('Rule deleted');
    },
  });

  const methods = useForm({
    defaultValues: { material_id: '', warehouse_id: '', minimum_stock: '', maximum_stock: '', reorder_quantity: '' },
  });

  const onSubmit = (data: any) => {
    const payload = {
      material_id: data.material_id,
      warehouse_id: data.warehouse_id,
      minimum_stock: parseFloat(data.minimum_stock),
      maximum_stock: parseFloat(data.maximum_stock),
      reorder_quantity: parseFloat(data.reorder_quantity),
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (rule: any) => {
    setEditing(rule);
    methods.reset({
      material_id: rule.material_id?.toString(),
      warehouse_id: rule.warehouse_id?.toString(),
      minimum_stock: rule.minimum_stock?.toString(),
      maximum_stock: rule.maximum_stock?.toString(),
      reorder_quantity: rule.reorder_quantity?.toString(),
    });
    setIsModalOpen(true);
  };

  const filtered = rules;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reorder Rules</h2>
          <p className="text-sm text-gray-500">Automatic reorder thresholds per material &amp; warehouse</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            methods.reset();
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2"
        >
          <Plus size={18} /> Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search..." />
        </div>
        <Table
          columns={[
            { header: 'Material', accessor: 'material_name' },
            { header: 'Warehouse', accessor: 'warehouse_name', render: (v) => v || '—' },
            { header: 'Min Stock', accessor: 'minimum_stock' },
            { header: 'Max Stock', accessor: 'maximum_stock' },
            { header: 'Reorder Qty', accessor: 'reorder_quantity' },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Reorder Rule' : 'New Reorder Rule'}
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="warehouse_id" label="Warehouse" type="select" options={warehouseOptions} required />
              <FormField name="minimum_stock" label="Minimum Stock" required />
              <FormField name="maximum_stock" label="Maximum Stock" required />
              <FormField name="reorder_quantity" label="Reorder Quantity" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
