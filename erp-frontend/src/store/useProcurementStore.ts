import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFinanceStore } from './useFinanceStore';

export interface PRItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

export interface Requisition {
  id: string;
  department: string;
  requiredDate: string;
  items: PRItem[];
  totalAmount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Converted';
  requestedBy: string;
  requestedAt: string;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  prId?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDelivery: string;
  items: any[];
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  createdBy: string;
}

export interface GRNItem {
  materialId: string;
  materialName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  binId: string;
  batchNumber: string;
}

export interface GRN {
  id: string;
  poId: string;
  supplierName: string;
  date: string;
  deliveryChallan: string;
  items: GRNItem[];
  status: 'Pending QC' | 'QC Completed' | 'Posted';
  receivedBy: string;
}

export interface QCInspection {
  id: string;
  grnId: string;
  materialId: string;
  materialName: string;
  supplierName: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Posted';
  results?: any;
  inspector?: string;
  remarks?: string;
}

interface ProcurementState {
  requisitions: Requisition[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  inspections: QCInspection[];
  
  // Requisition Actions
  addRequisition: (pr: Omit<Requisition, 'id' | 'status' | 'requestedAt'>) => void;
  updatePRStatus: (id: string, status: Requisition['status'], user?: string) => void;
  
  // PO Actions
  addPO: (po: Omit<PurchaseOrder, 'id' | 'status'>) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => void;
  
  // GRN Actions
  addGRN: (grn: Omit<GRN, 'id' | 'status'>) => void;
  
  // QC Actions
  addInspection: (qc: Omit<QCInspection, 'id' | 'status'>) => void;
  updateInspection: (id: string, status: QCInspection['status'], results: any, inspector: string, remarks: string) => void;
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set) => ({
      requisitions: [],
      purchaseOrders: [],
      grns: [],
      inspections: [],

      addRequisition: (pr) => set((state) => ({
        requisitions: [
          {
            ...pr,
            id: `PR-2026-${(state.requisitions.length + 1).toString().padStart(3, '0')}`,
            status: 'Draft',
            requestedAt: new Date().toISOString(),
          },
          ...state.requisitions
        ]
      })),

      updatePRStatus: (id, status, user) => set((state) => ({
        requisitions: state.requisitions.map(pr => 
          pr.id === id ? { 
            ...pr, 
            status, 
            approvedBy: user, 
            approvedAt: user ? new Date().toISOString() : undefined 
          } : pr
        )
      })),

      addPO: (po) => set((state) => ({
        purchaseOrders: [
          {
            ...po,
            id: `PO-2026-${(state.purchaseOrders.length + 1).toString().padStart(3, '0')}`,
            status: 'Draft',
          },
          ...state.purchaseOrders
        ]
      })),

      updatePOStatus: (id, status) => set((state) => ({
        purchaseOrders: state.purchaseOrders.map(po => 
          po.id === id ? { ...po, status } : po
        )
      })),

      addGRN: (grn) => set((state) => {
        const grnId = `GRN-2026-${(state.grns.length + 1).toString().padStart(3, '0')}`;
        const newGRN = {
          ...grn,
          id: grnId,
          status: 'Pending QC' as const,
        };
        
        // Automatically create QC inspections for each item
        const newInspections = grn.items.map((item, index) => ({
          id: `QC-2026-${(state.inspections.length + index + 1).toString().padStart(3, '0')}`,
          grnId: grnId,
          materialId: item.materialId,
          materialName: item.materialName,
          supplierName: grn.supplierName,
          date: new Date().toISOString(),
          status: 'Pending' as const,
        }));

        // Finance Integration: GRN hone par
        // Raw Material Inventory Dr / Accounts Payable Cr
        const totalAmount = grn.items.reduce((sum, item) => sum + (item.acceptedQty * 100), 0); // Mock price 100
        
        useFinanceStore.getState().addJournal({
          date: new Date().toISOString(),
          ref: grnId,
          description: `GRN for PO ${grn.poId} from ${grn.supplierName}`,
          type: 'GRN',
          lines: [
            { accountId: '1300', accountName: 'Raw Material Inventory', debit: totalAmount, credit: 0 },
            { accountId: '2100', accountName: 'Accounts Payable', debit: 0, credit: totalAmount }
          ]
        });

        useFinanceStore.getState().addPayable({
          supplierId: 'S-001', // Mock
          supplierName: grn.supplierName,
          amount: totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ref: grnId
        });

        return {
          grns: [newGRN, ...state.grns],
          inspections: [...newInspections, ...state.inspections]
        };
      }),

      addInspection: (qc) => set((state) => ({
        inspections: [
          {
            ...qc,
            id: `QC-2026-${(state.inspections.length + 1).toString().padStart(3, '0')}`,
            status: 'Pending',
          },
          ...state.inspections
        ]
      })),

      updateInspection: (id, status, results, inspector, remarks) => set((state) => ({
        inspections: state.inspections.map(qc => 
          qc.id === id ? { ...qc, status, results, inspector, remarks } : qc
        )
      })),
    }),
    {
      name: 'procurement-storage',
    }
  )
);
