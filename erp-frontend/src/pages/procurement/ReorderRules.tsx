import React from 'react';
import { Plus, Bell, ArrowDown, Settings, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';

const mockReorderRules: any[] = [];

export const ReorderRulesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mockRulesData, setMockRulesData] = React.useState(mockReorderRules);
  const methods = useForm();

  const onSubmit = (data: any) => {
    const newRule = {
      id: mockRulesData.length + 1,
      material: data.material,
      warehouse: data.warehouse,
      min_qty: parseFloat(data.min_qty),
      max_qty: parseFloat(data.max_qty),
      current_qty: 0,
      status: 'Healthy'
    };
    setMockRulesData([...mockRulesData, newRule]);
    toast.success('Reorder rule created successfully');
    setIsModalOpen(false);
    methods.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reorder Rules</h2>
          <p className="text-sm text-gray-500">Automate Purchase Requisitions based on stock levels</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Add Reorder Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Triggered Rules</p>
            <p className="text-2xl font-bold text-gray-900">2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Rules</p>
            <p className="text-2xl font-bold text-gray-900">{mockRulesData.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ArrowDown size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Auto-PRs Today</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={() => {}} placeholder="Search rules..." />
          </div>
        </div>

        <Table
          columns={[
            { header: 'Material', accessor: 'material' },
            { header: 'Warehouse', accessor: 'warehouse' },
            { header: 'Min Qty', accessor: 'min_qty' },
            { header: 'Max Qty', accessor: 'max_qty' },
            { 
              header: 'Current Qty', 
              accessor: 'current_qty',
              render: (val, row) => (
                <span className={val < row.min_qty ? "text-red-600 font-bold" : "text-gray-900"}>
                  {val}
                </span>
              )
            },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (val) => (
                <Badge color={val === 'Triggered' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}>
                  {val}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: () => (
                <div className="flex items-center gap-2">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={mockRulesData}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Reorder Rule"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="material" label="Material" placeholder="e.g. Palm Oil" required />
            <FormField name="warehouse" label="Warehouse" placeholder="e.g. Factory Main" required />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="min_qty" label="Minimum Quantity" type="number" placeholder="100" required />
              <FormField name="max_qty" label="Maximum Quantity" type="number" placeholder="1000" required />
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn btn-outline">Cancel</button>
              <button type="submit" className="flex-1 btn btn-primary">Save Rule</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
