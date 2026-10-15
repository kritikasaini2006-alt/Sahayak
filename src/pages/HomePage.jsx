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
  FileText,
  Clock,
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
      <section className="relative bg-[#F5EAD9] text-[#445363] border-b border-[#445363]/15 overflow-hidden py-12 md:py-16 lg:py-20">
        {/* Subtle geometric civic pattern background */}
        <div
          className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#445363_1.2px,transparent_1.2px)] [background-size:28px_28px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Search & Shortcuts */}
            <div className="lg:col-span-7 space-y-6">
              {/* Small understated civic-tech label */}
              <div className="inline-flex items-center gap-2 bg-[#E5E8E1] border border-[#445363]/25 text-[#445363] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-2xs">
                <Landmark className="w-3.5 h-3.5 text-[#454F2A]" />
                <span>{t('brand.tagline')}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#445363] tracking-tight leading-[1.18]">
                {t('home.heroTitle')}{' '}
                <span className="text-[#454F2A] block sm:inline">
                  {t('home.heroTitleHighlight')}
                </span>
              </h1>

              {/* Concise Explanatory Paragraph */}
              <p className="text-base sm:text-lg text-[#445363]/85 leading-relaxed max-w-xl">
                {t('home.heroSubtitle')}
              </p>

              {/* Search Field (Soft Cream) & Olive Green Button */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center gap-2.5 bg-[#FAF8F1] p-2 rounded-2xl border border-[#445363]/25 shadow-md max-w-xl"
              >
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="w-5 h-5 text-[#445363]/60 absolute left-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 bg-transparent text-[#445363] placeholder-[#445363]/50 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto font-semibold px-6 py-3 bg-[#454F2A] hover:bg-[#384022] active:bg-[#2c331b] text-[#FAF8F1] rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#454F2A] focus:ring-offset-2 shrink-0"
                >
                  {t('home.findSchemes')}
                </button>
              </form>

              {/* Popular Search Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#445363]/75 pt-1">
                <span className="font-semibold text-[#445363]">{t('home.popularSearches')}</span>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?category=Agriculture%20%26%20Rural')}
                  className="bg-[#FAF8F1] hover:bg-[#E5E8E1] text-[#445363] border border-[#445363]/20 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs"
                >
                  PM-KISAN
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?category=Health%20%26%20Family%20Welfare')}
                  className="bg-[#FAF8F1] hover:bg-[#E5E8E1] text-[#445363] border border-[#445363]/20 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs"
                >
                  Ayushman Bharat
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?category=Housing%20%26%20Shelter')}
                  className="bg-[#FAF8F1] hover:bg-[#E5E8E1] text-[#445363] border border-[#445363]/20 px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs"
                >
                  PMAY Housing
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
                  <AshokaChakra className="w-[390px] h-[390px] sm:w-[460px] sm:h-[460px] lg:w-[500px] lg:h-[500px] text-[#315D9B] drop-shadow-[0_0_24px_rgba(49,93,155,0.22)]" />
                </div>
              </div>

              {/* Stationary "Your Next Steps" Card in Front */}
              <div className="relative z-10 w-full max-w-md bg-[#FAF8F1] border border-[#445363]/20 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#445363]/15">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#445363] flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#454F2A]" />
                      <span>{t('home.nextStepsTitle')}</span>
                    </h3>
                    <p className="text-xs text-[#445363]/70 mt-0.5">
                      {t('home.nextStepsSubtitle')}
                    </p>
                  </div>
                  <span className="bg-[#EDD575]/35 text-[#445363] border border-[#EDD575] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('brand.badge')}
                  </span>
                </div>

                {/* 4 Working Steps */}
                <div className="space-y-2.5">
                  {/* Step 1: Check Eligibility (Active Step) */}
                  <Link
                    to="/eligibility"
                    className="group flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F1] hover:bg-[#E5E8E1] border-2 border-[#454F2A] shadow-xs transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#454F2A] text-[#FAF8F1] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-0.5">
                      01
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-[#445363] group-hover:text-[#454F2A] transition-colors">
                          {t('home.stepEligibility')}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#454F2A] text-[#FAF8F1] px-2 py-0.5 rounded-full shrink-0">
                          {t('home.activeStep')}
                        </span>
                      </div>
                      <p className="text-xs text-[#445363]/75 mt-0.5 leading-snug">
                        {t('home.stepEligibilityDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#454F2A] shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Step 2: View Required Documents */}
                  <Link
                    to="/schemes"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#E5E8E1] border border-[#445363]/15 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#E5E8E1] text-[#445363] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      02
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#445363] group-hover:text-[#454F2A] transition-colors">
                        {t('home.stepDocuments')}
                      </h4>
                      <p className="text-xs text-[#445363]/70 mt-0.5 leading-snug">
                        {t('home.stepDocumentsDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#445363]/40 group-hover:text-[#454F2A] shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Step 3: Get Application Guidance */}
                  <Link
                    to="/assistant"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#E5E8E1] border border-[#445363]/15 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#E5E8E1] text-[#445363] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      03
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#445363] group-hover:text-[#454F2A] transition-colors">
                        {t('home.stepGuidance')}
                      </h4>
                      <p className="text-xs text-[#445363]/70 mt-0.5 leading-snug">
                        {t('home.stepGuidanceDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#445363]/40 group-hover:text-[#454F2A] shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Step 4: Track Your Application */}
                  <Link
                    to="/applications"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#E5E8E1] border border-[#445363]/15 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#E5E8E1] text-[#445363] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      04
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#445363] group-hover:text-[#454F2A] transition-colors">
                        {t('home.stepTrack')}
                      </h4>
                      <p className="text-xs text-[#445363]/70 mt-0.5 leading-snug">
                        {t('home.stepTrackDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#445363]/40 group-hover:text-[#454F2A] shrink-0 self-center group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Non-Affiliation Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-20">
        <div className="bg-[#FAF8F1] rounded-2xl border border-[#445363]/20 p-5 md:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#454F2A]/10 border border-[#454F2A]/30 text-[#454F2A] rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#454F2A]" />
            </div>
            <div>
              <h3 className="font-bold text-[#445363] text-base md:text-lg">
                {t('home.trustCardTitle')}
              </h3>
              <p className="text-[#445363]/80 text-xs md:text-sm mt-1 leading-relaxed">
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
          <Badge variant="olive">{t('home.howItWorksBadge')}</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#445363]">
            {t('home.howItWorksTitle')}
          </h2>
          <p className="text-[#445363]/80 text-sm">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#FAF8F1] p-5 sm:p-6 rounded-2xl border border-[#445363]/20 shadow-sm space-y-2.5 relative hover:border-[#454F2A] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-[#454F2A] text-[#FAF8F1] font-bold flex items-center justify-center text-sm shadow-2xs">
              01
            </div>
            <h3 className="font-bold text-[#445363] text-base">{t('home.step1Title')}</h3>
            <p className="text-xs text-[#445363]/80 leading-relaxed">
              {t('home.step1Desc')}
            </p>
          </div>

          <div className="bg-[#FAF8F1] p-5 sm:p-6 rounded-2xl border border-[#445363]/20 shadow-sm space-y-2.5 relative hover:border-[#454F2A] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-[#E5E8E1] text-[#445363] font-bold flex items-center justify-center text-sm border border-[#445363]/20">
              02
            </div>
            <h3 className="font-bold text-[#445363] text-base">{t('home.step2Title')}</h3>
            <p className="text-xs text-[#445363]/80 leading-relaxed">
              {t('home.step2Desc')}
            </p>
          </div>

          <div className="bg-[#FAF8F1] p-5 sm:p-6 rounded-2xl border border-[#445363]/20 shadow-sm space-y-2.5 relative hover:border-[#454F2A] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-[#EDD575]/40 text-[#445363] font-bold flex items-center justify-center text-sm border border-[#EDD575]">
              03
            </div>
            <h3 className="font-bold text-[#445363] text-base">{t('home.step3Title')}</h3>
            <p className="text-xs text-[#445363]/80 leading-relaxed">
              {t('home.step3Desc')}
            </p>
          </div>

          <div className="bg-[#FAF8F1] p-5 sm:p-6 rounded-2xl border border-[#445363]/20 shadow-sm space-y-2.5 relative hover:border-[#454F2A] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-[#315D9B]/15 text-[#315D9B] font-bold flex items-center justify-center text-sm border border-[#315D9B]/30">
              04
            </div>
            <h3 className="font-bold text-[#445363] text-base">{t('home.step4Title')}</h3>
            <p className="text-xs text-[#445363]/80 leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#445363] mt-1.5">
              {t('home.popularSchemesTitle')}
            </h2>
            <p className="text-[#445363]/80 text-sm mt-0.5">
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
        <div className="bg-[#445363] rounded-3xl p-6 sm:p-8 md:p-10 text-[#FAF8F1] relative overflow-hidden shadow-xl border border-[#384452]">
          <div className="max-w-2xl space-y-4 relative z-10">
            <Badge variant="amber" className="bg-[#EDD575]/20 text-[#EDD575] border-[#EDD575]/40 font-bold">
              {t('home.ctaBadge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-[#E5E8E1]/90 text-sm sm:text-base leading-relaxed">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/assistant">
                <Button variant="primary" size="md" icon={Bot}>
                  {t('home.ctaStartChat')}
                </Button>
              </Link>
              <Link to="/eligibility">
                <Button variant="outline" size="md" className="bg-transparent text-[#FAF8F1] border-[#FAF8F1]/40 hover:bg-[#FAF8F1]/15">
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
