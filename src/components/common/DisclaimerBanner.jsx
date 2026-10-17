import React, { useState } from 'react';
import { ShieldAlert, X, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export default function DisclaimerBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation();

  if (isDismissed) return null;

  return (
    <aside
      aria-label={t('disclaimerBanner.title')}
      className="bg-[#0a172a] text-slate-200 border-b border-slate-800/80 text-xs py-2 px-4 transition-all"
    >
      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <p className="truncate sm:whitespace-normal leading-relaxed text-slate-300">
            <span className="font-semibold text-white">{t('disclaimerBanner.title')}</span>{' '}
            {t('disclaimerBanner.text')}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.india.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-amber-300 hover:text-white underline underline-offset-2 transition-colors font-medium"
          >
            {t('disclaimerBanner.portalLink')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label={t('disclaimerBanner.dismiss')}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
