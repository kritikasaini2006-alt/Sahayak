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
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useTranslation } from '../context/LanguageContext';

export default function AboutPage() {
  const { t, language } = useTranslation();
  useDocumentTitle(t('about.pageTitle'));

  const faqs = language === 'hi' ? [
    {
      q: 'क्या सहायक AI भारत सरकार का आधिकारिक पोर्टल है?',
      a: 'नहीं। सहायक AI एक स्वतंत्र, गैर-सरकारी नागरिक-तकनीकी (Civic-Tech) पहल है। हम भारत सरकार या किसी भी राज्य सरकार से संबद्ध या अधिकृत नहीं हैं। हमारा मंच सार्वजनिक रूप से उपलब्ध नीतियों और नियमों को सरल भाषा में नागरिकों तक पहुँचाता है।',
    },
    {
      q: 'क्या मैं सहायक AI पर सीधे योजना के लिए आवेदन जमा कर सकता हूँ?',
      a: 'नहीं। पूर्ण पारदर्शिता सुनिश्चित करने और किसी भी धोखाधड़ी को रोकने के लिए, आवेदन केवल आधिकारिक सरकारी पोर्टलों (जैसे pmkisan.gov.in, pmjay.gov.in) या अधिकृत जन सेवा केंद्रों (CSCs) और जिला कार्यालयों के माध्यम से ही जमा किए जाने चाहिए।',
    },
    {
      q: 'क्या सहायक AI योजनाओं की जानकारी के लिए कोई शुल्क लेता है?',
      a: 'कभी नहीं। सहायक AI पूरी तरह से निःशुल्क है। हम कोई शुल्क नहीं लेते, न ही कोई सशुल्क सदस्यता मांगते हैं।',
    },
    {
      q: 'योजनाओं का डेटा कहाँ से आता है?',
      a: 'सभी योजना पात्रता शर्तें, वित्तीय लाभ और दस्तावेज़ चेकलिस्ट आधिकारिक सार्वजनिक स्रोतों, भारत के राष्ट्रीय पोर्टल (india.gov.in), myScheme (myscheme.gov.in), और मंत्रालयों के आधिकारिक राजपत्रों से लिए गए हैं।',
    },
  ] : [
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
    <div className="py-6 sm:py-8 space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Badge variant="teal">{t('about.badge')}</Badge>
          <span className="text-xs text-slate-500 font-medium">{t('about.openAccess')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          {t('about.pageTitle')}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
          {t('about.pageSubtitle')}
        </p>
      </div>

      {/* Prominent Non-Affiliation Declaration */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 sm:p-6 space-y-2.5">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{t('about.noticeTitle')}</span>
        </div>
        <p className="text-xs md:text-sm text-amber-950/90 leading-relaxed">
          {t('about.noticeText')}
        </p>
      </div>

      {/* The Problem & Our Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">{t('about.challengeTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('about.challengeText')}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">{t('about.missionTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('about.missionText')}
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-navy-900">{t('about.principlesTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {t('about.p1Title')}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('about.p1Desc')}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {t('about.p2Title')}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('about.p2Desc')}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-teal-600 font-bold text-sm flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4" />
              {t('about.p3Title')}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('about.p3Desc')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          {t('about.faqsTitle')}
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
        <h3 className="font-bold text-navy-900 text-sm">
          {language === 'hi' ? 'महत्वपूर्ण आधिकारिक सरकारी पोर्टल संदर्भ' : 'Key Official Government Portals for Reference'}
        </h3>
        <ul className="text-xs text-slate-600 space-y-2">
          <li>
            • <strong>{language === 'hi' ? 'भारत का राष्ट्रीय पोर्टल:' : 'National Portal of India:'}</strong>{' '}
            <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              india.gov.in
            </a>
          </li>
          <li>
            • <strong>{language === 'hi' ? 'myScheme केंद्रीय कल्याण पोर्टल:' : 'myScheme Central Welfare Portal:'}</strong>{' '}
            <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              myscheme.gov.in
            </a>
          </li>
          <li>
            • <strong>{language === 'hi' ? 'प्रत्यक्ष लाभ अंतरण (DBT) भारत:' : 'Direct Benefit Transfer (DBT) Bharat:'}</strong>{' '}
            <a href="https://dbtbharat.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              dbtbharat.gov.in
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

