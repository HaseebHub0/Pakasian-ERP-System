import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'No data found',
  description = 'There are no records to display.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-4">
        {icon ?? <PackageOpen size={32} />}
      </div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
