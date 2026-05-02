import React from 'react';
import { Plus, AlertCircle, Edit2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

const materialSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  unit: z.string().min(1, 'Unit is required'),
  standard_cost: z.string().min(1, 'Standard cost is required'),
  safety_stock: z.string().min(1, 'Safety stock is required'),
  reorder_level: z.string().min(1, 'Reorder level is required'),
  current_stock: z.string().optional(),
  status: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export const RawMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<any>(null);
  const [showNewTypeInput, setShowNewTypeInput] = React.useState(false);
  const [newType, setNewType] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');
  
  const { data: rawMaterials = [], isLoading } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: masterDataAPI.getRawMaterials
  });

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Material added successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      const serverMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Material Error: ' + serverMsg);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Material updated successfully');
      setIsModalOpen(false);
      setEditingMaterial(null);
      methods.reset();
    },
    onError: (error: any) => {
      const serverMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Material Error: ' + serverMsg);
    }
  });

  const baseTypes = ['ingredient', 'oil', 'spice', 'packaging', 'additive'];
  const allTypes = Array.from(new Set([...baseTypes, ...rawMaterials.map((rm: any) => rm.material_type)])).filter(Boolean);
  const materialTypesOptions = allTypes.map((type: any) => ({
    label: type,
    value: type
  }));

  const methods = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
  });

  const handleToggleStatus = (row: any) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: row.id, data: { status: newStatus } });
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    methods.reset({
      code: material.material_code,
      name: material.material_name,
      type: material.material_type,
      unit: material.unit_of_measure,
      standard_cost: material.standard_cost?.toString(),
      safety_stock: material.safety_stock?.toString(),
      reorder_level: material.reorder_level?.toString(),
      current_stock: material.current_stock?.toString() || '0',
      status: material.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleAddNewType = () => {
    if (!newType.trim()) return;
    methods.setValue('type', newType.trim());
    setShowNewTypeInput(false);
    setNewType('');
  };

  const onSubmit = (data: MaterialFormValues) => {
    const payload = {
      material_code: data.code,
      material_name: data.name,
      material_type: data.type,
      unit_of_measure: data.unit,
      standard_cost: parseFloat(data.standard_cost || '0'),
      safety_stock: parseFloat(data.safety_stock || '0'),
      reorder_level: parseFloat(data.reorder_level || '0'),
      current_stock: parseFloat(data.current_stock || '0'),
      status: data.status || 'active'
    };
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStockColor = (row: any) => {
    const stock = Number(row.current_stock) || 0;
    const reorderLevel = Number(row.reorder_level) || 0;
    const safetyStock = Number(row.safety_stock) || 0;
    
    if (stock <= reorderLevel) return 'text-red-600 font-bold';
    if (stock <= safetyStock) return 'text-amber-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const lowStockItems = rawMaterials.filter((m: any) => {
    const stock = Number(m.current_stock) || 0;
    const reorderLevel = Number(m.reorder_level) || 0;
    return stock <= reorderLevel;
  });

  const filteredMaterials = rawMaterials.filter((m: any) => {
    const matchesSearch = 
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.material_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || m.material_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Raw Materials</h2>
          <p className="text-sm text-gray-500">Manage ingredients, packaging, and supplies</p>
        </div>
        <button onClick={() => {
          setEditingMaterial(null);
          methods.reset();
          setIsModalOpen(true);
        }} className="btn btn-primary gap-2">
          <Plus size={18} />
          Add Material
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-600 shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-red-800">Critical Stock Alert</h4>
            <p className="text-sm text-red-700">
              {lowStockItems.length} items are below reorder level: {lowStockItems.map(i => i.material_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchBar onSearch={setSearchTerm} placeholder="Search materials by code or name..." />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="">All Types</option>
              {materialTypesOptions.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={[
            { header: 'Code', accessor: 'material_code' },
            { header: 'Name', accessor: 'material_name' },
            { 
              header: 'Type', 
              accessor: 'material_type', 
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
            },
            { header: 'Unit', accessor: 'unit_of_measure' },
            { header: 'Std. Cost', accessor: 'standard_cost', render: (val) => formatCurrency(val) },
            { header: 'Safety', accessor: 'safety_stock', render: (val) => Math.floor(Number(val)) },
            { header: 'Reorder', accessor: 'reorder_level', render: (val) => Math.floor(Number(val)) },
            { 
              header: 'Current Stock', 
              accessor: 'current_stock', 
              render: (val, row) => <span className={getStockColor(row)}>{Math.floor(Number(val)) || 0}</span> 
            },
            {
              header: 'Status',
              accessor: 'status',
              render: (val) => (
                <div className="flex items-center gap-2">
                  <Badge color={getStatusColor(val)}>{val}</Badge>
                </div>
              )
            },
            {
              header: 'Actions',
              accessor: 'code',
              render: (_, row) => (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(row)}
                    title={row.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                    className={`p-1 rounded ${
                      row.status === 'active' 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredMaterials}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? "Edit Raw Material" : "Add Raw Material"}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="code" label="Material Code" placeholder="RM-..." required />
            <FormField name="name" label="Material Name" placeholder="e.g. Palm Oil" required />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Material Type *</label>
                <button
                  type="button"
                  onClick={() => setShowNewTypeInput(!showNewTypeInput)}
                  className="text-xs text-primary hover:underline"
                >
                  {showNewTypeInput ? 'Cancel' : '+ Add New Type'}
                </button>
              </div>
              {showNewTypeInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                    placeholder="E.g. Preservative..."
                  />
                  <button
                    type="button"
                    onClick={handleAddNewType}
                    className="btn btn-primary px-3 py-2"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <FormField 
                  name="type" 
                  label="" 
                  type="select" 
                  options={materialTypesOptions} 
                  required 
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField name="unit" label="Unit" placeholder="Kg, Litre, etc." required />
              <FormField name="standard_cost" label="Std. Cost" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="safety_stock" label="Safety Stock" placeholder="0" required />
              <FormField name="reorder_level" label="Reorder Level" placeholder="0" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField name="current_stock" label="Initial/Current Stock" placeholder="0" />
              <FormField
                name="status"
                label="Status"
                type="select"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">{editingMaterial ? 'Update Material' : 'Save Material'}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
