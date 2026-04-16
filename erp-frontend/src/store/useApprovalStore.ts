import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApprovalRequest {
  id: string;
  type: 'purchase_order' | 'sales_order' | 'inventory_adjustment' | 'batch_release' | 'purchase_requisition';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  targetRole?: string;
  data: any;
  approvedBy?: string;
  approvedAt?: string;
}

interface ApprovalState {
  requests: ApprovalRequest[];
  addRequest: (request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateStatus: (id: string, status: 'approved' | 'rejected', userId: string) => void;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (request) => set((state) => ({
        requests: [
          {
            ...request,
            id: Math.random().toString(36).substring(7),
            requestedAt: new Date().toISOString(),
            status: 'pending',
          },
          ...state.requests
        ]
      })),
      updateStatus: (id, status, userId) => set((state) => ({
        requests: state.requests.map((r) => 
          r.id === id 
            ? { ...r, status, approvedBy: userId, approvedAt: new Date().toISOString() } 
            : r
        )
      })),
    }),
    {
      name: 'erp-approval-storage',
    }
  )
);
