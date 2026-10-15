import React from 'react';
import { UserCheck, Edit2, Trash2, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import { useTranslation } from '../../context/LanguageContext';

export default function ProfileSummaryBanner({ profile, onEdit, onClear, onEvaluate }) {
  const { t } = useTranslation();
  if (!profile || !profile.age || !profile.state) return null;

  return (
    <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-navy-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl shrink-0 mt-0.5 border border-teal-500/30">
          <UserCheck className="w-5 h-5 text-teal-400" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
              {t('eligibility.storedCitizenProfile', 'Stored Citizen Profile')}
            </span>
            <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">
              {t('eligibility.localBrowser', 'Local Browser')}
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            {profile.age} {t('common.yrs', 'yrs')} • {profile.occupation?.replace('_', ' ')} • {profile.state} ({profile.areaType})
          </p>
          <p className="text-xs text-slate-300">
            {t('eligibility.householdAnnualIncome', { amount: Number(profile.annualIncome || 0).toLocaleString('en-IN') })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
        {onEvaluate && (
          <Button
            variant="teal"
            size="sm"
            onClick={onEvaluate}
            icon={ArrowRight}
            iconPosition="right"
            className="flex-1 md:flex-none font-semibold"
          >
            {t('nav.checkEligibility', 'Check Eligibility')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          icon={Edit2}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          {t('common.edit', 'Edit')}
        </Button>
        <button
          onClick={onClear}
          title={t('eligibility.resetProfile', 'Clear Stored Profile')}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
          aria-label={t('eligibility.resetProfile', 'Clear Stored Profile')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

