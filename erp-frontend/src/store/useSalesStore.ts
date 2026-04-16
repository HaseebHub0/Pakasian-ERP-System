import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFinanceStore } from './useFinanceStore';

export type SalesOrderStatus = 'Received' | 'Confirmed' | 'Stock Reserved' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type DispatchStatus = 'Pending' | 'In Transit' | 'Delivered' | 'Partially Delivered' | 'Rejected';
export type ReturnCondition = 'Resellable' | 'Damaged' | 'Expired';

export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  items: SalesOrderItem[];
  totalAmount: number;
  paymentType: 'Cash' | 'Credit' | 'Cheque';
  source: 'sales_app' | 'manual_entry' | 'distributor_portal';
  status: SalesOrderStatus;
  createdAt: string;
  confirmedAt?: string;
  reservedAt?: string;
}

export interface Dispatch {
  id: string;
  orderId: string;
  customerName: string;
  vehicleId: string;
  driverName: string;
  dispatchDate: string;
  status: DispatchStatus;
  items: {
    productId: string;
    productName: string;
    orderedQty: number;
    deliveredQty?: number;
  }[];
  deliveredAt?: string;
}

export interface SalesInvoice {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'Unpaid' | 'Paid';
}

export interface SalesReturn {
  id: string;
  orderId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    condition: ReturnCondition;
  }[];
  date: string;
  status: 'Processed';
}

interface SalesState {
  orders: SalesOrder[];
  dispatches: Dispatch[];
  invoices: SalesInvoice[];
  returns: SalesReturn[];
  
  // Actions
  addOrder: (order: Omit<SalesOrder, 'id' | 'status' | 'createdAt'>) => void;
  updateOrderStatus: (id: string, status: SalesOrderStatus) => void;
  addDispatch: (dispatch: Omit<Dispatch, 'id' | 'status'>) => void;
  confirmDelivery: (dispatchId: string, status: DispatchStatus, deliveredItems: { productId: string, deliveredQty: number }[]) => void;
  addReturn: (salesReturn: Omit<SalesReturn, 'id' | 'status' | 'date'>) => void;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      orders: [],
      dispatches: [],
      invoices: [],
      returns: [],

      addOrder: (order) => set((state) => ({
        orders: [
          {
            ...order,
            id: `SO-2026-${(state.orders.length + 1).toString().padStart(4, '0')}`,
            status: 'Received',
            createdAt: new Date().toISOString(),
          },
          ...state.orders
        ]
      })),

      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),

      addDispatch: (dispatch) => set((state) => ({
        dispatches: [
          {
            ...dispatch,
            id: `DSP-${new Date().getFullYear()}-${(state.dispatches.length + 1).toString().padStart(4, '0')}`,
            status: 'In Transit',
          },
          ...state.dispatches
        ],
        orders: state.orders.map(o => o.id === dispatch.orderId ? { ...o, status: 'Dispatched' } : o)
      })),

      confirmDelivery: (dispatchId, status, deliveredItems) => set((state) => {
        const dispatch = state.dispatches.find(d => d.id === dispatchId);
        if (!dispatch) return state;

        const order = state.orders.find(o => o.id === dispatch.orderId);
        if (!order) return state;

        // Create Invoice
        const invoiceId = `INV-${new Date().getFullYear()}-${(state.invoices.length + 1).toString().padStart(4, '0')}`;
        const newInvoice: SalesInvoice = {
          id: invoiceId,
          orderId: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          amount: order.totalAmount, // In real case, calculate based on delivered items
          date: new Date().toISOString(),
          status: 'Unpaid',
        };

        // Finance Integration: Sale hone par
        // AR Dr / Revenue Cr
        useFinanceStore.getState().addJournal({
          date: new Date().toISOString(),
          ref: invoiceId,
          description: `Sales Invoice for Order ${order.id}`,
          type: 'SALES',
          lines: [
            { accountId: '1200', accountName: 'Accounts Receivable', debit: order.totalAmount, credit: 0 },
            { accountId: '4000', accountName: 'Sales Revenue', debit: 0, credit: order.totalAmount }
          ]
        });

        // COGS: COGS Dr / FG Inventory Cr
        const cogsAmount = order.totalAmount * 0.6; // Mock 60% COGS
        useFinanceStore.getState().addJournal({
          date: new Date().toISOString(),
          ref: invoiceId,
          description: `COGS for Order ${order.id}`,
          type: 'SALES',
          lines: [
            { accountId: '5000', accountName: 'Cost of Goods Sold', debit: cogsAmount, credit: 0 },
            { accountId: '1320', accountName: 'Finished Goods Inventory', debit: 0, credit: cogsAmount }
          ]
        });

        useFinanceStore.getState().addReceivable({
          customerId: order.customerId,
          customerName: order.customerName,
          amount: order.totalAmount,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          ref: invoiceId
        });

        return {
          dispatches: state.dispatches.map(d => 
            d.id === dispatchId ? { 
              ...d, 
              status, 
              deliveredAt: new Date().toISOString(),
              items: d.items.map(item => {
                const delivered = deliveredItems.find(di => di.productId === item.productId);
                return { ...item, deliveredQty: delivered ? delivered.deliveredQty : item.orderedQty };
              })
            } : d
          ),
          orders: state.orders.map(o => o.id === dispatch.orderId ? { ...o, status: 'Delivered' } : o),
          invoices: [newInvoice, ...state.invoices]
        };
      }),

      addReturn: (salesReturn) => set((state) => ({
        returns: [
          {
            ...salesReturn,
            id: `RET-${new Date().getFullYear()}-${(state.returns.length + 1).toString().padStart(4, '0')}`,
            status: 'Processed',
            date: new Date().toISOString(),
          },
          ...state.returns
        ]
      })),
    }),
    {
      name: 'sales-storage',
    }
  )
);
