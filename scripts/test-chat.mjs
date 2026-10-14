import { processChatRequest, generateSystemPrompt, generateOfflineSampleReply } from '../api/chat.js';

async function runTests() {
  console.log('--- Sahayak AI Chatbot Unit & Integration Tests ---');
  let failures = 0;

  // Test 1: Empty input validation
  try {
    const res = await processChatRequest({ prompt: '   ' });
    if (res.status === 400 && res.body.error) {
      console.log('✅ Test 1 Passed: Empty prompt rejected with 400.');
    } else {
      console.error('❌ Test 1 Failed: Expected 400 on empty prompt, got', res.status);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Offline demo mode fallback when GEMINI_API_KEY is not set
  try {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await processChatRequest({
      prompt: 'Tell me about PM-KISAN benefits and eligibility',
      language: 'en',
    });

    if (
      res.status === 200 &&
      res.body.isDemoMode === true &&
      res.body.reply.includes('₹6,000') &&
      res.body.reply.includes('pmkisan.gov.in')
    ) {
      console.log('✅ Test 2 Passed: Offline Demo Mode generates accurate PM-KISAN guidance.');
    } else {
      console.error('❌ Test 2 Failed:', res);
      failures++;
    }

    process.env.GEMINI_API_KEY = originalKey;
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Hindi offline reply
  try {
    const hindiReply = generateOfflineSampleReply('मुझे किसान योजना की जानकारी चाहिए', 'hi');
    if (hindiReply.includes('₹6,000') && hindiReply.includes('pmkisan.gov.in')) {
      console.log('✅ Test 3 Passed: Hindi offline reply contains correct scheme parameters.');
    } else {
      console.error('❌ Test 3 Failed:', hindiReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: System Prompt with Citizen Profile
  try {
    const profile = {
      age: 42,
      gender: 'Male',
      state: 'Uttar Pradesh',
      areaType: 'Rural',
      occupation: 'small_farmer',
      farmerLandholding: '1.5 acres',
      annualIncome: 120000,
      rationCard: 'BPL',
      hasGirlChildUnder10: 'yes',
    };
    const sysPrompt = generateSystemPrompt('hi', profile);
    if (
      sysPrompt.includes('Uttar Pradesh') &&
      sysPrompt.includes('small farmer') &&
      sysPrompt.includes('1.5 acres') &&
      sysPrompt.includes('PRIMARY LANGUAGE: Respond in fluent, polite, accessible Hindi')
    ) {
      console.log('✅ Test 4 Passed: System prompt accurately injects profile context and Hindi instruction.');
    } else {
      console.error('❌ Test 4 Failed:', sysPrompt);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Verify Ayushman Bharat offline response includes universal senior citizen coverage (Cabinet decision)
  try {
    const ayushmanReply = generateOfflineSampleReply('Tell me about Ayushman Bharat health insurance', 'en');
    if (ayushmanReply.includes('₹5,00,000') && ayushmanReply.includes('70+')) {
      console.log('✅ Test 5 Passed: Ayushman Bharat verified details include ₹5 Lakh and 70+ seniors.');
    } else {
      console.error('❌ Test 5 Failed:', ayushmanReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 5 TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runTests();

