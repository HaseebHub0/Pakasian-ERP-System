import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JournalType = 'GRN' | 'SALES' | 'PRODUCTION' | 'PAYMENT' | 'RECEIPT' | 'ADJUSTMENT';

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  description: string;
  type: JournalType;
  lines: JournalLine[];
  total: number;
}

export interface Account {
  id: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  category: string;
  balance: number;
}

export interface Payable {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
  ref: string;
}

export interface Receivable {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
  ref: string;
}

interface FinanceState {
  journals: JournalEntry[];
  accounts: Account[];
  payables: Payable[];
  receivables: Receivable[];
  isPeriodClosed: boolean;
  
  addJournal: (entry: Omit<JournalEntry, 'id' | 'total'>) => void;
  addPayable: (payable: Omit<Payable, 'id' | 'status'>) => void;
  addReceivable: (receivable: Omit<Receivable, 'id' | 'status'>) => void;
  paySupplier: (payableId: string, amount: number, method: string, ref: string) => void;
  receiveCustomerPayment: (receivableId: string, amount: number, method: string, ref: string) => void;
  closePeriod: () => void;
  getAccountBalance: (accountId: string) => number;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      journals: [],
      accounts: [
        { id: '1010', name: 'Cash', type: 'Asset', category: 'Current Assets', balance: 5000000 },
        { id: '1020', name: 'Bank', type: 'Asset', category: 'Current Assets', balance: 15000000 },
        { id: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets', balance: 0 },
        { id: '1300', name: 'Raw Material Inventory', type: 'Asset', category: 'Inventory', balance: 0 },
        { id: '1310', name: 'WIP Inventory', type: 'Asset', category: 'Inventory', balance: 0 },
        { id: '1320', name: 'Finished Goods Inventory', type: 'Asset', category: 'Inventory', balance: 0 },
        { id: '2100', name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities', balance: 0 },
        { id: '3000', name: 'Retained Earnings', type: 'Equity', category: 'Equity', balance: 0 },
        { id: '4000', name: 'Sales Revenue', type: 'Revenue', category: 'Revenue', balance: 0 },
        { id: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'Direct Costs', balance: 0 },
        { id: '5100', name: 'Manufacturing Overhead', type: 'Expense', category: 'Direct Costs', balance: 0 },
      ],
      payables: [],
      receivables: [],
      isPeriodClosed: false,

      addJournal: (entry) => {
        if (get().isPeriodClosed) return;
        
        const id = `JV-${Date.now()}`;
        const total = entry.lines.reduce((sum, line) => sum + line.debit, 0);
        
        const newEntry = { ...entry, id, total };
        
        // Update account balances
        const updatedAccounts = get().accounts.map(acc => {
          const lines = entry.lines.filter(l => l.accountId === acc.id);
          if (lines.length === 0) return acc;
          
          let balanceChange = 0;
          lines.forEach(line => {
            if (acc.type === 'Asset' || acc.type === 'Expense') {
              balanceChange += (line.debit - line.credit);
            } else {
              balanceChange += (line.credit - line.debit);
            }
          });
          
          return { ...acc, balance: acc.balance + balanceChange };
        });

        set(state => ({
          journals: [newEntry, ...state.journals],
          accounts: updatedAccounts
        }));
      },

      addPayable: (payable) => {
        const id = `AP-${Date.now()}`;
        set(state => ({
          payables: [...state.payables, { ...payable, id, status: 'Pending' }]
        }));
      },

      addReceivable: (receivable) => {
        const id = `AR-${Date.now()}`;
        set(state => ({
          receivables: [...state.receivables, { ...receivable, id, status: 'Pending' }]
        }));
      },

      paySupplier: (payableId, amount, method, ref) => {
        const payable = get().payables.find(p => p.id === payableId);
        if (!payable) return;

        // Create Journal Entry
        get().addJournal({
          date: new Date().toISOString(),
          ref: ref,
          description: `Payment to ${payable.supplierName} for ${payable.ref}`,
          type: 'PAYMENT',
          lines: [
            { accountId: '2100', accountName: 'Accounts Payable', debit: amount, credit: 0 },
            { accountId: method === 'Cash' ? '1010' : '1020', accountName: method, debit: 0, credit: amount }
          ]
        });

        set(state => ({
          payables: state.payables.map(p => 
            p.id === payableId ? { ...p, status: 'Paid' } : p
          )
        }));
      },

      receiveCustomerPayment: (receivableId, amount, method, ref) => {
        const receivable = get().receivables.find(r => r.id === receivableId);
        if (!receivable) return;

        // Create Journal Entry
        get().addJournal({
          date: new Date().toISOString(),
          ref: ref,
          description: `Payment received from ${receivable.customerName} for ${receivable.ref}`,
          type: 'RECEIPT',
          lines: [
            { accountId: method === 'Cash' ? '1010' : '1020', accountName: method, debit: amount, credit: 0 },
            { accountId: '1200', accountName: 'Accounts Receivable', debit: 0, credit: amount }
          ]
        });

        set(state => ({
          receivables: state.receivables.map(r => 
            r.id === receivableId ? { ...r, status: 'Paid' } : r
          )
        }));
      },

      closePeriod: () => set({ isPeriodClosed: true }),
      
      getAccountBalance: (accountId) => {
        const acc = get().accounts.find(a => a.id === accountId);
        return acc ? acc.balance : 0;
      }
    }),
    {
      name: 'pakistani-foods-finance',
    }
  )
);
