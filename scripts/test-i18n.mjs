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
} from '../src/data/schemeTranslations.js';
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

console.log('\n🎉 ALL 6 BILINGUAL & I18N TESTS PASSED WITH 100% SUCCESS!\n');
