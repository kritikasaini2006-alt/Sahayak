import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  Calendar,
  Bell,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  APPLICATION_STATUSES,
  saveApplicationRecord,
} from '../../utils/applicationStorage';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import { loadSchemeChecklistProgress, SCHEME_GUIDANCE } from '../../data/schemeGuidance';
import { useTranslation } from '../../context/LanguageContext';

export default function ApplicationRecordModal({
  isOpen,
  onClose,
  initialSchemeId = null,
  existingRecord = null,
  onSaveSuccess,
}) {
  const { t, getSchemeText, getCategoryText, getStatusText } = useTranslation();
  const [selectedSchemeId, setSelectedSchemeId] = useState(
    existingRecord?.schemeId || initialSchemeId || 'pm-kisan'
  );
  const [status, setStatus] = useState(existingRecord?.status || 'Interested');
  const [appliedDate, setAppliedDate] = useState(existingRecord?.appliedDate || '');
  const [personalNotes, setPersonalNotes] = useState(existingRecord?.personalNotes || '');
  const [nextStepReminder, setNextStepReminder] = useState(existingRecord?.nextStepReminder || '');
  const [reminderDate, setReminderDate] = useState(existingRecord?.reminderDate || '');
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync state when modal opens or initial data changes
  useEffect(() => {
    if (existingRecord) {
      setSelectedSchemeId(existingRecord.schemeId);
      setStatus(existingRecord.status || 'Interested');
      setAppliedDate(existingRecord.appliedDate || '');
      setPersonalNotes(existingRecord.personalNotes || '');
      setNextStepReminder(existingRecord.nextStepReminder || '');
      setReminderDate(existingRecord.reminderDate || '');
    } else if (initialSchemeId) {
      setSelectedSchemeId(initialSchemeId);
      setStatus('Interested');
      setAppliedDate('');
      setPersonalNotes('');
      setNextStepReminder('');
      setReminderDate('');
    }
    setErrorMsg(null);
  }, [existingRecord, initialSchemeId, isOpen]);

  if (!isOpen) return null;

  const currentScheme =
    MOCK_SCHEMES.find((s) => s.id === selectedSchemeId) || MOCK_SCHEMES[0];

  // Calculate live checklist progress for the selected scheme
  const schemeGuidance = SCHEME_GUIDANCE[selectedSchemeId];
  const checklistMap = loadSchemeChecklistProgress(selectedSchemeId);
  const totalDocs = schemeGuidance?.documents?.length || 0;
  const completedDocs = schemeGuidance?.documents
    ? schemeGuidance.documents.filter((d) => checklistMap[d.id]).length
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSchemeId) {
      setErrorMsg(t('applications.selectGovtSchemeErr', 'Please select a government scheme to track.'));
      return;
    }

    const payload = {
      id: existingRecord?.id || `app_${selectedSchemeId}`,
      schemeId: selectedSchemeId,
      schemeTitle: currentScheme.title,
      schemeCategory: currentScheme.category,
      officialPortal: currentScheme.officialPortal,
      status,
      appliedDate,
      personalNotes: personalNotes.trim(),
      nextStepReminder: nextStepReminder.trim(),
      reminderDate,
      checklistProgress: {
        completed: completedDocs,
        total: totalDocs,
      },
      createdAt: existingRecord?.createdAt,
    };

    const saved = saveApplicationRecord(payload);
    if (saved) {
      if (onSaveSuccess) onSaveSuccess(saved);
      onClose();
    } else {
      setErrorMsg(t('applications.saveFailedErr', 'Failed to save record. Please check your storage settings.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-navy-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <span className="text-[10px] bg-teal-900/60 text-teal-200 border border-teal-500/40 font-semibold px-2 py-0.5 rounded tracking-wider uppercase">
              {t('applications.citizenWorkspaceTracker', 'Citizen Workspace Tracker')}
            </span>
            <h2 id="app-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {existingRecord ? t('applications.editModalTitle', 'Update Application Record') : t('applications.addModalTitle', 'Track New Scheme Application')}
            </h2>
            <p className="text-xs text-slate-300">
              {t('applications.notOfficialSubmission', 'User-managed preparation tracker • Not an official government submission')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-sm text-slate-700 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scheme Selection (Disabled if editing existing record) */}
          <div className="space-y-1.5">
            <label htmlFor="modal-scheme" className="text-xs font-bold text-navy-900 uppercase tracking-wider block">
              {t('applications.govtSchemeReq', 'Government Scheme *')}
            </label>
            {existingRecord ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-navy-900 text-sm flex items-center justify-between">
                <span>{getSchemeText(currentScheme, 'title') || currentScheme.title}</span>
                <span className="text-xs text-teal-700 font-normal">{getCategoryText(currentScheme.category)}</span>
              </div>
            ) : (
              <select
                id="modal-scheme"
                value={selectedSchemeId}
                onChange={(e) => setSelectedSchemeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-sm text-navy-900"
              >
                {MOCK_SCHEMES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getSchemeText(s, 'title') || s.title} ({getCategoryText(s.category)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block">
              {t('applications.userControlledStatus', 'User-Controlled Application Status *')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {APPLICATION_STATUSES.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    status === st
                      ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {getStatusText(st)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              {t('applications.statusManagedByYou', 'Status is managed entirely by you to organize your personal readiness.')}
            </p>
          </div>

          {/* Dates Row: Applied Date / Planned Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="applied-date" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('applications.appPlannedDate', 'Application / Planned Date (Optional)')}</span>
              </label>
              <input
                id="applied-date"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reminder-date" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('applications.nextStepDueDate', 'Next Step Due Date (Optional)')}</span>
              </label>
              <input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Next Step Reminder Text */}
          <div className="space-y-1.5">
            <label htmlFor="next-step" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('applications.nextActionStep', 'Next Action Step or Reminder (Optional)')}</span>
            </label>
            <input
              id="next-step"
              type="text"
              value={nextStepReminder}
              onChange={(e) => setNextStepReminder(e.target.value)}
              placeholder={t('applications.nextActionPlaceholder', 'e.g. Visit local CSC for biometric e-KYC on Friday')}
              maxLength={300}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Personal Notes */}
          <div className="space-y-1.5">
            <label htmlFor="personal-notes" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-navy-600" />
              <span>{t('applications.personalNotesLabel', 'Personal Preparation Notes (Optional)')}</span>
            </label>
            <textarea
              id="personal-notes"
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder={t('applications.personalNotesPlaceholder', 'e.g. Met Lekhpal for Khatauni stamp; bank passbook branch confirmed.')}
              maxLength={1000}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('applications.notesPrivacyNotice', 'Notes are stored locally on your device. Never record passwords, bank PINs, or Aadhaar numbers.')}</span>
            </div>
          </div>

          {/* Current Document Checklist Progress Preview */}
          {totalDocs > 0 && (
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-teal-700" />
                <span>
                  {t('applications.docChecklistProgress', { completed: completedDocs, total: totalDocs })}
                </span>
              </div>
              <span className="font-bold text-teal-800">
                {Math.round((completedDocs / totalDocs) * 100)}%
              </span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {existingRecord ? t('applications.saveChanges', 'Save Changes') : t('applications.createRecord', 'Create Application Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

