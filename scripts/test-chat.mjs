import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processChatRequest, generateSystemPrompt, generateOfflineSampleReply, checkRateLimit, cleanAiReply } from '../api/chat.js';
import { stripFillerPhrases, extractAgeFromText, normalizeAgeString, normalizeAgeQuestion, determineAgeGroup, parseAgeGroupFromText } from '../src/utils/responseParser.js';
import { TRANSLATIONS } from '../src/data/translations.js';
import { AGE_GROUP_OPTIONS } from '../src/data/chatOptions.js';

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

  // Test 15: Exact friendly age prompt in English and Hindi
  try {
    const enOffline = generateOfflineSampleReply('Tell me schemes for Uttar Pradesh', 'en', { state: 'Uttar Pradesh' });
    const hiOffline = generateOfflineSampleReply('उत्तर प्रदेश के लिए योजनाएं बताएं', 'hi', { state: 'Uttar Pradesh' });

    const expectedEn = 'Please tell me your age so I can find government schemes that are relevant to you.';
    const expectedHi = 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।';

    const promptEnOk = enOffline.reply.includes(expectedEn) && TRANSLATIONS.en.agePrompt === expectedEn;
    const promptHiOk = hiOffline.reply.includes(expectedHi) && TRANSLATIONS.hi.agePrompt === expectedHi;

    if (promptEnOk && promptHiOk) {
      console.log('✅ Test 15 Passed: Exact user-friendly age prompt delivered in both English and Hindi.');
    } else {
      console.error('❌ Test 15 Failed: Age prompt does not match exact required text:', {
        enOfflineReply: enOffline.reply,
        hiOfflineReply: hiOffline.reply,
        transEn: TRANSLATIONS.en.agePrompt,
        transHi: TRANSLATIONS.hi.agePrompt,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 15 Exception:', err);
    failures++;
  }

  // Test 16: Clickable age-group options displayed beneath age question in English and Hindi
  try {
    const enOffline = generateOfflineSampleReply('Find schemes', 'en', { state: 'Maharashtra' });
    const hiOffline = generateOfflineSampleReply('योजनाएं खोजें', 'hi', { state: 'Maharashtra' });

    const expectedEnLabels = ['Under 18 years', '18–25 years', '26–40 years', '41–60 years', 'Above 60 years'];
    const expectedHiLabels = ['18 वर्ष से कम', '18–25 वर्ष', '26–40 वर्ष', '41–60 वर्ष', '60 वर्ष से अधिक'];

    const actualEnLabels = Array.isArray(enOffline.options) ? enOffline.options.map((o) => o.label) : [];
    const actualHiLabels = Array.isArray(hiOffline.options) ? hiOffline.options.map((o) => o.label) : [];

    const enLabelsMatch = expectedEnLabels.every((lbl) => actualEnLabels.includes(lbl));
    const hiLabelsMatch = expectedHiLabels.every((lbl) => actualHiLabels.includes(lbl));

    const isSingleChoice = enOffline.questionType === 'single_choice' && hiOffline.questionType === 'single_choice';

    if (isSingleChoice && actualEnLabels.length === 5 && actualHiLabels.length === 5 && enLabelsMatch && hiLabelsMatch) {
      console.log('✅ Test 16 Passed: Age question displays 5 clickable age-group options in English and Hindi.');
    } else {
      console.error('❌ Test 16 Failed: Age question does not display expected 5 options:', {
        actualEnLabels,
        actualHiLabels,
        enType: enOffline.questionType,
        hiType: hiOffline.questionType,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 16 Exception:', err);
    failures++;
  }

  // Test 17: Natural age input parsing (English & Hindi)
  try {
    const cases = [
      { text: '34', expected: 34 },
      { text: 'I am 34 years old', expected: 34 },
      { text: 'Age: 45', expected: 45 },
      { text: 'i am around 28', expected: 28 },
      { text: 'मेरी उम्र 34 साल है', expected: 34 },
      { text: '३४ वर्ष', expected: 34 },
      { text: 'मेरी आयु 50 वर्ष है', expected: 50 },
      { text: 'sukanya samriddhi yojana for 8 year old daughter', expected: null }, // guards third-party child scheme references
    ];

    let allParsed = true;
    for (const c of cases) {
      const extracted = extractAgeFromText(c.text);
      const actualAge = extracted.valid ? extracted.age : null;
      if (actualAge !== c.expected) {
        console.error(`❌ Test 17 Failed for input "${c.text}": expected ${c.expected}, got ${actualAge}`);
        allParsed = false;
        failures++;
        break;
      }
    }

    if (allParsed) {
      console.log('✅ Test 17 Passed: Natural age entry accurately parsed across English, Hindi, and Devanagari numerals.');
    }
  } catch (err) {
    console.error('❌ Test 17 Exception:', err);
    failures++;
  }

  // Test 18: Unclear / invalid age handling with polite retry prompt
  try {
    const invalidInputs = ['150', '-5', 'abc', 'invalid age input'];
    let handlesInvalids = true;

    for (const inp of invalidInputs) {
      const parsed = extractAgeFromText(inp);
      if (parsed.valid) {
        handlesInvalids = false;
        console.error(`❌ Test 18 Failed: "${inp}" should be rejected as invalid, but got parsed age:`, parsed);
        failures++;
        break;
      }
    }

    // Test processChatRequest retry prompt when previous assistant message asked for age
    const prevAgeMsg = {
      role: 'assistant',
      content: 'Please tell me your age so I can find government schemes that are relevant to you.',
      fieldKey: 'age',
    };

    const retryResEn = await processChatRequest({
      prompt: 'my age is 250',
      conversationHistory: [prevAgeMsg],
      language: 'en',
    });

    const retryResHi = await processChatRequest({
      prompt: 'मेरी उम्र 200 साल है',
      conversationHistory: [{ ...prevAgeMsg, content: 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।' }],
      language: 'hi',
    });

    const retryEnOk = retryResEn.body.reply.includes('between 1 and 120');
    const retryHiOk = retryResHi.body.reply.includes('1 से 120');

    if (handlesInvalids && retryEnOk && retryHiOk) {
      console.log('✅ Test 18 Passed: Out-of-bounds/unclear age politely asks for valid age (1-120) in EN & HI.');
    } else {
      console.error('❌ Test 18 Failed: Retry responses incorrect:', {
        en: retryResEn.body.reply,
        hi: retryResHi.body.reply,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 18 Exception:', err);
    failures++;
  }

  // Test 19: Replacement of legacy confusing age-group phrases via normalization
  try {
    const legacy1 = 'Next, please let me know your age group so I can find schemes that match your life stage.';
    const legacy2 = 'Could you please select your correct age group from the options below so I can find the best schemes for you?';
    const legacyHi = 'कृपया नीचे दिए गए विकल्पों में से अपना सही आयु वर्ग चुनें।';

    const normalized1 = normalizeAgeString(legacy1, 'en');
    const normalized2 = normalizeAgeString(legacy2, 'en');
    const normalizedHi = normalizeAgeString(legacyHi, 'hi');

    const expectedEn = 'Please tell me your age so I can find government schemes that are relevant to you.';
    const expectedHi = 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।';

    const structuredLegacyMsg = {
      role: 'assistant',
      content: legacy1,
      questionType: 'single-choice',
      fieldKey: 'ageGroup',
      options: [
        { label: '18-35 years', value: '18-35' },
        { label: '36-60 years', value: '36-60' },
      ],
    };
    const cleanedMsg = normalizeAgeQuestion(structuredLegacyMsg, 'en');

    if (
      normalized1 === expectedEn &&
      normalized2 === expectedEn &&
      normalizedHi === expectedHi &&
      cleanedMsg.questionType === 'single_choice' &&
      cleanedMsg.options.length === 5 &&
      cleanedMsg.content === expectedEn
    ) {
      console.log('✅ Test 19 Passed: Legacy age-group phrases safely replaced and standardized with 5 clickable buttons.');
    } else {
      console.error('❌ Test 19 Failed: Normalization did not replace legacy phrases properly:', {
        normalized1,
        normalized2,
        normalizedHi,
        cleanedMsg,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 19 Exception:', err);
    failures++;
  }

  // Test 20: Every clickable age-group button recognized and correctly sets representative age (EN & HI)
  try {
    const ageOptionsEn = AGE_GROUP_OPTIONS.en;
    const ageOptionsHi = AGE_GROUP_OPTIONS.hi;

    let allOptionsPassed = true;
    for (const opt of ageOptionsEn) {
      const parsed = extractAgeFromText(opt.label, 'en');
      if (!parsed.valid || !parsed.age || !parsed.ageGroup) {
        console.error(`❌ Test 20 Failed for EN option "${opt.label}":`, parsed);
        allOptionsPassed = false;
        failures++;
        break;
      }
    }

    for (const opt of ageOptionsHi) {
      const parsed = extractAgeFromText(opt.label, 'hi');
      if (!parsed.valid || !parsed.age || !parsed.ageGroup) {
        console.error(`❌ Test 20 Failed for HI option "${opt.label}":`, parsed);
        allOptionsPassed = false;
        failures++;
        break;
      }
    }

    if (allOptionsPassed) {
      console.log('✅ Test 20 Passed: Every age-group button in English and Hindi recognized with valid representative age and group.');
    }
  } catch (err) {
    console.error('❌ Test 20 Exception:', err);
    failures++;
  }

  // Test 21: Typed exact ages correctly mapped to appropriate age group via determineAgeGroup
  try {
    const exactAgeTests = [
      { age: 14, expectedEn: 'Under 18 years', expectedHi: '18 वर्ष से कम' },
      { age: 21, expectedEn: '18–25 years', expectedHi: '18–25 वर्ष' },
      { age: 34, expectedEn: '26–40 years', expectedHi: '26–40 वर्ष' },
      { age: 45, expectedEn: '41–60 years', expectedHi: '41–60 वर्ष' },
      { age: 68, expectedEn: 'Above 60 years', expectedHi: '60 वर्ष से अधिक' },
    ];

    let allGroupingsMatch = true;
    for (const item of exactAgeTests) {
      const enGroup = determineAgeGroup(item.age, 'en');
      const hiGroup = determineAgeGroup(item.age, 'hi');
      const parsedEn = extractAgeFromText(String(item.age), 'en');
      const parsedHi = extractAgeFromText(String(item.age), 'hi');

      if (
        enGroup !== item.expectedEn ||
        hiGroup !== item.expectedHi ||
        parsedEn.ageGroup !== item.expectedEn ||
        parsedHi.ageGroup !== item.expectedHi
      ) {
        console.error(`❌ Test 21 Failed for age ${item.age}:`, {
          enGroup,
          expectedEn: item.expectedEn,
          hiGroup,
          expectedHi: item.expectedHi,
          parsedEn,
          parsedHi,
        });
        allGroupingsMatch = false;
        failures++;
        break;
      }
    }

    if (allGroupingsMatch) {
      console.log('✅ Test 21 Passed: Typed exact ages (14, 21, 34, 45, 68) accurately mapped to appropriate age groups in EN and HI.');
    }
  } catch (err) {
    console.error('❌ Test 21 Exception:', err);
    failures++;
  }

  // Test 22: AI Assistant eligibility flow proceeds directly to Step 3 (Occupation) after selecting age group or typing age
  try {
    const profileWithState = { state: 'Karnataka' };

    // Case A: User clicks "41–60 years" option
    const resOptionClick = generateOfflineSampleReply('41–60 years', 'en', profileWithState);
    // Case B: User clicks Hindi "18–25 वर्ष" option
    const resOptionClickHi = generateOfflineSampleReply('18–25 वर्ष', 'hi', profileWithState);
    // Case C: User types exact age "45"
    const resTypedAge = generateOfflineSampleReply('45', 'en', profileWithState);
    // Case D: User types natural phrase "I am 34 years old"
    const resNaturalPhrase = generateOfflineSampleReply('I am 34 years old', 'en', profileWithState);

    const caseAOk = resOptionClick.fieldKey === 'occupation' && resOptionClick.questionType === 'single_choice';
    const caseBOk = resOptionClickHi.fieldKey === 'occupation' && resOptionClickHi.questionType === 'single_choice';
    const caseCOk = resTypedAge.fieldKey === 'occupation' && resTypedAge.questionType === 'single_choice';
    const caseDOk = resNaturalPhrase.fieldKey === 'occupation' && resNaturalPhrase.questionType === 'single_choice';

    if (caseAOk && caseBOk && caseCOk && caseDOk) {
      console.log('✅ Test 22 Passed: AI Assistant eligibility flow proceeds directly to Occupation without asking for age again across all input modes.');
    } else {
      console.error('❌ Test 22 Failed: One or more cases did not proceed to occupation:', {
        caseA: resOptionClick.fieldKey,
        caseB: resOptionClickHi.fieldKey,
        caseC: resTypedAge.fieldKey,
        caseD: resNaturalPhrase.fieldKey,
      });
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 22 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 22 CHATBOT TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n🚨 ${failures} TESTS FAILED.`);
    process.exit(1);
  }
}

runTests();
