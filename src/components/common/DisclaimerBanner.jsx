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
      className="bg-[#34404e] text-[#FAF8F1] border-b border-[#2c3743] text-xs py-2 px-4 transition-all"
    >
      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="w-4 h-4 text-[#EDD575] shrink-0" aria-hidden="true" />
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
            className="hidden md:inline-flex items-center gap-1 text-[#EDD575] hover:text-white underline underline-offset-2 transition-colors"
          >
            {t('disclaimerBanner.portalLink')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label={t('disclaimerBanner.dismiss')}
            className="p-1 text-[#E5E8E1] hover:text-white rounded hover:bg-[#445363] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
