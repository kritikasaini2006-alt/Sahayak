import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bot,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Compass,
  CheckCircle2,
  ChevronRight,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import SchemeCard from '../components/common/SchemeCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AshokaChakra from '../components/common/AshokaChakra';
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
    <div className="space-y-12 md:space-y-16 pb-16">
      {/* Hero Section: Two-Column Civic-Tech Layout */}
      <section className="relative bg-gradient-to-b from-[#FDFBF7] via-[#FAF7F0] to-[#F3EDE2] text-slate-800 border-b border-stone-200/80 overflow-hidden py-12 md:py-16 lg:py-20">
        {/* Subtle geometric civic pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#0f223d_1.2px,transparent_1.2px)] [background-size:28px_28px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Actions, Search & Shortcuts */}
            <div className="lg:col-span-7 space-y-6">
              {/* Small understated civic-tech label */}
              <div className="inline-flex items-center gap-2 bg-stone-100/90 border border-stone-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-2xs">
                <Landmark className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('brand.tagline')}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 tracking-tight leading-[1.18]">
                {t('home.heroTitle')}{' '}
                <span className="text-teal-700 block sm:inline">
                  {t('home.heroTitleHighlight')}
                </span>
              </h1>

              {/* Concise Explanatory Paragraph */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {t('home.heroSubtitle')}
              </p>

              {/* Primary Dual Actions: Find My Schemes & Check Eligibility */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/schemes"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 shrink-0 cursor-pointer"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{t('home.findMySchemes')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
                <Link
                  to="/eligibility"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-stone-50 active:bg-stone-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shrink-0 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>{t('home.checkEligibilityBtn')}</span>
                </Link>
              </div>

              {/* Search Field & Button */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl border border-stone-300 shadow-sm max-w-xl"
              >
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto font-semibold px-6 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 shrink-0 cursor-pointer text-sm"
                >
                  {t('home.findSchemes')}
                </button>
              </form>

              {/* Popular Search Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                <span className="font-semibold text-slate-700">{t('home.popularSearches')}</span>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?q=PM-KISAN')}
                  className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-stone-200 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  PM-KISAN
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?q=Ayushman')}
                  className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-stone-200 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  Ayushman Bharat
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?q=PMAY')}
                  className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-stone-200 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  PMAY Housing
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?q=Sukanya')}
                  className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-stone-200 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  Sukanya Samriddhi
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?q=Mudra')}
                  className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-stone-200 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  Mudra Loans
                </button>
              </div>
            </div>

            {/* Right Column: "Your Next Steps" Card with Animated Ashoka Chakra Behind */}
            <div className="lg:col-span-5 relative flex items-center justify-center py-6 sm:py-8 lg:py-6">
              {/* Large Animated Ashoka Chakra Centered Directly Behind Card */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible"
                aria-hidden="true"
              >
                <div className="animate-chakra flex items-center justify-center">
                  <AshokaChakra className="w-[390px] h-[390px] sm:w-[460px] h-[460px] lg:w-[500px] lg:h-[500px] text-[#315D9B] opacity-75 drop-shadow-[0_0_24px_rgba(49,93,155,0.18)]" />
                </div>
              </div>

              {/* Stationary "Your Next Steps" Card in Front */}
              <div className="relative z-10 w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-teal-700" />
                      <span>{t('home.nextStepsTitle')}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('home.nextStepsSubtitle')}
                    </p>
                  </div>
                  <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('brand.badge')}
                  </span>
                </div>

                {/* 4 Working Steps with Live Links */}
                <div className="space-y-2.5">
                  {/* Step 1: Check Eligibility (Active Step) */}
                  <Link
                    to="/eligibility"
                    className="group flex items-start gap-3 p-3 rounded-xl bg-teal-50/70 hover:bg-teal-50 border-2 border-teal-700 shadow-xs transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-0.5">
                      01
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-teal-950 group-hover:text-teal-800 transition-colors">
                          {t('home.stepEligibility')}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-700 text-white px-2 py-0.5 rounded-full shrink-0">
                          {t('home.activeStep')}
                        </span>
                      </div>
                      <p className="text-xs text-teal-900/80 mt-0.5 leading-snug">
                        {t('home.stepEligibilityDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-700 shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Step 2: View Required Documents */}
                  <Link
                    to="/schemes"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-stone-50 border border-stone-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      02
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {t('home.stepDocuments')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {t('home.stepDocumentsDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Step 3: Get Application Guidance */}
                  <Link
                    to="/assistant"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-stone-50 border border-stone-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      03
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {t('home.stepGuidance')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {t('home.stepGuidanceDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Step 4: Track Your Application */}
                  <Link
                    to="/applications"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-stone-50 border border-stone-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      04
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {t('home.stepTrack')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {t('home.stepTrackDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Non-Affiliation Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base md:text-lg">
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

      {/* 3-Step Beginner Guide: How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="teal">{t('home.howItWorksBadge')}</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('home.howItWorksTitle')}
          </h2>
          <p className="text-slate-600 text-sm">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Step 1: Find schemes */}
          <Link
            to="/schemes"
            className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-teal-600 hover:shadow-md transition-all space-y-3.5 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                {t('home.beginnerStep1Title')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('home.beginnerStep1Desc')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
              <span>{t('home.findMySchemes')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Step 2: Check eligibility */}
          <Link
            to="/eligibility"
            className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-teal-600 hover:shadow-md transition-all space-y-3.5 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                {t('home.beginnerStep2Title')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('home.beginnerStep2Desc')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
              <span>{t('home.checkEligibilityBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Step 3: Follow application guidance */}
          <Link
            to="/assistant"
            className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-teal-600 hover:shadow-md transition-all space-y-3.5 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                {t('home.beginnerStep3Title')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('home.beginnerStep3Desc')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
              <span>{t('home.stepGuidance')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <Badge variant="teal">{t('home.popularSchemesBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
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
        <div className="bg-[#0f223d] rounded-3xl p-6 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-navy-800">
          <div className="max-w-2xl space-y-4 relative z-10">
            <Badge variant="amber" className="bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold">
              {t('home.ctaBadge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/assistant">
                <Button variant="primary" size="md" icon={Bot}>
                  {t('home.ctaStartChat')}
                </Button>
              </Link>
              <Link to="/eligibility">
                <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
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
