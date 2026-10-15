import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, Users, Home, Award, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export default function HouseholdStep({ formData, updateField }) {
  const { t, language } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const toggleTooltip = (name) => {
    setActiveTooltip(activeTooltip === name ? null : name);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">
            {language === 'hi' ? 'पारिवारिक एवं सामाजिक स्थिति' : 'Household & Vulnerability Factors'}
          </h2>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            {language === 'hi' ? 'सभी फ़ील्ड वैकल्पिक' : 'All Fields Optional'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'hi'
            ? 'ये वैकल्पिक विवरण विशेष योजनाओं (जैसे कन्या बचत, आवास अनुदान, या खाद्य सुरक्षा लाभ) की पहचान करने में मदद करते हैं।'
            : 'These optional details help identify specialized schemes (such as girl child savings, housing grants, or food security benefits). You may skip any question.'}
        </p>
      </div>

      {/* Sensitive Fields Privacy Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          {language === 'hi'
            ? 'हम नाम, फोन नंबर, आधार नंबर या बैंक आईडी एकत्र नहीं करते हैं। सभी उत्तर केवल आपके स्थानीय ब्राउज़र सत्र में सुरक्षित रहते हैं।'
            : 'We do not collect names, phone numbers, Aadhaar numbers, or bank IDs. All answers remain securely in your local browser session.'}
        </p>
      </div>

      {/* Social Category (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            {language === 'hi' ? 'सामाजिक श्रेणी (वैकल्पिक)' : 'Social Category (Optional)'}
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('category')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'category'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'क्यों पूछा गया?' : 'Why ask?'}</span>
          </button>
        </div>

        {activeTooltip === 'category' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            {language === 'hi'
              ? 'विशिष्ट केंद्रीय और राज्य कल्याणकारी योजनाएं अनुसूचित जाति (SC), अनुसूचित जनजाति (ST) या अन्य पिछड़ा वर्ग (OBC) आवेदकों के लिए विशेष प्रावधान प्रदान करती हैं।'
              : 'Specific central and state welfare initiatives (e.g. PM Ujjwala, Stand-Up India) provide designated allocations or fee waivers for SC, ST, or OBC applicants.'}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'general', label: language === 'hi' ? 'सामान्य' : 'General' },
            { id: 'obc', label: language === 'hi' ? 'अन्य पिछड़ा वर्ग (OBC)' : 'OBC' },
            { id: 'sc', label: language === 'hi' ? 'अनुसूचित जाति (SC)' : 'Scheduled Caste (SC)' },
            { id: 'st', label: language === 'hi' ? 'अनुसूचित जनजाति (ST)' : 'Scheduled Tribe (ST)' },
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
            {language === 'hi' ? 'राशन कार्ड / खाद्य सुरक्षा स्थिति' : 'Ration Card / Food Security Status (Optional)'}
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('ration')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'ration'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'क्यों पूछा गया?' : 'Why ask?'}</span>
          </button>
        </div>

        {activeTooltip === 'ration' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            {language === 'hi'
              ? 'राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA) राशन कार्ड (AAY / BPL) आयुष्मान भारत और सामाजिक सुरक्षा पेंशन में स्वतः नामांकन के लिए मुख्य मानक हैं।'
              : 'National Food Security Act (NFSA) ration cards (AAY / BPL) serve as standard proxies for automated enrollment in Ayushman Bharat and old age social security pensions.'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: 'aay',
              title: language === 'hi' ? 'अंत्योदय (AAY)' : 'Antyodaya (AAY)',
              desc: language === 'hi' ? 'अत्यंत निर्धन परिवार कार्ड' : 'Poorest of the poor card',
            },
            {
              id: 'bpl',
              title: language === 'hi' ? 'प्राथमिकता गृहस्थी (BPL / PHH)' : 'Priority Household (BPL / PHH)',
              desc: language === 'hi' ? 'गरीबी रेखा से नीचे का कार्ड' : 'Below poverty line card',
            },
            {
              id: 'apl',
              title: language === 'hi' ? 'सामान्य / APL / कोई नहीं' : 'General / APL / None',
              desc: language === 'hi' ? 'गरीबी रेखा से ऊपर या कोई कार्ड नहीं' : 'Above poverty line or no card',
            },
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
            {language === 'hi' ? 'आवास की वर्तमान स्थिति' : 'Current Housing Condition (Optional)'}
          </label>
          <button
            type="button"
            onClick={() => toggleTooltip('housing')}
            className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 focus:outline-none"
            aria-expanded={activeTooltip === 'housing'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'क्यों पूछा गया?' : 'Why ask?'}</span>
          </button>
        </div>

        {activeTooltip === 'housing' && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 animate-fadeIn">
            {language === 'hi'
              ? 'प्रधानमंत्री आवास योजना (PMAY) के अनुसार लाभार्थी के नाम पर भारत में कहीं भी पक्का मकान नहीं होना चाहिए।'
              : 'Pradhan Mantri Awas Yojana (PMAY) requires that the beneficiary does not own a pucca house in their name anywhere in India.'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: 'kutcha',
              title: language === 'hi' ? 'कच्चा मकान' : 'Kutcha / Dilapidated',
              desc: language === 'hi' ? 'मिट्टी, घास-फूस या कच्ची ईंट' : 'Mud, thatch, unbaked brick',
            },
            {
              id: 'homeless',
              title: language === 'hi' ? 'बेघर / कोई घर नहीं' : 'Homeless / No House',
              desc: language === 'hi' ? 'अस्थायी आश्रय में निवास' : 'Living in temporary shelter',
            },
            {
              id: 'pucca',
              title: language === 'hi' ? 'पक्का मकान' : 'Pucca House',
              desc: language === 'hi' ? 'कंक्रीट अथवा पक्की ईंटों का मकान' : 'Permanent concrete / brick house',
            },
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
          {language === 'hi' ? 'विशेष पारिवारिक स्थितियां' : 'Special Family Situations'}
        </span>

        {/* Girl Child under 10 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-navy-900 block">
              {language === 'hi'
                ? 'क्या आपके परिवार में 10 वर्ष या उससे कम आयु की बालिका है?'
                : 'Does your family have a girl child aged 10 or younger?'}
            </span>
            <span className="text-[11px] text-slate-500">
              {language === 'hi'
                ? 'सुकन्या समृद्धि योजना (उच्च ब्याज दर कर-मुक्त शिक्षा बचत) के लिए आवश्यक।'
                : 'Crucial for Sukanya Samriddhi Yojana (high-interest tax-free child education savings).'}
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
                {ans === 'yes' ? (language === 'hi' ? 'हाँ' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')}
              </button>
            ))}
          </div>
        </div>

        {/* Disability / Divyangjan */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-navy-900 block">
              {language === 'hi'
                ? 'क्या परिवार का कोई सदस्य दिव्यांग (विकलांग) है?'
                : 'Is any household member a person with disability (Divyangjan)?'}
            </span>
            <span className="text-[11px] text-slate-500">
              {language === 'hi'
                ? 'राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) दिव्यांग पेंशन एवं सहायक उपकरण अनुदान हेतु।'
                : 'Relevant for disability pensions under NSAP and assistive equipment grants.'}
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
                {ans === 'yes' ? (language === 'hi' ? 'हाँ' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

