import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
        Access Restricted (403 Forbidden)
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        Your current role (<span className="font-semibold text-slate-800">{role}</span>) does not have sufficient permission to access this module or operational action.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
        >
          <Home size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
