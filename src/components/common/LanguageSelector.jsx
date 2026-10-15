import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGS } from '../../context/LanguageContext';

export default function LanguageSelector({ variant = 'desktop', className = '' }) {
  const { language, changeLanguage } = useTranslation();

  if (variant === 'mobile') {
    return (
      <div className={`flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>भाषा / Language:</span>
        </div>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          {SUPPORTED_LANGS.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  isSelected
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
                aria-pressed={isSelected}
                aria-label={`Switch to ${lang.label}`}
              >
                {lang.nativeLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop / Tablet compact toggle pill
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors shadow-2xs ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-0.5">
        {SUPPORTED_LANGS.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
                isSelected
                  ? 'bg-white text-navy-900 shadow-2xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-navy-900 hover:bg-slate-200/60'
              }`}
              aria-pressed={isSelected}
              title={`Switch language to ${lang.label} (${lang.nativeLabel})`}
            >
              {lang.code === 'en' ? 'EN' : 'हिन्दी'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

