import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Printer,
  RotateCcw,
  Layers,
  Info,
  Bookmark,
  CheckSquare,
  Building2,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import {
  SCHEME_GUIDANCE,
  loadSchemeChecklistProgress,
  saveSchemeChecklistProgress,
  resetSchemeChecklistProgress,
} from '../../data/schemeGuidance';
import { useTranslation } from '../../context/LanguageContext';

export default function SchemeGuidanceView({
  schemeId = 'pm-kisan',
  isSaved = false,
  onToggleSave = null,
}) {
  const { t, getSchemeText, getGuidanceData, language } = useTranslation();
  const rawGuidance = SCHEME_GUIDANCE[schemeId] || SCHEME_GUIDANCE['pm-kisan'];
  const guidance = getGuidanceData(rawGuidance);

  // Checklist state for documents
  const [docProgress, setDocProgress] = useState(() =>
    loadSchemeChecklistProgress(guidance.schemeId)
  );

  // Review checklist state
  const [reviewProgress, setReviewProgress] = useState(() =>
    loadSchemeChecklistProgress(`${guidance.schemeId}_review`)
  );

  // Document filter: 'all' | 'mandatory' | 'conditional'
  const [docFilter, setDocFilter] = useState('all');

  // Reload progress whenever selected scheme changes
  useEffect(() => {
    setDocProgress(loadSchemeChecklistProgress(guidance.schemeId));
    setReviewProgress(loadSchemeChecklistProgress(`${guidance.schemeId}_review`));
  }, [guidance.schemeId]);

  // Toggle document checked status
  const handleToggleDoc = (docId) => {
    const updated = {
      ...docProgress,
      [docId]: !docProgress[docId],
    };
    setDocProgress(updated);
    saveSchemeChecklistProgress(guidance.schemeId, updated);
  };

  // Toggle review item checked status
  const handleToggleReview = (idx) => {
    const key = `rev_${idx}`;
    const updated = {
      ...reviewProgress,
      [key]: !reviewProgress[key],
    };
    setReviewProgress(updated);
    saveSchemeChecklistProgress(`${guidance.schemeId}_review`, updated);
  };

  // Reset checklist progress
  const handleResetProgress = () => {
    const confirmPrompt = t('guidance.resetConfirm', { title: guidance.title });
    if (window.confirm(confirmPrompt)) {
      resetSchemeChecklistProgress(guidance.schemeId);
      resetSchemeChecklistProgress(`${guidance.schemeId}_review`);
      setDocProgress({});
      setReviewProgress({});
    }
  };

  // Browser-native print / download PDF
  const handlePrint = () => {
    window.print();
  };

  // Calculations for Document Progress
  const totalDocs = guidance.documents.length;
  const completedDocsCount = guidance.documents.filter(
    (doc) => docProgress[doc.id]
  ).length;
  const docPercentage =
    totalDocs > 0 ? Math.round((completedDocsCount / totalDocs) * 100) : 0;

  // Filtered documents
  const filteredDocs = guidance.documents.filter((doc) => {
    if (docFilter === 'mandatory') return doc.requirementType === 'Mandatory';
    if (docFilter === 'conditional') return doc.requirementType === 'Conditional';
    return true;
  });

  // Calculations for Review Checklist Progress
  const totalReviewItems = guidance.reviewChecklist.length;
  const completedReviewCount = guidance.reviewChecklist.filter(
    (_, idx) => reviewProgress[`rev_${idx}`]
  ).length;
  const reviewPercentage =
    totalReviewItems > 0
      ? Math.round((completedReviewCount / totalReviewItems) * 100)
      : 0;

  const schemeTitle = getSchemeText(guidance, 'title') || guidance.title;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Print-Only Header (Visible only when user uses browser print / PDF export) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {t('guidance.printHeaderTitle', 'Sahayak AI — Citizen Application & Document Guidance')}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {t('guidance.printHeaderSubtitle', 'Independent Civic Guidance • Verified Government Welfare Scheme Checklist')}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>{t('guidance.printedOn', { date: new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN') })}</p>
            <p>{t('guidance.officialPortalLabel', { portal: guidance.portalName })}</p>
          </div>
        </div>
        <div className="mt-3 p-2 bg-slate-100 rounded text-xs text-slate-700">
          {t('guidance.printNotice', { portal: guidance.portalName })}
        </div>
      </div>

      {/* Main Guidance Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal">{guidance.ministry}</Badge>
              <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {t('guidance.verifiedDate', { date: guidance.lastVerifiedDate })}
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {t('guidance.gazetteSourced', 'Gazette Sourced')}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-navy-900 tracking-tight leading-snug">
              {schemeTitle}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>{t('guidance.officialSourceLabel', 'Official Source:')}</strong> {guidance.officialSource}
            </p>
          </div>

          {/* Action Buttons (Print, Reset, Save, Official Portal) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(guidance.schemeId)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isSaved
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isSaved ? t('guidance.removeFromSavedBtn', 'Remove from Saved') : t('guidance.saveSchemeBtn', 'Save Scheme')}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">
                  {isSaved ? t('guidance.saved', 'Saved') : t('common.save', 'Save')}
                </span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title={t('guidance.printChecklist', 'Print / Save PDF Checklist')}
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('guidance.printPdf', 'Print / PDF')}</span>
            </button>

            <button
              onClick={handleResetProgress}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title={t('guidance.resetChecklist', 'Reset checklist progress')}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('guidance.resetBtn', 'Reset')}</span>
            </button>

            <a
              href={guidance.officialPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>{guidance.portalName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Civic Safety & Non-Affiliation Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-navy-900 block">
              {t('guidance.safetyGuaranteeTitle', 'Independent Civic Guidance & Data Safety Guarantee:')}
            </span>
            <p className="leading-relaxed">
              {t('guidance.safetyGuaranteeText', { portal: guidance.portalName })}
            </p>
          </div>
        </div>

        {/* State Variance Notice */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950 block">
              {t('guidance.stateVarianceTitle', 'State-Specific Rules & Revenue Variation:')}
            </span>
            <p className="leading-relaxed text-amber-900/90">
              {guidance.stateVarianceNote}
            </p>
          </div>
        </div>

        {/* Prerequisites Checklist */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {t('guidance.essentialPrereqs', 'Essential Prerequisites Before Applying')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {guidance.prerequisites.map((prereq, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{prereq}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: DOCUMENT READINESS CHECKLIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                {t('guidance.docsChecklistNum', '1. Required Documents Checklist')}
              </h3>
              <Badge variant="teal">
                {t('guidance.docsReadyBadge', { completed: completedDocsCount, total: totalDocs })}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('guidance.docsChecklistDesc', 'Mark documents you have organized. Click any document to expand official procurement guidelines.')}
            </p>
          </div>

          {/* Progress Bar & Filter */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-900">
                <span>{t('guidance.preparedPercent', { percent: docPercentage })}</span>
              </div>
              <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${docPercentage}%` }}
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs print:hidden">
              <button
                onClick={() => setDocFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  docFilter === 'all'
                    ? 'bg-navy-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {t('guidance.allFilter', { total: totalDocs })}
              </button>
              <button
                onClick={() => setDocFilter('mandatory')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  docFilter === 'mandatory'
                    ? 'bg-navy-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {t('guidance.mandatoryFilter', 'Mandatory')}
              </button>
              <button
                onClick={() => setDocFilter('conditional')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  docFilter === 'conditional'
                    ? 'bg-navy-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {t('guidance.conditionalFilter', 'Conditional')}
              </button>
            </div>
          </div>
        </div>

        {/* Documents Cards List */}
        <div className="space-y-4">
          {filteredDocs.map((doc) => {
            const isChecked = !!docProgress[doc.id];
            return (
              <div
                key={doc.id}
                className={`rounded-xl border transition-all p-4 sm:p-5 ${
                  isChecked
                    ? 'bg-teal-50/50 border-teal-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleDoc(doc.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all border ${
                        isChecked
                          ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                          : 'border-slate-300 bg-white hover:border-teal-500'
                      }`}
                      aria-label={`Mark ${doc.name} as ${isChecked ? 'not ready' : 'ready'}`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4 text-transparent" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm sm:text-base font-bold transition-colors ${
                            isChecked
                              ? 'text-teal-950 line-through opacity-85'
                              : 'text-navy-900'
                          }`}
                        >
                          {doc.name}
                        </h4>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            doc.requirementType === 'Mandatory'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {doc.requirementType === 'Mandatory' ? t('guidance.requiredBadge', 'Mandatory') : t('guidance.conditionalBadge', 'Conditional')}
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {t('guidance.issuingAuthority', 'Issuing Authority:')} {doc.issuingAuthority}
                        </span>
                      </div>

                      {/* Purpose */}
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 font-semibold">{t('guidance.documentPurpose', 'Purpose:')}</strong>{' '}
                        {doc.purpose}
                      </p>

                      {/* Condition if applicable */}
                      {doc.condition && (
                        <p className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200/60 leading-relaxed">
                          <strong>{t('guidance.whenNeeded', 'When needed:')}</strong> {doc.condition}
                        </p>
                      )}

                      {/* Official Instructions for Obtaining */}
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <div>
                          <strong className="text-teal-800 font-semibold">
                            {t('guidance.howToObtainLabel', 'How to Obtain / Verify:')}
                          </strong>{' '}
                          {doc.howToObtain}
                        </div>
                        {doc.commonMistakes && (
                          <div className="text-[11px] text-slate-500 italic">
                            {t('guidance.tipToPreventRejection', { tip: doc.commonMistakes })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: STEP-BY-STEP APPLICATION GUIDE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            {t('guidance.stepsWalkthrough', '2. Step-by-Step Application Walkthrough')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('guidance.stepsWalkthroughDesc', 'Follow this verified chronological sequence to file your application on official government portals.')}
          </p>
        </div>

        <div className="space-y-4">
          {guidance.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-200 transition-colors"
            >
              {/* Step Number Circle */}
              <div className="w-8 h-8 rounded-full bg-navy-800 text-white font-extrabold flex items-center justify-center shrink-0 text-xs shadow-sm">
                {step.stepNumber}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-navy-900">
                    {step.title}
                  </h4>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 font-bold px-2 py-0.5 rounded">
                    {t('guidance.mode', 'Mode:')} {step.mode}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                {step.tip && (
                  <div className="mt-1 bg-white border border-teal-200 text-teal-900 p-2 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{t('guidance.civicProTip', 'Civic Pro-Tip:')}</strong> {step.tip}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: FINAL PRE-SUBMISSION REVIEW CHECKLIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-600" />
                {t('guidance.reviewChecklistNum', '3. Final Pre-Submission Review Checklist')}
              </h3>
              <Badge variant="teal">
                {t('guidance.reviewVerifiedBadge', { completed: completedReviewCount, total: totalReviewItems })}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('guidance.reviewChecklistDesc', 'Verify these common error causes before clicking final submit on the official portal.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy-900">
              {t('guidance.completePercent', { percent: reviewPercentage })}
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${reviewPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {guidance.reviewChecklist.map((item, idx) => {
            const isChecked = !!reviewProgress[`rev_${idx}`];
            return (
              <div
                key={idx}
                onClick={() => handleToggleReview(idx)}
                className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3 select-none ${
                  isChecked
                    ? 'bg-teal-50/70 border-teal-300 text-teal-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                    isChecked
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className="text-xs font-medium leading-relaxed flex-1">
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Submission Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 rounded-2xl text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md print:hidden">
        <div className="space-y-2 text-center md:text-left">
          <Badge variant="teal" className="bg-teal-800/80 text-teal-200 border-teal-600/40">
            {t('guidance.portalAppReady', 'Official Portal Application Ready')}
          </Badge>
          <h3 className="text-lg sm:text-2xl font-bold tracking-tight">
            {t('guidance.readyToSubmitTitle', 'Ready to file your official application?')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {t('guidance.readyToSubmitDesc', 'Ensure your document photocopies and Aadhaar OTP phone are with you, then visit the authorized government portal to submit.')}
          </p>
        </div>

        <a
          href={guidance.officialPortal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-extrabold text-sm shadow-md transition-all shrink-0"
        >
          <span>{t('guidance.launchOfficialPortal', { portal: guidance.portalName })}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

