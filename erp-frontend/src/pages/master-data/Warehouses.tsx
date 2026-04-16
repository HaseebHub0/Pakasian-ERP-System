import React from 'react';
import { Plus, Warehouse, MapPin, Package, Edit2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

export const WarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] = React.useState<any>(null);

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: masterDataAPI.getWarehouses
  });

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse registered successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      const serverMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Warehouse Error: ' + serverMsg);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse updated successfully');
      setIsModalOpen(false);
      setEditingWarehouse(null);
      methods.reset();
    },
    onError: (error: any) => {
      const serverMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error('Warehouse Error: ' + serverMsg);
    }
  });

  const warehouseTypes = ['Factory', 'Regional', 'City', 'Retail'];
  const methods = useForm();

  const handleToggleStatus = (row: any) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: row.id, data: { status: newStatus } });
  };

  const handleEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    methods.reset({
      name: warehouse.warehouse_name,
      type: warehouse.warehouse_type,
      location: warehouse.city + (warehouse.province ? `, ${warehouse.province}` : ''),
      bins: warehouse.bin_list?.join(', '),
      status: warehouse.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    const parts = data.location ? data.location.split(',') : ['', ''];
    const payload = {
      warehouse_name: data.name,
      warehouse_type: data.type,
      city: parts[0]?.trim() || 'Unknown',
      province: parts.length > 1 ? parts[1]?.trim() : 'Punjab', 
      country: 'Pakistan',
      status: data.status || 'active',
      bin_names: data.bins || ''
    };

    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Warehouses</h2>
          <p className="text-sm text-gray-500">Manage storage locations and inventory zones</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Register Warehouse
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={() => {}} placeholder="Search warehouses..." />
          </div>
        </div>

        <Table
          columns={[
            { 
              header: 'Warehouse', 
              accessor: 'name',
              render: (val, row) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Warehouse size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{val || row.warehouse_name}</p>
                    <p className="text-xs text-gray-500">{row.id}</p>
                  </div>
                </div>
              )
            },
            { 
              header: 'Location', 
              accessor: 'city',
              render: (val, row) => (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin size={14} />
                  {val || row.city}
                </div>
              )
            },
            { header: 'Type', accessor: 'warehouse_type' },
            { 
              header: 'Bins', 
              accessor: 'bin_count',
              render: (val) => (
                <div className="flex flex-wrap gap-1">
                   <span className="text-xs font-bold text-gray-700">{val || 0} Bin(s)</span>
                </div>
              )
            },
            { 
              header: 'Capacity', 
              accessor: 'capacity_stats',
              render: (stats) => {
                const used = stats?.usage_percentage || '0%';
                return (
                  <div className="w-full max-w-[100px] space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                      <span>Usage</span>
                      <span>{used}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${parseInt(used) > 80 ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: used }} 
                      />
                    </div>
                  </div>
                )
              }
            },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (val) => <Badge color="bg-green-100 text-green-800 border-green-200">{val}</Badge>
            },
            {
              header: 'Actions',
              accessor: 'id',
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
          data={warehouses}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? "Update Warehouse" : "Register New Warehouse"}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" label="Warehouse Name" placeholder="e.g. North Zone WH" required />
            
            <div>
              <FormField 
                name="type" 
                label="Warehouse Type *" 
                type="select"
                options={warehouseTypes.map(t => ({ label: t, value: t }))}
                required
              />
            </div>

            <FormField name="location" label="Location/Address" placeholder="City, Area..." required />
            
            <FormField 
              name="bins" 
              label="Bins (Comma separated)" 
              placeholder="Bin-A1, Bin-A2, Bin-B1..." 
              type="textarea"
            />

            {editingWarehouse && (
              <FormField
                name="status"
                label="Status"
                type="select"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
              />
            )}
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn btn-outline">Cancel</button>
              <button type="submit" className="flex-1 btn btn-primary">{editingWarehouse ? "Update" : "Register"}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
