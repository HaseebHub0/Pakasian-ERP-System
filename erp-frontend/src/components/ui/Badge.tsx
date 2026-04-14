import React from 'react';

type StatusVariant =
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'purple'
  | 'gray';

const STATUS_MAP: Record<string, StatusVariant> = {
  // Green — success/completed
  approved: 'green',
  active: 'green',
  completed: 'green',
  delivered: 'green',
  received: 'green',
  paid: 'green',
  passed: 'green',
  confirmed: 'green',
  closed: 'green',

  // Yellow — waiting/neutral
  pending: 'yellow',
  draft: 'yellow',
  planned: 'yellow',
  'on hold': 'yellow',
  waiting: 'yellow',
  partial: 'yellow',
  requested: 'yellow',

  // Red — failure/blocked
  rejected: 'red',
  cancelled: 'red',
  overdue: 'red',
  failed: 'red',
  'on hold - overdue': 'red',
  expired: 'red',

  // Blue — in motion
  'in progress': 'blue',
  running: 'blue',
  dispatched: 'blue',
  shipped: 'blue',
  processing: 'blue',
  'in transit': 'blue',

  // Purple — special
  submitted: 'purple',
  reviewed: 'purple',
  'under review': 'purple',
};

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20',
};

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const normalized = status?.toLowerCase().trim() ?? '';
  const variant: StatusVariant = STATUS_MAP[normalized] ?? 'gray';
  const classes = VARIANT_CLASSES[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${classes} ${className}`}
    >
      {status}
    </span>
  );
}
