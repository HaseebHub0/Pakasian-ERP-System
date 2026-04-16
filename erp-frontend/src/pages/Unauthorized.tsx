import React from 'react';
import { ShieldAlert, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            You don't have the required permissions to access this module. 
            Please contact your system administrator if you believe this is an error.
          </p>
        </div>
        <div className="pt-4">
          <Link 
            to="/dashboard"
            className="btn btn-primary gap-2 w-full"
          >
            <Home size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
