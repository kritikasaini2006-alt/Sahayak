import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, Users, Home, Award, Sparkles } from 'lucide-react';

export default function HouseholdStep({ formData, updateField }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const toggleTooltip = (name) => {
    setActiveTooltip(activeTooltip === name ? null : name);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Household & Vulnerability Factors</h2>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            All Fields Optional
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          These optional details help identify specialized schemes (such as girl child savings, housing grants, or food security benefits). You may skip any question.
        </p>
      </div>

      {/* Sensitive Fields Privacy Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          We do not collect names, phone numbers, Aadhaar numbers, or bank IDs. All answers remain securely in your local browser session.
        </p>
      </div>

      {/* Social Category (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            Social Category (Optional)
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('category')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'category'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why ask?</span>
          </button>
        </div>

        {activeTooltip === 'category' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            Specific central and state welfare initiatives (e.g. PM Ujjwala, Stand-Up India) provide designated allocations or fee waivers for SC, ST, or OBC applicants.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'general', label: 'General' },
            { id: 'obc', label: 'OBC' },
            { id: 'sc', label: 'Scheduled Caste (SC)' },
            { id: 'st', label: 'Scheduled Tribe (ST)' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateField('socialCategory', formData.socialCategory === cat.id ? '' : cat.id)}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                formData.socialCategory === cat.id
                  ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ration Card Status (Optional) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Ration Card / Food Security Status (Optional)
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('ration')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'ration'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why ask?</span>
          </button>
        </div>

        {activeTooltip === 'ration' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            National Food Security Act (NFSA) ration cards (AAY / BPL) serve as standard proxies for automated enrollment in Ayushman Bharat and old age social security pensions.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'aay', title: 'Antyodaya (AAY)', desc: 'Poorest of the poor card' },
            { id: 'bpl', title: 'Priority Household (BPL / PHH)', desc: 'Below poverty line card' },
            { id: 'apl', title: 'General / APL / None', desc: 'Above poverty line or no card' },
          ].map((rc) => (
            <button
              key={rc.id}
              type="button"
              onClick={() => updateField('rationCard', formData.rationCard === rc.id ? '' : rc.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.rationCard === rc.id
                  ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-navy-900">{rc.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{rc.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Housing Type (Optional) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            Current Housing Condition (Optional)
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('housing')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'housing'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why ask?</span>
          </button>
        </div>

        {activeTooltip === 'housing' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            Pradhan Mantri Awas Yojana (PMAY) requires that the beneficiary does not own a pucca house in their name anywhere in India.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'kutcha', title: 'Kutcha / Dilapidated', desc: 'Mud, thatch, unbaked brick' },
            { id: 'homeless', title: 'Homeless / No House', desc: 'Living in temporary shelter' },
            { id: 'pucca', title: 'Pucca House', desc: 'Permanent concrete / brick house' },
          ].map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => updateField('housingType', formData.housingType === h.id ? '' : h.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.housingType === h.id
                  ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-navy-900">{h.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{h.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Family Situations */}
      <div className="pt-2 border-t border-slate-200 space-y-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Special Family Situations
        </span>

        {/* Girl Child under 10 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-navy-900 block">
              Does your family have a girl child aged 10 or younger?
            </span>
            <span className="text-[11px] text-slate-500">
              Crucial for Sukanya Samriddhi Yojana (high-interest tax-free child education savings).
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {['yes', 'no'].map((ans) => (
              <button
                key={ans}
                type="button"
                onClick={() => updateField('hasGirlChildUnder10', formData.hasGirlChildUnder10 === ans ? '' : ans)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                  formData.hasGirlChildUnder10 === ans
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>

        {/* Disability / Divyangjan */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-navy-900 block">
              Is any household member a person with disability (Divyangjan)?
            </span>
            <span className="text-[11px] text-slate-500">
              Relevant for disability pensions under NSAP and assistive equipment grants.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {['yes', 'no'].map((ans) => (
              <button
                key={ans}
                type="button"
                onClick={() => updateField('hasDisability', formData.hasDisability === ans ? '' : ans)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                  formData.hasDisability === ans
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

