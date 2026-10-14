import {
  APPLICATION_STATUSES,
  getSavedSchemeIds,
  saveSavedSchemeIds,
  isSchemeSaved,
  toggleSaveSchemeId,
  removeSavedSchemeId,
  getApplicationRecords,
  saveApplicationRecord,
  updateApplicationStatus,
  deleteApplicationRecord,
  exportUserData,
  importUserData,
  clearAllUserData,
  safeJsonParse,
  SAVED_SCHEMES_KEY,
  APPLICATION_RECORDS_KEY,
} from '../src/utils/applicationStorage.js';

// Setup mock localStorage in Node
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

async function runApplicationTests() {
  console.log('--- Sahayak AI Saved Schemes & My Applications Unit Tests ---');
  let failures = 0;

  // Test 1: Saved Schemes Management
  try {
    saveSavedSchemeIds(['pm-kisan', 'pm-jay']);
    if (isSchemeSaved('pm-kisan') && !isSchemeSaved('pmay-g')) {
      toggleSaveSchemeId('pmay-g');
      if (isSchemeSaved('pmay-g')) {
        removeSavedSchemeId('pm-kisan');
        if (!isSchemeSaved('pm-kisan')) {
          console.log('✅ Test 1 Passed: Saved schemes add, toggle, check, and remove operations work correctly.');
        } else {
          console.error('❌ Test 1 Failed: Scheme was not removed');
          failures++;
        }
      } else {
        console.error('❌ Test 1 Failed: Scheme was not toggled on');
        failures++;
      }
    } else {
      console.error('❌ Test 1 Failed: Initial saved schemes verification failed');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Application Records & Status Lifecycle
  try {
    const newRecord = {
      schemeId: 'pm-mudra',
      schemeTitle: 'Pradhan Mantri MUDRA Yojana',
      schemeCategory: 'Financial Inclusion & Loans',
      status: 'Interested',
      appliedDate: '2024-10-15',
      personalNotes: 'Planning to request Shishu tier for small shop expansion.',
      nextStepReminder: 'Get quotation from machinery supplier',
      reminderDate: '2024-10-22',
      checklistProgress: { completed: 2, total: 4 },
    };

    saveApplicationRecord(newRecord);
    let records = getApplicationRecords();
    const created = records.find((r) => r.schemeId === 'pm-mudra');

    if (created && created.status === 'Interested' && created.nextStepReminder.includes('quotation')) {
      // Test status updates through all 5 statuses
      for (const st of APPLICATION_STATUSES) {
        updateApplicationStatus('pm-mudra', st);
        const updated = getApplicationRecords().find((r) => r.schemeId === 'pm-mudra');
        if (updated.status !== st) {
          throw new Error(`Failed to update status to ${st}`);
        }
      }
      console.log('✅ Test 2 Passed: Application record creation and status updates across all 5 statuses work as expected.');
    } else {
      console.error('❌ Test 2 Failed: Record was not saved properly:', created);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Export & Import of User Workspace
  try {
    const exported = exportUserData();
    if (
      exported &&
      exported.version === '1.0' &&
      Array.isArray(exported.data.savedSchemes) &&
      Array.isArray(exported.data.applicationRecords)
    ) {
      // Test Import
      const importPayload = {
        version: '1.0',
        data: {
          savedSchemes: ['sukanya-samriddhi', 'pm-vishwakarma'],
          applicationRecords: [
            {
              schemeId: 'sukanya-samriddhi',
              schemeTitle: 'Sukanya Samriddhi Yojana',
              status: 'Completed',
              personalNotes: 'Account opened at local post office.',
            },
          ],
        },
      };

      const result = importUserData(JSON.stringify(importPayload));
      if (result.success && isSchemeSaved('sukanya-samriddhi')) {
        const apps = getApplicationRecords();
        const ssyApp = apps.find((a) => a.schemeId === 'sukanya-samriddhi');
        if (ssyApp && ssyApp.status === 'Completed') {
          console.log('✅ Test 3 Passed: Workspace JSON export and import functions validate and restore data flawlessly.');
        } else {
          console.error('❌ Test 3 Failed: Imported application record not found:', apps);
          failures++;
        }
      } else {
        console.error('❌ Test 3 Failed: Import returned failure:', result);
        failures++;
      }
    } else {
      console.error('❌ Test 3 Failed: Invalid export structure:', exported);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Corruption Resistance on Malformed Data
  try {
    // Inject invalid JSON string into localStorage
    mockStorage[SAVED_SCHEMES_KEY] = '{{malformed-corrupt-json!!!';
    mockStorage[APPLICATION_RECORDS_KEY] = 'INVALID_ARRAY_DATA';

    const safeSaved = getSavedSchemeIds();
    const safeApps = getApplicationRecords();

    if (Array.isArray(safeSaved) && Array.isArray(safeApps)) {
      console.log('✅ Test 4 Passed: Malformed stored JSON in localStorage is handled safely without crashing.');
    } else {
      console.error('❌ Test 4 Failed: Expected arrays from corrupt data, got:', safeSaved, safeApps);
      failures++;
    }

    // Invalid JSON Import validation
    const badImportResult = importUserData('NOT_A_JSON');
    if (!badImportResult.success) {
      console.log('✅ Test 4b Passed: Malformed import string is rejected with friendly error message.');
    } else {
      console.error('❌ Test 4b Failed: Malformed JSON was accepted');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Clear All Data
  try {
    saveSavedSchemeIds(['pm-kisan']);
    saveApplicationRecord({ schemeId: 'pm-kisan', status: 'Submitted' });

    clearAllUserData();

    // After clear, saved schemes should be empty
    const afterClearSaved = safeJsonParse(mockStorage[SAVED_SCHEMES_KEY], []);
    const afterClearApps = safeJsonParse(mockStorage[APPLICATION_RECORDS_KEY], []);

    if (afterClearSaved.length === 0 && afterClearApps.length === 0) {
      console.log('✅ Test 5 Passed: Clear all user data cleanly resets all stored workspace keys.');
    } else {
      console.error('❌ Test 5 Failed: Data remained after clearAllUserData');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 5 APPLICATION & SAVED SCHEMES TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runApplicationTests();

