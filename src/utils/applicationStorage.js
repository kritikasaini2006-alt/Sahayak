/**
 * Reusable Data Layer for Sahayak AI Citizen Workspace:
 * - Saved Schemes management
 * - Application Records tracking with user-controlled statuses
 * - Safe LocalStorage persistence with corruption resistance
 * - JSON Export & Import with strict schema validation
 * - Clear-all-data utilities
 *
 * Privacy & Security:
 * - NEVER requests or stores Aadhaar numbers, bank passwords, OTPs, or biometric data.
 * - Explicitly marks records as user-managed self-tracking records.
 */

export const SAVED_SCHEMES_KEY = 'sahayak_saved_schemes';
export const APPLICATION_RECORDS_KEY = 'sahayak_application_records';
export const GENERAL_DOCS_KEY = 'sahayak_general_documents';
export const CHECKLIST_STORAGE_KEY = 'sahayak_scheme_checklists';

export const APPLICATION_STATUSES = [
  'Interested',
  'Preparing Documents',
  'Ready to Apply',
  'Submitted',
  'Completed',
];

export const STATUS_COLORS = {
  Interested: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'blue',
  },
  'Preparing Documents': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badge: 'amber',
  },
  'Ready to Apply': {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    badge: 'teal',
  },
  Submitted: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badge: 'navy',
  },
  Completed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badge: 'green',
  },
};

/**
 * Safe JSON parser with fallback to avoid crashing on malformed stored data.
 */
export function safeJsonParse(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn('Malformed JSON encountered in localStorage, falling back safely:', err);
    return fallback;
  }
}

// ==========================================
// 1. SAVED SCHEMES API
// ==========================================

export function getSavedSchemeIds() {
  if (typeof localStorage === 'undefined') return ['pm-kisan', 'pm-jay'];
  const raw = localStorage.getItem(SAVED_SCHEMES_KEY);
  const parsed = safeJsonParse(raw, null);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  // Default starting sample
  return ['pm-kisan', 'pm-jay'];
}

export function saveSavedSchemeIds(ids) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const cleanIds = Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' && id.trim()))] : [];
    localStorage.setItem(SAVED_SCHEMES_KEY, JSON.stringify(cleanIds));
    return true;
  } catch (err) {
    console.error('Failed to save saved schemes:', err);
    return false;
  }
}

export function isSchemeSaved(schemeId) {
  const ids = getSavedSchemeIds();
  return ids.includes(schemeId);
}

export function toggleSaveSchemeId(schemeId) {
  if (!schemeId) return false;
  const current = getSavedSchemeIds();
  const exists = current.includes(schemeId);
  const updated = exists ? current.filter((id) => id !== schemeId) : [...current, schemeId];
  saveSavedSchemeIds(updated);
  return !exists;
}

export function removeSavedSchemeId(schemeId) {
  const current = getSavedSchemeIds();
  const updated = current.filter((id) => id !== schemeId);
  saveSavedSchemeIds(updated);
  return updated;
}

// ==========================================
// 2. APPLICATION RECORDS API
// ==========================================

const DEFAULT_SAMPLE_APPLICATIONS = [
  {
    id: 'app_pm-kisan',
    schemeId: 'pm-kisan',
    schemeTitle: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    schemeCategory: 'Agriculture & Rural',
    officialPortal: 'https://pmkisan.gov.in',
    status: 'Preparing Documents',
    appliedDate: '2024-10-10',
    personalNotes: 'Obtained digital Khatauni from Bhulekh portal. Need to complete mobile e-KYC.',
    nextStepReminder: 'Visit Tehsil / CSC center for Aadhaar biometric verification',
    reminderDate: '2024-10-25',
    checklistProgress: { completed: 3, total: 4 },
    createdAt: '2024-10-01T10:00:00.000Z',
    updatedAt: '2024-10-10T14:30:00.000Z',
  },
  {
    id: 'app_pm-jay',
    schemeId: 'pm-jay',
    schemeTitle: 'Ayushman Bharat - PM Jan Arogya Yojana (AB-PMJAY)',
    schemeCategory: 'Health & Family Welfare',
    officialPortal: 'https://beneficiary.nha.gov.in',
    status: 'Interested',
    appliedDate: '',
    personalNotes: 'Checking if grandparents aged 70+ qualify under universal Ayushman cover.',
    nextStepReminder: 'Verify grandfather birth certificate on Beneficiary NHA portal',
    reminderDate: '2024-10-28',
    checklistProgress: { completed: 1, total: 3 },
    createdAt: '2024-10-05T12:00:00.000Z',
    updatedAt: '2024-10-05T12:00:00.000Z',
  },
];

