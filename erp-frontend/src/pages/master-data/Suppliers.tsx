import React from 'react';
import { Plus, Star, ChevronDown, ChevronUp, History, Package, Power, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { cn } from '@/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<any>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: masterDataAPI.getSuppliers
  });

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier added successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated successfully');
      setIsModalOpen(false);
      setEditingSupplier(null);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const { data: rawMaterials = [] } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: masterDataAPI.getRawMaterials
  });

  const methods = useForm();

  const handleToggleStatus = (supplier: any) => {
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: supplier.id, data: { status: newStatus } });
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    methods.reset({
      name: supplier.supplier_name,
      contact: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      city: supplier.city,
      address: supplier.address,
      rating: supplier.rating?.toString(),
      payment_terms: supplier.payment_terms,
      lead_time: supplier.lead_time_days?.toString(),
      materials: supplier.supplied_materials || [],
      status: supplier.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      supplier_name: data.name,
      contact_person: data.contact,
      phone: data.phone,
      email: data.email,
      rating: parseInt(data.rating) || 3,
      payment_terms: data.payment_terms,
      lead_time_days: parseInt(data.lead_time, 10),
      city: data.city,
      address: data.address,
      supplied_materials: data.materials || [],
      status: data.status || 'active'
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={14} 
          className={cn(i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} 
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suppliers</h2>
          <p className="text-sm text-gray-500">Manage vendor relationships and pricing</p>
        </div>
        <button 
          onClick={() => {
            setEditingSupplier(null);
            methods.reset();
            setIsModalOpen(true);
          }} 
          className="btn btn-primary gap-2"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={() => {}} placeholder="Search suppliers..." />
          </div>
        </div>

        <div className="divide-y">
          {suppliers.map((supplier: any) => (
            <div key={supplier.id} className="group">
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                    {supplier.supplier_name?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{supplier.supplier_name}</h4>
                      {supplier.city && <span className="text-xs font-medium text-primary px-1.5 py-0.5 bg-primary/5 rounded">{supplier.city}</span>}
                    </div>
                    <p className="text-xs text-gray-500">{supplier.contact_person}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Terms</p>
                    <p className="text-sm font-medium">{supplier.payment_terms || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Rating</p>
                    {renderStars(supplier.rating)}
                  </div>
                  <Badge color={supplier.status === 'active' ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>{supplier.status}</Badge>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(supplier); }}
                      title={supplier.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                      className={`p-1 rounded ${
                        supplier.status === 'active' 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                  {expandedId === supplier.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              {expandedId === supplier.id && (
                <div className="bg-gray-50 p-6 border-t border-b animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Package size={16} />
                        Supplied Materials
                      </h5>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left">Material</th>
                              <th className="px-4 py-2 text-right">Last Price</th>
                              <th className="px-4 py-2 text-right">Last Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {supplier.supplied_materials?.length > 0 ? (
                              supplier.supplied_materials.map((matId: any) => {
                                const material = rawMaterials.find((m: any) => m.id === matId);
                                return (
                                  <tr key={matId}>
                                    <td className="px-4 py-2 font-medium">{material?.material_name || 'Unknown'}</td>
                                    <td className="px-4 py-2 text-right">{material?.standard_cost ? formatCurrency(material.standard_cost) : '-'}</td>
                                    <td className="px-4 py-2 text-right text-gray-400 italic font-light">No History</td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td className="px-4 py-2 text-gray-400 italic text-center" colSpan={3}>No materials assigned</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <History size={16} />
                        Performance History
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">On-time Delivery</span>
                          <span className="font-medium text-green-600">92%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Quality Acceptance</span>
                          <span className="font-medium text-green-600">98%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Lead Time (Avg)</span>
                          <span className="font-medium">{supplier.lead_time_days || 4.5} Days</span>
                        </div>
                      </div>
                      
                      {supplier.address && (
                        <div className="mt-6 pt-6 border-t">
                          <h6 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Registered Address</h6>
                          <p className="text-sm text-gray-600 leading-relaxed italic">
                            {supplier.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Company Name" required />
              <FormField name="contact" label="Contact Person" required />
              <FormField name="phone" label="Phone Number" required />
              <FormField name="email" label="Email Address" type="email" />
              <FormField name="city" label="City" required />
              <FormField 
                name="rating" 
                label="Initial Rating" 
                type="select" 
                options={[
                  { label: '1 Star', value: '1' },
                  { label: '2 Stars', value: '2' },
                  { label: '3 Stars', value: '3' },
                  { label: '4 Stars', value: '4' },
                  { label: '5 Stars', value: '5' },
                ]} 
              />
              <FormField 
                name="payment_terms" 
                label="Payment Terms" 
                type="select" 
                options={[
                  { label: 'Cash on Delivery', value: 'COD' },
                  { label: 'Net 30 Days', value: 'NET30' },
                  { label: 'Net 60 Days', value: 'NET60' },
                  { label: 'Advance Payment', value: 'ADVANCE' },
                ]} 
                required
              />
              <FormField name="lead_time" label="Lead Time (Days)" type="number" placeholder="e.g. 5" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Supplied Materials</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                {rawMaterials.map((m: any) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={m.id}
                      {...methods.register('materials')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {m.material_name}
                  </label>
                ))}
              </div>
            </div>

            <FormField name="address" label="Full Address" type="textarea" />
            
            {editingSupplier && (
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
