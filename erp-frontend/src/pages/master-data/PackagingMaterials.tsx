import React from 'react';
import { Plus, Edit2, Power, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

const schema = z.object({
  material_code: z.string().min(1, 'Code is required'),
  material_name: z.string().min(1, 'Name is required'),
  material_type: z.string().min(1, 'Type is required'),
  unit_of_measure: z.string().min(1, 'Unit is required'),
  standard_cost: z.string().min(1, 'Cost is required'),
  safety_stock: z.string().optional(),
  reorder_level: z.string().optional(),
  current_stock: z.string().optional(),
  supplier: z.string().optional(),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const MATERIAL_TYPES = [
  { label: 'Primary (Direct Contact)', value: 'primary' },
  { label: 'Secondary (Cartons/Boxes)', value: 'secondary' },
  { label: 'Tertiary (Pallets/Wrap)', value: 'tertiary' },
];

export const PackagingMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['packaging-materials'],
    queryFn: masterDataAPI.getPackagingMaterials,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: masterDataAPI.getSuppliers,
  });

  const methods = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createPackagingMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('Packaging material added');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Error: ' + msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      masterDataAPI.updatePackagingMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('Updated successfully');
      setIsModalOpen(false);
      setEditing(null);
      methods.reset();
    },
    onError: (error: any) => {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Error: ' + msg);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      masterDataAPI.updatePackagingMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('Status updated');
    },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    methods.reset({
      material_code: item.material_code,
      material_name: item.material_name,
      material_type: item.material_type,
      unit_of_measure: item.unit_of_measure,
      standard_cost: item.standard_cost?.toString(),
      safety_stock: item.safety_stock?.toString() || '0',
      reorder_level: item.reorder_level?.toString() || '0',
      current_stock: item.current_stock?.toString() || '0',
      supplier: item.supplier || '',
      status: item.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (row: any) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: row.id, data: { status: newStatus } });
  };

  const onSubmit = (data: FormValues) => {
    const payload = {
      material_code: data.material_code,
      material_name: data.material_name,
      material_type: data.material_type,
      unit_of_measure: data.unit_of_measure,
      standard_cost: parseFloat(data.standard_cost),
      safety_stock: parseFloat(data.safety_stock || '0'),
      reorder_level: parseFloat(data.reorder_level || '0'),
      current_stock: parseFloat(data.current_stock || '0'),
      supplier: data.supplier || null,
      status: data.status || 'active',
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = materials.filter((m: any) => {
    const matchesSearch =
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.material_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || m.material_type === selectedType;
    return matchesSearch && matchesType;
  });

  const typeColor: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-purple-100 text-purple-800 border-purple-200',
    tertiary: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Packaging Materials</h2>
          <p className="text-sm text-gray-500">Pouches, cartons, pallets and all packaging stock</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            methods.reset();
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2"
        >
          <Plus size={18} />
          Add Packaging Material
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {['primary', 'secondary', 'tertiary'].map((t) => {
          const count = materials.filter((m: any) => m.material_type === t).length;
          return (
            <div key={t} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 capitalize">{t} Packaging</p>
                <p className="text-xl font-bold">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={setSearchTerm} placeholder="Search by code or name..." />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="">All Types</option>
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={[
            { header: 'Code', accessor: 'material_code' },
            { header: 'Name', accessor: 'material_name' },
            {
              header: 'Type',
              accessor: 'material_type',
              render: (val) => (
                <Badge color={typeColor[val] || 'bg-gray-100 text-gray-700'}>
                  {val}
                </Badge>
              ),
            },
            { header: 'Unit', accessor: 'unit_of_measure' },
            { header: 'Std. Cost', accessor: 'standard_cost', render: (val) => formatCurrency(val) },
            { header: 'Safety Stock', accessor: 'safety_stock', render: (val) => Math.floor(Number(val)) },
            { header: 'Reorder Level', accessor: 'reorder_level', render: (val) => Math.floor(Number(val)) },
            { header: 'Current Stock', accessor: 'current_stock', render: (val) => Math.floor(Number(val)) },
            { header: 'Supplier', accessor: 'supplier_name', render: (val) => val || '—' },
            {
              header: 'Status',
              accessor: 'status',
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge>,
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(row)}
                    title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                    className={`p-1 rounded ${
                      row.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); methods.reset(); }}
        title={editing ? 'Edit Packaging Material' : 'Add Packaging Material'}
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="material_code" label="Material Code" placeholder="PKG-001" required />
              <FormField name="material_name" label="Material Name" placeholder="e.g. Pouch 100g" required />
              <FormField
                name="material_type"
                label="Type"
                type="select"
                options={MATERIAL_TYPES}
                required
              />
              <FormField name="unit_of_measure" label="Unit" placeholder="pcs, kg, m²" required />
              <FormField name="standard_cost" label="Standard Cost (PKR)" placeholder="0.00" required />
              <FormField
                name="supplier"
                label="Supplier"
                type="select"
                options={[
                  { label: '— None —', value: '' },
                  ...suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id })),
                ]}
              />
              <FormField name="safety_stock" label="Safety Stock" placeholder="0" />
              <FormField name="reorder_level" label="Reorder Level" placeholder="0" />
              <FormField name="current_stock" label="Current Stock" placeholder="0" />
              {editing && (
                <FormField
                  name="status"
                  label="Status"
                  type="select"
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                />
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
