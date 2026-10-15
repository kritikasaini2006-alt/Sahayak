import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { en } from '../src/locales/en.js';
import { hi } from '../src/locales/hi.js';
import {
  SCHEME_TRANSLATIONS,
  CATEGORY_TRANSLATIONS,
  BENEFICIARY_TRANSLATIONS,
  SCHEME_TYPE_TRANSLATIONS,
  STATUS_TRANSLATIONS,
  EVALUATION_TEXT_TRANSLATIONS,
} from '../src/data/schemeTranslations.js';
import { GUIDANCE_TRANSLATIONS } from '../src/data/schemeGuidanceTranslations.js';
import { SCHEME_GUIDANCE } from '../src/data/schemeGuidance.js';
import { MOCK_SCHEMES as mockSchemes } from '../src/data/mockSchemes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Sahayak AI Bilingual & i18n System Unit Tests ---');

// Helper to flatten nested object keys
function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

// ==========================================
// Test 1: Translation Dictionary Parity
// ==========================================
const enKeys = getDeepKeys(en);
const hiKeys = getDeepKeys(hi);
console.log(`ℹ Total English keys indexed: ${enKeys.length}`);
console.log(`ℹ Total Hindi keys indexed: ${hiKeys.length}`);

let missingInHindi = [];
for (const key of enKeys) {
  const hiVal = getNestedValue(hi, key);
  if (hiVal === undefined || hiVal === null || (typeof hiVal === 'string' && hiVal.trim() === '')) {
    missingInHindi.push(key);
  }
}

if (missingInHindi.length === 0) {
  console.log(`✅ Test 1 Passed: 100% dictionary parity! All ${enKeys.length} English keys have valid Hindi translations.`);
} else {
  console.error(`❌ Test 1 Failed: Missing ${missingInHindi.length} keys in Hindi dictionary:`, missingInHindi.slice(0, 10));
  process.exit(1);
}

// ==========================================
// Test 2: Fallback Logic & Parameter Interpolation
// ==========================================
function simulateT(lang, keyPath, params = {}) {
  const dicts = { en, hi };
  let val = getNestedValue(dicts[lang], keyPath);
  if (val === undefined || val === null || val === '') {
    val = getNestedValue(dicts.en, keyPath);
  }
  if (val === undefined || val === null) {
    return keyPath;
  }
  if (typeof val === 'string' && params && Object.keys(params).length > 0) {
    return val.replace(/\{(\w+)\}/g, (_, match) => {
      return params[match] !== undefined ? params[match] : `{${match}}`;
    });
  }
  return val;
}

// Test missing key fallback
const fallbackVal = simulateT('hi', 'nonexistent.test.key');
if (fallbackVal === 'nonexistent.test.key') {
  console.log('✅ Test 2a Passed: Non-existent keys safely fallback to key path without throwing.');
} else {
  console.error('❌ Test 2a Failed: Fallback did not return key path.');
  process.exit(1);
}

// Test interpolation
const interpolatedEn = simulateT('en', 'schemes.showingCount', { count: 12 });
const interpolatedHi = simulateT('hi', 'schemes.showingCount', { count: 12 });
if (interpolatedEn.includes('12') && interpolatedHi.includes('12')) {
  console.log(`✅ Test 2b Passed: Parameter interpolation successful ('${interpolatedEn}' & '${interpolatedHi}').`);
} else {
  console.error('❌ Test 2b Failed: Interpolation failed for count.');
  process.exit(1);
}

// ==========================================
// Test 3: Scheme Metadata Completeness
// ==========================================
const totalSchemes = mockSchemes.length;
let schemesWithCompleteTranslations = 0;

for (const scheme of mockSchemes) {
  const trans = SCHEME_TRANSLATIONS[scheme.id];
  if (
    trans &&
    trans.title &&
    trans.ministry &&
    trans.category &&
    trans.shortDescription &&
    trans.financialBenefit &&
    Array.isArray(trans.keywords) &&
    trans.keywords.length > 0
  ) {
    schemesWithCompleteTranslations++;
  } else {
    console.error(`Missing or incomplete Hindi translation for scheme ID: ${scheme.id}`);
  }
}

