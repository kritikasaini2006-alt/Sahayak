import React, { useState } from 'react';
import { OCCUPATION_OPTIONS } from '../../data/statesAndDistricts';
import { Briefcase, IndianRupee, HelpCircle, AlertCircle, Wrench, Wheat } from 'lucide-react';

export default function LivelihoodStep({ formData, updateField, errors }) {
  const [showIncomeTooltip, setShowIncomeTooltip] = useState(false);

  const selectedOccupation = OCCUPATION_OPTIONS.find((o) => o.id === formData.occupation);

  const quickIncomePresets = [
    { label: '₹60,000', value: 60000 },
    { label: '₹1,20,000', value: 120000 },
    { label: '₹2,50,000', value: 250000 },
    { label: '₹5,00,000', value: 500000 },
    { label: '₹10,00,000+', value: 1000000 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div>
        <h2 className="text-lg font-bold text-navy-900">Livelihood, Occupation & Income</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Welfare programs are closely aligned with your source of livelihood, family profession, and economic capacity.
        </p>
      </div>

      {/* Primary Occupation Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          Primary Livelihood / Occupation <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1">
          {OCCUPATION_OPTIONS.map((occ) => {
            const isSelected = formData.occupation === occ.id;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => {
                  updateField('occupation', occ.id);
                  // Reset contextual subfields if occupation changes
                  if (occ.id !== 'farmer') updateField('farmerLandholding', '');
                  if (occ.id !== 'artisan') updateField('artisanTrade', '');
                }}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-navy-900">{occ.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {occ.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {errors.occupation && (
          <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.occupation}
          </p>
        )}
      </div>

      {/* Conditional Sub-Question: Farmer Landholding */}
      {formData.occupation === 'farmer' && (
        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2 animate-fadeIn">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Wheat className="w-4 h-4 text-amber-700" />
            Agricultural Landholding Category (Crucial for PM-KISAN)
          </label>
          <p className="text-xs text-amber-900/80">
            PM-KISAN prioritizes small & marginal farmers holding cultivable land in their names.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {[
              { id: 'small_marginal', title: 'Small / Marginal', desc: '< 2 Hectares (< 5 Acres)' },
              { id: 'large', title: 'Large Landholding', desc: '> 2 Hectares' },
              { id: 'landless_tenant', title: 'Landless / Tenant', desc: 'Leased or sharecropped land' },
            ].map((lh) => (
              <button
                key={lh.id}
                type="button"
                onClick={() => updateField('farmerLandholding', lh.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  formData.farmerLandholding === lh.id
                    ? 'bg-amber-100 border-amber-600 text-amber-950 font-bold shadow-sm'
                    : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50/40'
                }`}
              >
                <div className="text-xs">{lh.title}</div>
                <div className="text-[10px] text-slate-500 font-normal">{lh.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Sub-Question: Artisan Traditional Trade */}
      {formData.occupation === 'artisan' && selectedOccupation && (
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2 animate-fadeIn">
          <label className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-teal-700" />
            Specific Traditional Trade (Crucial for PM Vishwakarma)
          </label>
          <p className="text-xs text-teal-900/80">
            PM Vishwakarma provides ₹15,000 toolkit grants and collateral-free credit for 18 designated trade categories.
          </p>
          <select
            value={formData.artisanTrade}
            onChange={(e) => updateField('artisanTrade', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-teal-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="">-- Select Your Specific Craft / Trade --</option>
            {selectedOccupation.subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Annual Household Income */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label htmlFor="annual-income" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
            Annual Household Income <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowIncomeTooltip(!showIncomeTooltip)}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={showIncomeTooltip}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why ask?</span>
          </button>
        </div>

        {showIncomeTooltip && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            Welfare schemes use household income caps to determine subsidy eligibility, loan brackets, and poverty exclusions.
          </div>
        )}

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
            ₹
          </span>
          <input
            id="annual-income"
            type="number"
            min="0"
            step="5000"
            placeholder="e.g. 120000"
            value={formData.annualIncome}
            onChange={(e) => updateField('annualIncome', e.target.value)}
            className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-slate-50/50 ${
              errors.annualIncome
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-teal-500 focus:border-teal-500'
            }`}
            aria-invalid={!!errors.annualIncome}
            aria-describedby={errors.annualIncome ? 'income-error' : undefined}
          />
        </div>

        {/* Quick Income Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400">Quick select:</span>
          {quickIncomePresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateField('annualIncome', preset.value)}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {errors.annualIncome && (
          <p id="income-error" className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.annualIncome}
          </p>
        )}
      </div>
    </div>
  );
}

