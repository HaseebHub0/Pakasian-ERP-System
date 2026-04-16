import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Search, Filter, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { formatCurrency, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useForm, FormProvider } from 'react-hook-form';
import { FormField } from '@/components/ui/Forms';

export const AccountsReceivablePage: React.FC = () => {
  const { receivables, receiveCustomerPayment } = useFinanceStore();
  const [selectedReceivable, setSelectedReceivable] = React.useState<any>(null);

  const methods = useForm({
    defaultValues: {
      amount: 0,
      method: 'Bank',
      ref: ''
    }
  });

  const handleReceiveClick = (receivable: any) => {
    setSelectedReceivable(receivable);
    methods.reset({
      amount: receivable.amount,
      method: 'Bank',
      ref: ''
    });
  };

  const onSubmit = (data: any) => {
    if (!selectedReceivable) return;
    receiveCustomerPayment(selectedReceivable.id, data.amount, data.method, data.ref);
    toast.success('Payment recorded successfully');
    setSelectedReceivable(null);
  };

  const totalReceivable = receivables.reduce((acc, curr) => curr.status !== 'Paid' ? acc + curr.amount : acc, 0);
  const paidThisMonth = receivables.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Accounts Receivable</h2>
          <p className="text-sm text-gray-500">Manage customer invoices and credit collections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReceivable)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Paid this Month</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(paidThisMonth)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Avg. Collection Period</p>
          <p className="text-2xl font-bold text-gray-900">14 Days</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search invoices..." className="pl-10 pr-4 py-2 border rounded-md text-sm w-64" />
            </div>
          </div>
        </div>
        <Table
          columns={[
            { header: 'ID', accessor: 'id', render: (val) => <span className="font-mono font-bold text-primary">{val}</span> },
            { header: 'Reference', accessor: 'ref' },
            { header: 'Customer', accessor: 'customerName' },
            { header: 'Due Date', accessor: 'dueDate', render: (val) => formatDate(val) },
            { header: 'Amount', accessor: 'amount', render: (val) => <span className="font-bold">{formatCurrency(val)}</span> },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => (
                <Badge color={
                  val === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }>
                  {val}
                </Badge>
              )
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                row.status !== 'Paid' ? (
                  <button 
                    onClick={() => handleReceiveClick(row)}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Record Payment
                  </button>
                ) : (
                  <button className="text-gray-400 text-sm font-medium hover:underline">
                    View Receipt
                  </button>
                )
              )
            }
          ]}
          data={receivables}
        />
      </div>

      <Modal
        isOpen={!!selectedReceivable}
        onClose={() => setSelectedReceivable(null)}
        title={`Record Payment: ${selectedReceivable?.ref}`}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer</span>
                <span className="font-bold">{selectedReceivable?.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Amount</span>
                <span className="font-bold">{formatCurrency(selectedReceivable?.amount)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <FormField name="amount" label="Received Amount" type="number" required />
              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  name="method" 
                  label="Payment Method" 
                  type="select" 
                  options={[
                    { label: 'Bank Transfer', value: 'Bank' },
                    { label: 'Cash', value: 'Cash' },
                    { label: 'Cheque', value: 'Cheque' }
                  ]} 
                />
                <FormField name="ref" label="Reference #" placeholder="e.g. TRN-992011" required />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setSelectedReceivable(null)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary gap-2">
                <CheckCircle2 size={18} /> Confirm Payment
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
