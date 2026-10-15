import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  FileCheck2,
  Calendar,
  Bell,
  FileText,
  ExternalLink,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import Badge from '../common/Badge';
import {
  APPLICATION_STATUSES,
  STATUS_COLORS,
  updateApplicationStatus,
  deleteApplicationRecord,
} from '../../utils/applicationStorage';
import { useTranslation } from '../../context/LanguageContext';

export default function ApplicationDashboard({
  applications = [],
  onRefresh,
  onOpenNewModal,
  onOpenEditModal,
  onNavigateToGuide,
}) {
  const { t, getStatusText, getCategoryText, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Compute status summary metrics
  const statusCounts = useMemo(() => {
    const counts = {
      All: applications.length,
      Interested: 0,
      'Preparing Documents': 0,
      'Ready to Apply': 0,
      Submitted: 0,
      Completed: 0,
    };
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status] += 1;
      }
    });
    return counts;
  }, [applications]);

  // Compute upcoming reminders
  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return applications
      .filter((app) => app.nextStepReminder || app.reminderDate)
      .map((app) => {
        let urgency = 'normal';
        let daysDiff = null;
        if (app.reminderDate) {
          const diffMs = new Date(app.reminderDate) - new Date(todayStr);
          daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (daysDiff < 0) urgency = 'overdue';
          else if (daysDiff <= 3) urgency = 'urgent';
          else urgency = 'upcoming';
        }
        return {
          ...app,
          daysDiff,
          urgency,
        };
      })
      .sort((a, b) => {
        if (!a.reminderDate) return 1;
        if (!b.reminderDate) return -1;
        return new Date(a.reminderDate) - new Date(b.reminderDate);
      });
  }, [applications]);

  // Filter applications by search query and status filter
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        selectedStatusFilter === 'All' || app.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.schemeTitle.toLowerCase().includes(q) ||
        app.schemeCategory.toLowerCase().includes(q) ||
        (app.personalNotes && app.personalNotes.toLowerCase().includes(q)) ||
        (app.nextStepReminder && app.nextStepReminder.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [applications, searchQuery, selectedStatusFilter]);

  const handleStatusChange = (schemeId, newStatus) => {
    updateApplicationStatus(schemeId, newStatus);
    if (onRefresh) onRefresh();
  };

  const handleDelete = (schemeId, title) => {
    const confirmMsg = t('applications.deleteConfirm', { title });
    if (window.confirm(confirmMsg)) {
      deleteApplicationRecord(schemeId);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. STATUS SUMMARY CARDS DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All', count: statusCounts.All, color: 'text-navy-900', border: 'border-slate-300' },
          { label: 'Interested', count: statusCounts.Interested, color: 'text-blue-700', border: 'border-blue-200' },
          { label: 'Preparing Documents', count: statusCounts['Preparing Documents'], color: 'text-amber-700', border: 'border-amber-200' },
          { label: 'Ready to Apply', count: statusCounts['Ready to Apply'], color: 'text-teal-700', border: 'border-teal-200' },
          { label: 'Submitted', count: statusCounts.Submitted, color: 'text-indigo-700', border: 'border-indigo-200' },
          { label: 'Completed', count: statusCounts.Completed, color: 'text-emerald-700', border: 'border-emerald-200' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setSelectedStatusFilter(item.label)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedStatusFilter === item.label
                ? 'bg-navy-900 text-white shadow-sm ring-2 ring-navy-900 ring-offset-1'
                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                selectedStatusFilter === item.label ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {getStatusText(item.label)}
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${
                selectedStatusFilter === item.label ? 'text-white' : item.color
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* 2. UPCOMING USER-ENTERED REMINDERS WIDGET (if any reminders exist) */}
      {upcomingReminders.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>{t('applications.upcomingReminders', { count: upcomingReminders.length })}</span>
            </h3>
            <span className="text-[11px] text-amber-800 font-medium hidden sm:inline">
              {t('applications.remindersSubtitle', 'Self-scheduled reminders to keep your civic applications moving')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingReminders.slice(0, 4).map((rem) => (
              <div
                key={rem.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy-900 truncate max-w-[220px]">
                    {rem.schemeTitle}
                  </span>
                  {rem.reminderDate && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rem.urgency === 'overdue'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : rem.urgency === 'urgent'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rem.urgency === 'overdue' && t('applications.overdue', 'Overdue: ')}
                      {rem.daysDiff === 0 && t('applications.dueToday', 'Due Today')}
                      {rem.daysDiff === 1 && t('applications.dueTomorrow', 'Due Tomorrow')}
                      {rem.daysDiff > 1 && t('applications.inDays', { days: rem.daysDiff })}
                      {rem.urgency === 'overdue' && t('applications.daysAgo', { days: Math.abs(rem.daysDiff) })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {rem.nextStepReminder || t('applications.nextStepScheduled', 'Next step review scheduled')}
                </p>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-teal-700 font-medium">{t('applications.statusLabel', { status: getStatusText(rem.status) })}</span>
                  <button
                    onClick={() => onOpenEditModal(rem)}
                    className="text-navy-900 hover:text-teal-700 font-bold underline"
                  >
                    {t('applications.updateNote', 'Update Note')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONTROLS BAR: SEARCH, FILTER & NEW RECORD BUTTON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('applications.searchApplications', 'Search tracked applications or notes...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter & New Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">{t('applications.allStatuses', { count: applications.length })}</option>
              {APPLICATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {getStatusText(st)} ({statusCounts[st] || 0})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('applications.trackApplication', 'Track Application')}</span>
          </button>
        </div>
      </div>

      {/* 4. APPLICATION RECORDS LIST */}
      <div className="space-y-4">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => {
            const statusStyle = STATUS_COLORS[app.status] || STATUS_COLORS.Interested;
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header: Title, Category & User Tracked Label */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="teal">{getCategoryText(app.schemeCategory)}</Badge>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                        {t('applications.userSelfTracked', 'User Self-Tracked Record')}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-navy-900 leading-snug">
                      {app.schemeTitle}
                    </h3>
                  </div>

                  {/* Inline Status Selector Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">{t('applications.statusSelectLabel', 'Status')}:</span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.schemeId, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {APPLICATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {getStatusText(st)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Details Grid: Dates, Notes & Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  {/* Dates & Reminders Column */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('applications.timelineDetails', 'Timeline Details:')}</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">{t('applications.applicationDate', 'Application Date:')}</span>{' '}
                        <strong className="text-navy-900">{app.appliedDate || t('applications.notSet', 'Not set')}</strong>
                      </div>
                      {app.reminderDate && (
                        <div>
                          <span className="text-slate-500">{t('applications.reminderTarget', 'Reminder Target:')}</span>{' '}
                          <strong className="text-amber-800">{app.reminderDate}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Step & Personal Notes Column */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 md:col-span-2 flex flex-col justify-between">
                    <div>
                      {app.nextStepReminder && (
                        <div className="mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>{t('applications.nextStep', 'Next Step:')}</strong> {app.nextStepReminder}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-700">{t('applications.personalNotes', 'Personal Notes:')}</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed italic">
                          {app.personalNotes ? `"${app.personalNotes}"` : t('applications.noNotesEntered', 'No notes entered yet.')}
                        </p>
                      </div>
                    </div>

                    {/* Document Checklist Progress if tracked */}
                    {app.checklistProgress && app.checklistProgress.total > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-teal-800 font-medium">
                        <span className="flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                          {t('applications.documentReadiness', {
                            completed: app.checklistProgress.completed,
                            total: app.checklistProgress.total,
                          })}
                        </span>
                        <span className="font-bold">
                          {Math.round((app.checklistProgress.completed / app.checklistProgress.total) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Guide Action */}
                    <button
                      onClick={() => onNavigateToGuide(app.schemeId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors border border-teal-200"
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('applications.prepareDocsGuide', 'Prepare Documents & Guide')}</span>
                    </button>

                    {/* Edit Record Notes Modal */}
                    <button
                      onClick={() => onOpenEditModal(app)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('applications.editNotes', 'Edit Notes')}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Launch Official Portal */}
                    <a
                      href={app.officialPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                    >
                      <span>{t('common.officialPortal', 'Official Portal')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Delete Application Record */}
                    <button
                      onClick={() => handleDelete(app.schemeId, app.schemeTitle)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t('applications.deleteRecord', 'Delete application record')}
                      aria-label={t('applications.deleteRecord', 'Delete application record')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-navy-900 text-lg">
              {searchQuery || selectedStatusFilter !== 'All'
                ? t('applications.noMatchingRecords', 'No matching application records')
                : t('applications.noRecordsTitle', 'No applications tracked yet')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || selectedStatusFilter !== 'All'
                ? t('applications.tryAdjustingFilter', 'Try adjusting your search query or status filter.')
                : t('applications.noRecordsSubtitle', 'Track schemes you are applying for, set next-step reminders, and organize your document progress.')}
            </p>
            {searchQuery || selectedStatusFilter !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('All');
                }}
                className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold"
              >
                {t('applications.clearFilters', 'Clear Filters')}
              </button>
            ) : (
              <button
                onClick={onOpenNewModal}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('applications.trackFirstScheme', 'Track Your First Scheme')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

