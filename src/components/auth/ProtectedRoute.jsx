import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center mb-4 border border-navy-100 shadow-sm animate-pulse">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-navy-900 mb-1">Verifying Secure Session</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          Checking your citizen account authentication status...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination so user is redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

