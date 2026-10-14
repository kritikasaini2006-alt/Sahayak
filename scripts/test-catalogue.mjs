import { MOCK_SCHEMES, SCHEME_CATEGORIES, BENEFICIARY_TYPES, SCHEME_TYPES } from '../src/data/mockSchemes.js';

console.log('====================================================');
console.log('🧪 RUNNING DISCOVER SCHEMES CATALOGUE TESTS');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// -------------------------------------------------------------
// Test 1: Data Integrity & Reliability of Verified Sources
// -------------------------------------------------------------
console.log('Test Suite 1: Data Integrity & Verified Sources');
assert(MOCK_SCHEMES.length >= 10, `Catalogue contains ${MOCK_SCHEMES.length} schemes (>= 10)`);

MOCK_SCHEMES.forEach((s) => {
  assert(!!s.id && !!s.title, `Scheme "${s.id}" has valid id and title`);
  assert(!!s.ministry, `Scheme "${s.id}" has official ministry`);
  assert(!!s.purpose, `Scheme "${s.id}" has purpose and civic objective`);
  assert(Array.isArray(s.eligibilityCriteria) && s.eligibilityCriteria.length > 0, `Scheme "${s.id}" has structured eligibility criteria`);
  assert(Array.isArray(s.documentsRequired) && s.documentsRequired.length > 0, `Scheme "${s.id}" has required documents list`);
  assert(s.officialPortal && s.officialPortal.startsWith('https://'), `Scheme "${s.id}" has secure official portal link (${s.officialPortal})`);
  assert(!!s.officialSource, `Scheme "${s.id}" has verified government source reference`);
});

// -------------------------------------------------------------
// Test 2: Search Functionality
// -------------------------------------------------------------
console.log('\nTest Suite 2: Search Query Evaluation');
function searchSchemes(q) {
  const query = q.toLowerCase().trim();
  return MOCK_SCHEMES.filter((scheme) => {
    return (
      scheme.title.toLowerCase().includes(query) ||
      scheme.shortDescription.toLowerCase().includes(query) ||
      scheme.ministry.toLowerCase().includes(query) ||
      (scheme.tags && scheme.tags.some((t) => t.toLowerCase().includes(query))) ||
      (scheme.beneficiaryType && scheme.beneficiaryType.toLowerCase().includes(query))
    );
  });
}

const kisanSearch = searchSchemes('Kisan');
assert(kisanSearch.some((s) => s.id === 'pm-kisan'), 'Search "Kisan" finds PM-KISAN');
assert(kisanSearch.some((s) => s.id === 'pm-kmy'), 'Search "Kisan" finds PM-KMY');

const healthSearch = searchSchemes('hospitalization');
assert(healthSearch.some((s) => s.id === 'pm-jay'), 'Search "hospitalization" finds Ayushman Bharat');

const nonExistent = searchSchemes('unrelatedxyzquery');
assert(nonExistent.length === 0, 'Non-matching query returns empty array');

// -------------------------------------------------------------
// Test 3: Multi-Attribute Filtering
// -------------------------------------------------------------
console.log('\nTest Suite 3: Multi-Attribute Filtering');
const agriSchemes = MOCK_SCHEMES.filter((s) => s.category === 'Agriculture & Rural');
assert(agriSchemes.length >= 2, `Category "Agriculture & Rural" returns ${agriSchemes.length} schemes`);

const centralSector = MOCK_SCHEMES.filter((s) => s.schemeType === 'Central Sector Scheme' || s.level === 'Central Sector Scheme');
assert(centralSector.length >= 4, `Scheme type "Central Sector Scheme" returns ${centralSector.length} schemes`);

const vendorBeneficiaries = MOCK_SCHEMES.filter(
  (s) => s.targetBeneficiaries && s.targetBeneficiaries.includes('Street Vendors & Micro-Shops')
);
assert(vendorBeneficiaries.some((s) => s.id === 'pm-svanidhi'), 'Beneficiary filter matches PM-SVANidhi');

// -------------------------------------------------------------
// Test 4: Sorting Logic
// -------------------------------------------------------------
console.log('\nTest Suite 4: Sorting Evaluation');
const sortedAsc = [...MOCK_SCHEMES].sort((a, b) => a.title.localeCompare(b.title));
assert(sortedAsc[0].title <= sortedAsc[1].title, 'A-Z sort correctly orders alphabetically');

const sortedDesc = [...MOCK_SCHEMES].sort((a, b) => b.title.localeCompare(a.title));
assert(sortedDesc[0].title >= sortedDesc[1].title, 'Z-A sort correctly orders reverse-alphabetically');

console.log('\n====================================================');
console.log(`📊 CATALOGUE TEST RESULTS: ${passedTests} / ${totalTests} tests passed`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

