import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFinanceStore } from './useFinanceStore';

export type ProductionStatus = 'Planned' | 'Released' | 'In Progress' | 'Completed' | 'Cancelled';
export type BatchStatus = 'Draft' | 'Released' | 'In Progress' | 'Completed' | 'Rejected';
export type StageName = 'Mixing' | 'Frying' | 'Oil Draining' | 'Seasoning' | 'Cooling' | 'Packing';

export interface BatchStage {
  name: StageName;
  status: 'Pending' | 'In Progress' | 'Completed';
  machineId?: string;
  operatorId?: string;
  startTime?: string;
  endTime?: string;
  inputQty?: number;
  outputQty?: number;
  wasteQty?: number;
  wasteType?: string;
  logs?: any; // For stage-specific logs like oil consumption
}

export interface ProductionBatch {
  id: string; // PN260312A format
  orderId: string;
  productId: string;
  productName: string;
  plannedQty: number;
  actualQty?: number;
  status: BatchStatus;
  lineId: string;
  stages: BatchStage[];
  currentStageIndex: number;
  createdAt: string;
  completedAt?: string;
  yield?: number;
  totalCost?: number;
}

export interface ProductionOrder {
  id: string;
  productId: string;
  productName: string;
  plannedQty: number;
  startDate: string;
  endDate: string;
  status: ProductionStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  batches: string[]; // Batch IDs
}

interface ManufacturingState {
  orders: ProductionOrder[];
  batches: ProductionBatch[];
  
  // Order Actions
  addOrder: (order: Omit<ProductionOrder, 'id' | 'status' | 'createdAt' | 'batches'>) => void;
  updateOrderStatus: (id: string, status: ProductionStatus, user?: string) => void;
  
  // Batch Actions
  createBatches: (orderId: string, count: number, lineId: string) => void;
  updateBatchStage: (batchId: string, stageIndex: number, updates: Partial<BatchStage>) => void;
  completeBatch: (batchId: string, actualQty: number, qualityStatus: 'Approved' | 'Rejected') => void;
}

const STAGES: StageName[] = ['Mixing', 'Frying', 'Oil Draining', 'Seasoning', 'Cooling', 'Packing'];

export const useManufacturingStore = create<ManufacturingState>()(
  persist(
    (set, get) => ({
      orders: [],
      batches: [],

      addOrder: (order) => set((state) => ({
        orders: [
          {
            ...order,
            id: `PO-${new Date().getFullYear()}-${(state.orders.length + 1).toString().padStart(4, '0')}`,
            status: 'Planned',
            createdAt: new Date().toISOString(),
            batches: [],
          },
          ...state.orders
        ]
      })),

      updateOrderStatus: (id, status, user) => set((state) => ({
        orders: state.orders.map(o => 
          o.id === id ? { ...o, status, approvedBy: user } : o
        )
      })),

      createBatches: (orderId, count, lineId) => set((state) => {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return state;

        const qtyPerBatch = order.plannedQty / count;
        const newBatches: ProductionBatch[] = [];
        const batchIds: string[] = [];

        for (let i = 0; i < count; i++) {
          const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
          const seq = String.fromCharCode(65 + i); // A, B, C...
          const batchId = `${order.productId.split('-')[0]}${dateStr}${seq}`;
          
          const batch: ProductionBatch = {
            id: batchId,
            orderId,
            productId: order.productId,
            productName: order.productName,
            plannedQty: qtyPerBatch,
            status: 'Released',
            lineId,
            stages: STAGES.map(name => ({ name, status: 'Pending' })),
            currentStageIndex: 0,
            createdAt: new Date().toISOString(),
          };
          
          newBatches.push(batch);
          batchIds.push(batchId);
        }

        return {
          batches: [...newBatches, ...state.batches],
          orders: state.orders.map(o => o.id === orderId ? { ...o, batches: [...o.batches, ...batchIds], status: 'Released' } : o)
        };
      }),

      updateBatchStage: (batchId, stageIndex, updates) => set((state) => {
        const batch = state.batches.find(b => b.id === batchId);
        if (!batch) return state;

        const newStages = [...batch.stages];
        newStages[stageIndex] = { ...newStages[stageIndex], ...updates };
        
        let newStatus = batch.status;
        if (updates.status === 'In Progress') {
          newStatus = 'In Progress';
          
          // Finance Integration: Production issue hone par
          // WIP Dr / Inventory Cr
          if (batch.status !== 'In Progress') {
            const issueAmount = batch.plannedQty * 30; // Mock raw material cost
            useFinanceStore.getState().addJournal({
              date: new Date().toISOString(),
              ref: batch.id,
              description: `Material Issue for Batch ${batch.id}`,
              type: 'PRODUCTION',
              lines: [
                { accountId: '1310', accountName: 'WIP Inventory', debit: issueAmount, credit: 0 },
                { accountId: '1300', accountName: 'Raw Material Inventory', debit: 0, credit: issueAmount }
              ]
            });
          }
        }
        
        return {
          batches: state.batches.map(b => b.id === batchId ? {
            ...b,
            stages: newStages,
            status: newStatus,
            currentStageIndex: updates.status === 'Completed' && stageIndex < STAGES.length - 1 ? stageIndex + 1 : b.currentStageIndex
          } : b)
        };
      }),

      completeBatch: (batchId, actualQty, qualityStatus) => set((state) => {
        const batch = state.batches.find(b => b.id === batchId);
        if (!batch) return state;

        const yieldVal = (actualQty / batch.plannedQty) * 100;
        const totalCost = batch.plannedQty * 50;

        if (qualityStatus === 'Approved') {
          // Finance Integration: Production complete hone par
          // FG Inventory Dr / WIP Cr
          useFinanceStore.getState().addJournal({
            date: new Date().toISOString(),
            ref: batch.id,
            description: `Production Completion for Batch ${batch.id}`,
            type: 'PRODUCTION',
            lines: [
              { accountId: '1320', accountName: 'Finished Goods Inventory', debit: totalCost, credit: 0 },
              { accountId: '1310', accountName: 'WIP Inventory', debit: 0, credit: totalCost }
            ]
          });
        }

        return {
          batches: state.batches.map(b => b.id === batchId ? {
            ...b,
            actualQty,
            status: qualityStatus === 'Approved' ? 'Completed' : 'Rejected',
            completedAt: new Date().toISOString(),
            yield: yieldVal,
            totalCost: totalCost,
          } : b)
        };
      }),
    }),
    {
      name: 'manufacturing-storage',
    }
  )
);
