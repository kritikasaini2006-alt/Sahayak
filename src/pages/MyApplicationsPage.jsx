import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderCheck,
  Bookmark,
  FileCheck2,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Compass,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MyApplicationsPage() {
  const [activeTab, setActiveTab] = useState('saved');

  // Pull saved schemes from localStorage or default to 2 samples for showcase
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('sahayak_saved_schemes');
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.length > 0 ? parsed : ['pm-kisan', 'pm-jay'];
    } catch {
      return ['pm-kisan', 'pm-jay'];
    }
  });

  const [documentStatus, setDocumentStatus] = useState({
    aadhaar: true,
    bankPassbook: true,
    rationCard: false,
    incomeCert: false,
    domicileCert: true,
    casteCert: false,
  });

  const toggleDocument = (key) => {
    setDocumentStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savedSchemes = MOCK_SCHEMES.filter((scheme) => savedIds.includes(scheme.id));

  const removeSavedScheme = (id) => {
    const updated = savedIds.filter((item) => item !== id);
    setSavedIds(updated);
    try {
      localStorage.setItem('sahayak_saved_schemes', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const readinessPercentage = Math.round(
    (Object.values(documentStatus).filter(Boolean).length / Object.values(documentStatus).length) * 100
  );

  return (
    <div className="py-8 md:py-12 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Citizen Workspace</Badge>
          <span className="text-xs text-slate-500 font-medium">Personal Readiness Center</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          My Saved Schemes & Document Checklist
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          Keep track of schemes you intend to apply for, check required documentation, and access direct official application links.
        </p>
      </div>

      {/* Advisory Pill */}
      <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-navy-900">Offline Readiness Tool:</strong> This dashboard organizes your documents and saved schemes locally in your browser. Official submissions and status tracking occur strictly on official government ministry portals.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'saved'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Schemes ({savedSchemes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'documents'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Document Readiness ({readinessPercentage}%)</span>
        </button>
      </div>

      {/* Tab 1: Saved Schemes */}
      {activeTab === 'saved' && (
        <div className="space-y-6 animate-fadeIn">
          {savedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal">{scheme.category}</Badge>
                      <button
                        onClick={() => removeSavedScheme(scheme.id)}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="font-bold text-base text-navy-900">{scheme.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{scheme.shortDescription}</p>
                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700">Benefit:</span>{' '}
                      <span className="text-navy-900 font-bold">{scheme.financialBenefit}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{scheme.applicationMode}</span>
                    <a
                      href={scheme.officialPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                    >
                      Apply on Portal
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-navy-900 text-base">No saved schemes yet</h3>
              <p className="text-xs text-slate-500">
                Browse our curated welfare directory and click the bookmark button on any scheme card to save it here for reference.
              </p>
              <Link to="/schemes">
                <Button variant="teal" size="sm" icon={Compass}>
                  Explore Schemes
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Document Readiness Tracker */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Progress Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-navy-900">General Document Readiness Score</h3>
              <p className="text-xs text-slate-600 max-w-xl">
                Most central and state schemes require a standard set of identity and financial documents. Mark the documents you have readily available:
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-2xl font-extrabold text-navy-900">{readinessPercentage}%</span>
                <span className="block text-[11px] text-slate-500 font-medium">Ready to Apply</span>
              </div>
              <div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${readinessPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                id: 'aadhaar',
                title: 'Aadhaar Card (Mobile Linked)',
                desc: 'Needed for e-KYC and Direct Benefit Transfer (DBT)',
              },
              {
                id: 'bankPassbook',
                title: 'Bank Passbook / Cancelled Cheque',
                desc: 'Active account linked with Aadhaar NPCI mapper',
              },
              {
                id: 'rationCard',
                title: 'Ration Card (PHH / AAY)',
                desc: 'Proof of family composition and socio-economic category',
              },
              {
                id: 'incomeCert',
                title: 'Income Certificate',
                desc: 'Issued by Tehsildar / Revenue Department within 1 year',
              },
              {
                id: 'domicileCert',
                title: 'Domicile / Residence Certificate',
                desc: 'Proof of permanent residency in the respective state',
              },
              {
                id: 'casteCert',
                title: 'Caste Certificate (SC/ST/OBC)',
                desc: 'Required for specific affirmative social welfare quotas',
              },
            ].map((doc) => {
              const isChecked = documentStatus[doc.id];
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-300 text-teal-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isChecked
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900">{doc.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{doc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