if (schemesWithCompleteTranslations === totalSchemes && totalSchemes >= 10) {
  console.log(`✅ Test 3 Passed: All ${totalSchemes} verified schemes have complete localized Hindi metadata and Devanagari keywords.`);
} else {
  console.error(`❌ Test 3 Failed: Only ${schemesWithCompleteTranslations}/${totalSchemes} schemes translated.`);
  process.exit(1);
}

// ==========================================
// Test 4: Bilingual Scheme Search Matching
// ==========================================
function searchSchemes(query) {
  const cleanQuery = query.toLowerCase().trim();
  return mockSchemes.filter((scheme) => {
    const hiData = SCHEME_TRANSLATIONS[scheme.id] || {};
    const searchFields = [
      scheme.title,
      scheme.shortDescription,
      scheme.category,
      scheme.financialBenefit,
      hiData.title,
      hiData.shortDescription,
      hiData.category,
      hiData.financialBenefit,
      ...(scheme.tags || []),
      ...(hiData.keywords || []),
    ]
      .filter(Boolean)
      .map((f) => f.toLowerCase());

    return searchFields.some((field) => field.includes(cleanQuery));
  });
}

const hindiQueries = [
  { q: 'किसान', expectId: 'pm-kisan' },
  { q: 'आयुष्मान', expectId: 'pm-jay' },
  { q: 'आवास', expectId: 'pmay-g' },
  { q: 'सुकन्या', expectId: 'sukanya-samriddhi' },
  { q: 'मुद्रा', expectId: 'pm-mudra' },
  { q: 'कारीगर', expectId: 'pm-vishwakarma' },
  { q: 'रेहड़ी', expectId: 'pm-svanidhi' },
  { q: 'पेंशन', expectId: 'nsap-oaps' },
  { q: 'उज्ज्वला', expectId: 'pmuy' },
];

let hindiSearchPassed = true;
for (const testCase of hindiQueries) {
  const results = searchSchemes(testCase.q);
  const found = results.some((r) => r.id === testCase.expectId);
  if (!found) {
    console.error(`❌ Devanagari search for '${testCase.q}' failed to match scheme '${testCase.expectId}'.`);
    hindiSearchPassed = false;
  }
}

if (hindiSearchPassed) {
  console.log(`✅ Test 4 Passed: Bilingual search matching verified across all ${hindiQueries.length} Devanagari test queries.`);
} else {
  console.error('❌ Test 4 Failed: Bilingual search query failed.');
  process.exit(1);
}

// ==========================================
// Test 5: Category & Status Translations
// ==========================================
const expectedCategories = [
  'Agriculture & Rural',
  'Health & Family Welfare',
  'Housing & Shelter',
  'Women & Child Development',
  'Financial Inclusion & Loans',
  'Social Security & Pensions',
  'Artisans & Craftsmen',
  'Urban Livelihoods & Vendors',
];

let allCategoriesTranslated = true;
for (const cat of expectedCategories) {
  if (!CATEGORY_TRANSLATIONS[cat]) {
    console.error(`Missing category translation for: ${cat}`);
    allCategoriesTranslated = false;
  }
}

const expectedStatuses = ['interested', 'preparing_docs', 'ready_to_apply', 'submitted', 'completed'];
let allStatusesTranslated = true;
for (const st of expectedStatuses) {
  if (!STATUS_TRANSLATIONS[st]) {
    console.error(`Missing status translation for: ${st}`);
    allStatusesTranslated = false;
  }
}

if (allCategoriesTranslated && allStatusesTranslated) {
  console.log('✅ Test 5 Passed: All welfare categories and application statuses have authentic Hindi translations.');
} else {
  console.error('❌ Test 5 Failed: Category or status translation missing.');
  process.exit(1);
}

// ==========================================
// Test 6: Typography & Font Assets
// ==========================================
const indexHtmlPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const hasDevanagariFont = indexHtml.includes('Noto+Sans+Devanagari');

const tailwindConfigPath = path.resolve(__dirname, '../tailwind.config.js');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
const hasDevanagariInTailwind = tailwindConfig.includes('Noto Sans Devanagari');

