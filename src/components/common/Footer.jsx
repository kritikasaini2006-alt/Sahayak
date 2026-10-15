import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export default function Footer() {
  const { t, isHindi } = useTranslation();

  return (
    <footer className="bg-[#445363] text-[#FAF8F1] border-t border-[#384452] mt-auto">
      {/* Upper Footer: Pillars & Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#454F2A] flex items-center justify-center text-[#FAF8F1] shadow-md">
                <span className="font-extrabold text-base text-[#EDD575]">स</span>
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  {t('brand.name')}<span className="text-[#EDD575]">{t('brand.domain')}</span>
                </span>
                <p className="text-xs text-[#E5E8E1]/80">{t('footer.subtitle')}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#E5E8E1]/90 leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>

            <div className="flex items-center gap-2 text-xs text-[#FAF8F1] bg-[#384452] border border-[#303a46] p-2.5 rounded-lg max-w-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#EDD575]" />
              <span>{t('footer.independentBadge')}</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#FAF8F1] uppercase tracking-wider">
              {t('footer.navigationTitle')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors">
                  {t('nav.discoverSchemes')}
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors">
                  {t('nav.checkEligibility')}
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors flex items-center gap-1.5">
                  <span>{t('nav.aiAssistant')}</span>
                  <span className="text-[10px] bg-[#EDD575]/20 text-[#EDD575] border border-[#EDD575]/40 px-1 rounded">AI</span>
                </Link>
              </li>
              <li>
                <Link to="/applications" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors">
                  {t('nav.myApplications')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#FAF8F1] uppercase tracking-wider">
              {t('footer.domainsTitle')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#E5E8E1]">
              <li>{isHindi ? 'कृषि एवं ग्रामीण किसान' : 'Agriculture & Farmers'}</li>
              <li>{isHindi ? 'स्वास्थ्य एवं बीमा सुरक्षा' : 'Healthcare & Insurance'}</li>
              <li>{isHindi ? 'आवास एवं स्वच्छता' : 'Housing & Sanitation'}</li>
              <li>{isHindi ? 'महिला एवं बाल विकास' : 'Women & Child Welfare'}</li>
              <li>{isHindi ? 'वरिष्ठ नागरिक पेंशन' : 'Senior Citizen Pensions'}</li>
              <li>{isHindi ? 'सूक्ष्म उद्योग एवं ऋण' : 'Micro-Enterprise & Credit'}</li>
            </ul>
          </div>

          {/* Official Portals Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#FAF8F1] uppercase tracking-wider">
              {t('footer.portalsTitle')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors inline-flex items-center gap-1"
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
                  className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors inline-flex items-center gap-1"
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
                  className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors inline-flex items-center gap-1"
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
                  className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors inline-flex items-center gap-1"
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
                  className="text-[#E5E8E1] hover:text-[#EDD575] transition-colors inline-flex items-center gap-1"
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
      <div className="border-t border-[#384452] bg-[#3b4856] py-5 px-4 sm:px-6 lg:px-8 text-xs text-[#E5E8E1]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-center md:text-left leading-relaxed max-w-4xl">
            <strong className="text-white">{isHindi ? 'अस्वीकरण:' : 'Disclaimer:'}</strong> {t('footer.disclaimerText')}
          </p>
          <div className="text-center md:text-right shrink-0">
            <p className="text-[#E5E8E1]/80">
              © {new Date().getFullYear()} {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
