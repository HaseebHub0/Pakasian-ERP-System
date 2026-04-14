import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  fullscreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-indigo-200 border-t-indigo-600 ${SIZE_CLASSES[size]} ${className}`}
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
