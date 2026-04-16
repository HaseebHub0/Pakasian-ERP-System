import React from 'react';
import { Gift, Target, TrendingUp, Percent, Plus, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const mockTargets: any[] = [];

const mockPromotions: any[] = [];

export const IncentivesPage: React.FC = () => {
  const [isTargetModalOpen, setIsTargetModalOpen] = React.useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = React.useState(false);
  const targetMethods = useForm();
  const promoMethods = useForm();

  const onTargetSubmit = (data: any) => {
    toast.success('Sales target set for distributor');
    setIsTargetModalOpen(false);
  };

  const onPromoSubmit = (data: any) => {
    toast.success('Trade promotion created and active');
    setIsPromoModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="text-primary" /> Distributor Incentives
          </h2>
          <p className="text-sm text-gray-500">Manage sales targets, bonuses, and trade promotions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsPromoModalOpen(true)} className="btn btn-outline gap-2">
            <Percent size={18} /> New Promotion
          </button>
          <button onClick={() => setIsTargetModalOpen(true)} className="btn btn-primary gap-2">
            <Target size={18} /> Set Target
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Targets Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Distributor Sales Targets
              </h3>
              <Badge color="bg-blue-100 text-blue-800 border-blue-200">Current Month</Badge>
            </div>
            <Table
              columns={[
                { header: 'Distributor', accessor: 'distributor' },
                { header: 'Product', accessor: 'product' },
                { 
                  header: 'Target vs Actual', 
                  accessor: 'target',
                  render: (_, row) => (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{row.actual.toLocaleString()} / {row.target.toLocaleString()}</span>
                        <span className="font-bold">{Math.round((row.actual / row.target) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            row.actual >= row.target ? "bg-green-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min((row.actual / row.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                },
                { header: 'Bonus', accessor: 'bonus', render: (val) => val > 0 ? <span className="font-bold text-green-600">{formatCurrency(val)}</span> : '-' },
                { 
                  header: 'Status', 
                  accessor: 'status', 
                  render: (val) => (
                    <Badge color={val === 'Achieved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                      {val}
                    </Badge>
                  )
                },
              ]}
              data={mockTargets}
            />
          </div>

          {/* Promotions Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Percent size={18} className="text-primary" />
                Active Trade Promotions
              </h3>
            </div>
            <Table
              columns={[
                { header: 'Promotion Name', accessor: 'name' },
                { header: 'Type', accessor: 'type' },
                { header: 'Value', accessor: 'value', render: (val) => <span className="font-bold text-primary">{val}</span> },
                { header: 'ROI', accessor: 'roi', render: (val) => <span className="text-green-600 font-medium">{val}</span> },
                { 
                  header: 'Status', 
                  accessor: 'status', 
                  render: (val) => (
                    <Badge color={val === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                      {val}
                    </Badge>
                  )
                },
              ]}
              data={mockPromotions}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Target Achievement Trend
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTargets}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="distributor" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="actual" name="Actual Sales" radius={[4, 4, 0, 0]}>
                    {mockTargets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.actual >= entry.target ? '#22c55e' : '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> Incentive Insights
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-white/60 font-bold uppercase mb-1">Top Performer</p>
                <p className="text-sm font-medium">Karachi Distributor has exceeded target by 10%. Bonus of PKR 200,000 provisioned.</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-white/60 font-bold uppercase mb-1">Promotion Impact</p>
                <p className="text-sm font-medium">Ramadan Special promotion has increased order volume by 22% in the first week.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} title="Set Sales Target">
        <FormProvider {...targetMethods}>
          <form onSubmit={targetMethods.handleSubmit(onTargetSubmit)} className="space-y-4">
            <FormField name="distributor" label="Distributor" type="select" options={[
              { label: 'Karachi Distributor', value: '1' },
              { label: 'Lahore Distributor', value: '2' },
            ]} required />
            <FormField name="product" label="Product Category" type="select" options={[
              { label: 'Protein Nimko', value: '1' },
              { label: 'Nimko Mix', value: '2' },
            ]} required />
            <FormField name="target_qty" label="Monthly Target (Units)" type="number" required />
            <FormField name="bonus_amount" label="Bonus Amount (PKR)" type="number" required />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsTargetModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Set Target</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="New Trade Promotion">
        <FormProvider {...promoMethods}>
          <form onSubmit={promoMethods.handleSubmit(onPromoSubmit)} className="space-y-4">
            <FormField name="promo_name" label="Promotion Name" placeholder="e.g. Ramadan Special" required />
            <FormField name="promo_type" label="Promotion Type" type="select" options={[
              { label: 'Percentage Discount', value: 'pct' },
              { label: 'Fixed Discount', value: 'fixed' },
              { label: 'Buy X Get Y', value: 'bogo' },
            ]} required />
            <FormField name="promo_value" label="Value" placeholder="e.g. 5% or Buy 10 Get 1" required />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="start_date" label="Start Date" type="date" required />
              <FormField name="end_date" label="End Date" type="date" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsPromoModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Activate Promotion</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