if (hasDevanagariFont && hasDevanagariInTailwind) {
  console.log('✅ Test 6 Passed: Noto Sans Devanagari Google Font included and configured in Tailwind sans font family.');
} else {
  console.error('❌ Test 6 Failed: Noto Sans Devanagari font configuration missing.');
  process.exit(1);
}

// ==========================================
// Test 7: Scheme Array Content Translations (Eligibility, Documents, Steps, Benefits)
// ==========================================
let arrayFieldsPassed = true;
for (const scheme of mockSchemes) {
  const trans = SCHEME_TRANSLATIONS[scheme.id];
  if (!trans) {
    console.error(`❌ Missing translation for scheme ${scheme.id}`);
    arrayFieldsPassed = false;
    continue;
  }

  const requiredArrays = ['eligibilityCriteria', 'documentsRequired', 'benefitDetails', 'applicationSteps'];
  for (const field of requiredArrays) {
    if (!Array.isArray(trans[field]) || trans[field].length === 0) {
      console.error(`❌ Scheme ${scheme.id} is missing Hindi array '${field}'`);
      arrayFieldsPassed = false;
    } else {
      // Check each element is a non-empty string
      for (const item of trans[field]) {
        if (!item || typeof item !== 'string' || item.trim() === '') {
          console.error(`❌ Scheme ${scheme.id} field '${field}' has empty item`);
          arrayFieldsPassed = false;
        }
      }
    }
  }

  if (typeof trans.applicationMode !== 'string' || !trans.applicationMode.trim()) {
    console.error(`❌ Scheme ${scheme.id} is missing Hindi applicationMode`);
    arrayFieldsPassed = false;
  }
}

if (arrayFieldsPassed) {
  console.log('✅ Test 7 Passed: All 10 schemes have complete localized Hindi array fields (eligibility criteria, required documents, benefit details, application steps, application mode).');
} else {
  console.error('❌ Test 7 Failed: Scheme array content translation check failed.');
  process.exit(1);
}

// ==========================================
// Test 8: Guidance Translations (Documents, Steps, Prerequisites, Review Checklist)
// ==========================================
let guidanceTranslationsPassed = true;
for (const scheme of mockSchemes) {
  const gTrans = GUIDANCE_TRANSLATIONS[scheme.id];
  const originalGuidance = SCHEME_GUIDANCE[scheme.id];

  if (!gTrans) {
    console.error(`❌ Missing GUIDANCE_TRANSLATIONS for scheme ${scheme.id}`);
    guidanceTranslationsPassed = false;
    continue;
  }

  if (!originalGuidance) {
    console.error(`❌ Missing SCHEME_GUIDANCE for scheme ${scheme.id}`);
    guidanceTranslationsPassed = false;
    continue;
  }

  // Verify documents count & fields
  if (!Array.isArray(gTrans.documents) || gTrans.documents.length !== originalGuidance.documents.length) {
    console.error(`❌ GUIDANCE_TRANSLATIONS for ${scheme.id} documents count mismatch: expected ${originalGuidance.documents.length}, got ${gTrans.documents?.length}`);
    guidanceTranslationsPassed = false;
  } else {
    for (const doc of gTrans.documents) {
      if (!doc.id || !doc.name || !doc.purpose || !doc.howToObtain) {
        console.error(`❌ GUIDANCE_TRANSLATIONS for ${scheme.id} document ${doc.id} missing required fields`);
        guidanceTranslationsPassed = false;
      }
    }
  }

  // Verify steps count & fields
  if (!Array.isArray(gTrans.steps) || gTrans.steps.length !== originalGuidance.steps.length) {
    console.error(`❌ GUIDANCE_TRANSLATIONS for ${scheme.id} steps count mismatch: expected ${originalGuidance.steps.length}, got ${gTrans.steps?.length}`);
    guidanceTranslationsPassed = false;
  } else {
    for (const step of gTrans.steps) {
      if (!step.stepNumber || !step.title || !step.description) {
        console.error(`❌ GUIDANCE_TRANSLATIONS for ${scheme.id} step ${step.stepNumber} missing required fields`);
        guidanceTranslationsPassed = false;
      }
    }
  }

  // Verify prerequisites, reviewChecklist, and stateVarianceNote
  if (!Array.isArray(gTrans.prerequisites) || gTrans.prerequisites.length === 0) {
    console.error(`❌ Missing prerequisites for ${scheme.id}`);
    guidanceTranslationsPassed = false;
  }
  if (!Array.isArray(gTrans.reviewChecklist) || gTrans.reviewChecklist.length === 0) {
    console.error(`❌ Missing reviewChecklist for ${scheme.id}`);
    guidanceTranslationsPassed = false;
  }
  if (!gTrans.stateVarianceNote || typeof gTrans.stateVarianceNote !== 'string') {
    console.error(`❌ Missing stateVarianceNote for ${scheme.id}`);
    guidanceTranslationsPassed = false;
  }
}

