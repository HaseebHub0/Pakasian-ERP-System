'use client';

import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="text-gray-600 hover:text-gray-900 mr-3"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center">
            <div className="bg-indigo-600 text-white px-2 py-1 rounded mr-2">
              <span className="font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Pakasian ERP</h1>
            </div>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm text-gray-700 font-medium">
                {user.name} ({user.role})
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
