import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  CheckCircle2,
  FileText,
  ChevronRight,
  Bookmark,
  Building2,
  Coins,
  Sparkles,
  Info,
  FileCheck2,
} from 'lucide-react';
import Badge from './Badge';

export default function SchemeCard({
  scheme,
  onSaveToggle,
  isSaved = false,
  onViewDetails,
  eligibilityStatus,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 hover:shadow-civic-card transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5 md:p-6 space-y-4">
        {/* Header badges & save */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="teal">{scheme.category}</Badge>

            {/* Live Eligibility Badge (if calculated) */}
            {eligibilityStatus === 'likely_eligible' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Likely Eligible
              </span>
            )}
            {eligibilityStatus === 'possibly_eligible' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Possibly Eligible
              </span>
            )}

            {scheme.popular && (
              <Badge variant="amber">High Benefit</Badge>
            )}
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {scheme.schemeType || scheme.level}
            </span>
          </div>

          <button
            onClick={() => onSaveToggle && onSaveToggle(scheme.id)}
            title={isSaved ? 'Saved in applications' : 'Save scheme'}
            aria-label={isSaved ? 'Remove from saved' : 'Save scheme'}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isSaved
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'border-slate-200 text-slate-400 hover:text-navy-800 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title and Ministry */}
        <div>
          <h3
            onClick={() => onViewDetails && onViewDetails(scheme)}
            className={`text-lg font-bold text-navy-900 group-hover:text-teal-700 transition-colors leading-snug ${
              onViewDetails ? 'cursor-pointer' : ''
            }`}
          >
            {scheme.title}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{scheme.ministry}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {scheme.shortDescription}
        </p>

        {/* Key Highlight Metric */}
        {scheme.financialBenefit && (
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Primary Benefit
              </span>
              <span className="text-sm font-bold text-navy-900">
                {scheme.financialBenefit}
              </span>
            </div>
          </div>
        )}

        {/* Expandable Quick Eligibility & Documents */}
        {expanded && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn text-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Key Eligibility
              </h4>
              <ul className="space-y-1 pl-5 list-disc text-slate-600 text-xs">
                {scheme.eligibilityCriteria.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-navy-600" />
                Essential Documents
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {scheme.documentsRequired.map((doc, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 italic bg-amber-50/70 p-2 rounded border border-amber-100">
              Application Mode: {scheme.applicationMode}
            </p>

            <div className="pt-1">
              <Link
                to={`/applications?scheme=${scheme.id}&tab=guide`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-900 text-xs font-bold transition-colors border border-teal-200/80"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Document Checklist & Application Guide →</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-navy-800 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Show Less' : 'Quick Preview'}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`} />
          </button>

          {onViewDetails && (
            <button
              onClick={() => onViewDetails(scheme)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
            >
              <span>Full Details</span>
            </button>
          )}
        </div>

        <a
          href={scheme.officialPortal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 hover:border-teal-400 px-2.5 py-1.5 rounded-lg shadow-sm transition-all"
        >
          Official Portal
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
