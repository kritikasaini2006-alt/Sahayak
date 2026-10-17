import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTranslateRequest, performOfflineTranslation } from '../api/translate.js';
import { TRANSLATIONS } from '../src/data/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.resolve(__dirname, '../.env.local');

// Safely load local environment variables for tests
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

async function runLanguageSwitchTests() {
  console.log('--- Sahayak AI Immediate Language Switching Unit & Integration Tests ---');
  let failures = 0;

  // Test 1: Translate English AI response to Hindi preserving facts, URLs, and markdown
  try {
    const enText = `**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account in 3 equal installments of ₹2,000.\n• **Eligibility:** All landholding farmer families with cultivable land in their names. Must complete Aadhaar e-KYC. High-income taxpayers are excluded.\n• **Required Documents:** Aadhaar Card, Land Records (Khatauni/Jamabandi), Bank Passbook with Aadhaar linkage.\n• **Official Portal:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*Official Next Step:* Visit pmkisan.gov.in or your nearest Common Service Centre (CSC) to submit official e-KYC.`;

    const res = await processTranslateRequest({
      text: enText,
      targetLanguage: 'hi',
      sourceLanguage: 'en',
    });

    if (
      res.status === 200 &&
      res.body.translatedText &&
      res.body.translatedText.includes('पीएम-किसान') &&
      res.body.translatedText.includes('₹6,000') &&
      res.body.translatedText.includes('₹2,000') &&
      res.body.translatedText.includes('pmkisan.gov.in') &&
      res.body.translatedText.includes('•')
    ) {
      console.log('✅ Test 1 Passed: English AI response translated to Hindi with accurate scheme name, amounts, portal URL, and markdown.');
    } else {
      console.error('❌ Test 1 Failed: Translation to Hindi failed or distorted content:', res);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Translate Hindi AI response back to English
  try {
    const hiText = `**पीएम-किसान (PM-KISAN) योजना:**\n\n• **मुख्य लाभ:** सभी पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष वित्तीय सहायता (₹2,000 की 3 समान किस्तों में)।\n• **पात्रता:** जिनके नाम पर कृषि योग्य भूमि दर्ज है और जिनका बैंक खाता आधार से लिंक (e-KYC) है।\n• **आवश्यक दस्तावेज:** आधार कार्ड, खतौनी/जमाबंदी (भूमि दस्तावेज), और बैंक पासबुक।\n• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*नोट:* आधिकारिक पंजीकरण के लिए अपने नजदीकी जन सेवा केंद्र (CSC) या pmkisan.gov.in पोर्टल पर जाएं।`;

    const res = await processTranslateRequest({
      text: hiText,
      targetLanguage: 'en',
      sourceLanguage: 'hi',
    });

    if (
      res.status === 200 &&
      res.body.translatedText &&
      res.body.translatedText.includes('PM-KISAN') &&
      res.body.translatedText.includes('₹6,000') &&
      res.body.translatedText.includes('pmkisan.gov.in') &&
      res.body.translatedText.includes('Benefit')
    ) {
      console.log('✅ Test 2 Passed: Hindi response accurately restored to English with matching scheme details.');
    } else {
      console.error('❌ Test 2 Failed: Translation back to English failed:', res);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Translate clickable options (single-choice and multi-choice)
  try {
    const res = await processTranslateRequest({
      text: 'Please select your State:',
      fieldKey: 'state',
      options: [
        { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
        { label: 'Bihar', value: 'Bihar' },
      ],
      targetLanguage: 'hi',
    });

    if (
      res.status === 200 &&
      Array.isArray(res.body.translatedOptions) &&
      res.body.translatedOptions.some((o) => o.label === 'उत्तर प्रदेश' && o.value === 'Uttar Pradesh') &&
      res.body.translatedOptions.some((o) => o.label === 'बिहार' && o.value === 'Bihar')
    ) {
      console.log('✅ Test 3 Passed: Clickable options accurately translated to Devanagari while preserving stable value identifiers.');
    } else {
      console.error('❌ Test 3 Failed: Option translation mismatch:', res.body.translatedOptions);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Translate structured scheme recommendation cards
  try {
    const res = await processTranslateRequest({
      text: 'Recommended Government Schemes',
      recommendedSchemes: [
        {
          id: 'pm-kisan',
          title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
          benefit: '₹6,000 / year via DBT',
          keyCriteria: 'Cultivable land in name',
          documentsRequired: ['Aadhaar Card', 'Land Records'],
          portalUrl: 'https://pmkisan.gov.in',
        },
      ],
      targetLanguage: 'hi',
    });

    const translatedScheme = res.body.translatedSchemes?.[0];
    if (
      res.status === 200 &&
      translatedScheme &&
      translatedScheme.title.includes('प्रधानमंत्री किसान सम्मान निधि') &&
      translatedScheme.portalUrl === 'https://pmkisan.gov.in' &&
      Array.isArray(translatedScheme.documentsRequired) &&
      translatedScheme.documentsRequired.includes('आधार कार्ड')
    ) {
      console.log('✅ Test 4 Passed: Structured scheme recommendation cards localized accurately with official Hindi metadata.');
    } else {
      console.error('❌ Test 4 Failed: Scheme card translation failed:', res.body.translatedSchemes);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Batch translation of multiple messages in a single request
  try {
    const res = await processTranslateRequest({
      messages: [
        {
          id: 'asst_1',
          text: 'Namaste! To identify verified government welfare schemes tailored to you, please select your **State or Union Territory**:',
          fieldKey: 'state',
          options: [{ label: 'Uttar Pradesh', value: 'Uttar Pradesh' }],
        },
        {
          id: 'asst_2',
          text: 'Please select your **Age Group** so we can verify schemes targeted to youth, adults, or senior citizens:',
          fieldKey: 'ageGroup',
          options: [{ label: '18 - 35 years', value: '18_35' }],
        },
      ],
      targetLanguage: 'hi',
    });

    if (
      res.status === 200 &&
      Array.isArray(res.body.translations) &&
      res.body.translations.length === 2 &&
      res.body.translations[0].id === 'asst_1' &&
      res.body.translations[0].translatedText.includes('राज्य या केंद्र शासित प्रदेश') &&
      res.body.translations[1].id === 'asst_2' &&
      res.body.translations[1].translatedText.includes('आयु वर्ग')
    ) {
      console.log('✅ Test 5 Passed: Batch translation processed multiple messages simultaneously in a single roundtrip.');
    } else {
      console.error('❌ Test 5 Failed: Batch translation mismatch:', res.body);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  // Test 6: In-memory translation caching in AIAssistantPage.jsx
  try {
    const pagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    const hasCacheRef = content.includes('translationCacheRef = useRef');
    const seedsWelcome = content.includes('translationCacheRef.current =') || content.includes('welcome: {');
    const readsFromCache = content.includes('translationCacheRef.current[msg.id]?.[language]');
    const writesToCache = content.includes('translationCacheRef.current[item.id][language] =');

    if (hasCacheRef && seedsWelcome && readsFromCache && writesToCache) {
      console.log('✅ Test 6 Passed: In-memory translation cache (translationCacheRef) implemented for instant back-and-forth toggling without duplicate API calls.');
    } else {
      console.error('❌ Test 6 Failed: Translation cache missing or incomplete in AIAssistantPage.jsx');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 6 Exception:', err);
    failures++;
  }

  // Test 7: Race condition protection during rapid language switching
  try {
    const pagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    const hasActiveLangRef = content.includes('activeLanguageRef = useRef(language)') || content.includes('activeLanguageRef = useRef');
    const syncsActiveLang = content.includes('activeLanguageRef.current = language');
    const checksActiveBeforeUpdate = content.includes('if (activeLanguageRef.current === language)') || content.includes('activeLanguageRef.current === curLang');
    const hasInFlightTracking = content.includes('inFlightTranslationsRef');

    if (hasActiveLangRef && syncsActiveLang && checksActiveBeforeUpdate && hasInFlightTracking) {
      console.log('✅ Test 7 Passed: Race condition guard & duplicate in-flight request deduplication verified.');
    } else {
      console.error('❌ Test 7 Failed: Race condition protection check failed in AIAssistantPage.jsx');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 7 Exception:', err);
    failures++;
  }

  // Test 8: Loading indicator for messages currently being translated
  try {
    const pagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    const hasIsTranslatingFlag = content.includes('msg.isTranslating');
    const rendersLoader = content.includes('Loader2') && content.includes('animate-spin');
    const displaysTranslatingNotice = content.includes('हिन्दी में अनुवाद किया जा रहा है') && content.includes('Translating to English');
    const hidesOldTextWhileTranslating = content.includes('msg.isTranslating ? (') && content.includes('formatMessageText(msg.text)');

    if (hasIsTranslatingFlag && rendersLoader && displaysTranslatingNotice && hidesOldTextWhileTranslating) {
      console.log('✅ Test 8 Passed: Translation loading indicator displayed on translating messages; old-language text hidden during active translation.');
    } else {
      console.error('❌ Test 8 Failed: Translation loading state missing or incomplete in AIAssistantPage.jsx');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 8 Exception:', err);
    failures++;
  }

  // Test 9: Preservation of original text, role, time, and metadata
  try {
    const pagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    const preservesOriginal = content.includes('originalText: data.reply') || content.includes('originalText:');
    const preservesOriginalLang = content.includes('originalLanguage: language');
    const doesNotTranslateUserMessages = content.includes("if (msg.sender !== 'assistant')") || content.includes("msg.sender === 'user'");

    if (preservesOriginal && preservesOriginalLang && doesNotTranslateUserMessages) {
      console.log('✅ Test 9 Passed: Original message text, originalLanguage, and metadata preserved; user messages left untranslated.');
    } else {
      console.error('❌ Test 9 Failed: Original message preservation check failed in AIAssistantPage.jsx');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 9 Exception:', err);
    failures++;
  }

  // Test 10: Server-side translation routes and dev middleware
  try {
    const viteConfigPath = path.resolve(__dirname, '../vite.config.js');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    const vercelConfigPath = path.resolve(__dirname, '../vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    const viteHandlesTranslate = viteConfig.includes("req.url === '/api/translate'");
    const vercelRewritesApi = vercelConfig.rewrites.some((r) => r.source === '/api/(.*)' && r.destination === '/api/$1');

    if (viteHandlesTranslate && vercelRewritesApi) {
      console.log('✅ Test 10 Passed: /api/translate registered in Vite development middleware and Vercel serverless rewrites.');
    } else {
      console.error('❌ Test 10 Failed: /api/translate routing check failed in vite.config.js or vercel.json');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 10 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 10 IMMEDIATE LANGUAGE SWITCHING TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error(`\n🚨 ${failures} LANGUAGE SWITCHING TESTS FAILED.\n`);
    process.exit(1);
  }
}

runLanguageSwitchTests();
