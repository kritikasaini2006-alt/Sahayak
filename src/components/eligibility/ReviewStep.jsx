import React from 'react';
import { Edit2, ShieldCheck, User, Briefcase, Home, CheckCircle2 } from 'lucide-react';
import { OCCUPATION_OPTIONS } from '../../data/statesAndDistricts';
import { useTranslation } from '../../context/LanguageContext';

export default function ReviewStep({ formData, onEditStep, saveToStorage, setSaveToStorage }) {
  const { t, language } = useTranslation();
  const occObj = OCCUPATION_OPTIONS.find((o) => o.id === formData.occupation);

  const formatIncome = (val) => {
    if (!val && val !== 0) return t('common.notProvided', 'Not Provided');
    return `₹${Number(val).toLocaleString('en-IN')} / ${t('common.perYear', 'year')}`;
  };

  const getGenderText = (gender) => {
    if (!gender) return t('common.notSpecified', 'Not Specified');
    if (language === 'hi') {
      if (gender === 'male') return 'पुरुष';
      if (gender === 'female') return 'महिला';
      if (gender === 'other') return 'अन्य';
    }
    return gender;
  };

  const getAreaText = (area) => {
    if (!area) return t('common.notSpecified', 'Not Specified');
    if (language === 'hi') {
      return area === 'rural' ? 'ग्रामीण क्षेत्र' : 'शहरी क्षेत्र';
    }
    return `${area.charAt(0).toUpperCase() + area.slice(1)} Area`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div>
        <h2 className="text-lg font-bold text-navy-900">{t('eligibility.reviewTitle', 'Review Your Profile Details')}</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('eligibility.reviewSubtitle', 'Please review the details below before running the eligibility matching engine. You can edit any section instantly.')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Section 1: Demographics */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                {t('eligibility.demographicsLocation', 'Demographics & Location')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t('common.edit', 'Edit')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.ageLabel', 'Age')}:</span>
              <span className="font-bold text-navy-900">{formData.age} {t('common.years', 'Years')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.genderLabel', 'Gender')}:</span>
              <span className="font-semibold text-slate-700 capitalize">
                {getGenderText(formData.gender)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.stateLabel', 'State / UT')}:</span>
              <span className="font-semibold text-slate-700">{formData.state}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.habitation', 'Habitation:')}</span>
              <span className="font-semibold text-slate-700">
                {getAreaText(formData.areaType)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Livelihood & Income */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                {t('eligibility.livelihoodIncome', 'Livelihood & Income')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t('common.edit', 'Edit')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.occupationLabel', 'Occupation')}:</span>
              <span className="font-bold text-navy-900">{occObj ? occObj.label : formData.occupation}</span>
              {formData.farmerLandholding && (
                <span className="block text-[11px] text-amber-700 capitalize font-medium">
                  {t('eligibility.landholding', 'Landholding:')} {formData.farmerLandholding.replace('_', ' ')}
                </span>
              )}
              {formData.artisanTrade && (
                <span className="block text-[11px] text-teal-700 font-medium">
                  {t('eligibility.trade', 'Trade:')} {formData.artisanTrade}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.annualIncomeLabel', 'Annual Household Income')}:</span>
              <span className="font-bold text-emerald-700">{formatIncome(formData.annualIncome)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Household Factors */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                {t('eligibility.householdCharacteristics', 'Household & Family Characteristics')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t('common.edit', 'Edit')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.socialCategory', 'Social Category:')}</span>
              <span className="font-semibold text-slate-700 uppercase">
                {formData.socialCategory || t('common.notDisclosed', 'Not Disclosed')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.rationCard', 'Ration Card:')}</span>
              <span className="font-semibold text-slate-700 uppercase">
                {formData.rationCard || t('common.notSpecified', 'Not Specified')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.housingType', 'Housing Type:')}</span>
              <span className="font-semibold text-slate-700 capitalize">
                {formData.housingType || t('common.notSpecified', 'Not Specified')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('eligibility.girlChild', 'Girl Child (≤ 10 yrs):')}</span>
              <span className="font-semibold text-slate-700 capitalize">
                {formData.hasGirlChildUnder10 === 'yes' ? t('common.yes', 'Yes') : formData.hasGirlChildUnder10 === 'no' ? t('common.no', 'No') : t('common.notSpecified', 'Not Specified')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Local Storage Preference Toggle */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label htmlFor="save-profile-checkbox" className="text-xs font-bold text-teal-950 flex items-center gap-2 cursor-pointer">
            <input
              id="save-profile-checkbox"
              type="checkbox"
              checked={saveToStorage}
              onChange={(e) => setSaveToStorage(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-teal-300 focus:ring-teal-500"
            />
            <span>{t('eligibility.rememberProfile', 'Remember profile on this device (Local Storage)')}</span>
          </label>
          <p className="text-[11px] text-teal-900/80 pl-6 leading-relaxed">
            {t('eligibility.rememberProfileDesc', 'Saves your non-sensitive demographic answers in this browser so you can revisit recommendations or update criteria later. You can clear this anytime.')}
          </p>
        </div>
      </div>
    </div>
  );
}
