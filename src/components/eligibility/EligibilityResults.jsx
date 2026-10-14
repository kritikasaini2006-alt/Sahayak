import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Building2,
  FileText,
  ChevronDown,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function EligibilityResults({
  results,
  profile,
  onEditProfile,
  onClearProfile,
  onRestartForm,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => {
    try {
      const stored = localStorage.getItem('sahayak_saved_schemes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveScheme = (id) => {
    setSavedSchemeIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('sahayak_saved_schemes', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const { likely, possibly, notEligible, all, summary } = results;

  const displayList =
    activeFilter === 'likely'
      ? likely
      : activeFilter === 'possibly'
      ? possibly
      : activeFilter === 'not_eligible'
      ? notEligible
      : all;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'likely_eligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Likely Eligible
          </span>
        );
      case 'possibly_eligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Possibly Eligible
          </span>
        );
      case 'not_eligible':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Not Eligible
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Profile Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Evaluation Completed
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-navy-900 mt-1">
              Eligibility Assessment for Your Profile
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Profile: {profile.age} yrs • {profile.occupation} • {profile.state} ({profile.areaType}) • Annual Income ₹{Number(profile.annualIncome).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              icon={Edit2}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearProfile}
              icon={Trash2}
              className="text-red-700 hover:text-red-800 hover:border-red-300"
            >
              Clear Data
            </Button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => setActiveFilter('likely')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all text-center ${
              activeFilter === 'likely'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="text-2xl font-extrabold text-emerald-800 block">
              {summary.likelyCount}
            </span>
            <span className="text-xs font-bold text-emerald-900">Likely Eligible</span>
          </div>

          <div
            onClick={() => setActiveFilter('possibly')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all text-center ${
              activeFilter === 'possibly'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500'
                : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="text-2xl font-extrabold text-amber-800 block">
              {summary.possiblyCount}
            </span>
            <span className="text-xs font-bold text-amber-900">Possibly Eligible</span>
          </div>

          <div
            onClick={() => setActiveFilter('not_eligible')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all text-center ${
              activeFilter === 'not_eligible'
                ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-2xl font-extrabold text-slate-700 block">
              {summary.notEligibleCount}
            </span>
            <span className="text-xs font-bold text-slate-600">Not Eligible</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All Evaluated (${summary.totalEvaluated})` },
            { id: 'likely', label: `Likely Eligible (${summary.likelyCount})` },
            { id: 'possibly', label: `Possibly Eligible (${summary.possiblyCount})` },
            { id: 'not_eligible', label: `Not Eligible (${summary.notEligibleCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {displayList.length} schemes
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {displayList.map((item) => {
          const isExpanded = expandedSchemeId === item.schemeId;
          const isSaved = savedSchemeIds.includes(item.schemeId);

          return (
            <div
              key={item.schemeId}
              className={`bg-white rounded-xl border transition-all overflow-hidden ${
                item.status === 'likely_eligible'
                  ? 'border-emerald-200 hover:border-emerald-400'
                  : item.status === 'possibly_eligible'
                  ? 'border-amber-200 hover:border-amber-400'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.status)}
                    <Badge variant="teal">{item.scheme.category}</Badge>
                    {item.verified ? (
                      <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-2 py-0.5 rounded">
                        Official Gazette Rule
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-300 font-medium px-2 py-0.5 rounded">
                        Estimated Rule
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSaveScheme(item.schemeId)}
                      className={`text-xs p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                        isSaved
                          ? 'bg-teal-50 border-teal-300 text-teal-800'
                          : 'border-slate-200 text-slate-400 hover:text-navy-900'
                      }`}
                      title={isSaved ? 'Saved in My Applications' : 'Save Scheme'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      <span className="text-[11px] hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <a
                      href={item.officialPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Official Portal
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Scheme Title & Benefit */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-navy-900 leading-snug">
                    {item.scheme.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.scheme.ministry || item.sourceDocument}</span>
                  </p>
                </div>

                {item.scheme.financialBenefit && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Benefit:
                    </span>
                    <span className="font-bold text-navy-900">
                      {item.scheme.financialBenefit}
                    </span>
                  </div>
                )}

                {/* Why You Qualify / Reasons */}
                {item.reasons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Matching Criteria Met
                    </span>
                    <ul className="space-y-1 pl-5 list-disc text-xs text-slate-600">
                      {item.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Criteria Alert */}
                {item.missing.length > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1 text-xs text-amber-900">
                    <span className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Information to Confirm / Missing Details:
                    </span>
                    <ul className="space-y-0.5 pl-5 list-disc text-[11px]">
                      {item.missing.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unmet Criteria (If Not Eligible) */}
                {item.unmet.length > 0 && (
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-1 text-xs text-red-900">
                    <span className="font-bold flex items-center gap-1.5 text-red-950">
                      <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      Disqualification Factors:
                    </span>
                    <ul className="space-y-0.5 pl-5 list-disc text-[11px]">
                      {item.unmet.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expandable Scheme Details (Documents, Mode, Source) */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-navy-900 block mb-1">
                        Application Mode & Next Steps:
                      </span>
                      <p>{item.scheme.applicationMode || 'Online via designated official ministry portal.'}</p>
                    </div>

                    {item.scheme.documentsRequired && item.scheme.documentsRequired.length > 0 && (
                      <div>
                        <span className="font-bold text-navy-900 block mb-1">
                          Required Documents:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.scheme.documentsRequired.map((doc, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 italic pt-1">
                      Rule Source: {item.sourceDocument}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer toggle */}
              <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedSchemeId(isExpanded ? null : item.schemeId)}
                  className="text-xs font-semibold text-navy-800 hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? 'Hide Details' : 'View Required Documents & Application Steps'}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-90'}`} />
                </button>

                <span className="text-[11px] text-slate-400">
                  {item.scheme.level || 'Central Government'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

