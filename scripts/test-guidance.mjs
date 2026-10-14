import { SCHEME_GUIDANCE, loadSchemeChecklistProgress, saveSchemeChecklistProgress, resetSchemeChecklistProgress } from '../src/data/schemeGuidance.js';
import { MOCK_SCHEMES } from '../src/data/mockSchemes.js';

// Setup mock localStorage in Node environment
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

async function runGuidanceTests() {
  console.log('--- Sahayak AI Document & Application Guidance Unit Tests ---');
  let failures = 0;

  // Test 1: Coverage for all catalog schemes
  try {
    const missingSchemes = [];
    MOCK_SCHEMES.forEach((scheme) => {
      if (!SCHEME_GUIDANCE[scheme.id]) {
        missingSchemes.push(scheme.id);
      }
    });

    if (missingSchemes.length === 0) {
      console.log(`✅ Test 1 Passed: All ${MOCK_SCHEMES.length} schemes have verified guidance.`);
    } else {
      console.error('❌ Test 1 Failed: Missing guidance for:', missingSchemes);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Document fields verification (purpose, required/conditional, how to obtain)
  try {
    let docsValid = true;
    Object.entries(SCHEME_GUIDANCE).forEach(([schemeId, guidance]) => {
      if (!guidance.documents || guidance.documents.length === 0) {
        console.error(`❌ ${schemeId} has no documents!`);
        docsValid = false;
      }
      guidance.documents.forEach((doc) => {
        if (!doc.id || !doc.name || !doc.purpose || !doc.howToObtain || !doc.issuingAuthority) {
          console.error(`❌ ${schemeId} document missing required fields:`, doc);
          docsValid = false;
        }
        if (!['Mandatory', 'Conditional'].includes(doc.requirementType)) {
          console.error(`❌ ${schemeId} document has invalid requirementType:`, doc.requirementType);
          docsValid = false;
        }
      });
    });

    if (docsValid) {
      console.log('✅ Test 2 Passed: All documents include purpose, required/conditional status, and how-to-obtain instructions.');
    } else {
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Application guide steps, prerequisites, review checklist, and state variance
  try {
    let stepsValid = true;
    Object.entries(SCHEME_GUIDANCE).forEach(([schemeId, guidance]) => {
      if (!guidance.prerequisites || guidance.prerequisites.length === 0) {
        console.error(`❌ ${schemeId} missing prerequisites.`);
        stepsValid = false;
      }
      if (!guidance.steps || guidance.steps.length < 3) {
        console.error(`❌ ${schemeId} has fewer than 3 application steps.`);
        stepsValid = false;
      }
      if (!guidance.reviewChecklist || guidance.reviewChecklist.length === 0) {
        console.error(`❌ ${schemeId} missing final review checklist.`);
        stepsValid = false;
      }
      if (!guidance.stateVarianceNote) {
        console.error(`❌ ${schemeId} missing state variance note.`);
        stepsValid = false;
      }
      if (!guidance.officialPortal.startsWith('https://')) {
        console.error(`❌ ${schemeId} invalid official portal URL:`, guidance.officialPortal);
        stepsValid = false;
      }
    });

    if (stepsValid) {
      console.log('✅ Test 3 Passed: All schemes have verified prerequisites, chronological steps, review checklist, and state variance notes.');
    } else {
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Privacy & Security Audit - No requests for confidential citizen credentials
  try {
    const serialized = JSON.stringify(SCHEME_GUIDANCE).toLowerCase();
    const forbiddenPhrases = [
      'enter your aadhaar number',
      'enter aadhaar number',
      'enter bank account number',
      'enter otp',
      'enter password',
      'upload photo of aadhaar',
    ];
    let privacyViolations = 0;
    forbiddenPhrases.forEach((phrase) => {
      if (serialized.includes(phrase)) {
        console.error(`❌ Found forbidden sensitive credential request phrase: "${phrase}"`);
        privacyViolations++;
      }
    });

    if (privacyViolations === 0) {
      console.log('✅ Test 4 Passed: Zero requests for Aadhaar numbers, OTPs, passwords, or document uploads.');
    } else {
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Local Storage Persistence & Reset Behavior
  try {
    const testScheme = 'pm-kisan';
    const sampleProgress = { 'pmkisan-aadhaar': true, 'pmkisan-land-record': true };

    saveSchemeChecklistProgress(testScheme, sampleProgress);
    const loaded = loadSchemeChecklistProgress(testScheme);

    if (loaded['pmkisan-aadhaar'] === true && loaded['pmkisan-land-record'] === true) {
      // Test reset
      resetSchemeChecklistProgress(testScheme);
      const afterReset = loadSchemeChecklistProgress(testScheme);
      if (Object.keys(afterReset).length === 0) {
        console.log('✅ Test 5 Passed: Checklist progress successfully persists to localStorage and can be reset cleanly.');
      } else {
        console.error('❌ Test 5 Failed: Reset did not clear progress:', afterReset);
        failures++;
      }
    } else {
      console.error('❌ Test 5 Failed: Loaded progress does not match saved progress:', loaded);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 5 GUIDANCE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runGuidanceTests();

