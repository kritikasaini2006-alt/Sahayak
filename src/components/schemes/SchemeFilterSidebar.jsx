import React from 'react';
import {
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  Users,
  Layers,
  X,
  Check,
} from 'lucide-react';
import {
  SCHEME_CATEGORIES,
  BENEFICIARY_TYPES,
  SCHEME_TYPES,
} from '../../data/mockSchemes';
import { INDIAN_STATES_AND_UTS } from '../../data/statesAndDistricts';
import { useTranslation } from '../../context/LanguageContext';

export default function SchemeFilterSidebar({
  selectedCategory,
  onSelectCategory,
  selectedState,
  onSelectState,
  selectedBeneficiary,
  onSelectBeneficiary,
  selectedSchemeType,
  onSelectSchemeType,
  onlyEligible,
  onToggleOnlyEligible,
  hasActiveProfile,
  onResetFilters,
  totalMatching,
  activeFilterCount,
  isMobileOpen,
  onCloseMobile,
}) {
  const { t, getCategoryText, getBeneficiaryText, getSchemeTypeText, isHindi } = useTranslation();

  const content = (
    <div className="space-y-6">
      {/* Header and Reset */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
            {t('schemes.filterTitle')} {activeFilterCount > 0 && `(${activeFilterCount})`}
          </h3>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 hover:underline focus:outline-none"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t('schemes.clearAll')}</span>
          </button>
        )}
      </div>

      {/* Profile Eligibility Toggle */}
      {hasActiveProfile && (
        <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyEligible}
              onChange={(e) => onToggleOnlyEligible(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-teal-600 border-teal-300 focus:ring-teal-500"
            />
            <div>
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {t('schemes.filterByProfile')}
              </span>
              <span className="text-[11px] text-teal-900/80 block mt-0.5 leading-tight">
                {isHindi
                  ? 'केवल वही योजनाएं देखें जो आपकी नागरिक प्रोफ़ाइल से मेल खाती हैं।'
                  : 'Show only schemes matching your saved citizen profile.'}
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          {t('schemes.categoryFilter')}
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {SCHEME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                selectedCategory === cat
                  ? 'bg-navy-800 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{getCategoryText(cat)}</span>
              {selectedCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Target Beneficiary Filter */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {t('schemes.beneficiaryFilter')}
        </label>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {BENEFICIARY_TYPES.map((b) => (
            <button
              key={b}
              onClick={() => onSelectBeneficiary(b)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                selectedBeneficiary === b
                  ? 'bg-navy-800 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{getBeneficiaryText(b)}</span>
              {selectedBeneficiary === b && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* State / UT Availability */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label htmlFor="state-filter-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {t('schemes.stateFilter')}
        </label>
        <select
          id="state-filter-select"
          value={selectedState}
          onChange={(e) => onSelectState(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        >
          <option value="All India">{isHindi ? 'अखिल भारतीय (All India) / कोई भी राज्य' : 'All India / Any State'}</option>
          {INDIAN_STATES_AND_UTS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Scheme Type Filter */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label htmlFor="scheme-type-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('schemes.schemeTypeFilter')}
        </label>
        <select
          id="scheme-type-select"
          value={selectedSchemeType}
          onChange={(e) => onSelectSchemeType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        >
          {SCHEME_TYPES.map((type) => (
            <option key={type} value={type}>
              {getSchemeTypeText(type)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm h-fit sticky top-24">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-navy-950/60 backdrop-blur-sm flex justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs bg-white h-full p-5 shadow-2xl overflow-y-auto space-y-4 animate-slideLeft">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-navy-900">{t('schemes.filterTitle')}</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {content}

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-teal-700 transition-colors"
              >
                {isHindi ? `फ़िल्टर लागू करें (${totalMatching} योजनाएं)` : `Apply Filters (${totalMatching} Schemes)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
