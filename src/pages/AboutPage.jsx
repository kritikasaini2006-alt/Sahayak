import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  Users,
  Target,
  HelpCircle,
  CheckCircle,
  HeartHandshake,
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function AboutPage() {
  const faqs = [
    {
      q: 'Is Sahayak AI an official portal of the Government of India?',
      a: 'No. Sahayak AI is an independent, non-governmental civic-tech initiative. We are not affiliated with, authorized by, or endorsed by the Government of India or any state government. Our platform synthesizes publicly available policy guidelines to help citizens understand and locate benefits.',
    },
    {
      q: 'Can I directly submit my scheme application on Sahayak AI?',
      a: 'No. To ensure absolute transparency and prevent fraud, applications must be submitted directly through official government portals (such as pmkisan.gov.in, pmjay.gov.in) or physically at authorized Common Service Centres (CSCs) and district offices. We provide direct links to verified official portals.',
    },
    {
      q: 'Does Sahayak AI charge any fee for discovering schemes?',
      a: 'Never. Sahayak AI is completely free. We do not charge fees, require paid subscriptions, or sell citizen information.',
    },
    {
      q: 'Where does the scheme data come from?',
      a: 'All scheme criteria, financial benefits, and documentation checklists are indexed directly from official public sources, including the National Portal of India (india.gov.in), myScheme (myscheme.gov.in), and official central/state ministry notifications.',
    },
  ];

  return (
    <div className="py-8 md:py-16 space-y-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Badge variant="teal">Civic Technology Initiative</Badge>
          <span className="text-xs text-slate-500 font-medium">Open Welfare Access</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight">
          About Sahayak AI
        </h1>
        <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
          Bridging the gap between India's vast public welfare programs and the citizens who need them most through transparent, accessible technology.
        </p>
      </div>

      {/* Prominent Non-Affiliation Declaration */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 md:p-8 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>Official Transparency & Non-Affiliation Notice</span>
        </div>
        <p className="text-xs md:text-sm text-amber-950/90 leading-relaxed">
          Sahayak AI is an educational and technological demonstration project. It is <strong>NOT</strong> an official government agency, portal, or representative. We do not claim any partnership with the Government of India or any state government. Official scheme regulations, beneficiary selections, and DBT disbursements remain the exclusive purview of the respective administrative ministries.
        </p>
      </div>

      {/* The Problem & Our Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-navy-900">The Challenge</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            India runs hundreds of central and state welfare initiatives allocating billions of rupees. However, marginalized households, rural families, and informal laborers frequently miss out due to complex jargon, fragmented portals, lack of document clarity, or reliance on unauthorized middlemen.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-navy-900">Our Civic Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sahayak AI reimagines welfare discovery. We translate multi-page government gazettes into clear eligibility questions, document readiness checklists, and conversational guidance, empowering citizens to apply with confidence on official platforms.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-navy-900">Our Core Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Grounded in Fact
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every scheme rule and criterion is sourced directly from publicly accessible government notifications and gazettes.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Zero Middlemen
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct guidance pointing to official government offices, Common Service Centres (CSCs), and authenticated `.gov.in` sites.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4" />
              Citizen Privacy
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Preliminary screening requires no account or sensitive personal data storage.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <h3 className="font-bold text-navy-900 text-sm sm:text-base">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Directory References */}
      <div className="bg-slate-100 rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-navy-900 text-sm">Key Official Government Portals for Reference</h3>
        <ul className="text-xs text-slate-600 space-y-2">
          <li>
            • <strong>National Portal of India:</strong>{' '}
            <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              india.gov.in
            </a>
          </li>
          <li>
            • <strong>myScheme Central Welfare Portal:</strong>{' '}
            <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              myscheme.gov.in
            </a>
          </li>
          <li>
            • <strong>Direct Benefit Transfer (DBT) Bharat:</strong>{' '}
            <a href="https://dbtbharat.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              dbtbharat.gov.in
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

