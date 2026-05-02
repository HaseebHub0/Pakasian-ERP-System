import React from 'react';
import { Plus, CheckCircle, XCircle, Send, Trash2, FileText } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementAPI } from '@/api/procurement';
import { masterDataAPI } from '@/api/masterData';

export const RequisitionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [convertModalOpen, setConvertModalOpen] = React.useState(false);
  const [selectedPR, setSelectedPR] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [supplierForConvert, setSupplierForConvert] = React.useState<string>('');

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['purchase-requisitions'],
    queryFn: procurementAPI.getRequisitions,
  });
  const { data: materials = [] } = useQuery({ queryKey: ['raw-materials'], queryFn: masterDataAPI.getRawMaterials });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: masterDataAPI.getWarehouses });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: masterDataAPI.getSuppliers });

  const materialOptions = materials.map((m: any) => ({ label: m.material_name, value: m.id }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouse_name, value: w.id }));
  const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: s.id }));

  const createMutation = useMutation({
    mutationFn: procurementAPI.createRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      toast.success('Requisition created');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Create failed'),
  });

  const submitMutation = useMutation({
    mutationFn: procurementAPI.submitRequisition,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      toast.success(data?.message || 'PR submitted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Submit failed'),
  });

  const approveMutation = useMutation({
    mutationFn: procurementAPI.approveRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      toast.success('PR approved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Approve failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: procurementAPI.rejectRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      toast.success('PR rejected');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Reject failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: procurementAPI.deleteRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      toast.success('PR deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Delete failed'),
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, supplier_id }: any) => procurementAPI.convertRequisitionToPO(id, { supplier_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('PR converted to PO');
      setConvertModalOpen(false);
      setSelectedPR(null);
      setSupplierForConvert('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Convert failed'),
  });

  const methods = useForm({
    defaultValues: {
      department: '',
      items: [{ material_id: '', requested_quantity: '', required_date: '', warehouse_id: '', remarks: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'items' });

  const onSubmit = (data: any) => {
    const payload = {
      department: data.department,
      status: 'Draft',
      items: data.items.map((i: any) => ({
        material_id: i.material_id,
        requested_quantity: parseFloat(i.requested_quantity),
        required_date: i.required_date || null,
        warehouse_id: i.warehouse_id || null,
        remarks: i.remarks || '',
      })),
    };
    createMutation.mutate(payload);
  };

  const filtered = requisitions.filter((r: any) =>
    r.requisition_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Requisitions</h2>
          <p className="text-sm text-gray-500">Internal requests for raw materials</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Create Requisition
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <SearchBar onSearch={setSearchTerm} placeholder="Search by PR number or department..." />
        </div>
        <Table
          columns={[
            { header: 'PR Number', accessor: 'requisition_number' },
            { header: 'Department', accessor: 'department' },
            { header: 'Date', accessor: 'created_date', render: (v) => formatDate(v) },
            { header: 'Items', accessor: 'items', render: (v) => (v ? v.length : 0) },
            { header: 'Status', accessor: 'status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            { header: 'Approval', accessor: 'approval_status', render: (v) => <Badge color={getStatusColor(v)}>{v}</Badge> },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  {row.status === 'Draft' && (
                    <button
                      onClick={() => submitMutation.mutate(row.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Submit for Approval"
                    >
                      <Send size={16} />
                    </button>
                  )}
                  {row.status === 'Submitted' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(row.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(row.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {row.status === 'Approved' && (
                    <button
                      onClick={() => {
                        setSelectedPR(row);
                        setConvertModalOpen(true);
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Convert to PO"
                    >
                      <FileText size={16} />
                    </button>
                  )}
                  {(row.status === 'Draft' || row.status === 'Rejected') && (
                    <button
                      onClick={() => deleteMutation.mutate(row.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
        />
        {isLoading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Requisition" size="xl">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="department"
                label="Department"
                type="select"
                options={[
                  { label: 'Production', value: 'production' },
                  { label: 'Maintenance', value: 'maintenance' },
                  { label: 'Admin', value: 'admin' },
                  { label: 'Warehouse', value: 'warehouse' },
                ]}
                required
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Items</h4>
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 bg-gray-50 rounded border grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <FormField name={`items.${idx}.material_id`} label="Material" type="select" options={materialOptions} required />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.requested_quantity`} label="Qty" required />
                  </div>
                  <div className="col-span-2">
                    <FormField name={`items.${idx}.required_date`} label="Required Date" type="date" />
                  </div>
                  <div className="col-span-3">
                    <FormField name={`items.${idx}.warehouse_id`} label="Warehouse" type="select" options={warehouseOptions} />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  append({ material_id: '', requested_quantity: '', required_date: '', warehouse_id: '', remarks: '' })
                }
                className="btn btn-outline btn-sm gap-2"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                Save as Draft
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Convert PR to Purchase Order" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Converting <span className="font-mono font-bold">{selectedPR?.requisition_number}</span> to a PO. Select a supplier.
          </p>
          <div>
            <label className="text-sm font-medium">Supplier</label>
            <select
              value={supplierForConvert}
              onChange={(e) => setSupplierForConvert(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            >
              <option value="">-- Select Supplier --</option>
              {supplierOptions.map((s: any) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConvertModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              disabled={!supplierForConvert || convertMutation.isPending}
              onClick={() => convertMutation.mutate({ id: selectedPR.id, supplier_id: supplierForConvert })}
              className="btn btn-primary"
            >
              Convert
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