export function getApplicationRecords() {
  if (typeof localStorage === 'undefined') return DEFAULT_SAMPLE_APPLICATIONS;
  const raw = localStorage.getItem(APPLICATION_RECORDS_KEY);
  if (!raw) {
    // Initialize default sample applications for immediate visual demonstration
    saveApplicationRecords(DEFAULT_SAMPLE_APPLICATIONS);
    return DEFAULT_SAMPLE_APPLICATIONS;
  }
  const parsed = safeJsonParse(raw, null);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return [];
}

export function saveApplicationRecords(records) {
  if (typeof localStorage === 'undefined') return false;
  try {
    if (!Array.isArray(records)) return false;
    localStorage.setItem(APPLICATION_RECORDS_KEY, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error('Failed to save application records:', err);
    return false;
  }
}

export function getApplicationRecord(schemeId) {
  const records = getApplicationRecords();
  return records.find((r) => r.schemeId === schemeId) || null;
}

export function saveApplicationRecord(record) {
  if (!record || !record.schemeId) return null;

  const records = getApplicationRecords();
  const existingIndex = records.findIndex((r) => r.schemeId === record.schemeId);

  const sanitized = {
    id: record.id || `app_${record.schemeId}`,
    schemeId: String(record.schemeId).trim(),
    schemeTitle: record.schemeTitle || 'Government Welfare Scheme',
    schemeCategory: record.schemeCategory || 'General Welfare',
    officialPortal: record.officialPortal || 'https://www.india.gov.in',
    status: APPLICATION_STATUSES.includes(record.status) ? record.status : 'Interested',
    appliedDate: record.appliedDate || '',
    personalNotes: typeof record.personalNotes === 'string' ? record.personalNotes.slice(0, 1000) : '',
    nextStepReminder: typeof record.nextStepReminder === 'string' ? record.nextStepReminder.slice(0, 300) : '',
    reminderDate: record.reminderDate || '',
    checklistProgress: record.checklistProgress || { completed: 0, total: 0 },
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let updatedRecords;
  if (existingIndex >= 0) {
    // Update existing record
    updatedRecords = [...records];
    updatedRecords[existingIndex] = {
      ...records[existingIndex],
      ...sanitized,
      createdAt: records[existingIndex].createdAt || sanitized.createdAt,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Insert new application record
    updatedRecords = [sanitized, ...records];
  }

  saveApplicationRecords(updatedRecords);
  return sanitized;
}

export function updateApplicationStatus(schemeId, newStatus) {
  if (!schemeId || !APPLICATION_STATUSES.includes(newStatus)) return null;
  const records = getApplicationRecords();
  const index = records.findIndex((r) => r.schemeId === schemeId);
  if (index === -1) return null;

  records[index] = {
    ...records[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  saveApplicationRecords(records);
  return records[index];
}

export function deleteApplicationRecord(schemeId) {
  const records = getApplicationRecords();
  const updated = records.filter((r) => r.schemeId !== schemeId);
  saveApplicationRecords(updated);
  return updated;
}

// ==========================================
// 3. EXPORT & IMPORT UTILITIES
// ==========================================

export function exportUserData() {
  if (typeof localStorage === 'undefined') return null;

  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    exportedBy: 'Sahayak AI Citizen Workspace',
    disclaimer: 'User-managed civic preparation data. Contains no official government credentials or sensitive passwords.',
    data: {
      savedSchemes: getSavedSchemeIds(),
      applicationRecords: getApplicationRecords(),
      generalDocuments: safeJsonParse(localStorage.getItem(GENERAL_DOCS_KEY), {}),
      schemeChecklists: safeJsonParse(localStorage.getItem(CHECKLIST_STORAGE_KEY), {}),
    },
  };

  return exportPayload;
}

export function downloadUserDataFile() {
  const payload = exportUserData();
  if (!payload) return false;

  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sahayak-citizen-workspace-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (err) {
    console.error('Failed to trigger JSON file download:', err);
    return false;
  }
}

/**
 * Validates and imports user data safely.
 * Returns { success: boolean, message: string, recordCount?: number }
 */
export function importUserData(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return { success: false, message: 'Invalid or empty JSON file.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { success: false, message: 'Invalid JSON format. Please upload a valid exported Sahayak workspace file.' };
  }

  // Schema sanity check
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, message: 'Invalid data format: Expected a JSON object.' };
  }

  const data = parsed.data || parsed; // Support wrapped or direct payload

  // Validate saved schemes
  let savedCount = 0;
  if (Array.isArray(data.savedSchemes)) {
    const validSaved = data.savedSchemes.filter((id) => typeof id === 'string' && id.trim());
    saveSavedSchemeIds(validSaved);
    savedCount = validSaved.length;
  }

  // Validate application records
  let appCount = 0;
  if (Array.isArray(data.applicationRecords)) {
    const validApps = [];
    const seenSchemeIds = new Set();

    data.applicationRecords.forEach((app) => {
      if (app && app.schemeId && typeof app.schemeId === 'string' && !seenSchemeIds.has(app.schemeId)) {
        seenSchemeIds.add(app.schemeId);
        validApps.push({
          id: app.id || `app_${app.schemeId}`,
          schemeId: String(app.schemeId).trim(),
          schemeTitle: String(app.schemeTitle || 'Government Welfare Scheme'),
          schemeCategory: String(app.schemeCategory || 'General Welfare'),
          officialPortal: String(app.officialPortal || 'https://www.india.gov.in'),
          status: APPLICATION_STATUSES.includes(app.status) ? app.status : 'Interested',
          appliedDate: typeof app.appliedDate === 'string' ? app.appliedDate : '',
          personalNotes: typeof app.personalNotes === 'string' ? app.personalNotes.slice(0, 1000) : '',
          nextStepReminder: typeof app.nextStepReminder === 'string' ? app.nextStepReminder.slice(0, 300) : '',
          reminderDate: typeof app.reminderDate === 'string' ? app.reminderDate : '',
          checklistProgress: app.checklistProgress || { completed: 0, total: 0 },
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    saveApplicationRecords(validApps);
    appCount = validApps.length;
  }

  // Validate general documents
  if (data.generalDocuments && typeof data.generalDocuments === 'object' && !Array.isArray(data.generalDocuments)) {
    try {
      localStorage.setItem(GENERAL_DOCS_KEY, JSON.stringify(data.generalDocuments));
    } catch {}
  }

  // Validate scheme checklists
  if (data.schemeChecklists && typeof data.schemeChecklists === 'object' && !Array.isArray(data.schemeChecklists)) {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(data.schemeChecklists));
    } catch {}
  }

  return {
    success: true,
    message: `Workspace imported successfully: ${appCount} applications and ${savedCount} saved schemes restored.`,
    appCount,
    savedCount,
  };
}

// ==========================================
// 4. CLEAR ALL DATA
// ==========================================

export function clearAllUserData() {
  if (typeof localStorage === 'undefined') return true;
  try {
    localStorage.removeItem(SAVED_SCHEMES_KEY);
    localStorage.removeItem(APPLICATION_RECORDS_KEY);
    localStorage.removeItem(GENERAL_DOCS_KEY);
    localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear all user data:', err);
    return false;
  }
}
