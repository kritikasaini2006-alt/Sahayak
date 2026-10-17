import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGS } from '../../context/LanguageContext';

export default function LanguageSelector({ variant = 'desktop', className = '' }) {
  const { language, changeLanguage } = useTranslation();

  if (variant === 'mobile') {
    return (
      <div className={`flex items-center justify-between p-2.5 bg-stone-100 border border-stone-200 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Globe className="w-4 h-4 text-teal-700" />
          <span>भाषा / Language:</span>
        </div>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200 shadow-2xs">
          {SUPPORTED_LANGS.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
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
      className={`inline-flex items-center gap-1 p-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors shadow-2xs ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Globe className="w-3.5 h-3.5 text-amber-400 ml-1 shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-0.5">
        {SUPPORTED_LANGS.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-2xs ring-1 ring-teal-600'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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

