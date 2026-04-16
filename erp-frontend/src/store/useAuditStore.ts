import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  status: 'success' | 'failure';
}

interface AuditState {
  logs: AuditLog[];
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) => set((state) => ({
        logs: [
          {
            ...log,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
          },
          ...state.logs
        ].slice(0, 1000) // Keep last 1000 logs
      })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'erp-audit-storage',
    }
  )
);
