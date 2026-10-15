import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bookmark,
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Compass,
  Layers,
  Printer,
  RotateCcw,
  FileText,
  CheckSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FolderCheck,
  Download,
  Upload,
  Trash2,
  Plus,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { SCHEME_GUIDANCE } from '../data/schemeGuidance';
import SchemeGuidanceView from '../components/guidance/SchemeGuidanceView';
import ApplicationDashboard from '../components/applications/ApplicationDashboard';
import SavedSchemesList from '../components/applications/SavedSchemesList';
import ApplicationRecordModal from '../components/applications/ApplicationRecordModal';
import SchemeDetailModal from '../components/schemes/SchemeDetailModal';
import { loadCitizenProfile } from '../utils/eligibilityEngine';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import {
  getSavedSchemeIds,
  saveSavedSchemeIds,
  toggleSaveSchemeId,
  getApplicationRecords,
  saveApplicationRecord,
  downloadUserDataFile,
  importUserData,
  clearAllUserData,
  GENERAL_DOCS_KEY,
  safeJsonParse,
} from '../utils/applicationStorage';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useTranslation } from '../context/LanguageContext';

export default function MyApplicationsPage() {
  const { t, language } = useTranslation();
  useDocumentTitle(language === 'hi' ? 'मेरे आवेदन एवं सहेजी गई योजनाएं' : 'My Applications & Saved Schemes');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Active tab: 'applications' | 'saved' | 'guide' | 'documents'
  const initialTab = searchParams.get('tab') || 'applications';
  const initialSchemeId = searchParams.get('scheme') || 'pm-kisan';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedSchemeId, setSelectedSchemeId] = useState(initialSchemeId);

  // Storage states
  const [savedIds, setSavedIds] = useState(() => getSavedSchemeIds());
  const [applications, setApplications] = useState(() => getApplicationRecords());

  // Re-sync storage data whenever active user changes
  useEffect(() => {
    setSavedIds(getSavedSchemeIds());
    setApplications(getApplicationRecords());
  }, [user]);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalInitialSchemeId, setModalInitialSchemeId] = useState('pm-kisan');
  const [detailModalScheme, setDetailModalScheme] = useState(null);

  // Import feedback banner
  const [importNotice, setImportNotice] = useState(null);
  const fileInputRef = useRef(null);

  // Sync state with URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const schemeParam = searchParams.get('scheme');
    if (tabParam && ['applications', 'saved', 'guide', 'documents'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (schemeParam && SCHEME_GUIDANCE[schemeParam]) {
      setSelectedSchemeId(schemeParam);
    }
  }, [searchParams]);

  // Refresh data from storage
  const refreshStorageData = () => {
    setSavedIds(getSavedSchemeIds());
    setApplications(getApplicationRecords());
  };

  const handleTabChange = (tab, schemeId = null) => {
    setActiveTab(tab);
    const targetScheme = schemeId || selectedSchemeId;
    if (schemeId) {
      setSelectedSchemeId(schemeId);
    }
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    if (tab === 'guide') {
      params.set('scheme', targetScheme);
    }
    setSearchParams(params);
  };

  const handleSelectSchemeForGuide = (schemeId) => {
    setSelectedSchemeId(schemeId);
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'guide');
    params.set('scheme', schemeId);
    setSearchParams(params);
  };

  // General 6-document readiness state
  const [documentStatus, setDocumentStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(GENERAL_DOCS_KEY);
      if (stored) return safeJsonParse(stored, {});
    } catch {}
    return {
      aadhaar: true,
      bankPassbook: true,
      rationCard: false,
      incomeCert: false,
      domicileCert: true,
      casteCert: false,
    };
  });

  const toggleDocument = (key) => {
    setDocumentStatus((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(GENERAL_DOCS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Open modal to track a new scheme
  const handleOpenNewModal = (schemeId = null) => {
    setEditingRecord(null);
    setModalInitialSchemeId(schemeId || 'pm-kisan');
    setIsRecordModalOpen(true);
  };

  // Open modal to edit existing application record
  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  // Export JSON user data
  const handleExport = () => {
    const success = downloadUserDataFile();
    if (success) {
      setImportNotice({
        type: 'success',
        text: 'Workspace exported successfully as JSON file.',
      });
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  // Import JSON user data file
  const handleFileImport = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const res = importUserData(text);
      if (res.success) {
        refreshStorageData();
        setImportNotice({
          type: 'success',
          text: res.message,
        });
      } else {
        setImportNotice({
          type: 'error',
          text: res.message,
        });
      }
      setTimeout(() => setImportNotice(null), 5000);
    };
    reader.onerror = () => {
      setImportNotice({
        type: 'error',
        text: 'Failed to read the imported JSON file.',
      });
      setTimeout(() => setImportNotice(null), 5000);
    };
    reader.readAsText(file);
    // Reset file input value so re-importing the same file triggers change
    event.target.value = '';
  };

  // Clear all user workspace data with confirmation
  const handleClearAllData = () => {
    if (
      window.confirm(
        '⚠️ ARE YOU SURE? This will delete all your saved schemes, application tracking records, and document checklists from your browser. This action cannot be undone.'
      )
    ) {
      clearAllUserData();
      setSavedIds([]);
      setApplications([]);
      setDocumentStatus({
        aadhaar: false,
        bankPassbook: false,
        rationCard: false,
        incomeCert: false,
        domicileCert: false,
        casteCert: false,
      });
      setImportNotice({
        type: 'info',
        text: 'All workspace data has been reset cleanly.',
      });
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  const readinessPercentage = Math.round(
    (Object.values(documentStatus).filter(Boolean).length / Object.values(documentStatus).length) * 100
  );

  return (
    <div className="py-5 sm:py-7 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header bar */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="teal">{t('applications.workspaceBadge')}</Badge>
            {user && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
                {language === 'hi' ? 'खाता:' : 'Account:'} {user.email}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">{t('applications.personalReadiness')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            {t('applications.pageTitle')}
          </h1>
          <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
            {t('applications.pageSubtitle')}
          </p>
        </div>

        {/* Global Workspace Actions: Export, Import, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
            title={t('applications.exportBackup')}
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('applications.exportBackup')}</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
            title={t('applications.importBackup')}
          >
            <Upload className="w-3.5 h-3.5 text-navy-600" />
            <span>{t('applications.importBackup')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />

          {/* Clear All Data */}
          <button
            onClick={handleClearAllData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold shadow-2xs transition-colors"
            title={t('applications.clearAllData')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('schemes.clearAll')}</span>
          </button>
        </div>
      </div>

      {/* Import / Export Notification Toast */}
      {importNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn print:hidden ${
            importNotice.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : importNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{importNotice.text}</span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Advisory Pill */}
      <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600 print:hidden">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-navy-900">{language === 'hi' ? 'नागरिक स्व-प्रबंधित ट्रैकिंग:' : 'User Self-Managed Tracking:'}</strong>{' '}
          {language === 'hi'
            ? 'इस डैशबोर्ड में सभी आवेदन रिकॉर्ड, स्थितियां और नोट्स पूरी तरह से आपकी व्यक्तिगत योजना के लिए आपके द्वारा प्रबंधित हैं। सहायक AI सरकारी आंतरिक प्रणालियों से जुड़ा नहीं है। आधिकारिक आवेदन सत्यापित सरकारी पोर्टलों पर ही किए जाने चाहिए।'
            : 'All application records, statuses, and notes in this dashboard are maintained entirely by you for your personal planning. Sahayak AI does not connect to internal government processing systems or infer official approval. Official applications must be completed on verified government portals.'}
        </p>
      </div>

      {/* Active Citizen Profile Link */}
      {(() => {
        const stored = loadCitizenProfile();
        if (!stored || !stored.age || !stored.state) return null;
        return (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
              <span className="text-teal-900 font-medium">
                {t('schemes.connectedProfile')} <strong className="font-bold text-navy-900">{stored.age} yrs</strong> • {stored.occupation?.replace('_', ' ')} • {stored.state} ({stored.areaType})
              </span>
            </div>
            <Link
              to="/eligibility"
              className="text-teal-700 hover:text-teal-900 font-bold underline shrink-0"
            >
              {language === 'hi' ? 'योजना पात्रता जांचें →' : 'Check Scheme Eligibility →'}
            </Link>
          </div>
        );
      })()}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-8 overflow-x-auto print:hidden">
        {/* Tab 1: Applications Dashboard */}
        <button
          onClick={() => handleTabChange('applications')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'applications'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderCheck className="w-4 h-4" />
          <span>{t('applications.tabApplications')} ({applications.length})</span>
        </button>

        {/* Tab 2: Saved Schemes */}
        <button
          onClick={() => handleTabChange('saved')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'saved'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{t('applications.tabSaved')} ({savedIds.length})</span>
        </button>

        {/* Tab 3: Scheme Guidance & Checklist */}
        <button
          onClick={() => handleTabChange('guide')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'guide'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('applications.tabGuide')}</span>
        </button>

        {/* Tab 4: General Document Wallet */}
        <button
          onClick={() => handleTabChange('documents')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'documents'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{t('applications.tabDocs')} ({readinessPercentage}%)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MY APPLICATIONS DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'applications' && (
        <ApplicationDashboard
          applications={applications}
          onRefresh={refreshStorageData}
          onOpenNewModal={() => handleOpenNewModal()}
          onOpenEditModal={(rec) => handleOpenEditModal(rec)}
          onNavigateToGuide={(schemeId) => handleTabChange('guide', schemeId)}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 2: SAVED SCHEMES */}
      {/* ======================================================== */}
      {activeTab === 'saved' && (
        <SavedSchemesList
          savedIds={savedIds}
          onRefresh={refreshStorageData}
          onOpenDetails={(scheme) => setDetailModalScheme(scheme)}
          onTrackScheme={(schemeId) => handleOpenNewModal(schemeId)}
          onNavigateToGuide={(schemeId) => handleTabChange('guide', schemeId)}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 3: SPECIFIC SCHEME GUIDANCE & CHECKLIST */}
      {/* ======================================================== */}
      {activeTab === 'guide' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Scheme Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="scheme-select"
                  className="text-xs font-bold text-navy-900 uppercase tracking-wider block"
                >
                  Select Government Scheme for Guidance:
                </label>
                <p className="text-xs text-slate-500">
                  Choose any welfare initiative to view its verified document checklist, prerequisites, and application steps.
                </p>
              </div>

              {/* Selector Dropdown */}
              <select
                id="scheme-select"
                value={selectedSchemeId}
                onChange={(e) => handleSelectSchemeForGuide(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-navy-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
              >
                {MOCK_SCHEMES.map((scheme) => (
                  <option key={scheme.id} value={scheme.id}>
                    {scheme.title} ({scheme.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Pills for Saved Schemes */}
            {savedIds.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="font-semibold text-slate-500 shrink-0">Your Saved Schemes:</span>
                {MOCK_SCHEMES.filter((s) => savedIds.includes(s.id)).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSchemeForGuide(s.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      selectedSchemeId === s.id
                        ? 'bg-navy-800 text-white border-navy-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {s.title.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Render Comprehensive Scheme Guidance View */}
          <SchemeGuidanceView
            schemeId={selectedSchemeId}
            isSaved={savedIds.includes(selectedSchemeId)}
            onToggleSave={(id) => {
              toggleSaveSchemeId(id);
              refreshStorageData();
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: GENERAL DOCUMENT WALLET / READINESS */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Progress Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-navy-900">General Document Readiness Score</h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Most central and state schemes require a standard set of identity and financial documents. Mark the documents you have readily available:
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-3xl font-extrabold text-navy-900">{readinessPercentage}%</span>
                <span className="block text-[11px] text-slate-500 font-medium">Ready to Apply</span>
              </div>
              <div className="w-28 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${readinessPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* General Checklist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                id: 'aadhaar',
                title: 'Aadhaar Card (Mobile Linked)',
                desc: 'Needed for e-KYC and Direct Benefit Transfer (DBT) across all Central schemes.',
                authority: 'UIDAI',
              },
              {
                id: 'bankPassbook',
                title: 'Bank Passbook / Cancelled Cheque',
                desc: 'Active account linked with Aadhaar NPCI mapper for monetary transfers.',
                authority: 'Scheduled Bank',
              },
              {
                id: 'rationCard',
                title: 'Ration Card (PHH / AAY)',
                desc: 'Proof of family composition and socio-economic category (Ayushman Bharat, PMAY).',
                authority: 'Food & Civil Supplies',
              },
              {
                id: 'incomeCert',
                title: 'Income Certificate',
                desc: 'Issued by Tehsildar / Revenue Department within 1 year for means-tested subsidies.',
                authority: 'State Revenue Dept',
              },
              {
                id: 'domicileCert',
                title: 'Domicile / Residence Certificate',
                desc: 'Proof of permanent residency in the respective state for state-quota schemes.',
                authority: 'Tehsil / e-District',
              },
              {
                id: 'casteCert',
                title: 'Caste Certificate (SC/ST/OBC)',
                desc: 'Required for specific affirmative social welfare quotas and special grants.',
                authority: 'District Magistrate / SDM',
              },
            ].map((doc) => {
              const isChecked = documentStatus[doc.id];
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-300 text-teal-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isChecked
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-navy-900">{doc.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
                    <span className="text-[10px] text-teal-700 font-semibold block pt-1">
                      Issuer: {doc.authority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Application Record Add/Edit Modal */}
      <ApplicationRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        initialSchemeId={modalInitialSchemeId}
        existingRecord={editingRecord}
        onSaveSuccess={() => {
          refreshStorageData();
        }}
      />

      {/* Scheme Detail Modal (when clicked from Saved Schemes) */}
      <SchemeDetailModal
        scheme={detailModalScheme}
        isOpen={!!detailModalScheme}
        onClose={() => setDetailModalScheme(null)}
        isSaved={detailModalScheme ? savedIds.includes(detailModalScheme.id) : false}
        onToggleSave={(id) => {
          toggleSaveSchemeId(id);
          refreshStorageData();
        }}
      />
    </div>
  );
}
