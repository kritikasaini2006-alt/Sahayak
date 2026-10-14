import React, { useState } from 'react';
import {
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  Building2,
  FileCheck,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import SchemeCard from '../components/common/SchemeCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function CheckEligibilityPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    state: 'Uttar Pradesh',
    areaType: 'rural',
    ageGroup: '18-40',
    gender: 'female',
    occupation: 'farmer',
    annualIncome: 'under-1-lakh',
    rationCard: 'bpl',
    primaryInterest: 'farming',
  });

  const [hasEvaluated, setHasEvaluated] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      setHasEvaluated(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setHasEvaluated(false);
  };

  // Mock eligibility logic matching selected criteria with real schemes
  const matchedSchemes = React.useMemo(() => {
    if (!hasEvaluated) return [];

    return MOCK_SCHEMES.filter((scheme) => {
      if (formData.occupation === 'farmer' && scheme.id === 'pm-kisan') return true;
      if (formData.occupation === 'artisan' && scheme.id === 'pm-vishwakarma') return true;
      if (formData.occupation === 'business' && scheme.id === 'pm-mudra') return true;
      if ((formData.rationCard === 'bpl' || formData.rationCard === 'aay') && scheme.id === 'pm-jay') return true;
      if (formData.areaType === 'rural' && scheme.id === 'pmay-g') return true;
      if (formData.gender === 'female' && (scheme.id === 'sukanya-samriddhi' || scheme.id === 'pmuy')) return true;
      if (formData.ageGroup === '60-plus' && scheme.id === 'nsap-oaps') return true;
      return scheme.popular;
    });
  }, [hasEvaluated, formData]);

  return (
    <div className="py-8 md:py-12 space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Eligibility Screener</Badge>
          <span className="text-xs text-slate-500 font-medium">Self-Assessment Tool</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Find Schemes That Match Your Household
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          Answer a few straightforward demographic and livelihood questions to see a tailored shortlist of government benefits you may qualify for.
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-start gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Preliminary Guidance Notice:</span> This assessment evaluates criteria published by government departments. Final approval, biometric verification, and fund disbursements are strictly handled by authorized government authorities.
        </div>
      </div>

      {!hasEvaluated ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Progress Indicator */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-navy-800 text-white font-bold text-xs flex items-center justify-center">
                {step}
              </span>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step {step} of 3:{' '}
                {step === 1 && 'Basic Location & Demographics'}
                {step === 2 && 'Livelihood & Occupation'}
                {step === 3 && 'Household & Needs'}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {Math.round((step / 3) * 100)}% Complete
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      State / Union Territory
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option>Uttar Pradesh</option>
                      <option>Bihar</option>
                      <option>Madhya Pradesh</option>
                      <option>Rajasthan</option>
                      <option>Maharashtra</option>
                      <option>West Bengal</option>
                      <option>Karnataka</option>
                      <option>Tamil Nadu</option>
                      <option>Other State / UT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Habitation Area
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['rural', 'urban'].map((area) => (
                        <button
                          type="button"
                          key={area}
                          onClick={() => updateField('areaType', area)}
                          className={`py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                            formData.areaType === area
                              ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {area} Area
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Age Bracket
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'under-18', label: '< 18 yrs' },
                        { id: '18-40', label: '18 - 40 yrs' },
                        { id: '40-60', label: '40 - 60 yrs' },
                        { id: '60-plus', label: '60+ yrs' },
                      ].map((age) => (
                        <button
                          type="button"
                          key={age.id}
                          onClick={() => updateField('ageGroup', age.id)}
                          className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                            formData.ageGroup === age.id
                              ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {age.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'female', label: 'Female' },
                        { id: 'male', label: 'Male' },
                        { id: 'transgender', label: 'Transgender' },
                      ].map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => updateField('gender', g.id)}
                          className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                            formData.gender === g.id
                              ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Primary Occupation or Livelihood
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'farmer', title: 'Small / Marginal Farmer', desc: 'Owns cultivable land or tenant farming' },
                      { id: 'artisan', title: 'Traditional Artisan / Craftsman', desc: 'Carpenter, weaver, blacksmith, potter, etc.' },
                      { id: 'business', title: 'Micro-Entrepreneur / Shopkeeper', desc: 'Small vendor, repair shop, trading unit' },
                      { id: 'daily-wage', title: 'Daily Wage / Construction Worker', desc: 'Unorganized sector manual laborer' },
                      { id: 'student', title: 'Student / Young Jobseeker', desc: 'Pursuing higher studies or skill training' },
                      { id: 'homemaker', title: 'Homemaker / Caregiver', desc: 'Managing household and family welfare' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => updateField('occupation', item.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          formData.occupation === item.id
                            ? 'bg-teal-50 border-teal-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-sm text-navy-900">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Annual Household Income
                    </label>
                    <select
                      value={formData.annualIncome}
                      onChange={(e) => updateField('annualIncome', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="under-1-lakh">Below ₹1,00,000 / year</option>
                      <option value="1-to-2.5-lakh">₹1,00,000 - ₹2,50,000 / year</option>
                      <option value="2.5-to-5-lakh">₹2,50,000 - ₹5,00,000 / year</option>
                      <option value="above-5-lakh">Above ₹5,00,000 / year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Ration Card Status
                    </label>
                    <select
                      value={formData.rationCard}
                      onChange={(e) => updateField('rationCard', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="bpl">Below Poverty Line (BPL / PHH Card)</option>
                      <option value="aay">Antyodaya Anna Yojana (AAY Card)</option>
                      <option value="apl">Above Poverty Line (APL / General)</option>
                      <option value="none">No Ration Card / Not Sure</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-navy-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-teal-600" />
                    Privacy Assurance
                  </div>
                  <p>
                    All answers remain in your local browser session. No personally identifiable details are stored, logged, or shared with third parties.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Controls */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={step === 1}
              icon={ArrowLeft}
            >
              Previous
            </Button>

            <Button
              type="button"
              variant={step === 3 ? 'teal' : 'primary'}
              size="md"
              onClick={handleNext}
              icon={step === 3 ? Sparkles : ArrowRight}
              iconPosition="right"
            >
              {step === 3 ? 'Show Eligible Schemes' : 'Continue'}
            </Button>
          </div>
        </div>
      ) : (
        /* Evaluation Results View */
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-teal-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-700" />
                  Assessment Complete
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
                  You May Be Eligible for {matchedSchemes.length} Government Schemes
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Based on: {formData.areaType.toUpperCase()} area, {formData.occupation} livelihood, and household status.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                icon={RotateCcw}
              >
                Re-take Assessment
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-navy-900">
              Recommended Schemes for Your Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedSchemes.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

