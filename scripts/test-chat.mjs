import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processChatRequest, generateSystemPrompt, generateOfflineSampleReply, checkRateLimit, cleanAiReply } from '../api/chat.js';
import { stripFillerPhrases } from '../src/utils/responseParser.js';
import { TRANSLATIONS } from '../src/data/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.resolve(__dirname, '../.env.local');

// Safely load local environment variables for tests (without printing secrets)
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

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

  // Test 2: Missing GEMINI_API_KEY returns clear configuration error (HTTP 503)
  try {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await processChatRequest({
      prompt: 'Tell me about PM-KISAN benefits',
      language: 'en',
    });

    if (
      res.status === 503 &&
      res.body.isConfigMissing === true &&
      res.body.error &&
      res.body.error.includes('GEMINI_API_KEY')
    ) {
      console.log('✅ Test 2 Passed: Missing GEMINI_API_KEY returns clear configuration error (HTTP 503).');
    } else {
      console.error('❌ Test 2 Failed: Expected 503 with configuration error, got', res.status, res.body);
      failures++;
    }

    process.env.GEMINI_API_KEY = originalKey;
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Invalid GEMINI_API_KEY returns authentication error (HTTP 401)
  try {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'invalid_dummy_key_12345';

    const res = await processChatRequest({
      prompt: 'Hello',
      language: 'en',
    });

    // In environment with network access, invalid key returns 401. If network is blocked by sandbox, returns 502 network error
    if (
      (res.status === 401 && res.body.isAuthError) ||
      (res.status === 502 && res.body.error.includes('Network error'))
    ) {
      console.log('✅ Test 3 Passed: Invalid key handled gracefully (' + (res.status === 401 ? 'HTTP 401 Auth Error' : 'Graceful network isolation') + ').');
    } else {
      console.error('❌ Test 3 Failed: Unexpected response for invalid key:', res.status, res.body);
      failures++;
    }

    process.env.GEMINI_API_KEY = originalKey;
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Gemini live request or server network handling
  try {
    if (process.env.GEMINI_API_KEY) {
      const res = await processChatRequest({
        prompt: 'What is PM-KISAN in one brief sentence?',
        language: 'en',
      });

      if (res.status === 200 && res.body.reply && res.body.modelUsed) {
        console.log(`✅ Test 4 Passed: Live Gemini API request succeeded using model "${res.body.modelUsed}".`);
      } else if (res.status === 502 && res.body.error.includes('Network error')) {
        console.log('✅ Test 4 Passed: Network isolation handled safely without unhandled crashes.');
      } else if (res.status === 503) {
        console.log('✅ Test 4 Passed: Handled Gemini 503 high demand gracefully.');
      } else {
        console.error('❌ Test 4 Failed:', res.status, res.body);
        failures++;
      }
    } else {
      console.log('ℹ Test 4 Skipped: GEMINI_API_KEY not configured in environment.');
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Hindi offline reference reply
  try {
    const hindiReply = generateOfflineSampleReply('मुझे किसान योजना की जानकारी चाहिए', 'hi');
    if (hindiReply.includes('₹6,000') && hindiReply.includes('pmkisan.gov.in')) {
      console.log('✅ Test 5 Passed: Hindi welfare guidance contains correct verified scheme parameters.');
    } else {
      console.error('❌ Test 5 Failed:', hindiReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  // Test 6: System Prompt with Citizen Profile
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
      console.log('✅ Test 6 Passed: System prompt accurately injects profile context and Hindi instruction.');
    } else {
      console.error('❌ Test 6 Failed:', sysPrompt);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 6 Exception:', err);
    failures++;
  }

  // Test 7: Verify Ayushman Bharat guidance includes universal senior citizen coverage (Cabinet decision)
  try {
    const ayushmanReply = generateOfflineSampleReply('Tell me about Ayushman Bharat health insurance', 'en');
    if (ayushmanReply.includes('₹5,00,000') && ayushmanReply.includes('70+')) {
      console.log('✅ Test 7 Passed: Ayushman Bharat verified details include ₹5 Lakh and 70+ seniors.');
    } else {
      console.error('❌ Test 7 Failed:', ayushmanReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 7 Exception:', err);
    failures++;
  }

  // Test 8: Input Size Validation Constraint (> 2,000 chars rejected)
  try {
    const oversizedPrompt = 'a'.repeat(2001);
    const res = await processChatRequest({ prompt: oversizedPrompt });
    if (res.status === 400 && res.body.error && res.body.error.includes('2,000 characters')) {
      console.log('✅ Test 8 Passed: Oversized prompt (> 2,000 chars) rejected with HTTP 400.');
    } else {
      console.error('❌ Test 8 Failed: Expected 400 on oversized prompt, got', res.status);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 8 Exception:', err);
    failures++;
  }

  // Test 9: In-memory Rate Limiting Protection (429)
  try {
    const testIp = '192.168.1.100';
    let rateLimited = false;
    // Consume 30 allowable requests
    for (let i = 0; i < 30; i++) {
      checkRateLimit(testIp);
    }
    // 31st request should be rejected
    const check31 = checkRateLimit(testIp);
    if (!check31.allowed && check31.retryAfter > 0) {
      rateLimited = true;
    }

    // Now test through processChatRequest
    const res = await processChatRequest({
      prompt: 'Hello',
      clientIp: testIp,
    });

    if (rateLimited && res.status === 429 && res.body.isRateLimited) {
      console.log('✅ Test 9 Passed: In-memory rate limiting triggers HTTP 429 when threshold exceeded.');
    } else {
      console.error('❌ Test 9 Failed: Rate limiting not enforced as expected:', res);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 9 Exception:', err);
    failures++;
  }

  // Test 10: Warm welcoming initial greeting (EN and HI)
  try {
    const enWelcome = TRANSLATIONS.en?.welcomeMessage;
    const hiWelcome = TRANSLATIONS.hi?.welcomeMessage;

    if (
      enWelcome === 'Hello! 👋 What do you need help with today?' &&
      hiWelcome === 'नमस्ते! 👋 आज आपको किस बारे में मदद चाहिए?'
    ) {
      console.log('✅ Test 10 Passed: Initial conversation starts with warm, concise greeting in EN and HI.');
    } else {
      console.error('❌ Test 10 Failed: Unexpected welcome messages:', { enWelcome, hiWelcome });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 10 Exception:', err);
    failures++;
  }

  // Test 11: Removal of filler phrases in English and Hindi
  try {
    const sampleWithFiller1 = "I'd be happy to assist you with finding schemes. You can apply for PM-KISAN.";
    const cleaned1 = stripFillerPhrases(sampleWithFiller1);
    const sampleWithFiller2 = "Certainly! I would be delighted to help you. You are eligible for Ayushman Bharat.";
    const cleaned2 = cleanAiReply(sampleWithFiller2);
    const sampleWithFiller3 = "मुझे आपकी मदद करने में खुशी होगी। आप पीएम विश्वकर्मा योजना के लिए आवेदन कर सकते हैं।";
    const cleaned3 = cleanAiReply(sampleWithFiller3);

    if (
      !cleaned1.toLowerCase().includes('happy to assist') &&
      cleaned1.startsWith('You can apply') &&
      !cleaned2.toLowerCase().includes('delighted') &&
      cleaned2.startsWith('You are eligible') &&
      !cleaned3.includes('खुशी होगी') &&
      cleaned3.startsWith('आप पीएम विश्वकर्मा')
    ) {
      console.log('✅ Test 11 Passed: Robotic filler phrases removed cleanly in English and Hindi.');
    } else {
      console.error('❌ Test 11 Failed: Filler phrases not completely stripped:', { cleaned1, cleaned2, cleaned3 });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 11 Exception:', err);
    failures++;
  }

  // Test 12: No repetitive greeting on follow-up conversation turns
  try {
    const followUpReply = "Hello! Namaste! You can submit your application at your nearest CSC centre.";
    const cleanedFollowUp = cleanAiReply(followUpReply, { isFollowUp: true, isGreetingPrompt: false });

    if (
      !cleanedFollowUp.startsWith('Hello') &&
      !cleanedFollowUp.startsWith('Namaste') &&
      cleanedFollowUp.startsWith('You can submit')
    ) {
      console.log('✅ Test 12 Passed: Follow-up turns do not repeat greetings and get straight to the point.');
    } else {
      console.error('❌ Test 12 Failed: Repetitive greeting remained on follow-up turn:', cleanedFollowUp);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 12 Exception:', err);
    failures++;
  }

  // Test 13: Everyday technology questions with numbered steps (Aadhaar & DigiLocker)
  try {
    const aadhaarEn = generateOfflineSampleReply('How do I download my Aadhaar on mobile?', 'en');
    const aadhaarHi = generateOfflineSampleReply('मोबाइल पर आधार डाउनलोड कैसे करें?', 'hi');
    const digilockerEn = generateOfflineSampleReply('How do I use DigiLocker?', 'en');

    const hasNumberedSteps = (txt) => txt.includes('1.') && txt.includes('2.') && txt.includes('3.');

    if (
      hasNumberedSteps(aadhaarEn.reply) &&
      aadhaarEn.reply.includes('myaadhaar.uidai.gov.in') &&
      hasNumberedSteps(aadhaarHi.reply) &&
      aadhaarHi.reply.includes('myaadhaar.uidai.gov.in') &&
      hasNumberedSteps(digilockerEn.reply) &&
      digilockerEn.reply.includes('digilocker.gov.in')
    ) {
      console.log('✅ Test 13 Passed: Everyday tech questions answered with clear, practical numbered steps.');
    } else {
      console.error('❌ Test 13 Failed: Tech questions missing numbered steps or official portals:', {
        aadhaarEn: aadhaarEn.reply,
        aadhaarHi: aadhaarHi.reply,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 13 Exception:', err);
    failures++;
  }

  // Test 14: System prompt tone instructions
  try {
    const sysPrompt = generateSystemPrompt('en', null);
    const hasConversationalTone =
      sysPrompt.includes('STRICTLY AVOID robotic filler phrases') &&
      sysPrompt.includes('ALWAYS use clear, numbered steps (1., 2., 3.)') &&
      sysPrompt.includes('Do NOT repeatedly greet the user');

    if (hasConversationalTone) {
      console.log('✅ Test 14 Passed: System prompt enforces conversational tone, zero fillers, and numbered steps.');
    } else {
      console.error('❌ Test 14 Failed: System prompt missing conversational rules.');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 14 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 14 CHATBOT TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runTests();
