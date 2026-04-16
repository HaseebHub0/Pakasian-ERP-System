import React from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'motion/react';

interface TableProps {
  columns: {
    header: string;
    accessor: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  data: any[];
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
}

export const Table: React.FC<TableProps> = ({ columns, data, isLoading, onRowClick }) => {
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
        <div className="mb-2 text-slate-300 flex justify-center">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium">No records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200/60 rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "group transition-colors duration-200",
                  onRowClick ? "cursor-pointer hover:bg-slate-50/80" : "hover:bg-slate-50/40"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 text-slate-600">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; className?: string; color?: string }> = ({ 
  children, 
  className,
  color 
}) => {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all duration-200",
      color || "bg-slate-100 text-slate-600 border-slate-200",
      className
    )}>
      {children}
    </span>
  );
};

export const StatCard: React.FC<{
  icon: React.ElementType;
  value: string | number;
  label: string;
  trend?: { value: string; isUp: boolean };
}> = ({ icon: Icon, value, label, trend }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <Icon size={22} />
        </div>
        {trend && (
          <span className={cn(
            "px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1",
            trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
    </motion.div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn("bg-white rounded-3xl shadow-2xl w-full overflow-hidden relative z-10", sizes[size])}
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[80vh] scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
