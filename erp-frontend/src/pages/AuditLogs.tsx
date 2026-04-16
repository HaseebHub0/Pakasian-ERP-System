import React from 'react';
import { useAuditStore } from '@/store/useAuditStore';
import { Table, Badge } from '@/components/ui/Shared';
import { SearchBar } from '@/components/ui/Forms';
import { formatDate } from '@/utils/formatters';
import { Activity, Shield, User, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { logs } = useAuditStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">System Audit Logs</h2>
        <p className="text-sm text-gray-500">Track all system activities and administrative changes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Actions</p>
            <p className="text-xl font-bold text-gray-900">{logs.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Security Events</p>
            <p className="text-xl font-bold text-gray-900">
              {logs.filter(l => l.module === 'Auth' || l.module === 'Approvals').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="w-full max-w-md">
            <SearchBar onSearch={setSearchTerm} placeholder="Search logs by action, user, or module..." />
          </div>
        </div>

        <Table
          columns={[
            { 
              header: 'Timestamp', 
              accessor: 'timestamp',
              render: (val) => (
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={14} />
                  <span>{formatDate(val)}</span>
                </div>
              )
            },
            { 
              header: 'User', 
              accessor: 'userName',
              render: (val) => (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {val.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{val}</span>
                </div>
              )
            },
            { 
              header: 'Action', 
              accessor: 'action',
              render: (val) => (
                <Badge color="bg-blue-50 text-blue-700 border-blue-100 font-mono text-[10px]">
                  {val}
                </Badge>
              )
            },
            { header: 'Module', accessor: 'module' },
            { 
              header: 'Details', 
              accessor: 'details',
              render: (val) => <span className="text-gray-600 text-sm">{val}</span>
            },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (val) => (
                <Badge color={val === 'success' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}>
                  {val}
                </Badge>
              )
            },
          ]}
          data={filteredLogs}
        />
      </div>
    </div>
  );
};
