import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, Heart, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
      {/* Upper Footer: Pillars & Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                <span className="font-extrabold text-lg text-white">स</span>
              </div>
              <div>
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Sahayak<span className="text-teal-400">.AI</span>
                </span>
                <p className="text-xs text-slate-400">Civic-Tech Welfare Scheme Assistant</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering Indian citizens with transparent, accessible, and structured guidance to discover welfare schemes, check preliminary eligibility, and prepare required documents.
            </p>

            <div className="flex items-center gap-2 text-xs text-teal-300 bg-navy-900/80 border border-navy-800 p-2.5 rounded-lg max-w-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
              <span>Independent initiative. We do not sell data or charge citizens.</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="text-slate-400 hover:text-white transition-colors">
                  Discover Schemes
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="text-slate-400 hover:text-white transition-colors">
                  Check Eligibility
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span>AI Assistant</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1 rounded">Beta</span>
                </Link>
              </li>
              <li>
                <Link to="/applications" className="text-slate-400 hover:text-white transition-colors">
                  My Applications
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Welfare Domains
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Agriculture & Farmers</li>
              <li>Healthcare & Insurance</li>
              <li>Housing & Sanitation</li>
              <li>Women & Child Welfare</li>
              <li>Senior Citizen Pensions</li>
              <li>Micro-Enterprise & Credit</li>
            </ul>
          </div>

          {/* Official Portals Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Official Portals
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                >
                  India.gov.in
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.myscheme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                >
                  myScheme.gov.in
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://dbtbharat.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                >
                  DBT Bharat
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmjay.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                >
                  PM-JAY (Ayushman)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmkisan.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                >
                  PM-KISAN Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal & Non-Affiliation Disclaimer Bar */}
      <div className="border-t border-navy-900 bg-navy-950/90 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left leading-relaxed max-w-4xl">
            <strong className="text-slate-300">Disclaimer:</strong> Sahayak AI is an open civic technology demonstration project. It is not affiliated with, authorized by, or endorsed by the Government of India, any state government, or any statutory authority. Official scheme rules, eligibility norms, and application procedures are governed exclusively by their respective ministries.
          </p>
          <div className="text-center md:text-right shrink-0">
            <p className="text-slate-500">
              © {new Date().getFullYear()} Sahayak AI. Open Civic Tech Initiative.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

