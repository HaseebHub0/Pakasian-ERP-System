import React from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { useApprovalStore, ApprovalRequest } from '@/store/useApprovalStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';
import { useProcurementStore } from '@/store/useProcurementStore';
import { Table, Badge } from '@/components/ui/Shared';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const ApprovalsPage: React.FC = () => {
  const { requests, updateStatus } = useApprovalStore();
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);
  const { updatePRStatus } = useProcurementStore();

  const handleAction = (id: string, status: 'approved' | 'rejected', title: string, data: any) => {
    if (!user) return;
    updateStatus(id, status, user.name);
    
    // If it's a PR, update the procurement store as well
    if (data && data.id && data.id.startsWith('PR-')) {
      updatePRStatus(data.id, status === 'approved' ? 'Approved' : 'Rejected', user.name);
    }

    addLog({
      userId: user.id.toString(),
      userName: user.name,
      action: status === 'approved' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
      module: 'Approvals',
      details: `${status === 'approved' ? 'Approved' : 'Rejected'} request: ${title}`,
      status: 'success'
    });

    toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
  };

  const filteredRequests = requests.filter(r => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return r.targetRole === user.role;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const historyRequests = filteredRequests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Approval Center</h2>
        <p className="text-sm text-gray-500">Review and approve pending transactions and requests</p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-amber-500" size={20} />
            Pending Approvals ({pendingRequests.length})
          </h3>
          
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl border shadow-sm p-5 space-y-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FileText size={20} />
                    </div>
                    <Badge color="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-900">{req.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={14} />
                      <span>Requested by: {req.requestedBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>Date: {formatDate(req.requestedAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleAction(req.id, 'approved', req.title, req.data)}
                      className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2 text-sm"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'rejected', req.title, req.data)}
                      className="flex-1 btn btn-outline border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 py-2 text-sm"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <CheckCircle size={32} />
              </div>
              <p className="text-gray-500 font-medium">No pending approvals</p>
              <p className="text-sm text-gray-400">Everything is up to date!</p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Approval History</h3>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table
              columns={[
                { header: 'Request', accessor: 'title' },
                { header: 'Type', accessor: 'type', render: (val) => <span className="capitalize">{val.replace('_', ' ')}</span> },
                { header: 'Requested By', accessor: 'requestedBy' },
                { header: 'Date', accessor: 'requestedAt', render: (val) => formatDate(val) },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  render: (val) => (
                    <Badge color={val === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-rose-100 text-rose-800 border-rose-200'}>
                      {val}
                    </Badge>
                  )
                },
                { header: 'Action By', accessor: 'approvedBy' },
                { header: 'Action Date', accessor: 'approvedAt', render: (val) => val ? formatDate(val) : '-' },
              ]}
              data={historyRequests}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
