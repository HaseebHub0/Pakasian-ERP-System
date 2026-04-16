import React from 'react';
import { Search, ClipboardCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useProcurementStore, QCInspection } from '@/store/useProcurementStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const QCInspectionPage: React.FC = () => {
  const [selectedQC, setSelectedQC] = React.useState<QCInspection | null>(null);
  const { inspections, updateInspection } = useProcurementStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);
  const methods = useForm();

  const onSubmit = (data: any) => {
    if (!selectedQC || !user) return;

    updateInspection(
      selectedQC.id, 
      data.result === 'approved' ? 'Approved' : 'Rejected',
      data,
      user.name,
      data.remarks
    );

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'QC_INSPECTION',
      module: 'Procurement',
      details: `Completed QC for ${selectedQC.materialName} - Result: ${data.result}`,
      status: 'success'
    });

    toast.success('Inspection completed');
    setSelectedQC(null);
    methods.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">QC Inspection</h2>
          <p className="text-sm text-gray-500">Quality control for incoming raw materials</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search inspections..." 
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
        <Table
          columns={[
            { header: 'QC ID', accessor: 'id' },
            { header: 'GRN Number', accessor: 'grnId' },
            { header: 'Material', accessor: 'materialName' },
            { header: 'Supplier', accessor: 'supplierName' },
            { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
            { 
              header: 'Status', 
              accessor: 'status', 
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                row.status === 'Pending' ? (
                  <button 
                    onClick={() => setSelectedQC(row)}
                    className="btn btn-secondary btn-sm py-1"
                  >
                    Inspect
                  </button>
                ) : row.status === 'Approved' ? (
                  <button 
                    onClick={() => {
                      toast.success(`Inventory updated for ${row.materialName}`);
                      updateInspection(row.id, 'Posted', row.results, user?.name || '', row.remarks || '');
                    }}
                    className="btn btn-primary btn-sm py-1"
                  >
                    Post to Inventory
                  </button>
                ) : (
                  <button className="text-primary text-sm font-medium hover:underline">View Result</button>
                )
              )
            }
          ]}
          data={inspections}
        />
      </div>

      <Modal
        isOpen={!!selectedQC}
        onClose={() => setSelectedQC(null)}
        title={`QC Inspection: ${selectedQC?.id}`}
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Material</p>
                <p className="font-bold">{selectedQC?.materialName}</p>
              </div>
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="font-bold">{selectedQC?.supplierName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <ClipboardCheck size={16} /> Inspection Checklist
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Moisture Test',
                  'Purity Test',
                  'Contamination Check',
                  'Color Analysis',
                  'Odor/Smell Test',
                  'Packaging Integrity'
                ].map((test, i) => (
                  <label key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                    <span className="text-sm font-medium text-gray-700">{test}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                name="result" 
                label="Final Result" 
                type="select" 
                options={[
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                  { label: 'Conditional Approval', value: 'conditional' },
                ]} 
                required 
              />
              <FormField name="inspector" label="Inspector Name" required />
            </div>

            <FormField name="remarks" label="QC Remarks" type="textarea" placeholder="Enter detailed observations..." />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setSelectedQC(null)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <CheckCircle2 size={18} /> Submit Inspection
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
