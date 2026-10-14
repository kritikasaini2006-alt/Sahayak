import { evaluateEligibility, sanitizeProfileForStorage } from '../src/utils/eligibilityEngine.js';
import { SCHEME_RULES } from '../src/data/schemeRules.js';
import { MOCK_SCHEMES } from '../src/data/mockSchemes.js';

async function runEligibilityTests() {
  console.log('--- Sahayak AI Eligibility Screener & Matching Engine Unit Tests ---');
  let failures = 0;

  // Test 1: Small landholding farmer profile
  try {
    const farmerProfile = {
      age: 45,
      gender: 'male',
      state: 'Uttar Pradesh',
      areaType: 'rural',
      occupation: 'farmer',
      farmerLandholding: 'marginal_small',
      annualIncome: 120000,
      housingType: 'kutcha',
    };

    const res = evaluateEligibility(farmerProfile);
    const pmKisan = res.all.find((r) => r.schemeId === 'pm-kisan');

    if (pmKisan && pmKisan.status === 'likely_eligible') {
      console.log('✅ Test 1 Passed: Small landholding farmer evaluated as Likely Eligible for PM-KISAN.');
    } else {
      console.error('❌ Test 1 Failed: PM-KISAN status expected likely_eligible, got:', pmKisan);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Senior Citizen aged 70+ universal healthcare cover (Cabinet Sept 2024 decision)
  try {
    const seniorProfile = {
      age: 72,
      gender: 'female',
      state: 'Maharashtra',
      areaType: 'urban',
      occupation: 'retired',
      annualIncome: 600000, // Even with higher income, 70+ seniors are universally eligible
    };

    const res = evaluateEligibility(seniorProfile);
    const pmjay = res.all.find((r) => r.schemeId === 'pm-jay');

    if (pmjay && pmjay.status === 'likely_eligible') {
      console.log('✅ Test 2 Passed: Senior citizen aged 70+ evaluated as Likely Eligible for Ayushman Bharat under universal cover.');
    } else {
      console.error('❌ Test 2 Failed: Ayushman status expected likely_eligible for age 72, got:', pmjay);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: High income / institutional disqualification
  try {
    const highIncomeProfile = {
      age: 38,
      gender: 'male',
      state: 'Karnataka',
      areaType: 'urban',
      occupation: 'salaried_private',
      annualIncome: 1500000, // Income Tax Payee (> ₹10L)
    };

    const res = evaluateEligibility(highIncomeProfile);
    const pmKisan = res.all.find((r) => r.schemeId === 'pm-kisan');
    const pmayg = res.all.find((r) => r.schemeId === 'pmay-g');

    if (
      pmKisan &&
      pmKisan.status === 'not_eligible' &&
      pmayg &&
      pmayg.status === 'not_eligible'
    ) {
      console.log('✅ Test 3 Passed: High income profile properly disqualified from means-tested / rural subsidies.');
    } else {
      console.error('❌ Test 3 Failed: High income profile was not disqualified:', pmKisan?.status, pmayg?.status);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Traditional Artisan Profile -> PM Vishwakarma
  try {
    const artisanProfile = {
      age: 32,
      gender: 'male',
      state: 'Rajasthan',
      areaType: 'rural',
      occupation: 'artisan',
      artisanTrade: 'carpenter',
      annualIncome: 180000,
    };

    const res = evaluateEligibility(artisanProfile);
    const vishwakarma = res.all.find((r) => r.schemeId === 'pm-vishwakarma');

    if (vishwakarma && vishwakarma.status === 'likely_eligible') {
      console.log('✅ Test 4 Passed: Traditional artisan (carpenter) correctly evaluated as Likely Eligible for PM Vishwakarma.');
    } else {
      console.error('❌ Test 4 Failed: Expected likely_eligible for PM Vishwakarma, got:', vishwakarma);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Urban Street Vendor -> PM SVANidhi
  try {
    const vendorProfile = {
      age: 29,
      gender: 'male',
      state: 'Delhi',
      areaType: 'urban',
      occupation: 'micro_business',
      annualIncome: 140000,
    };

    const res = evaluateEligibility(vendorProfile);
    const svanidhi = res.all.find((r) => r.schemeId === 'pm-svanidhi');

    if (svanidhi && svanidhi.status === 'likely_eligible') {
      console.log('✅ Test 5 Passed: Urban street vendor correctly evaluated as Likely Eligible for PM SVANidhi.');
    } else {
      console.error('❌ Test 5 Failed: Expected likely_eligible for PM SVANidhi, got:', svanidhi);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  // Test 6: Incomplete / Missing information -> Possibly Eligible
  try {
    const sparseProfile = {
      age: 30,
      state: 'Bihar',
      // No occupation, income, or land details provided
    };

    const res = evaluateEligibility(sparseProfile);
    const pmKisan = res.all.find((r) => r.schemeId === 'pm-kisan');

    if (pmKisan && pmKisan.status === 'possibly_eligible' && pmKisan.missing.length > 0) {
      console.log('✅ Test 6 Passed: Unspecified criteria correctly results in Possibly Eligible with missing information listed.');
    } else {
      console.error('❌ Test 6 Failed: Expected possibly_eligible for sparse profile, got:', pmKisan);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 6 Exception:', err);
    failures++;
  }

  // Test 7: Profile Sanitization for Safe Storage
  try {
    const dirtyProfile = {
      age: '40',
      state: 'Punjab',
      annualIncome: '250000',
      unauthorizedField: 'MALICIOUS_INJECTION',
      aadhaarNumber: '1234-5678-9012', // Sensitive credential
      bankPassword: 'my_secret_password', // Sensitive credential
    };

    const sanitized = sanitizeProfileForStorage(dirtyProfile);

    if (
      sanitized.age === 40 &&
      sanitized.annualIncome === 250000 &&
      sanitized.unauthorizedField === undefined &&
      sanitized.aadhaarNumber === undefined &&
      sanitized.bankPassword === undefined
    ) {
      console.log('✅ Test 7 Passed: Profile sanitization securely strips sensitive credentials and unknown fields.');
    } else {
      console.error('❌ Test 7 Failed: Sanitization leaked unauthorized fields:', sanitized);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 7 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 7 ELIGIBILITY TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runEligibilityTests();
