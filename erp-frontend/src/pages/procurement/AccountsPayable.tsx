import React from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';
import { useRole } from '@/hooks/useRole';

export const AccountsPayablePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canMarkPaid } = useRole();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: ap = [], isLoading } = useQuery({ queryKey: ['accounts-payable'], queryFn: procurementAPI.getAccountsPayable });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });
  const { data: pos = [] } = useQuery({ queryKey: ['purchase-orders'], queryFn: procurementAPI.getPurchaseOrders });

  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));
  const poOptions = pos.map((p: any) => ({ label: p.po_number, value: p.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createAccountsPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Payable recorded');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const payMutation = useMutation({
    mutationFn: procurementAPI.markAPPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Marked as paid');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Update failed'),
  });

  const methods = useForm({
    defaultValues: { supplier_id: '', po_id: '', invoice_number: '', amount: '', due_date: '' },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      supplier_id: data.supplier_id,
      po_id: data.po_id || null,
      invoice_number: data.invoice_number,
      amount: parseFloat(data.amount),
      due_date: data.due_date || null,
      status: 'Pending',
    });
  };

  const filtered = ap.filter((a: any) =>
    a.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Accounts Payable</h2>
          <p className="text-sm text-gray-500">Supplier invoices pending payment</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Add Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search invoice..." />
        </div>
        <Table
          columns={[
            { header: 'Invoice #', accessor: 'invoice_number' },
            { header: 'Supplier', accessor: 'supplier_name' },
            { header: 'PO', accessor: 'po_number', render: (v) => v || '—' },
            { header: 'Amount', accessor: 'amount', render: (v) => formatCurrency(v) },
            { header: 'Due Date', accessor: 'due_date', render: (v) => (v ? formatDate(v) : '—') },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) =>
                row.status !== 'Paid' && canMarkPaid ? (
                  <button onClick={() => payMutation.mutate(row.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Mark Paid">
                    <CheckCircle size={16} />
                  </button>
                ) : null,
            },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Payable" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="supplier_id" label="Supplier" type="select" options={supplierOptions} required />
              <FormField name="po_id" label="Purchase Order" type="select" options={poOptions} />
              <FormField name="invoice_number" label="Invoice Number" required />
              <FormField name="amount" label="Amount (PKR)" required />
              <FormField name="due_date" label="Due Date" type="date" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                Save
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
