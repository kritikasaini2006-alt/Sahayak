import { evaluateEligibility, sanitizeProfileForStorage } from '../src/utils/eligibilityEngine.js';
import { SAMPLE_PROFILES } from '../src/data/sampleProfiles.js';

console.log('====================================================');
console.log('🧪 RUNNING SAHAYAK AI ELIGIBILITY ENGINE TESTS');
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
// Test 1: Sample 1 - Small Farmer in UP
// -------------------------------------------------------------
console.log('Test Suite 1: Evaluating Sample 1 (Small Farmer, UP, ₹75k, Rural, BPL)');
const farmerResults = evaluateEligibility(SAMPLE_PROFILES[0].data);

const pmKisan = farmerResults.all.find((s) => s.schemeId === 'pm-kisan');
assert(pmKisan && pmKisan.status === 'likely_eligible', 'PM-KISAN is Likely Eligible for small farmer');
assert(pmKisan && pmKisan.reasons.some((r) => r.includes('agricultural farming')), 'PM-KISAN identifies agricultural farming occupation');

const pmJay = farmerResults.all.find((s) => s.schemeId === 'pm-jay');
assert(pmJay && pmJay.status === 'likely_eligible', 'PM-JAY is Likely Eligible for BPL cardholder');

const pmayG = farmerResults.all.find((s) => s.schemeId === 'pmay-g');
assert(pmayG && pmayG.status === 'likely_eligible', 'PMAY-G is Likely Eligible for rural kutcha house inhabitant');

const ignoaps = farmerResults.all.find((s) => s.schemeId === 'nsap-oaps');
assert(ignoaps && ignoaps.status === 'not_eligible', 'IGNOAPS (Old Age Pension) is Not Eligible for 42-year old');
assert(ignoaps && ignoaps.unmet.some((u) => u.includes('Minimum qualifying age is 60')), 'IGNOAPS explains age requirement');

// -------------------------------------------------------------
// Test 2: Sample 2 - Urban Artisan / Tailor in MH with Girl Child
// -------------------------------------------------------------
console.log('\nTest Suite 2: Evaluating Sample 2 (Urban Artisan, Tailor, MH, Female, Girl Child)');
const artisanResults = evaluateEligibility(SAMPLE_PROFILES[1].data);

const vishwakarma = artisanResults.all.find((s) => s.schemeId === 'pm-vishwakarma');
assert(vishwakarma && vishwakarma.status === 'likely_eligible', 'PM Vishwakarma is Likely Eligible for traditional artisan');
assert(vishwakarma && vishwakarma.reasons.some((r) => r.includes('Tailor (Darzi)')), 'PM Vishwakarma recognizes Tailor trade');

const ssy = artisanResults.all.find((s) => s.schemeId === 'sukanya-samriddhi');
assert(ssy && ssy.status === 'likely_eligible', 'Sukanya Samriddhi is Likely Eligible for family with girl child <= 10');

const mudra = artisanResults.all.find((s) => s.schemeId === 'pm-mudra');
assert(mudra && mudra.status === 'likely_eligible', 'PM MUDRA is Likely Eligible for artisan/micro-enterprise');

const pmayG2 = artisanResults.all.find((s) => s.schemeId === 'pmay-g');
assert(pmayG2 && pmayG2.status === 'not_eligible', 'PMAY-G is Not Eligible for urban resident');
assert(pmayG2 && pmayG2.unmet.some((u) => u.includes('rural')), 'PMAY-G explains urban exclusion');

// -------------------------------------------------------------
// Test 3: Sample 3 - Elderly BPL Citizen in Bihar (Age 68, Income ₹40k)
// -------------------------------------------------------------
console.log('\nTest Suite 3: Evaluating Sample 3 (Elderly BPL Citizen, Age 68, Income ₹40k)');
const seniorResults = evaluateEligibility(SAMPLE_PROFILES[2].data);

const seniorPension = seniorResults.all.find((s) => s.schemeId === 'nsap-oaps');
assert(seniorPension && seniorPension.status === 'likely_eligible', 'IGNOAPS is Likely Eligible for 68-year old BPL citizen');

const seniorAyushman = seniorResults.all.find((s) => s.schemeId === 'pm-jay');
assert(seniorAyushman && seniorAyushman.status === 'likely_eligible', 'PM-JAY is Likely Eligible for low income BPL household');

const farmerScheme = seniorResults.all.find((s) => s.schemeId === 'pm-kisan');
assert(farmerScheme && farmerScheme.status === 'not_eligible', 'PM-KISAN is Not Eligible for non-farmer');

// -------------------------------------------------------------
// Test 4: Sample 4 - High-Income Salaried Professional (Income ₹12L)
// -------------------------------------------------------------
console.log('\nTest Suite 4: Evaluating Sample 4 (High-Income Salaried, Income ₹12L)');
const salariedResults = evaluateEligibility(SAMPLE_PROFILES[3].data);

assert(salariedResults.summary.likelyCount === 0, 'Zero welfare schemes are Likely Eligible for high-income corporate salaried');
const highIncomeKisan = salariedResults.all.find((s) => s.schemeId === 'pm-kisan');
assert(highIncomeKisan && highIncomeKisan.unmet.length > 0, 'PM-KISAN records high income and non-farmer disqualifications');

// -------------------------------------------------------------
// Test 5: Profile Sanitization & Storage Safety
// -------------------------------------------------------------
console.log('\nTest Suite 5: Checking Profile Sanitization (No sensitive leakages)');
const unsafeProfile = {
  ...SAMPLE_PROFILES[0].data,
  fullName: 'Ram Kumar',
  aadhaarNumber: '1234-5678-9012',
  bankAccount: '987654321',
  phoneNumber: '9876543210',
};
const cleaned = sanitizeProfileForStorage(unsafeProfile);
assert(!cleaned.fullName && !cleaned.aadhaarNumber && !cleaned.bankAccount && !cleaned.phoneNumber, 'Sanitization strips sensitive personal data');
assert(cleaned.age === 42 && cleaned.state === 'Uttar Pradesh' && cleaned.annualIncome === 75000, 'Sanitization preserves relevant eligibility criteria');

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} tests passed`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
