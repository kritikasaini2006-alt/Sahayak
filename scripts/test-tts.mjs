/**
 * Unit & Integration Tests: Clear Bilingual Text-To-Speech (TTS) Engine
 * Verifies Indian English (en-IN) and native Hindi (hi-IN) voice prioritization,
 * zero Siri imitation / no US/UK accent forced, mixed-language chunking,
 * Indian scheme acronym pronunciation (PM-KISAN -> PM Kisan, DBT -> D B T),
 * and sensible internal acoustic defaults (rate 0.88, pitch 1.0, volume 0.90).
 */

import assert from 'assert';
import {
  prepareSpokenText,
  splitIntoSpokenChunks,
  detectScriptLanguage,
  getVoiceCategories,
  selectBestVoice,
  evaluateEnglishVoice,
  loadTtsSettings,
  saveTtsSettings,
  SPEED_RATES,
  DEFAULT_TTS_SETTINGS,
} from '../src/utils/textToSpeech.js';

console.log('--- Sahayak AI Clear Bilingual Text-To-Speech (TTS) Unit Tests ---\n');

// Mock localStorage for node test runner
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// ============================================================================
// TEST 1: Markdown, Headings, Bullets, and Numbered Lists Sanitization
// ============================================================================
console.log('▶ Test 1: Markdown, Headings, Bullets, and List Sanitization');
const sampleMarkdown = `
### Pradhan Mantri Awas Yojana (PMAY)
Here are the **key details** of the scheme:
* Financial assistance up to ₹1.20 lakh in plains.
* Direct transfer to beneficiary bank account.
1. Submit Aadhaar and income certificate.
2. Verification by Gram Panchayat.
`;

const spokenText1 = prepareSpokenText(sampleMarkdown, 'en');
assert(!spokenText1.includes('###'), 'Should remove markdown hashes');
assert(!spokenText1.includes('**'), 'Should remove markdown asterisks');
assert(!spokenText1.includes('* Financial'), 'Should clean bullet symbols');
assert(spokenText1.includes('Pradhan Mantri Awas Yojana (PMAY).'), 'Headings should end with punctuation for pause');
assert(spokenText1.includes('1. Submit Aadhaar'), 'Numbered list preserved cleanly');
console.log('✅ Test 1 Passed: Markdown formatting and headings cleaned with natural pauses.');

// ============================================================================
// TEST 2: URL Sanitization without Spelling URLs Character by Character
// ============================================================================
console.log('▶ Test 2: URL Sanitization into Natural Spoken Phrases');
const textWithUrls = 'Apply online at https://pmkisan.gov.in/portal/login or view guidelines at https://india.gov.in';
const spokenEn = prepareSpokenText(textWithUrls, 'en');
const spokenHi = prepareSpokenText(textWithUrls, 'hi');

assert(!spokenEn.includes('https://'), 'Should not contain raw https URL in English');
assert(spokenEn.includes('Official source link available'), 'Should speak concise friendly phrase in English');
assert(!spokenHi.includes('https://'), 'Should not contain raw https URL in Hindi');
assert(spokenHi.includes('आधिकारिक पोर्टल लिंक उपलब्ध है'), 'Should speak concise friendly phrase in Hindi');
console.log('✅ Test 2 Passed: Bare URLs replaced with natural spoken notices in English and Hindi.');

// ============================================================================
// TEST 3: Indian Currency, Lakh/Crore, Scheme Acronyms, and Percentage Pronunciation
// ============================================================================
console.log('▶ Test 3: Currency, Lakh/Crore, Scheme Acronyms, and Percentage Sanitization');
const textWithSymbols = '<b>PM-KISAN</b>: Receives ₹6,000 /year via DBT with ₹1.20 lakh ceiling and 100% subsidy! 🌾✨';
const spokenPronunciation = prepareSpokenText(textWithSymbols, 'en');
assert(!spokenPronunciation.includes('<b>'), 'Strips HTML bold tag');
assert(!spokenPronunciation.includes('</b>'), 'Strips HTML closing tag');
assert(!spokenPronunciation.includes('🌾'), 'Strips emoji');
assert(!spokenPronunciation.includes('✨'), 'Strips emoji');
assert(spokenPronunciation.includes('PM Kisan'), 'Pronounces PM-KISAN without hyphen stutter');
assert(spokenPronunciation.includes('D B T'), 'Pronounces DBT with clean spacing');
assert(spokenPronunciation.includes('Rupees 6,000'), 'Converts ₹ into spoken Rupees in English');
assert(spokenPronunciation.includes('Rupees 1.20 Lakh'), 'Converts ₹1.20 lakh into Rupees 1.20 Lakh');
assert(spokenPronunciation.includes('percent'), 'Converts % into spoken percent');
assert(spokenPronunciation.includes('per year'), 'Converts /year into per year');

