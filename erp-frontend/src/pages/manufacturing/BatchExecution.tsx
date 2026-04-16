import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  CheckCircle2, 
  Settings, 
  User, 
  Droplets, 
  AlertCircle, 
  Plus,
  ArrowRight,
  Search
} from 'lucide-react';
import { Badge, Table } from '@/components/ui/Shared';
import { FormField } from '@/components/ui/Forms';
import { getStatusColor, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { FormProvider, useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useManufacturingStore, ProductionBatch, StageName } from '@/store/useManufacturingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';

export const BatchExecutionPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { batches, updateBatchStage, completeBatch } = useManufacturingStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);
  
  const batch = batches.find(b => b.id === id);
  const [isStageActive, setIsStageActive] = React.useState(false);
  
  const methods = useForm({
    defaultValues: {
      labour: [{ worker: '', hours: '' }],
      input_qty: '',
      output_qty: '',
      waste_qty: '',
      oil_consumed: '',
      tpm_reading: '22',
      machine: '',
      operator: '',
      remarks: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "labour"
  });

  if (!id || !batch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Batch Execution</h2>
            <p className="text-sm text-gray-500">Select a batch to start production</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="w-full max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search batches..." 
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <Table
            columns={[
              { header: 'Batch ID', accessor: 'id' },
              { header: 'Product', accessor: 'productName' },
              { header: 'Line', accessor: 'lineId' },
              { header: 'Planned Qty', accessor: 'plannedQty', render: (val) => `${val.toLocaleString()} Units` },
              { 
                header: 'Status', 
                accessor: 'status', 
                render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge>
              },
              {
                header: 'Actions',
                accessor: 'id',
                render: (val) => (
                  <button 
                    onClick={() => navigate(`/manufacturing/batch-execution/${val}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    Open Execution
                  </button>
                )
              }
            ]}
            data={batches.filter(b => b.status !== 'Completed' && b.status !== 'Rejected')}
          />
        </div>
      </div>
    );
  }

  const currentStage = batch.stages[batch.currentStageIndex];

  const handleStartStage = () => {
    setIsStageActive(true);
    updateBatchStage(batch.id, batch.currentStageIndex, { 
      status: 'In Progress',
      startTime: new Date().toISOString()
    });
    toast.success(`${currentStage.name} stage started`);
  };

  const handleCompleteStage = (data: any) => {
    if (!user) return;

    updateBatchStage(batch.id, batch.currentStageIndex, {
      status: 'Completed',
      endTime: new Date().toISOString(),
      machineId: data.machine,
      operatorId: data.operator,
      inputQty: parseFloat(data.input_qty),
      outputQty: parseFloat(data.output_qty),
      wasteQty: parseFloat(data.waste_qty),
      logs: currentStage.name === 'Frying' ? { oilConsumed: data.oil_consumed, tpm: data.tpm_reading } : undefined
    });

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'COMPLETE_STAGE',
      module: 'Manufacturing',
      details: `Completed ${currentStage.name} for batch ${batch.id}`,
      status: 'success'
    });

    setIsStageActive(false);
    toast.success(`${currentStage.name} stage completed`);
    methods.reset();
  };

  const handleFinalizeBatch = (qualityStatus: 'Approved' | 'Rejected') => {
    if (!user) return;
    
    completeBatch(batch.id, batch.stages[5].outputQty || 0, qualityStatus);
    
    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: 'COMPLETE_BATCH',
      module: 'Manufacturing',
      details: `Finalized batch ${batch.id} - Status: ${qualityStatus}`,
      status: 'success'
    });

    if (qualityStatus === 'Approved') {
      toast.success('Batch completed and inventory updated');
      toast.success('Journal: Finished Goods Dr / WIP Inventory Cr', { icon: '📝' });
    } else {
      toast.error('Batch rejected and moved to quarantine');
    }
  };

  const getTPMStatus = (tpm: number) => {
    if (tpm < 24) return { label: 'Good', color: 'bg-green-100 text-green-800 border-green-200' };
    if (tpm < 27) return { label: 'Warning', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'Change Oil Now', color: 'bg-red-100 text-red-800 border-red-200 animate-pulse' };
  };

  const tpmValue = parseFloat(methods.watch('tpm_reading')) || 0;
  const tpmStatus = getTPMStatus(tpmValue);

  return (
    <div className="space-y-6">
      {/* Batch Info Bar */}
      <div className="bg-primary text-white p-6 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="pr-6 border-r border-white/20">
            <p className="text-xs text-white/60 uppercase tracking-wider font-bold">Batch Number</p>
            <p className="text-2xl font-mono font-bold">{batch.id}</p>
          </div>
          <div className="pr-6 border-r border-white/20">
            <p className="text-xs text-white/60 uppercase tracking-wider font-bold">Product</p>
            <p className="text-lg font-semibold">{batch.productName}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider font-bold">Line</p>
            <p className="text-lg font-semibold">{batch.lineId}</p>
          </div>
        </div>
        <Badge color={batch.status === 'Completed' ? "bg-green-500 text-white border-green-400" : "bg-blue-500 text-white border-blue-400"} className="px-4 py-1 text-sm">
          {batch.status}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm overflow-x-auto">
        {batch.stages.map((stage, i) => (
          <React.Fragment key={stage.name}>
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                stage.status === 'Completed' ? "bg-green-500 text-white" :
                i === batch.currentStageIndex && batch.status !== 'Completed' ? "bg-primary text-white ring-4 ring-primary/20 animate-pulse" :
                "bg-gray-100 text-gray-400"
              )}>
                {stage.status === 'Completed' ? <CheckCircle2 size={20} /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-tight text-center",
                i === batch.currentStageIndex && batch.status !== 'Completed' ? "text-primary" : "text-gray-500"
              )}>
                {stage.name}
              </span>
            </div>
            {i < batch.stages.length - 1 && (
              <div className={cn(
                "flex-1 h-1 min-w-[40px] mx-2 rounded-full",
                stage.status === 'Completed' ? "bg-green-500" : "bg-gray-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {batch.status !== 'Completed' && batch.status !== 'Rejected' ? (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  Stage Execution: {currentStage.name}
                </h3>
                {!isStageActive ? (
                  <button 
                    onClick={handleStartStage}
                    className="btn btn-primary gap-2"
                  >
                    <Play size={16} /> Start Stage
                  </button>
                ) : (
                  <button 
                    onClick={methods.handleSubmit(handleCompleteStage)}
                    className="btn bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <CheckCircle2 size={16} /> Complete Stage
                  </button>
                )}
              </div>
              
              <div className="p-6">
                <FormProvider {...methods}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField 
                        name="machine" 
                        label="Machine/Equipment" 
                        type="select"
                        options={[
                          { label: 'Mixer-01 (High Speed)', value: 'm01' },
                          { label: 'Fryer-02 (Industrial)', value: 'f02' },
                          { label: 'Packer-04 (Auto)', value: 'p04' },
                        ]}
                      />
                      <FormField 
                        name="operator" 
                        label="Primary Operator" 
                        type="select"
                        options={[{ label: 'Muhammad Haseeb', value: 'mh' }]}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField name="input_qty" label="Input Qty (Kg)" placeholder="0.00" />
                      <FormField name="output_qty" label={currentStage.name === 'Packing' ? "Output Qty (Units)" : "Output Qty (Kg)"} placeholder="0.00" />
                      <FormField name="waste_qty" label="Waste Qty (Kg)" placeholder="0.00" />
                    </div>

                    {currentStage.name === 'Frying' && (
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-amber-900 flex items-center gap-2">
                            <Droplets size={18} /> Oil Tracking (Real-time)
                          </h4>
                          <Badge color={tpmStatus.color}>{tpmStatus.label}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="text-center">
                            <p className="text-xs text-amber-700 font-bold uppercase">Inlet Flow</p>
                            <p className="text-2xl font-bold text-amber-900">4.2 <span className="text-sm font-normal">L/min</span></p>
                          </div>
                          <div className="text-center border-x border-amber-200">
                            <p className="text-xs text-amber-700 font-bold uppercase">Outlet Flow</p>
                            <p className="text-2xl font-bold text-amber-900">3.8 <span className="text-sm font-normal">L/min</span></p>
                          </div>
                          <div className="text-center border-r border-amber-200">
                            <FormField name="tpm_reading" label="TPM Reading (%)" placeholder="0.0" />
                          </div>
                          <div className="text-center">
                            <FormField name="oil_consumed" label="Oil Consumed (L)" placeholder="0.0" />
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </FormProvider>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center space-y-6">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                batch.status === 'Completed' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {batch.status === 'Completed' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Batch {batch.status}</h3>
                <p className="text-gray-500">Execution completed on {formatDate(batch.completedAt || '')}</p>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => navigate('/manufacturing/batch-trace')}
                  className="btn btn-outline px-8 py-3 text-lg"
                >
                  View Batch Trace
                </button>
                <button 
                  onClick={() => navigate('/costing/batch-cost')}
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  View Costing
                </button>
              </div>
            </div>
          )}

          {batch.status === 'In Progress' && batch.currentStageIndex === 5 && batch.stages[5].status === 'Completed' && (
            <div className="bg-white rounded-xl border shadow-sm p-8 text-center space-y-4">
              <h3 className="text-xl font-bold">Final Batch Completion</h3>
              <p className="text-gray-500">All stages are complete. Please finalize the batch after quality verification.</p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handleFinalizeBatch('Rejected')}
                  className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50"
                >
                  Reject Batch
                </button>
                <button 
                  onClick={() => handleFinalizeBatch('Approved')}
                  className="btn btn-primary px-8"
                >
                  Approve & Complete Batch
                </button>
              </div>
            </div>
          )}

          {/* Labour Entry */}
          {batch.status !== 'Completed' && batch.status !== 'Rejected' && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" /> Labour Allocation
              </h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Worker Name</label>
                      <select className="w-full px-3 py-2 border rounded-md text-sm">
                        <option>Select Worker</option>
                        <option>Ahmed Khan</option>
                        <option>Sajid Ali</option>
                        <option>Sara Bibi</option>
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hours</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-md text-sm" placeholder="0.0" />
                    </div>
                    <button 
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded mb-0.5"
                    >
                      <AlertCircle size={18} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => append({ worker: '', hours: '' })}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Plus size={14} /> Add Worker
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4">Batch Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Planned Quantity</span>
                <span className="font-medium">{batch.plannedQty.toLocaleString()} Units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Stage</span>
                <span className="font-medium">{currentStage.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yield %</span>
                <span className="font-bold text-green-600">{batch.yield ? `${batch.yield.toFixed(1)}%` : '-'}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Overall Progress</span>
                  <span className="font-bold text-primary">
                    {batch.status === 'Completed' ? '100%' : `${Math.round((batch.currentStageIndex / 6) * 100)}%`}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: batch.status === 'Completed' ? '100%' : `${(batch.currentStageIndex / 6) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-600 text-white p-6 rounded-xl shadow-lg">
            <h4 className="font-bold mb-2">Quality Control</h4>
            <p className="text-sm text-white/80 mb-4">Final batch completion requires QC approval of the last stage output.</p>
            <button className="w-full py-2 bg-white text-amber-600 rounded-lg font-bold text-sm hover:bg-amber-50 transition-colors">
              Request QC Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