if (guidanceTranslationsPassed) {
  console.log('✅ Test 8 Passed: Full application guidance datasets (documents, procurement guides, steps, prerequisites, review checklists) verified across all 10 schemes.');
} else {
  console.error('❌ Test 8 Failed: Guidance translation test failed.');
  process.exit(1);
}

// ==========================================
// Test 9: Rule Evaluation Outcome Translations
// ==========================================
const sampleEvaluationStrings = [
  'Primary occupation is agricultural farming.',
  'Income tax payees are excluded under statutory PM-KISAN exclusion criteria.',
  'Senior citizen (age 70+) universally eligible under expanded Ayushman Vay Vandana cover.',
  'Living in kutcha house meets core housing deprivation criteria.',
  'Family has a girl child under 10 years of age (core qualifying criterion).',
  'Self-employed/micro-enterprise sector eligible for MUDRA credit facilities.',
  'Engaged in recognized traditional artisan trade.',
  'Meets senior citizen pension age requirement (60+ years).',
  'Urban street vending / daily livelihood sector eligible.',
  'Entry age within eligible range (18 to 40 years).',
];

let evaluationTranslationsPassed = true;
for (const sample of sampleEvaluationStrings) {
  const trans = EVALUATION_TEXT_TRANSLATIONS[sample];
  if (!trans || typeof trans !== 'string' || trans.trim() === '') {
    console.error(`❌ Missing evaluation text translation for: "${sample}"`);
    evaluationTranslationsPassed = false;
  }
}

if (evaluationTranslationsPassed) {
  console.log(`✅ Test 9 Passed: Eligibility rule evaluation reasons and disqualification criteria translate to authentic Hindi.`);
} else {
  console.error('❌ Test 9 Failed: Missing evaluation translations.');
  process.exit(1);
}

// ==========================================
// Test 10: English Non-Regression & Pure Content Preservation
// ==========================================
let englishNonRegressionPassed = true;
for (const scheme of mockSchemes) {
  if (!scheme.title || !scheme.shortDescription || !scheme.financialBenefit || !Array.isArray(scheme.eligibilityCriteria) || !Array.isArray(scheme.documentsRequired)) {
    console.error(`❌ Original scheme ${scheme.id} English fields were corrupted`);
    englishNonRegressionPassed = false;
  }
  // Check URLs remain official gov / nic portals
  const isOfficial =
    scheme.officialPortal.includes('.gov.in') ||
    scheme.officialPortal.includes('.nic.in') ||
    scheme.officialPortal.includes('mudra.org.in') ||
    scheme.officialPortal.includes('maandhan.in');
  if (!isOfficial) {
    console.error(`❌ Scheme ${scheme.id} portal URL invalid: ${scheme.officialPortal}`);
    englishNonRegressionPassed = false;
  }
}

if (englishNonRegressionPassed) {
  console.log('✅ Test 10 Passed: English content and official government portal URLs preserved without regression.');
} else {
  console.error('❌ Test 10 Failed: English non-regression test failed.');
  process.exit(1);
}

console.log('\n🎉 ALL 10 BILINGUAL & I18N TESTS PASSED WITH 100% SUCCESS!\n');