// Test Hindi currency & units
const hindiSample = 'पीएम किसान योजना: ₹6,000 /year सहायता और ₹1.20 lakh सीमा, 100% सब्सिडी।';
const spokenHindi = prepareSpokenText(hindiSample, 'hi');
assert(spokenHindi.includes('6,000 रुपये'), 'Converts ₹ into रुपये in Hindi');
assert(spokenHindi.includes('1.20 लाख रुपये'), 'Converts ₹1.20 lakh into 1.20 लाख रुपये');
assert(spokenHindi.includes('प्रतिशत'), 'Converts % into प्रतिशत');
assert(spokenHindi.includes('प्रति वर्ष'), 'Converts /year into प्रति वर्ष');
console.log('✅ Test 3 Passed: Scheme acronyms, Indian currency (lakh/Rupees), and units normalized for clear phonetics.');

// ============================================================================
// TEST 4: Structured Scheme Recommendation Summaries
// ============================================================================
console.log('▶ Test 4: Structured Scheme Recommendation Summaries');
const msgWithSchemes = {
  text: 'Based on your profile, here are recommended initiatives:',
  recommendedSchemes: [
    {
      title: 'PM-KISAN',
      benefit: '₹6,000 per year via DBT',
      keyCriteria: 'Small and marginal farmers',
      portalUrl: 'https://pmkisan.gov.in',
    },
  ],
};
const spokenWithSchemes = prepareSpokenText(msgWithSchemes, 'en');
assert(spokenWithSchemes.includes('PM Kisan'), 'Preserves scheme title with normalized acronym');
assert(spokenWithSchemes.includes('Benefit: Rupees 6,000 per year via D B T'), 'Preserves benefit details with Rupees and D B T');
assert(spokenWithSchemes.includes('Small and marginal farmers'), 'Preserves eligibility criteria');
console.log('✅ Test 4 Passed: Scheme details naturally woven into spoken content.');

// ============================================================================
// TEST 5: Devanagari Hindi Script Detection
// ============================================================================
console.log('▶ Test 5: Script & Language Detection');
assert.strictEqual(detectScriptLanguage('नमस्ते, मैं सहायक AI हूँ।'), 'hi');
assert.strictEqual(detectScriptLanguage('What are the documents needed for PM-KISAN?'), 'en');
assert.strictEqual(detectScriptLanguage('Pradhan Mantri Kisan Samman Nidhi', 'en'), 'en');
assert.strictEqual(detectScriptLanguage('Pradhan Mantri Kisan Samman Nidhi', 'hi'), 'hi');
console.log('✅ Test 5 Passed: Devanagari script accurately identified.');

// ============================================================================
// TEST 6: Sentence Chunking & Mixed Hindi-English Routing
// ============================================================================
console.log('▶ Test 6: Sentence Chunking and Mixed Language Routing');
const mixedScript = 'प्रधानमंत्री किसान सम्मान निधि योजना किसानों के लिए अत्यंत लाभकारी है। All eligible small and marginal farmers can apply online. आधिकारिक पोर्टल पर आधार कार्ड सत्यापन अनिवार्य है।';
const mixedChunks = splitIntoSpokenChunks(mixedScript, 'hi');
assert(mixedChunks.length >= 2, 'Should divide text into multiple sentence chunks');

// Check that Hindi sentences are tagged as 'hi' and English sentences as 'en'
const hindiChunk = mixedChunks.find((c) => c.text.includes('प्रधानमंत्री किसान'));
const englishChunk = mixedChunks.find((c) => c.text.includes('All eligible small'));
assert(hindiChunk, 'Found Hindi chunk');
assert.strictEqual(hindiChunk.lang, 'hi', 'Hindi chunk must be tagged as hi for native Hindi voice');
assert(englishChunk, 'Found English chunk');
assert.strictEqual(englishChunk.lang, 'en', 'English chunk must be tagged as en for Indian English voice');
console.log('✅ Test 6 Passed: Mixed responses route Devanagari to Hindi voice and English sentences to Indian English voice.');

