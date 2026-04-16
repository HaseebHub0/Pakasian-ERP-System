import React from 'react';
import { Plus, FileText, CheckCircle, XCircle, ChevronRight, User, Calendar, Trash2 } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useProcurementStore, Requisition } from '@/store/useProcurementStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useAuditStore } from '@/store/useAuditStore';
import { useNavigate } from 'react-router-dom';

export const RequisitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPR, setSelectedPR] = React.useState<Requisition | null>(null);
  const { requisitions, addRequisition, updatePRStatus } = useProcurementStore();
  const { user } = useAuthStore();
  const addApprovalRequest = useApprovalStore(state => state.addRequest);
  const addLog = useAuditStore(state => state.addLog);
  const [step, setStep] = React.useState(1);

  const methods = useForm({
    defaultValues: {
      department: '',
      required_date: '',
      remarks: '',
      items: [{ materialId: '', materialName: '', quantity: '', unit: '', estimatedCost: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items"
  });

  const onSubmit = (data: any) => {
    if (!user) return;

    const totalAmount = data.items.reduce((acc: number, item: any) => 
      acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.estimatedCost) || 0), 0
    );

    addRequisition({
      department: data.department,
      requiredDate: data.required_date,
      remarks: data.remarks,
      items: data.items.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity),
        estimatedCost: parseFloat(item.estimatedCost)
      })),
      totalAmount,
      requestedBy: user.name,
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'CREATE_PR',
      module: 'Procurement',
      details: `Created PR for ${data.department} - Amount: ${formatCurrency(totalAmount)}`,
      status: 'success'
    });

    toast.success('Requisition saved as Draft');
    setIsModalOpen(false);
    setStep(1);
    methods.reset();
  };

  const submitForApproval = (pr: Requisition) => {
    if (!user) return;

    let targetRole = 'procurement_manager';
    if (pr.totalAmount > 500000) {
      targetRole = 'admin'; // Director/Admin
    } else if (pr.totalAmount > 100000) {
      targetRole = 'finance_manager';
    }

    addApprovalRequest({
      type: 'purchase_requisition',
      title: `PR Approval: ${pr.id}`,
      description: `Requisition from ${pr.department} for ${formatCurrency(pr.totalAmount)}`,
      requestedBy: user.name,
      targetRole,
      data: pr
    });

    updatePRStatus(pr.id, 'Submitted');

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'SUBMIT_PR',
      module: 'Procurement',
      details: `Submitted PR ${pr.id} for approval to ${targetRole}`,
      status: 'success'
    });

    toast.success(`PR submitted to ${targetRole.replace('_', ' ')}`);
    if (selectedPR?.id === pr.id) {
      setSelectedPR({ ...pr, status: 'Submitted' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Requisitions</h2>
          <p className="text-sm text-gray-500">Internal requests for materials and services</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} />
          Create Requisition
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <SearchBar onSearch={() => {}} placeholder="Search PRs..." />
          </div>
          <Table
            columns={[
              { header: 'PR Number', accessor: 'id' },
              { header: 'Department', accessor: 'department' },
              { header: 'Items', accessor: 'items', render: (val) => val.length },
              { header: 'Total Amount', accessor: 'totalAmount', render: (val) => formatCurrency(val) },
              { 
                header: 'Status', 
                accessor: 'status', 
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge> 
              },
              {
                header: 'Actions',
                accessor: 'id',
                render: (_, row) => (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPR(row);
                    }}
                    className="p-1 text-primary hover:bg-primary/5 rounded"
                  >
                    <ChevronRight size={18} />
                  </button>
                )
              }
            ]}
            data={requisitions}
            onRowClick={(row) => setSelectedPR(row)}
          />
        </div>

        {selectedPR && (
          <div className="w-96 bg-white rounded-xl border shadow-sm p-6 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">PR Details</h3>
              <button onClick={() => setSelectedPR(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-primary">{selectedPR.id}</span>
                <Badge color={getStatusColor(selectedPR.status)}>{selectedPR.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500">Requester</p>
                  <p className="font-medium flex items-center gap-1"><User size={14} /> {selectedPR.requestedBy}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium flex items-center gap-1"><Calendar size={14} /> {formatDate(selectedPR.requestedAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-bold mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedPR.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.materialName} x {item.quantity} {item.unit}</span>
                      <span className="font-medium">{formatCurrency(item.quantity * item.estimatedCost)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(selectedPR.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                {selectedPR.status === 'Draft' && (
                  <button 
                    onClick={() => submitForApproval(selectedPR)}
                    className="w-full btn btn-primary gap-2"
                  >
                    <CheckCircle size={16} /> Submit for Approval
                  </button>
                )}
                
                {selectedPR.status === 'Approved' && (
                  <button 
                    onClick={() => {
                      toast.success('Opening Purchase Order creation...');
                      navigate('/procurement/purchase-orders');
                    }}
                    className="w-full btn btn-secondary gap-2"
                  >
                    <FileText size={16} /> Convert to PO
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setStep(1);
        }}
        title="Create Purchase Requisition"
        size="lg"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField 
                    name="department" 
                    label="Department" 
                    type="select" 
                    options={[
                      { label: 'Production', value: 'production' },
                      { label: 'Maintenance', value: 'maintenance' },
                      { label: 'Admin', value: 'admin' },
                    ]} 
                    required 
                  />
                  <FormField name="required_date" label="Required Date" type="date" required />
                </div>
                <FormField name="remarks" label="Remarks/Justification" type="textarea" />
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-primary">Next: Add Items</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                      <div className="flex items-end gap-3">
                        <FormField 
                          name={`items.${index}.materialName`} 
                          label="Material" 
                          type="select" 
                          className="flex-1"
                          options={[
                            { label: 'Besan (Gram Flour)', value: 'Besan (Gram Flour)' },
                            { label: 'Palm Oil', value: 'Palm Oil' },
                            { label: 'Red Chili Powder', value: 'Red Chili Powder' },
                            { label: 'Printed Film', value: 'Printed Film' },
                          ]} 
                        />
                        <FormField name={`items.${index}.quantity`} label="Qty" className="w-24" />
                        <FormField name={`items.${index}.unit`} label="Unit" className="w-24" />
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded mb-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField name={`items.${index}.estimatedCost`} label="Est. Cost per Unit (PKR)" />
                        <div className="flex flex-col justify-end">
                          <p className="text-xs text-gray-500 mb-1">Line Total</p>
                          <p className="font-bold text-primary">
                            {formatCurrency((parseFloat(methods.watch(`items.${index}.quantity`)) || 0) * (parseFloat(methods.watch(`items.${index}.estimatedCost`)) || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={() => append({ materialId: '', materialName: '', quantity: '', unit: '', estimatedCost: '' })}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Plus size={14} /> Add Row
                </button>
                <div className="flex justify-between pt-4 border-t">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-outline">Back</button>
                  <button type="submit" className="btn btn-primary">Save as Draft</button>
                </div>
              </div>
            )}
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
