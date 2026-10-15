import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import SchemeCard from '../components/common/SchemeCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useTranslation } from '../context/LanguageContext';

export default function HomePage() {
  const { t, isHindi } = useTranslation();
  useDocumentTitle(isHindi ? 'सरकारी योजनाएं खोजें' : 'Discover Indian Welfare Schemes');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/schemes?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/schemes');
    }
  };

  const featuredSchemes = MOCK_SCHEMES.slice(0, 3);

  return (
    <div className="space-y-10 md:space-y-14 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-navy-900 via-navy-800 to-navy-950 text-white overflow-hidden py-10 md:py-16">
        {/* Subtle geometric civic pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 bg-navy-700/80 border border-teal-500/40 text-teal-300 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>{t('brand.tagline')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {t('home.heroTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200">
                {t('home.heroTitleHighlight')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {t('home.heroSubtitle')}
            </p>

            {/* Quick Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 flex flex-col sm:flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl max-w-2xl mx-auto"
            >
              <div className="relative flex-1 w-full flex items-center">
                <Search className="w-5 h-5 text-slate-300 absolute left-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                variant="teal"
                size="md"
                className="w-full sm:w-auto font-semibold px-6"
              >
                {t('home.findSchemes')}
              </Button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 pt-2">
              <span className="text-slate-400">{t('home.popularSearches')}</span>
              <button
                onClick={() => navigate('/schemes?category=Agriculture%20%26%20Rural')}
                className="bg-navy-800/90 hover:bg-navy-700 border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors"
              >
                PM-KISAN
              </button>
              <button
                onClick={() => navigate('/schemes?category=Health%20%26%20Family%20Welfare')}
                className="bg-navy-800/90 hover:bg-navy-700 border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors"
              >
                Ayushman Bharat
              </button>
              <button
                onClick={() => navigate('/schemes?category=Housing%20%26%20Shelter')}
                className="bg-navy-800/90 hover:bg-navy-700 border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors"
              >
                PMAY Housing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Non-Affiliation Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-civic-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-base md:text-lg">
                {t('home.trustCardTitle')}
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed">
                {t('home.trustCardSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link to="/about" className="w-full md:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                {t('home.learnMission')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="teal">{t('home.howItWorksBadge')}</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
            {t('home.howItWorksTitle')}
          </h2>
          <p className="text-slate-600 text-sm">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-2.5 relative hover:border-teal-500 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 font-bold flex items-center justify-center text-sm border border-navy-100">
              01
            </div>
            <h3 className="font-bold text-navy-900 text-base">{t('home.step1Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.step1Desc')}
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-2.5 relative hover:border-teal-500 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-100">
              02
            </div>
            <h3 className="font-bold text-navy-900 text-base">{t('home.step2Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.step2Desc')}
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-2.5 relative hover:border-teal-500 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-100">
              03
            </div>
            <h3 className="font-bold text-navy-900 text-base">{t('home.step3Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.step3Desc')}
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-2.5 relative hover:border-teal-500 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-900 font-bold flex items-center justify-center text-sm border border-amber-100">
              04
            </div>
            <h3 className="font-bold text-navy-900 text-base">{t('home.step4Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.step4Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <Badge variant="primary">{t('home.popularSchemesBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1.5">
              {t('home.popularSchemesTitle')}
            </h2>
            <p className="text-slate-600 text-sm mt-0.5">
              {t('home.popularSchemesSubtitle')}
            </p>
          </div>

          <Link to="/schemes">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              {t('home.exploreAllSchemes')}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-teal-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <Badge variant="teal" className="bg-teal-900/60 text-teal-200 border-teal-500/40">
              {t('home.ctaBadge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/assistant">
                <Button variant="teal" size="md" icon={Sparkles}>
                  {t('home.ctaStartChat')}
                </Button>
              </Link>
              <Link to="/eligibility">
                <Button variant="outline" size="md" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  {t('home.ctaQuestionnaire')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
