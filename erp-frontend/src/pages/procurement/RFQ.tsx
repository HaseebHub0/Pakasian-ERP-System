import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const RFQPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [rfqModalOpen, setRfqModalOpen] = React.useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = React.useState(false);
  const [selectedRFQ, setSelectedRFQ] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: rfqs = [], isLoading } = useQuery({ queryKey: ['rfqs'], queryFn: procurementAPI.getRFQs });
  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations', selectedRFQ?.id],
    queryFn: () => procurementAPI.getQuotations(selectedRFQ ? { rfq_id: selectedRFQ.id } : undefined),
    enabled: !!selectedRFQ,
  });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });

  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));

  const createRFQMutation = useMutation({
    mutationFn: procurementAPI.createRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ created');
      setRfqModalOpen(false);
      rfqMethods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const createQuotationMutation = useMutation({
    mutationFn: procurementAPI.createQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations', selectedRFQ?.id] });
      toast.success('Quotation recorded');
      setQuotationModalOpen(false);
      quoteMethods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const rfqMethods = useForm({
    defaultValues: {
      supplier_id: '',
      material_id: '',
      quantity: '',
      required_date: '',
      notes: '',
    },
  });

  const quoteMethods = useForm({
    defaultValues: {
      supplier_id: '',
      material_id: '',
      quoted_price: '',
      delivery_days: '',
      valid_until: '',
    },
  });

  const onSubmitRFQ = (data: any) => {
    createRFQMutation.mutate({
      supplier_id: data.supplier_id,
      material_id: data.material_id || null,
      quantity: data.quantity ? parseFloat(data.quantity) : null,
      required_date: data.required_date || null,
      notes: data.notes || '',
    });
  };

  const onSubmitQuotation = (data: any) => {
    createQuotationMutation.mutate({
      rfq_id: selectedRFQ.id,
      supplier_id: data.supplier_id,
      material_id: data.material_id,
      quoted_price: parseFloat(data.quoted_price),
      delivery_days: parseInt(data.delivery_days || 7),
      valid_until: data.valid_until || null,
    });
  };

  const filtered = rfqs.filter((r: any) =>
    (r.rfq_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Requests for Quotation (RFQ)</h2>
          <p className="text-sm text-gray-500">Invite suppliers to submit price quotations</p>
        </div>
        <button onClick={() => setRfqModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Create RFQ
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search RFQ number..." />
        </div>
        <Table
          columns={[
            { header: 'RFQ Number', accessor: 'rfq_number' },
            { header: 'Supplier', accessor: 'supplier_name' },
            { header: 'Material', accessor: 'material_name' },
            { header: 'Quantity', accessor: 'quantity' },
            { header: 'Required Date', accessor: 'required_date', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v || 'Open'}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <button
                  onClick={() => { setSelectedRFQ(row); setQuotationModalOpen(true); }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  + Add Quotation
                </button>
              ),
            },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      {/* Quotations panel for selected RFQ */}
      {selectedRFQ && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              Quotations for <span className="font-mono text-indigo-600">{selectedRFQ.rfq_number}</span>
            </h3>
            <button onClick={() => setSelectedRFQ(null)} className="text-xs text-gray-400 hover:text-gray-600">
              <Trash2 size={14} /> Close
            </button>
          </div>
          <Table
            columns={[
              { header: 'Supplier', accessor: 'supplier_name' },
              { header: 'Material', accessor: 'material_id' },
              { header: 'Quoted Price (PKR)', accessor: 'quoted_price' },
              { header: 'Lead Time (days)', accessor: 'delivery_days' },
              { header: 'Valid Until', accessor: 'valid_until', render: (v) => (v ? formatDate(v) : '—') },
            ]}
            data={quotations}
          />
        </div>
      )}

      {/* RFQ Modal */}
      <Modal isOpen={rfqModalOpen} onClose={() => setRfqModalOpen(false)} title="Create Request for Quotation" size="lg">
        <FormProvider {...rfqMethods}>
          <form onSubmit={rfqMethods.handleSubmit(onSubmitRFQ)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="quantity" label="Quantity" required />
              <FormField name="required_date" label="Required Date" type="date" />
            </div>
            <FormField name="notes" label="Notes" type="textarea" />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setRfqModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createRFQMutation.isPending}>Create RFQ</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Quotation Modal */}
      <Modal isOpen={quotationModalOpen} onClose={() => setQuotationModalOpen(false)} title={`Add Quotation — ${selectedRFQ?.rfq_number}`} size="lg">
        <FormProvider {...quoteMethods}>
          <form onSubmit={quoteMethods.handleSubmit(onSubmitQuotation)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="quoted_price" label="Quoted Price (PKR)" required />
              <FormField name="delivery_days" label="Delivery Days" />
              <FormField name="valid_until" label="Valid Until" type="date" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setQuotationModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createQuotationMutation.isPending}>Save Quotation</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
