import React from 'react';
import { Plus, Cpu, Settings, Activity, Edit2, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

export const MachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'machines' | 'lines'>('machines');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMachine, setEditingMachine] = React.useState<any>(null);
  const [editingLine, setEditingLine] = React.useState<any>(null);

  const { data: productionLines = [], isLoading: isLinesLoading } = useQuery({
    queryKey: ['production-lines'],
    queryFn: masterDataAPI.getProductionLines
  });

  const createLineMutation = useMutation({
    mutationFn: masterDataAPI.createProductionLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-lines'] });
      toast.success('Production Line registered successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateProductionLine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-lines'] });
      toast.success('Production Line updated successfully');
      setIsModalOpen(false);
      setEditingLine(null);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const createMachineMutation = useMutation({
    mutationFn: masterDataAPI.createMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine registered successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMachineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateMachine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine updated successfully');
      setIsModalOpen(false);
      setEditingMachine(null);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: masterDataAPI.getMachines
  });

  const { data: factories = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: masterDataAPI.getWarehouses
  });
  const methods = useForm();

  const handleEditMachine = (machine: any) => {
    setEditingMachine(machine);
    methods.reset({
      name: machine.machine_name,
      code: machine.machine_code,
      type: machine.machine_type,
      line: machine.production_line_id,
      capacity: machine.capacity_per_hour,
      cost_per_hour: machine.cost_per_hour,
      maintenance_cost: machine.maintenance_cost,
      depreciation: machine.depreciation,
      status: machine.status,
    });
    setIsModalOpen(true);
  };

  const handleEditLine = (line: any) => {
    setEditingLine(line);
    // line_type contains comma separated processes
    const selectedProcesses = line.line_type?.split(',').map((p: string) => p.trim()) || [];
    methods.reset({
      name: line.line_name,
      capacity: line.capacity_per_hour,
      processes: selectedProcesses,
      factory: line.factory, // This will be the ID
      status: line.status,
    });
    setIsModalOpen(true);
  };

  const toggleStatusLine = (line: any) => {
    const newStatus = line.status === 'active' ? 'inactive' : 'active';
    updateLineMutation.mutate({ 
      id: line.id, 
      data: { status: newStatus } 
    });
  };

  const onSubmit = (data: any) => {
    if (activeTab === 'machines') {
      const payload = {
        machine_name: data.name,
        machine_code: data.code,
        machine_type: data.type,
        production_line_id: data.line,
        capacity_per_hour: parseFloat(data.capacity),
        cost_per_hour: parseFloat(data.cost_per_hour) || 0,
        maintenance_cost: parseFloat(data.maintenance_cost) || 0,
        depreciation: parseFloat(data.depreciation) || 0,
        status: data.status || 'active'
      };
      if (editingMachine) {
        updateMachineMutation.mutate({ id: editingMachine.id, data: payload });
      } else {
        createMachineMutation.mutate(payload);
      }
    } else {
      const payload = {
        line_name: data.name,
        factory: data.factory || null,
        line_type: Array.isArray(data.processes) ? data.processes.join(', ') : data.processes || '',
        capacity_per_hour: parseFloat(data.capacity),
        status: data.status || 'active'
      };
      if (editingLine) {
        updateLineMutation.mutate({ id: editingLine.id, data: payload });
      } else {
        createLineMutation.mutate(payload);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 border-green-200';
      case 'Idle': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Production Assets</h2>
          <p className="text-sm text-gray-500">Manage production lines, machines, and costing rates</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          {activeTab === 'machines' ? 'Register Machine' : 'Create Production Line'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('machines')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'machines' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Machines
        </button>
        <button 
          onClick={() => setActiveTab('lines')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'lines' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Production Lines
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={() => {}} placeholder={`Search ${activeTab}...`} />
          </div>
        </div>

        {activeTab === 'machines' ? (
          <Table
            columns={[
              { 
                header: 'Machine', 
                accessor: 'name',
                render: (val, row) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{val || row.machine_name}</p>
                      <p className="text-xs text-gray-500">{row.machine_code}</p>
                    </div>
                  </div>
                )
              },
              { header: 'Type', accessor: 'machine_type' },
              { header: 'Cap/Hr', accessor: 'capacity_per_hour' },
              { 
                header: 'Cost/Hr', 
                accessor: 'cost_per_hour',
                render: (val) => <span className="font-medium">{formatCurrency(val || 0)}</span>
              },
              { 
                header: 'Status', 
                accessor: 'status',
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge>
              },
              {
                header: 'Actions',
                accessor: 'id',
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditMachine(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    {row.status === 'Running' ? (
                      <button className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                        <Pause size={16} />
                      </button>
                    ) : (
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={machines}
          />
        ) : (
          <Table
            columns={[
              { header: 'Line Name', accessor: 'line_name' },
              { header: 'Factory/Location', accessor: 'factory_name' },
              { 
                header: 'Processes', 
                accessor: 'line_type',
                render: (val) => (
                  <div className="flex flex-wrap gap-1">
                    {val?.split(',').map((p: string, i: number) => (
                      <Badge key={i} color="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">{p.trim()}</Badge>
                    ))}
                  </div>
                )
              },
              { header: 'Capacity/Hr', accessor: 'capacity_per_hour' },
              { 
                header: 'Status', 
                accessor: 'status',
                render: (val) => (
                  <Badge color={val === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {val?.charAt(0).toUpperCase() + val?.slice(1)}
                  </Badge>
                )
              },
              {
                header: 'Actions',
                accessor: 'id',
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditLine(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => toggleStatusLine(row)} 
                      className={cn(
                        "p-1 rounded transition-colors",
                        row.status === 'active' ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                      )}
                      title={row.status === 'active' ? "Deactivate" : "Activate"}
                    >
                      {row.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  </div>
                )
              }
            ]}
            data={productionLines}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMachine(null);
          setEditingLine(null);
          methods.reset();
        }}
        title={activeTab === 'machines' 
          ? (editingMachine ? 'Edit Machine' : 'Register New Machine') 
          : (editingLine ? 'Edit Production Line' : 'Create Production Line')
        }
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            {activeTab === 'machines' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="name" label="Machine Name" placeholder="e.g. High Speed Mixer" required />
                  <FormField name="code" label="Machine Code" placeholder="MC-..." required />
                  <FormField 
                    name="type" 
                    label="Type" 
                    type="select"
                    options={[
                      { label: 'Mixer', value: 'Mixer' },
                      { label: 'Fryer', value: 'Fryer' },
                      { label: 'Packer', value: 'Packer' },
                      { label: 'Seasoner', value: 'Seasoner' },
                      { label: 'Conveyor', value: 'Conveyor' },
                    ]}
                    required
                  />
                  <FormField 
                    name="line" 
                    label="Production Line" 
                    type="select"
                    options={productionLines.map((l: any) => ({ label: l.line_name, value: l.id }))}
                    required
                  />
                  <FormField name="capacity" label="Capacity per Hour" type="number" placeholder="200" required />
                  <FormField name="cost_per_hour" label="Cost per Hour (PKR)" type="number" placeholder="1500" required />
                  <FormField name="maintenance_cost" label="Monthly Maint. Cost" type="number" placeholder="5000" required />
                  <FormField name="depreciation" label="Monthly Depreciation" type="number" placeholder="2000" required />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="name" label="Line Name" placeholder="e.g. Production Line A" required />
                  <FormField 
                    name="factory" 
                    label="Factory Location" 
                    type="select"
                    options={factories.map((f: any) => ({ label: f.warehouse_name, value: f.id }))}
                    required
                  />
                  <FormField name="capacity" label="Total Line Capacity/Hr" type="number" placeholder="500" required />
                  
                  {editingLine && (
                    <FormField 
                      name="status" 
                      label="Status" 
                      type="select"
                      options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                        { label: 'Maintenance', value: 'maintenance' },
                      ]}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Processes</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                    {['Priming', 'Mixing', 'Extruder', 'Packaging', 'Seasoning', 'Frying'].map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={p}
                          {...methods.register('processes')}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="pt-4 flex gap-3 border-t">
              <button 
                type="button" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMachine(null);
                  setEditingLine(null);
                }} 
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 btn btn-primary">
                {activeTab === 'machines' 
                  ? (editingMachine ? 'Update Machine' : 'Register') 
                  : (editingLine ? 'Update Line' : 'Register')
                }
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
