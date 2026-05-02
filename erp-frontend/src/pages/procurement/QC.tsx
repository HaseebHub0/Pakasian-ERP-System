import React from 'react';
import { Plus, ClipboardCheck } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const QCInspectionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: inspections = [], isLoading } = useQuery({ queryKey: ['qc-inspections'], queryFn: procurementAPI.getQCInspections });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });
  const { data: grns = [] } = useQuery({ queryKey: ['grns'], queryFn: procurementAPI.getGRNs });
  const { data: batches = [] } = useQuery({ queryKey: ['raw-material-batches'], queryFn: procurementAPI.getRawMaterialBatches });

  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));
  const grnOptions = grns.map((g: any) => ({ label: g.grn_number, value: g.id }));
  const batchOptions = batches.map((b: any) => ({ label: b.batch_number, value: b.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createQCInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-inspections'] });
      toast.success('Inspection recorded');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const methods = useForm({
    defaultValues: {
      material_id: '',
      grn_id: '',
      batch_id: '',
      inspection_date: new Date().toISOString().slice(0, 10),
      result: 'Approved',
      remarks: '',
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      material_id: data.material_id,
      grn_id: data.grn_id || null,
      batch_id: data.batch_id || null,
      inspection_date: data.inspection_date,
      result: data.result,
      remarks: data.remarks,
    });
  };

  const filtered = inspections.filter((i: any) =>
    (i.result || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">QC Inspections</h2>
          <p className="text-sm text-gray-500">Quality control of received raw materials</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Record Inspection
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Filter by result..." />
        </div>
        <Table
          columns={[
            { header: 'Date', accessor: 'inspection_date', render: (v) => formatDate(v) },
            { header: 'Material', accessor: 'material_name' },
            { header: 'GRN', accessor: 'grn_number', render: (v) => v || '—' },
            { header: 'Batch', accessor: 'batch_number', render: (v) => v || '—' },
            { header: 'Result', accessor: 'result', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            { header: 'Remarks', accessor: 'remarks' },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New QC Inspection" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="material_id" label="Material" type="select" options={materialOptions} required />
              <FormField name="grn_id" label="GRN" type="select" options={grnOptions} />
              <FormField name="batch_id" label="Batch" type="select" options={batchOptions} />
              <FormField name="inspection_date" label="Inspection Date" type="date" required />
              <FormField
                name="result"
                label="Result"
                type="select"
                options={[
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' },
                  { label: 'Conditional', value: 'Conditional' },
                ]}
                required
              />
            </div>
            <FormField name="remarks" label="Remarks" type="textarea" />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                <ClipboardCheck size={16} /> Save Inspection
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
