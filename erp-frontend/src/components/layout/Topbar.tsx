import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b flex justify-between items-center px-6 shrink-0 shadow-sm z-10">
      <div></div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium text-gray-900">{user?.first_name || 'Admin'} {user?.last_name || 'User'}</span>
          <span className="text-xs text-gray-500">{user?.role || 'Super Admin'}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
          <User size={20} />
        </div>
        <button 
          onClick={logout}
          className="ml-2 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
