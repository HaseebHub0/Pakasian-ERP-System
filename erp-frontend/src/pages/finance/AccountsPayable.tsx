import React from 'react';
import { DollarSign, Clock, CheckCircle, AlertCircle, FileText, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, Badge, StatCard, Modal } from '@/components/ui/Shared';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useForm, FormProvider } from 'react-hook-form';
import { FormField } from '@/components/ui/Forms';

export const AccountsPayablePage: React.FC = () => {
  const { payables, paySupplier } = useFinanceStore();
  const [selectedPayable, setSelectedPayable] = React.useState<any>(null);

  const methods = useForm({
    defaultValues: {
      amount: 0,
      method: 'Bank',
      ref: ''
    }
  });

  const handlePayClick = (payable: any) => {
    setSelectedPayable(payable);
    methods.reset({
      amount: payable.amount,
      method: 'Bank',
      ref: ''
    });
  };

  const onSubmit = (data: any) => {
    if (!selectedPayable) return;
    paySupplier(selectedPayable.id, data.amount, data.method, data.ref);
    toast.success('Payment processed successfully');
    setSelectedPayable(null);
  };

  const totalOutstanding = payables.reduce((acc, curr) => curr.status === 'Pending' ? acc + curr.amount : acc, 0);
  const paidThisMonth = payables.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Accounts Payable</h2>
          <p className="text-sm text-gray-500">Manage supplier invoices and outgoing payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Outstanding" value={formatCurrency(totalOutstanding)} />
        <StatCard icon={AlertCircle} label="Overdue" value={formatCurrency(0)} color="text-red-600" />
        <StatCard icon={Clock} label="Due this Week" value={formatCurrency(0)} />
        <StatCard icon={CheckCircle} label="Paid this Month" value={formatCurrency(paidThisMonth)} color="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2 border rounded-md text-sm" />
          </div>
        </div>

        <Table
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Reference', accessor: 'ref' },
            { header: 'Supplier', accessor: 'supplierName' },
            { 
              header: 'Due Date', 
              accessor: 'dueDate', 
              render: (val) => (
                <span className={new Date(val) < new Date() ? "text-red-600 font-bold" : "text-gray-900"}>
                  {formatDate(val)}
                </span>
              )
            },
            { header: 'Amount', accessor: 'amount', render: (val) => formatCurrency(val) },
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
                <div className="flex items-center gap-2">
                  {row.status !== 'Paid' && (
                    <button 
                      onClick={() => handlePayClick(row)}
                      className="btn btn-primary btn-sm py-1 px-3 text-xs"
                    >
                      Pay Now
                    </button>
                  )}
                  <button className="p-1 text-gray-400 hover:text-primary rounded">
                    <FileText size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={payables}
        />
      </div>

      <Modal
        isOpen={!!selectedPayable}
        onClose={() => setSelectedPayable(null)}
        title={`Process Payment: ${selectedPayable?.ref}`}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Supplier</span>
                <span className="font-bold">{selectedPayable?.supplierName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Amount</span>
                <span className="font-bold">{formatCurrency(selectedPayable?.amount)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <FormField name="amount" label="Payment Amount" type="number" required />
              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  name="method" 
                  label="Payment Method" 
                  type="select" 
                  options={[
                    { label: 'Bank Transfer', value: 'Bank' },
                    { label: 'Cash', value: 'Cash' }
                  ]} 
                />
                <FormField name="ref" label="Reference #" placeholder="e.g. CHQ-123456" required />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setSelectedPayable(null)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Payment</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
