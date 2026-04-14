import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';
type CardColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'orange';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
    label?: string;
  };
  color?: CardColor;
  loading?: boolean;
}

const COLOR_MAP: Record<CardColor, { bg: string; icon: string; accent: string }> = {
  indigo: { bg: 'bg-indigo-500', icon: 'text-indigo-600 bg-indigo-50', accent: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-500', icon: 'text-emerald-600 bg-emerald-50', accent: 'text-emerald-600' },
  amber: { bg: 'bg-amber-500', icon: 'text-amber-600 bg-amber-50', accent: 'text-amber-600' },
  rose: { bg: 'bg-rose-500', icon: 'text-rose-600 bg-rose-50', accent: 'text-rose-600' },
  violet: { bg: 'bg-violet-500', icon: 'text-violet-600 bg-violet-50', accent: 'text-violet-600' },
  sky: { bg: 'bg-sky-500', icon: 'text-sky-600 bg-sky-50', accent: 'text-sky-600' },
  orange: { bg: 'bg-orange-500', icon: 'text-orange-600 bg-orange-50', accent: 'text-orange-600' },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'indigo',
  loading = false,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    trend?.direction === 'up'
      ? 'text-emerald-600'
      : trend?.direction === 'down'
      ? 'text-red-500'
      : 'text-gray-400';

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>

      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}

      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          <span>{trend.value}</span>
          {trend.label && <span className="text-gray-400 font-normal">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
