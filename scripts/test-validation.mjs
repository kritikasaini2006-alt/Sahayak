console.log('====================================================');
console.log('🧪 RUNNING SAHAYAK AI FORM VALIDATION TESTS');
console.log('====================================================\n');

function validateStep1(data) {
  const errors = {};
  if (!data.age && data.age !== 0) {
    errors.age = 'Please enter your age.';
  } else {
    const ageNum = Number(data.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = 'Please enter a valid age between 1 and 120.';
    }
  }

  if (!data.state) {
    errors.state = 'Please select your State or Union Territory.';
  }

  if (!data.areaType) {
    errors.areaType = 'Please select whether you live in a rural or urban area.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateStep2(data) {
  const errors = {};
  if (!data.occupation) {
    errors.occupation = 'Please select your primary occupation or livelihood.';
  }

  if (data.annualIncome === '' || data.annualIncome === undefined) {
    errors.annualIncome = 'Please provide an estimated annual household income (use 0 if none).';
  } else {
    const incomeNum = Number(data.annualIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      errors.annualIncome = 'Annual income must be a valid non-negative number.';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

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

// Step 1 tests
console.log('Test Suite 1: Demographics Validation (Step 1)');
assert(!validateStep1({ age: '', state: '', areaType: '' }).isValid, 'Empty form is invalid');
assert(validateStep1({ age: '-5', state: 'Bihar', areaType: 'rural' }).errors.age !== undefined, 'Negative age is caught');
assert(validateStep1({ age: '150', state: 'Bihar', areaType: 'rural' }).errors.age !== undefined, 'Age > 120 is caught');
assert(validateStep1({ age: 'abc', state: 'Bihar', areaType: 'rural' }).errors.age !== undefined, 'Non-numeric age is caught');
assert(validateStep1({ age: '35', state: '', areaType: 'rural' }).errors.state !== undefined, 'Missing state is caught');
assert(validateStep1({ age: '35', state: 'Bihar', areaType: '' }).errors.areaType !== undefined, 'Missing areaType is caught');
assert(validateStep1({ age: '35', state: 'Bihar', areaType: 'rural' }).isValid, 'Valid Step 1 succeeds');

// Step 2 tests
console.log('\nTest Suite 2: Livelihood & Income Validation (Step 2)');
assert(!validateStep2({ occupation: '', annualIncome: '' }).isValid, 'Empty Step 2 is invalid');
assert(validateStep2({ occupation: '', annualIncome: 50000 }).errors.occupation !== undefined, 'Missing occupation is caught');
assert(validateStep2({ occupation: 'farmer', annualIncome: '' }).errors.annualIncome !== undefined, 'Missing income is caught');
assert(validateStep2({ occupation: 'farmer', annualIncome: -100 }).errors.annualIncome !== undefined, 'Negative income is caught');
assert(validateStep2({ occupation: 'farmer', annualIncome: 0 }).isValid, 'Zero income is valid');
assert(validateStep2({ occupation: 'farmer', annualIncome: 75000 }).isValid, 'Valid Step 2 succeeds');

console.log('\n====================================================');
console.log(`📊 VALIDATION TEST RESULTS: ${passedTests} / ${totalTests} tests passed`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

