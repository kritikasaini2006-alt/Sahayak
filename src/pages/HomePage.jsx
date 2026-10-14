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

export default function HomePage() {
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
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-navy-900 via-navy-800 to-navy-950 text-white overflow-hidden py-16 md:py-24">
        {/* Subtle geometric civic pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-navy-700/80 border border-teal-500/40 text-teal-300 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Next-Gen Civic Technology for Indian Citizens</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Discover Government Schemes{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200">
                You Are Eligible For
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Millions of welfare benefits remain uncollected due to complex bureaucracy. Sahayak AI simplifies criteria, guides document readiness, and links directly to official portals.
            </p>

            {/* Quick Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 flex flex-col sm:flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl max-w-2xl mx-auto"
            >
              <div className="relative flex-1 w-full flex items-center">
                <Search className="w-5 h-5 text-slate-300 absolute left-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="E.g., Farmer financial aid, Ayushman card, Girl child savings..."
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                variant="teal"
                size="md"
                className="w-full sm:w-auto font-semibold px-6"
              >
                Find Schemes
              </Button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 pt-2">
              <span className="text-slate-400">Popular searches:</span>
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
                Independent, Transparent, and Free Civic-Tech
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed">
                Sahayak AI is not an official government platform. We synthesize officially published rules from Central & State ministries so you can find the right scheme and submit on authorized portals without intermediaries.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link to="/about" className="w-full md:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                Learn About Mission
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="teal">How It Works</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
            Four Simple Steps to Welfare Entitlements
          </h2>
          <p className="text-slate-600 text-sm">
            Navigating government welfare should not require agents or complicated legal paperwork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative hover:border-teal-500 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 font-bold flex items-center justify-center text-base border border-navy-100">
              01
            </div>
            <h3 className="font-bold text-navy-900 text-base">Share Basic Profile</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your state, occupation, age, and family category via a simple questionnaire or conversational assistant.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative hover:border-teal-500 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-base border border-teal-100">
              02
            </div>
            <h3 className="font-bold text-navy-900 text-base">Match Eligible Schemes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our automated rules match your details against official eligibility criteria for central and state schemes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative hover:border-teal-500 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-base border border-emerald-100">
              03
            </div>
            <h3 className="font-bold text-navy-900 text-base">Get Document Checklist</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive a customized checklist of required documents (Aadhaar, Bank Passbook, Ration Card) before applying.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative hover:border-teal-500 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-900 font-bold flex items-center justify-center text-base border border-amber-100">
              04
            </div>
            <h3 className="font-bold text-navy-900 text-base">Apply on Official Portals</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct links to authenticated official government portals or nearest Common Service Centres (CSCs).
            </p>
          </div>
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge variant="primary">High-Impact Schemes</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-2">
              Popular Welfare Initiatives
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Direct benefit schemes offering crucial health, shelter, and financial support.
            </p>
          </div>

          <Link to="/schemes">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Explore All Schemes
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-teal-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-5 relative z-10">
            <Badge variant="teal" className="bg-teal-900/60 text-teal-200 border-teal-500/40">
              AI Conversational Guide
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Not sure which schemes you qualify for?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Talk with our AI assistant in natural conversational language. Describe your livelihood, family status, or business goals to discover relevant benefits.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/assistant">
                <Button variant="teal" size="lg" icon={Sparkles}>
                  Start AI Consultation
                </Button>
              </Link>
              <Link to="/eligibility">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Step-by-Step Questionnaire
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

