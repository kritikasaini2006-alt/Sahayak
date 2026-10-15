import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  User,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import EligibilityStepper from '../components/eligibility/EligibilityStepper';
import DemographicsStep from '../components/eligibility/DemographicsStep';
import LivelihoodStep from '../components/eligibility/LivelihoodStep';
import HouseholdStep from '../components/eligibility/HouseholdStep';
import ReviewStep from '../components/eligibility/ReviewStep';
import EligibilityResults from '../components/eligibility/EligibilityResults';
import ProfileSummaryBanner from '../components/eligibility/ProfileSummaryBanner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  evaluateEligibility,
  saveCitizenProfile,
  loadCitizenProfile,
  clearCitizenProfile,
} from '../utils/eligibilityEngine';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const INITIAL_FORM_STATE = {
  age: '',
  gender: '',
  state: '',
  areaType: '',
  occupation: '',
  farmerLandholding: '',
  artisanTrade: '',
  annualIncome: '',
  socialCategory: '',
  rationCard: '',
  housingType: '',
  hasGirlChildUnder10: '',
  hasDisability: '',
};

export default function CheckEligibilityPage() {
  const { t, language } = useTranslation();
  useDocumentTitle(t('eligibility.pageTitle'));
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [saveToStorage, setSaveToStorage] = useState(true);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [storedProfile, setStoredProfile] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load existing profile from localStorage on component mount or user change
  useEffect(() => {
    const existing = loadCitizenProfile();
    if (existing && existing.age && existing.state) {
      setStoredProfile(existing);
      setFormData(existing);
    } else {
      setStoredProfile(null);
    }
  }, [user]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const steps = [
    { number: 1, title: t('eligibility.step1Title') },
    { number: 2, title: t('eligibility.step2Title') },
    { number: 3, title: t('eligibility.step3Title') },
    { number: 4, title: t('eligibility.step4Title') },
  ];

  // Validation function for current step
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!formData.age && formData.age !== 0) {
        newErrors.age = language === 'hi' ? 'कृपया अपनी आयु दर्ज करें।' : 'Please enter your age.';
      } else {
        const ageNum = Number(formData.age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          newErrors.age = language === 'hi' ? 'कृपया 1 से 120 के बीच मान्य आयु दर्ज करें।' : 'Please enter a valid age between 1 and 120.';
        }
      }

      if (!formData.state) {
        newErrors.state = language === 'hi' ? 'कृपया अपना राज्य या केंद्र शासित प्रदेश चुनें।' : 'Please select your State or Union Territory.';
      }

      if (!formData.areaType) {
        newErrors.areaType = language === 'hi' ? 'कृपया ग्रामीण या शहरी क्षेत्र का चयन करें।' : 'Please select whether you live in a rural or urban area.';
      }
    } else if (stepNumber === 2) {
      if (!formData.occupation) {
        newErrors.occupation = language === 'hi' ? 'कृपया अपना मुख्य व्यवसाय या आजीविका चुनें।' : 'Please select your primary occupation or livelihood.';
      }

      if (formData.annualIncome === '' || formData.annualIncome === undefined) {
        newErrors.annualIncome = language === 'hi' ? 'कृपया अनुमानित वार्षिक आय दर्ज करें (यदि कोई नहीं है तो 0 लिखें)।' : 'Please provide an estimated annual household income (use 0 if none).';
      } else {
        const incomeNum = Number(formData.annualIncome);
        if (isNaN(incomeNum) || incomeNum < 0) {
          newErrors.annualIncome = language === 'hi' ? 'वार्षिक आय एक मान्य धनात्मक संख्या होनी चाहिए।' : 'Annual income must be a valid non-negative number.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        runEvaluation();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const runEvaluation = () => {
    const results = evaluateEligibility(formData);
    setEvaluationResults(results);

    if (saveToStorage) {
      const saved = saveCitizenProfile(formData);
      setStoredProfile(saved);
      showNotification(language === 'hi' ? 'नागरिक प्रोफ़ाइल स्थानीय स्टोरेज में सुरक्षित हो गई है।' : 'Citizen profile saved to local browser storage.');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplySampleProfile = (sample) => {
    setFormData(sample.data);
    setErrors({});
    setCurrentStep(1);
    setEvaluationResults(null);
    showNotification(language === 'hi' ? `नमूना प्रोफ़ाइल लागू: "${sample.name}"` : `Applied sample profile: "${sample.name}". You can navigate steps or click Review to evaluate.`);
  };

  const handleClearProfile = () => {
    clearCitizenProfile();
    setStoredProfile(null);
    setFormData(INITIAL_FORM_STATE);
    setEvaluationResults(null);
    setCurrentStep(1);
    showNotification(language === 'hi' ? 'सहेजी गई नागरिक प्रोफ़ाइल साफ़ कर दी गई है।' : 'Stored citizen profile data has been wiped from local storage.');
  };

  const handleEditProfile = () => {
    setEvaluationResults(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div className="py-5 sm:py-7 space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="teal">{t('eligibility.screenerBadge')}</Badge>
          <span className="text-xs text-slate-500 font-medium">{t('eligibility.screenerNote')}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          {t('eligibility.pageTitle')}
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          {t('eligibility.pageSubtitle')}
        </p>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          role="status"
          className="bg-navy-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-teal-500/30 flex items-center justify-between animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-4"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Profile Summary Banner (If Stored) */}
      {!evaluationResults && storedProfile && (
        <ProfileSummaryBanner
          profile={storedProfile}
          onEdit={handleEditProfile}
          onClear={handleClearProfile}
          onEvaluate={() => {
            const results = evaluateEligibility(storedProfile);
            setEvaluationResults(results);
          }}
        />
      )}

      {/* Sample Profiles Quick Tester */}
      {!evaluationResults && (
        <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4 text-teal-700" />
            <span>{t('eligibility.testSampleProfiles')}</span>
          </div>
          <p className="text-xs text-slate-500">
            {t('eligibility.testSampleSubtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {SAMPLE_PROFILES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySampleProfile(sample)}
                className="text-xs font-medium px-3 py-1.5 bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-lg shadow-sm transition-colors text-left"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form or Results View */}
      {!evaluationResults ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Stepper Progress */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5">
            <EligibilityStepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={(stepNum) => {
                if (validateStep(currentStep) || stepNum < currentStep) {
                  setCurrentStep(stepNum);
                }
              }}
            />
          </div>

          {/* Form Step Body */}
          <div className="p-5 md:p-6">
            {currentStep === 1 && (
              <DemographicsStep
                formData={formData}
                updateField={updateField}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <LivelihoodStep
                formData={formData}
                updateField={updateField}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <HouseholdStep
                formData={formData}
                updateField={updateField}
              />
            )}

            {currentStep === 4 && (
              <ReviewStep
                formData={formData}
                onEditStep={(stepNum) => setCurrentStep(stepNum)}
                saveToStorage={saveToStorage}
                setSaveToStorage={setSaveToStorage}
              />
            )}
          </div>

          {/* Form Action Controls */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 1}
              icon={ArrowLeft}
            >
              {t('common.back')}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={currentStep === 4 ? 'teal' : 'primary'}
                size="md"
                onClick={handleNext}
                icon={currentStep === 4 ? Sparkles : ArrowRight}
                iconPosition="right"
              >
                {currentStep === 4
                  ? (language === 'hi' ? 'मेरी पात्रता की जांच करें' : 'Evaluate My Eligibility')
                  : (language === 'hi' ? 'आगे बढ़ें' : 'Continue')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <EligibilityResults
          results={evaluationResults}
          profile={formData}
          onEditProfile={handleEditProfile}
          onClearProfile={handleClearProfile}
          onRestartForm={() => {
            setFormData(INITIAL_FORM_STATE);
            setEvaluationResults(null);
            setCurrentStep(1);
          }}
        />
      )}

      {/* Civic Transparency Notice */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-navy-900">{language === 'hi' ? 'नागरिक-तकनीकी पारदर्शिता सूचना:' : 'Civic-Tech Transparency Notice:'}</strong>{' '}
          {language === 'hi'
            ? 'सहायक AI प्रकाशित केंद्रीय और राज्य संचालन दिशानिर्देशों के आधार पर प्रारंभिक पात्रता जांच प्रदान करता है। अंतिम पात्रता निर्धारण, बायोमेट्रिक ई-केवाईसी और डीबीटी हस्तांतरण केवल आधिकारिक सरकारी विभागों और निर्दिष्ट पोर्टलों के माध्यम से होता है।'
            : 'Sahayak AI provides preliminary criteria screening based on published central and state operational guidelines. Final entitlement determinations, biometric e-KYC, and disbursements occur exclusively via authenticated official government departments and designated portals.'}
        </p>
      </div>
    </div>
  );
}
