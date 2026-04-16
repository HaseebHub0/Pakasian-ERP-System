import React from 'react';
import { Plus, Users, MapPin, CreditCard, Edit2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAPI } from '@/api/sales';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: salesAPI.getCustomers
  });

  const createMutation = useMutation({
    mutationFn: salesAPI.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer registered successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });
  const methods = useForm();

  const onSubmit = (data: any) => {
    const payload = {
      customer_name: data.name,
      contact_person: 'N/A', // Assuming not in form right now
      phone: '000-0000000',
      email: 'customer@example.com',
      address: `${data.region}`,
      credit_limit: parseFloat(data.credit_limit),
      payment_terms: data.payment_terms,
      status: 'Active'
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers & Distributors</h2>
          <p className="text-sm text-gray-500">Manage sales channels and credit limits</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Register Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-modern p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Customers</p>
            <h3 className="text-2xl font-bold">{customers.length}</h3>
          </div>
        </div>
        <div className="card-modern p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Outstanding</p>
            <h3 className="text-2xl font-bold">
              {formatCurrency(customers.reduce((acc: number, curr: any) => acc + (curr.outstanding || 0), 0))}
            </h3>
          </div>
        </div>
        <div className="card-modern p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Regions Covered</p>
            <h3 className="text-2xl font-bold">
              {new Set(customers.map((c: any) => c.address)).size}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={() => {}} placeholder="Search customers..." />
          </div>
        </div>

        <Table
          columns={[
            { 
              header: 'Customer', 
              accessor: 'customer_name',
              render: (val, row) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {val?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{val}</p>
                    <p className="text-xs text-gray-500">{row.address}</p>
                  </div>
                </div>
              )
            },
            { 
              header: 'Credit Limit', 
              accessor: 'credit_limit',
              render: (val) => formatCurrency(val)
            },
            { 
              header: 'Outstanding', 
              accessor: 'outstanding',
              render: (val, row) => {
                const currentOutstanding = val || 0;
                const limit = row.credit_limit || 1;
                return (
                  <div className="space-y-1">
                    <p className={cn("font-medium", currentOutstanding > limit ? "text-red-600" : "text-gray-900")}>
                      {formatCurrency(currentOutstanding)}
                    </p>
                    <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", currentOutstanding > limit ? "bg-red-500" : "bg-blue-500")}
                        style={{ width: `${Math.min((currentOutstanding / limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              }
            },
            { header: 'Terms', accessor: 'payment_terms' },
            { 
              header: 'Location', 
              accessor: 'address',
              render: (val) => (
                <div className="text-xs text-gray-500">
                  {val}
                </div>
              )
            },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (val) => <Badge color="bg-green-100 text-green-800 border-green-200">{val}</Badge>
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: () => (
                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 size={16} />
                </button>
              )
            }
          ]}
          data={customers}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Customer/Distributor Name" placeholder="e.g. Metro Cash & Carry" required />
              <FormField 
                name="region" 
                label="Region" 
                type="select"
                options={[
                  { label: 'Punjab', value: 'Punjab' },
                  { label: 'Sindh', value: 'Sindh' },
                  { label: 'KPK', value: 'KPK' },
                  { label: 'Balochistan', value: 'Balochistan' },
                  { label: 'Islamabad', value: 'Islamabad' },
                ]}
                required
              />
              <FormField name="credit_limit" label="Credit Limit (PKR)" type="number" placeholder="500000" required />
              <FormField 
                name="payment_terms" 
                label="Payment Terms" 
                type="select"
                options={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Net 15', value: 'Net 15' },
                  { label: 'Net 30', value: 'Net 30' },
                  { label: 'Net 45', value: 'Net 45' },
                  { label: 'Net 60', value: 'Net 60' },
                ]}
                required
              />
              <FormField name="lat" label="Latitude (for Route Opt.)" type="number" step="any" placeholder="31.5204" required />
              <FormField name="lng" label="Longitude (for Route Opt.)" type="number" step="any" placeholder="74.3587" required />
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn btn-outline">Cancel</button>
              <button type="submit" className="flex-1 btn btn-primary">Register</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
