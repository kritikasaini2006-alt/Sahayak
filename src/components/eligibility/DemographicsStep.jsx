import React, { useState } from 'react';
import { INDIAN_STATES_AND_UTS } from '../../data/statesAndDistricts';
import { HelpCircle, AlertCircle, MapPin, Calendar, User } from 'lucide-react';

export default function DemographicsStep({ formData, updateField, errors }) {
  const [showAgeTooltip, setShowAgeTooltip] = useState(false);
  const [showAreaTooltip, setShowAreaTooltip] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Intro Header */}
      <div>
        <h2 className="text-lg font-bold text-navy-900">Demographics & State Residency</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Basic demographic details ensure we evaluate schemes applicable to your age and geographical jurisdiction.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Age Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="citizen-age" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Applicant Age <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAgeTooltip(!showAgeTooltip)}
              className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
              aria-expanded={showAgeTooltip}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why ask?</span>
            </button>
          </div>

          {showAgeTooltip && (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
              Schemes have distinct age criteria (e.g., senior pensions at 60+, girl child savings under 10, adult credit at 18+).
            </div>
          )}

          <div className="relative">
            <input
              id="citizen-age"
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 35"
              value={formData.age}
              onChange={(e) => updateField('age', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-slate-50/50 ${
                errors.age
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/20'
                  : 'border-slate-300 focus:ring-teal-500 focus:border-teal-500'
              }`}
              aria-invalid={!!errors.age}
              aria-describedby={errors.age ? 'age-error' : undefined}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              Years
            </span>
          </div>

          {errors.age && (
            <p id="age-error" className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.age}
            </p>
          )}
        </div>

        {/* Gender Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Gender (Optional)
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'female', label: 'Female' },
              { id: 'male', label: 'Male' },
              { id: 'transgender', label: 'Transgender' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateField('gender', formData.gender === item.id ? '' : item.id)}
                className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                  formData.gender === item.id
                    ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Selected for schemes prioritizing women or vulnerable genders (e.g. PM Ujjwala).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* State / UT */}
        <div className="space-y-1.5">
          <label htmlFor="citizen-state" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            State / Union Territory <span className="text-red-500">*</span>
          </label>

          <select
            id="citizen-state"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-slate-50/50 ${
              errors.state
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-slate-300 focus:ring-teal-500 focus:border-teal-500'
            }`}
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? 'state-error' : undefined}
          >
            <option value="">-- Select Your State / UT --</option>
            {INDIAN_STATES_AND_UTS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {errors.state && (
            <p id="state-error" className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.state}
            </p>
          )}
        </div>

        {/* Habitation Area (Rural vs Urban) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Area of Residence <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAreaTooltip(!showAreaTooltip)}
              className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
              aria-expanded={showAreaTooltip}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why ask?</span>
            </button>
          </div>

          {showAreaTooltip && (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
              Schemes like PMAY-Gramin specifically fund rural houses, while others operate via municipal urban local bodies.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'rural', label: 'Rural (Gram Panchayat)', desc: 'Village or countryside' },
              { id: 'urban', label: 'Urban (Municipality)', desc: 'Town, city, or metro' },
            ].map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => updateField('areaType', area.id)}
                className={`py-2.5 px-3 rounded-lg border text-left transition-all ${
                  formData.areaType === area.id
                    ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs">{area.label}</div>
                <div className={`text-[10px] mt-0.5 ${formData.areaType === area.id ? 'text-teal-200' : 'text-slate-400'}`}>
                  {area.desc}
                </div>
              </button>
            ))}
          </div>

          {errors.areaType && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.areaType}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

