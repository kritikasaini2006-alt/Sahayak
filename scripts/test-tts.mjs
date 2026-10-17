/**
 * Unit & Integration Tests: Natural Text-To-Speech (TTS) Engine
 */

import assert from 'assert';
import {
  prepareSpokenText,
  splitIntoSpokenChunks,
  detectScriptLanguage,
  getVoiceCategories,
  selectBestVoice,
  loadTtsSettings,
  saveTtsSettings,
  SPEED_RATES,
  TTS_STORAGE_KEY,
} from '../src/utils/textToSpeech.js';

console.log('--- Sahayak AI Natural Text-To-Speech (TTS) Unit Tests ---\n');

// Mock localStorage for node test runner
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// ============================================================================
// TEST 1: Sanitization of Markdown, Headings, Bullets, and Numbered Lists
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
// TEST 3: Raw JSON / Structured Object Handling
// ============================================================================
console.log('▶ Test 3: Raw JSON and Structured Object Handling');
const rawJsonResponse = JSON.stringify({
  reply: 'Here are the details for your application inquiry.',
  questionType: 'none',
  fieldKey: null,
  allowSkip: false,
});
const spokenFromJson = prepareSpokenText(rawJsonResponse, 'en');
assert(!spokenFromJson.includes('{'), 'Must not speak opening brace');
assert(!spokenFromJson.includes('"reply"'), 'Must not speak JSON keys');
assert(spokenFromJson.includes('Here are the details for your application inquiry.'), 'Extracts clean reply text');
console.log('✅ Test 3 Passed: Serialized JSON gracefully normalized to readable text.');

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
assert(spokenWithSchemes.includes('PM-KISAN'), 'Preserves scheme title');
assert(spokenWithSchemes.includes('Benefit: ₹6,000 per year via DBT'), 'Preserves benefit details');
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
// TEST 6: Sentence Chunking and Length Bounds
// ============================================================================
console.log('▶ Test 6: Sentence Chunking and Length Bounds');
const longScript = 'पहला वाक्य यहाँ समाप्त होता है। दूसरा वाक्य सरकारी योजनाओं की पात्रता को विस्तार से समझाता है। तीसरा वाक्य आवश्यक दस्तावेजों जैसे आधार कार्ड, राशन कार्ड, और आय प्रमाण पत्र की सूची प्रदान करता है।';
const chunks = splitIntoSpokenChunks(longScript, 'hi');
assert(chunks.length >= 2, 'Should divide long text into multiple chunks');
for (const chunk of chunks) {
  assert(chunk.text.length <= 180, `Chunk length should be <= 180 chars, got ${chunk.text.length}`);
  assert.strictEqual(chunk.lang, 'hi', 'Chunk should inherit Hindi language');
}
console.log('✅ Test 6 Passed: Chunking respects punctuation boundaries and max-length bounds.');

// ============================================================================
// TEST 7: Voice Categorization & Priority Ranking
// ============================================================================
console.log('▶ Test 7: Voice Categorization and Priority Ranking');
const mockVoices = [
  { name: 'Generic Default', lang: 'en-US', voiceURI: 'def-1', default: true },
  { name: 'Google हिन्दी', lang: 'hi-IN', voiceURI: 'hi-google', default: false },
  { name: 'Lekha (Hindi India)', lang: 'hi-IN', voiceURI: 'hi-lekha', default: false },
  { name: 'Rishi (English India)', lang: 'en-IN', voiceURI: 'en-rishi', default: false },
  { name: 'Microsoft Swara Natural - Hindi (India)', lang: 'hi-IN', voiceURI: 'hi-swara', default: false },
];

const categories = getVoiceCategories(mockVoices);
assert(categories.hindi.length >= 3, 'Finds all Hindi voices');
assert(categories.indianEnglish.length >= 1, 'Finds Indian English voices');

// Best Hindi voice selection
const bestHindi = selectBestVoice(mockVoices, 'hi');
assert(
  bestHindi.name.includes('Google') || bestHindi.name.includes('Swara'),
  `Expected natural Hindi voice, got ${bestHindi.name}`
);

// Best Indian English selection
const bestEnglish = selectBestVoice(mockVoices, 'en');
assert.strictEqual(bestEnglish.name, 'Rishi (English India)');

// User preference override
const preferredOverride = selectBestVoice(mockVoices, 'hi', 'hi-lekha');
assert.strictEqual(preferredOverride.voiceURI, 'hi-lekha', 'Honors user preferred voice');

console.log('✅ Test 7 Passed: Voice categorization, natural ranking, and overrides verified.');

// ============================================================================
// TEST 8: Settings Persistence
// ============================================================================
console.log('▶ Test 8: Settings Persistence');
saveTtsSettings({ speed: 'slow', preferredVoiceHi: 'hi-swara' });
const loaded = loadTtsSettings();
assert.strictEqual(loaded.speed, 'slow');
assert.strictEqual(loaded.preferredVoiceHi, 'hi-swara');
assert.strictEqual(SPEED_RATES[loaded.speed], 0.85);
console.log('✅ Test 8 Passed: Speed and voice preferences saved and restored.');

console.log('\n🎉 ALL 8 TEXT-TO-SPEECH UNIT TESTS PASSED WITH 100% SUCCESS!\n');
