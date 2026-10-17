import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  CheckCircle2,
  FileText,
  Bookmark,
  Building2,
  Coins,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import Badge from './Badge';
import { useTranslation } from '../../context/LanguageContext';

export default function SchemeCard({
  scheme,
  onSaveToggle,
  isSaved = false,
  onViewDetails,
  eligibilityStatus,
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, getSchemeText, getSchemeArray, getCategoryText, getSchemeTypeText } = useTranslation();

  const title = getSchemeText(scheme, 'title') || scheme.title;
  const description = getSchemeText(scheme, 'shortDescription') || scheme.shortDescription;
  const benefit = getSchemeText(scheme, 'financialBenefit') || scheme.financialBenefit;
  const ministry = getSchemeText(scheme, 'ministry') || scheme.ministry;
  const category = getCategoryText(scheme.category) || scheme.category;
  const schemeType = getSchemeTypeText(scheme.schemeType || scheme.level) || (scheme.schemeType || scheme.level);
  const eligibilityCriteria = getSchemeArray(scheme, 'eligibilityCriteria').length > 0
    ? getSchemeArray(scheme, 'eligibilityCriteria')
    : scheme.eligibilityCriteria || [];
  const documentsRequired = getSchemeArray(scheme, 'documentsRequired').length > 0
    ? getSchemeArray(scheme, 'documentsRequired')
    : scheme.documentsRequired || [];
  const applicationMode = getSchemeText(scheme, 'applicationMode') || scheme.applicationMode || '';

  return (
    <article className="bg-white rounded-2xl border border-stone-200/90 hover:border-teal-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5 md:p-6 space-y-4">
        {/* Header badges & save */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="teal">{category}</Badge>

            {/* Live Eligibility Badge (if calculated) */}
            {eligibilityStatus === 'likely_eligible' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {t('schemes.likelyEligible')}
              </span>
            )}
            {eligibilityStatus === 'possibly_eligible' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {t('schemes.possiblyEligible')}
              </span>
            )}

            {scheme.popular && (
              <Badge variant="amber">{t('schemes.highBenefit')}</Badge>
            )}
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {schemeType}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSaveToggle) onSaveToggle(scheme.id);
            }}
            title={isSaved ? t('schemes.savedInApplications') : t('schemes.saveScheme')}
            aria-label={isSaved ? t('schemes.savedInApplications') : t('schemes.saveScheme')}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
              isSaved
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'border-stone-200 text-slate-400 hover:text-teal-700 hover:bg-stone-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title and Ministry */}
        <div>
          <h3
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded((prev) => !prev);
              }
            }}
            title={expanded ? t('schemes.showLess') : t('schemes.quickPreview')}
            className="text-lg font-bold text-slate-900 hover:text-[#454F2A] focus:text-[#454F2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2 rounded-md transition-colors leading-snug cursor-pointer select-none inline-block"
          >
            {title}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ministry}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Key Highlight Metric */}
        {benefit && (
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                {t('schemes.primaryBenefit')}
              </span>
              <span className="text-sm font-bold text-emerald-950">
                {benefit}
              </span>
            </div>
          </div>
        )}

        {/* Expandable Quick Eligibility & Documents */}
        {expanded && (
          <div className="pt-3 border-t border-stone-100 space-y-3 animate-fadeIn text-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                {t('schemes.keyEligibility')}
              </h4>
              <ul className="space-y-1 pl-5 list-disc text-slate-600 text-xs">
                {eligibilityCriteria.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-chakraBlue" />
                {t('schemes.essentialDocuments')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {documentsRequired.map((doc, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-stone-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {applicationMode && (
              <p className="text-xs text-slate-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                {t('schemes.applicationMode')} {applicationMode}
              </p>
            )}

            <div className="pt-1">
              <Link
                to={`/applications?scheme=${scheme.id}&tab=guide`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors border border-teal-200"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('schemes.checklistGuideLink')}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(scheme)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('schemes.fullDetails')}</span>
            </button>
          )}
        </div>

        <a
          href={scheme.officialPortal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 bg-white border border-teal-600/30 hover:border-teal-700 px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
        >
          {t('schemes.officialPortal')}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
