import React from 'react';
import { Plus, Users, MapPin, CreditCard, Edit2, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { useForm, FormProvider } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect, position }: { onLocationSelect: (lat: number, lng: number) => void, position: [number, number] | null }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const REGION_OPTIONS = [
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Sindh', value: 'Sindh' },
  { label: 'Khyber Pakhtunkhwa', value: 'KP' },
  { label: 'Balochistan', value: 'Balochistan' },
  { label: 'Azad Jammu & Kashmir', value: 'AJK' },
  { label: 'Gilgit-Baltistan', value: 'GB' },
  { label: 'Islamabad Capital Territory', value: 'ICT' },
];

const PAYMENT_TERMS_OPTIONS = [
  { label: 'Cash on Delivery (COD)', value: 'COD' },
  { label: 'Net 7 Days', value: 'NET7' },
  { label: 'Net 15 Days', value: 'NET15' },
  { label: 'Net 30 Days', value: 'NET30' },
  { label: 'Net 60 Days', value: 'NET60' },
  { label: 'Advance Payment', value: 'ADVANCE' },
];

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<[number, number] | null>(null);
  const [editingCustomer, setEditingCustomer] = React.useState<any>(null);
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: masterDataAPI.getCustomers
  });

  const methods = useForm({
    defaultValues: {
      name: '',
      customer_type: 'retailer',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      region: 'Punjab',
      city: '',
      credit_limit: '0',
      payment_terms: 'NET30',
      lat: '',
      lng: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer registered successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed: ${detail}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number, data: any }) => masterDataAPI.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed: ${detail}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: masterDataAPI.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setSelectedLocation(null);
    methods.reset({
      name: '',
      customer_type: 'retailer',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      region: 'Punjab',
      city: '',
      credit_limit: '0',
      payment_terms: 'NET30',
      lat: '',
      lng: ''
    });
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    methods.reset({
      name: customer.customer_name,
      customer_type: customer.customer_type || 'retailer',
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      region: customer.region || 'Punjab',
      city: customer.city || '',
      credit_limit: customer.credit_limit?.toString() || '0',
      payment_terms: customer.payment_terms || 'NET30',
      lat: customer.latitude || '',
      lng: customer.longitude || ''
    });
    if (customer.latitude && customer.longitude) {
      setSelectedLocation([parseFloat(customer.latitude), parseFloat(customer.longitude)]);
    } else {
      setSelectedLocation(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    const payload = {
      customer_name: data.name,
      customer_type: data.customer_type || 'retailer',
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      region: data.region,
      city: data.city,
      latitude: data.lat ? parseFloat(data.lat) : null,
      longitude: data.lng ? parseFloat(data.lng) : null,
      credit_limit: parseFloat(data.credit_limit),
      payment_terms: data.payment_terms,
      status: 'active'
    };
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    methods.setValue('lat', lat.toFixed(6));
    methods.setValue('lng', lng.toFixed(6));
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
              {new Set(customers.map((c: any) => c.region)).size}
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
                    <p className="text-xs text-gray-500">{row.city}, {row.region}</p>
                  </div>
                </div>
              )
            },
            { header: 'Type', accessor: 'customer_type', render: (val) => val?.replace('_', ' ') || '—' },
            {
              header: 'Contact',
              accessor: 'contact_person',
              render: (val, row) => (
                <div>
                  <p className="text-sm">{val || '—'}</p>
                  {row.phone && <p className="text-xs text-gray-500">{row.phone}</p>}
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
            { 
              header: 'Terms', 
              accessor: 'payment_terms',
              render: (val) => PAYMENT_TERMS_OPTIONS.find(opt => opt.value === val)?.label || val
            },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (val) => (
                <Badge color={val === 'active' ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (val, row) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(val)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={customers}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCustomer ? "Edit Customer" : "Register New Customer"}
        size="2xl"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField name="name" label="Customer/Distributor Name" placeholder="e.g. Metro Cash & Carry" required />
                <FormField
                  name="customer_type"
                  label="Customer Type"
                  type="select"
                  options={[
                    { label: 'Retailer', value: 'retailer' },
                    { label: 'Distributor', value: 'distributor' },
                    { label: 'Wholesaler', value: 'wholesaler' },
                    { label: 'Modern Trade', value: 'modern_trade' },
                    { label: 'Institutional', value: 'institutional' },
                  ]}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField name="contact_person" label="Contact Person" placeholder="e.g. Ali Ahmed" />
                  <FormField name="phone" label="Phone" placeholder="03001234567" />
                </div>
                <FormField name="email" label="Email" type="email" placeholder="contact@example.com" />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    name="region"
                    label="Region"
                    type="select"
                    options={REGION_OPTIONS}
                    required
                  />
                  <FormField name="city" label="City" placeholder="e.g. Lahore" required />
                </div>
                <FormField name="address" label="Address" type="textarea" placeholder="Full address..." />
                <FormField name="credit_limit" label="Credit Limit (PKR)" type="number" placeholder="500000" required />
                <FormField
                  name="payment_terms"
                  label="Payment Terms"
                  type="select"
                  options={PAYMENT_TERMS_OPTIONS}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField name="lat" label="Latitude" type="number" step="any" placeholder="31.5204" />
                  <FormField name="lng" label="Longitude" type="number" step="any" placeholder="74.3587" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Location on Map</label>
                <div className="h-[300px] w-full rounded-lg border overflow-hidden">
                  <MapContainer center={[30.3753, 69.3451]} zoom={5} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker onLocationSelect={handleLocationSelect} position={selectedLocation} />
                  </MapContainer>
                </div>
                <p className="text-xs text-gray-500 italic">Click on the map to set coordinates automatically.</p>
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModal} className="flex-1 btn btn-outline">Cancel</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 btn btn-primary">
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Register Customer')}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
