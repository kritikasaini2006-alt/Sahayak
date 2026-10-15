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
      className="bg-navy-950 text-slate-200 border-b border-navy-800 text-xs py-2 px-4 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
          <p className="truncate sm:whitespace-normal leading-relaxed">
            <span className="font-semibold text-white">{t('disclaimerBanner.title')}</span>{' '}
            {t('disclaimerBanner.text')}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.india.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-teal-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            {t('disclaimerBanner.portalLink')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label={t('disclaimerBanner.dismiss')}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-navy-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