// ============================================================================
// TEST 7: Authentic Indian English (en-IN) & Native Hindi (hi-IN) Voice Prioritization
// ============================================================================
console.log('▶ Test 7: Indian English & Native Hindi Voice Prioritization (No Siri / No US Accent)');
const mockVoices = [
  { name: 'Samantha', lang: 'en-US', voiceURI: 'en-samantha', default: true },
  { name: 'Daniel', lang: 'en-GB', voiceURI: 'en-daniel', default: false },
  { name: 'Aman', lang: 'en-IN', voiceURI: 'en-aman', default: false },
  { name: 'Rishi', lang: 'en-IN', voiceURI: 'en-rishi', default: false },
  { name: 'Google English India', lang: 'en-IN', voiceURI: 'en-google-in', default: false },
  { name: 'Google हिन्दी', lang: 'hi-IN', voiceURI: 'hi-google', default: false },
  { name: 'Lekha', lang: 'hi-IN', voiceURI: 'hi-lekha', default: false },
  { name: 'Microsoft Swara Natural - Hindi (India)', lang: 'hi-IN', voiceURI: 'hi-swara', default: false },
];

// Evaluate Aman and Google English India
const amanEval = evaluateEnglishVoice(mockVoices[2]);
const googleInEval = evaluateEnglishVoice(mockVoices[4]);
const samanthaEval = evaluateEnglishVoice(mockVoices[0]);
const danielEval = evaluateEnglishVoice(mockVoices[1]);

assert(amanEval.isIndianEnglish, 'Aman is recognized as Indian English voice');
assert(googleInEval.isIndianEnglish, 'Google English India is recognized as Indian English voice');
assert(!samanthaEval.isIndianEnglish, 'Samantha is NOT an Indian English voice');
assert(!danielEval.isIndianEnglish, 'Daniel is NOT an Indian English voice');

// Indian English voices must strictly score higher than US/UK voices
assert(amanEval.score > samanthaEval.score, 'Aman (en-IN) scores higher than Samantha (en-US)');
assert(googleInEval.score > samanthaEval.score, 'Google English India (en-IN) scores higher than Samantha (en-US)');
assert(amanEval.score > danielEval.score, 'Aman (en-IN) scores higher than Daniel (en-GB)');

// English selection must pick Indian English voice
const bestEnglish = selectBestVoice(mockVoices, 'en');
assert.strictEqual(bestEnglish.lang, 'en-IN', 'Best English voice MUST have en-IN Indian English language tag');
assert(bestEnglish.name.includes('Google') || bestEnglish.name === 'Aman' || bestEnglish.name === 'Rishi', 'Must choose authentic Indian English voice');

// Hindi selection must pick native Hindi voice
const bestHindi = selectBestVoice(mockVoices, 'hi');
assert(bestHindi.lang.startsWith('hi'), 'Best Hindi voice MUST have hi-IN language tag');
assert(bestHindi.name.includes('Google') || bestHindi.name.includes('Swara') || bestHindi.name === 'Lekha', 'Must choose native Hindi voice');

console.log('✅ Test 7 Passed: Indian English (en-IN) and native Hindi (hi-IN) voices strictly prioritized over US/UK accents.');

// ============================================================================
// TEST 8: Sensible Internal Acoustic Defaults (Rate 0.88, Pitch 1.0, Volume 0.90)
// ============================================================================
console.log('▶ Test 8: Internal Acoustic Defaults for Calm, Clear Comprehension');
assert.strictEqual(DEFAULT_TTS_SETTINGS.rate, 0.88, 'Default speech rate must be 0.88 (calm, steady pacing)');
assert.strictEqual(DEFAULT_TTS_SETTINGS.pitch, 1.0, 'Default pitch must be 1.0 (natural pitch)');
assert.strictEqual(DEFAULT_TTS_SETTINGS.volume, 0.90, 'Default volume must be 0.90 (clear, comfortable loudness)');
assert.strictEqual(SPEED_RATES.calm, 0.88);
assert.strictEqual(SPEED_RATES.normal, 0.88);

console.log('✅ Test 8 Passed: Sensible internal acoustic defaults (rate 0.88, pitch 1.0, volume 0.90) verified.');

console.log('\n🎉 ALL 8 TEXT-TO-SPEECH UNIT TESTS PASSED WITH 100% SUCCESS!\n');
