import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Building2,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  Coins,
  MapPin,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useTranslation } from '../../context/LanguageContext';

export default function SchemeDetailModal({
  scheme,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  eligibilityEvaluation,
}) {
  const {
    t,
    language,
    getSchemeText,
    getSchemeArray,
    getCategoryText,
    getSchemeTypeText,
    getEvaluationReasonText,
  } = useTranslation();
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !scheme) return null;

  const displayTitle = getSchemeText(scheme, 'title') || scheme.title;
  const displayMinistry = getSchemeText(scheme, 'ministry') || scheme.ministry;
  const displayCategory = getCategoryText(scheme.category);
  const displayBenefit = getSchemeText(scheme, 'financialBenefit') || scheme.financialBenefit;
  const displayPurpose = getSchemeText(scheme, 'purpose') || getSchemeText(scheme, 'shortDescription') || scheme.purpose || scheme.shortDescription;
  const displayBenefitDetails = getSchemeArray(scheme, 'benefitDetails').length > 0
    ? getSchemeArray(scheme, 'benefitDetails')
    : scheme.benefitDetails || [];
  const displayEligibilityCriteria = getSchemeArray(scheme, 'eligibilityCriteria').length > 0
    ? getSchemeArray(scheme, 'eligibilityCriteria')
    : scheme.eligibilityCriteria || [];
  const displayExclusions = getSchemeArray(scheme, 'exclusions').length > 0
    ? getSchemeArray(scheme, 'exclusions')
    : scheme.exclusions || [];
  const displayDocumentsRequired = getSchemeArray(scheme, 'documentsRequired').length > 0
    ? getSchemeArray(scheme, 'documentsRequired')
    : scheme.documentsRequired || [];
  const displayApplicationSteps = getSchemeArray(scheme, 'applicationSteps').length > 0
    ? getSchemeArray(scheme, 'applicationSteps')
    : scheme.applicationSteps || [];
  const displayTargetBeneficiaries = getSchemeArray(scheme, 'targetBeneficiaries').length > 0
    ? getSchemeArray(scheme, 'targetBeneficiaries').join(', ')
    : (scheme.targetBeneficiaries ? scheme.targetBeneficiaries.join(', ') : scheme.beneficiaryType);
  const displayBeneficiaryType = getSchemeText(scheme, 'beneficiaryType') || scheme.beneficiaryType;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheme-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 text-white p-5 sm:p-6 shrink-0 flex items-start justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal" className="bg-teal-900/60 text-teal-200 border-teal-500/40">
                {displayCategory}
              </Badge>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                {getSchemeTypeText(scheme.schemeType || scheme.level)}
              </span>
              {scheme.verificationStatus === 'verified' ? (
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {language === 'hi' ? 'सत्यापित सरकारी नियम' : 'Verified Official Rule'}
                </span>
              ) : (
                <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/30 font-semibold px-2 py-0.5 rounded">
                  {language === 'hi' ? 'आंशिक सत्यापन' : 'Estimated / Partial Verification'}
                </span>
              )}
            </div>

            <h2 id="scheme-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {displayTitle}
            </h2>

            <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{displayMinistry}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleSave(scheme.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isSaved
                  ? 'bg-teal-600 border-teal-500 text-white'
                  : 'bg-navy-800 border-navy-700 text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
              title={isSaved ? 'Remove from Saved Schemes' : 'Save Scheme for later'}
              aria-label={isSaved ? 'Remove from Saved Schemes' : 'Save Scheme'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors border border-navy-700"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Live Profile Match Evaluation (Phase 2 Connection) */}
          {eligibilityEvaluation && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                eligibilityEvaluation.status === 'likely_eligible'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : eligibilityEvaluation.status === 'possibly_eligible'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {eligibilityEvaluation.status === 'likely_eligible' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : eligibilityEvaluation.status === 'possibly_eligible' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-sm block">
                  {eligibilityEvaluation.status === 'likely_eligible' &&
                    (language === 'hi'
                      ? 'आपकी प्रोफ़ाइल इस योजना के लिए पात्र प्रतीत होती है'
                      : 'Your Profile is Likely Eligible for this scheme')}
                  {eligibilityEvaluation.status === 'possibly_eligible' &&
                    (language === 'hi'
                      ? 'आपकी प्रोफ़ाइल संभवतः पात्र है (पुष्टि आवश्यक)'
                      : 'Your Profile is Possibly Eligible (Verification Needed)')}
                  {eligibilityEvaluation.status === 'not_eligible' &&
                    (language === 'hi'
                      ? 'उपलब्ध आंकड़ों के आधार पर आपकी प्रोफ़ाइल अपात्र हो सकती है'
                      : 'Your Profile may not qualify based on available data')}
                </span>

                {eligibilityEvaluation.reasons.length > 0 && (
                  <p className="text-slate-700">
                    <strong>{language === 'hi' ? 'मिलान मानदंड:' : 'Matching Criteria:'}</strong>{' '}
                    {eligibilityEvaluation.reasons.map((r) => getEvaluationReasonText(r)).join(', ')}
                  </p>
                )}

                {eligibilityEvaluation.missing.length > 0 && (
                  <p className="text-amber-900">
                    <strong>{language === 'hi' ? 'पुष्टि आवश्यक:' : 'To confirm:'}</strong>{' '}
                    {eligibilityEvaluation.missing.map((m) => getEvaluationReasonText(m)).join(', ')}
                  </p>
                )}

                {eligibilityEvaluation.unmet.length > 0 && (
                  <p className="text-red-700">
                    <strong>{language === 'hi' ? 'अपात्रता कारण:' : 'Disqualification reason:'}</strong>{' '}
                    {eligibilityEvaluation.unmet.map((u) => getEvaluationReasonText(u)).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Purpose & Objective */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              {language === 'hi' ? 'योजना का उद्देश्य' : 'Purpose & Civic Objective'}
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {displayPurpose}
            </p>
          </div>

          {/* Quick Metrics Bar (Applicable States & Target Beneficiaries) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  {language === 'hi' ? 'भौगोलिक क्षेत्र' : 'Geographical Coverage'}
                </span>
                <span className="font-bold text-navy-900">
                  {scheme.applicableStates ? scheme.applicableStates.join(', ') : (language === 'hi' ? 'अखिल भारतीय (राष्ट्रीय)' : 'All India (National)')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-navy-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  {language === 'hi' ? 'लक्षित लाभार्थी' : 'Intended Beneficiaries'}
                </span>
                <span className="font-bold text-navy-900">
                  {displayTargetBeneficiaries}
                </span>
              </div>
            </div>
          </div>

          {/* Financial & Assistance Benefits */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              {language === 'hi' ? 'वित्तीय लाभ एवं सुविधाएं' : 'Benefits & Entitlements'}
            </h3>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="font-bold text-navy-950 text-sm">
                {displayBenefit}
              </div>

              {displayBenefitDetails.length > 0 && (
                <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700">
                  {displayBenefitDetails.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              {language === 'hi' ? 'पात्रता की शर्तें' : 'Eligibility Criteria'}
            </h3>
            <ul className="space-y-1.5 list-disc pl-5 text-xs text-slate-600">
              {displayEligibilityCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Exclusions (if any) */}
          {displayExclusions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                {language === 'hi' ? 'अपात्रता एवं अपवाद' : 'Exclusions & Disqualifications'}
              </h3>
              <ul className="space-y-1 list-disc pl-5 text-xs text-red-800/90 bg-red-50/50 p-3 rounded-xl border border-red-100">
                {displayExclusions.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Documents Checklist */}
          {displayDocumentsRequired.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-navy-600" />
                {t('schemes.essentialDocuments')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayDocumentsRequired.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Application Instructions */}
          {displayApplicationSteps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                {language === 'hi' ? 'आवेदन के आधिकारिक चरण' : 'Official Application Steps'}
              </h3>
              <div className="space-y-2">
                {displayApplicationSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Attribution & Gazette Verification Notice */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs text-slate-600">
            <span className="font-bold text-navy-900 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              {language === 'hi' ? 'सत्यापित सरकारी सूचना स्रोत' : 'Verified Government Information Source'}
            </span>
            <p className="text-[11px] leading-relaxed">
              <strong>Source:</strong> {scheme.officialSource || 'Published Gazette / Ministry Notification'}. Data last reviewed: {scheme.lastVerifiedDate || '2024'}.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {language === 'hi' ? 'आवेदन केवल आधिकारिक सरकारी पोर्टल पर ही जमा करें।' : 'Submit applications exclusively on authenticated government portals.'}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/applications?scheme=${scheme.id}&tab=guide`}
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{language === 'hi' ? 'दस्तावेज चेकलिस्ट एवं गाइड' : 'Interactive Checklist & Guide'}</span>
            </Link>

            <button
              onClick={() => onToggleSave(scheme.id)}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                isSaved
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? t('schemes.savedInApplications') : t('schemes.saveScheme')}</span>
            </button>

            <a
              href={scheme.officialPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>{t('schemes.officialPortal')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

