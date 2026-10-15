import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export default function PageLoader() {
  const { t, isHindi } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center space-y-3"
    >
      <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center border border-navy-100 shadow-2xs">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-600">
        {t('common.loading', isHindi ? 'लोड हो रहा है...' : 'Loading...')}
      </p>
      <span className="sr-only">
        {isHindi ? 'सामग्री लोड हो रही है' : 'Loading page content'}
      </span>
    </div>
  );
}

