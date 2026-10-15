import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGS } from '../../context/LanguageContext';

export default function LanguageSelector({ variant = 'desktop', className = '' }) {
  const { language, changeLanguage } = useTranslation();

  if (variant === 'mobile') {
    return (
      <div className={`flex items-center justify-between p-2.5 bg-[#E5E8E1] border border-[#445363]/20 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#445363]">
          <Globe className="w-4 h-4 text-[#454F2A]" />
          <span>भाषा / Language:</span>
        </div>
        <div className="flex items-center gap-1 bg-[#FAF8F1] p-0.5 rounded-lg border border-[#445363]/15 shadow-2xs">
          {SUPPORTED_LANGS.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  isSelected
                    ? 'bg-[#454F2A] text-white shadow-2xs'
                    : 'text-[#445363] hover:text-[#445363] hover:bg-[#E5E8E1]'
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
      className={`inline-flex items-center gap-1 p-1 bg-[#34404e] hover:bg-[#384452] border border-[#384452] rounded-lg transition-colors shadow-2xs ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Globe className="w-3.5 h-3.5 text-[#EDD575] ml-1 shrink-0" aria-hidden="true" />
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
                  ? 'bg-[#454F2A] text-white shadow-2xs ring-1 ring-[#384022]'
                  : 'text-[#E5E8E1] hover:text-white hover:bg-[#445363]'
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

