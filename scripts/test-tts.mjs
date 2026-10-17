/**
 * Unit & Integration Tests: Natural Text-To-Speech (TTS) Engine
 * Verifies Siri-style Apple voice prioritization, acoustic defaults (rate 0.88, pitch 1.0, volume 0.85),
 * currency & pronunciation sanitization, and honest voice categorization.
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
// TEST 1: Markdown, Headings, Bullets, and Numbered Lists
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
// TEST 3: Currency, Percentage, HTML, and Emoji Pronunciation Sanitization
// ============================================================================
console.log('▶ Test 3: Currency, Percentage, HTML, and Emoji Sanitization');
const textWithSymbols = '<b>PM-KISAN</b>: Receives ₹6,000 /year with 100% subsidy! 🌾✨';
const spokenPronunciation = prepareSpokenText(textWithSymbols, 'en');
assert(!spokenPronunciation.includes('<b>'), 'Strips HTML bold tag');
assert(!spokenPronunciation.includes('</b>'), 'Strips HTML closing tag');
assert(!spokenPronunciation.includes('🌾'), 'Strips emoji');
assert(!spokenPronunciation.includes('✨'), 'Strips emoji');
assert(spokenPronunciation.includes('Rupees 6,000'), 'Converts ₹ into spoken Rupees in English');
assert(spokenPronunciation.includes('percent'), 'Converts % into spoken percent');
console.log('✅ Test 3 Passed: HTML tags, emojis, and currency converted into clear spoken phonetics.');

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
assert(spokenWithSchemes.includes('Benefit: Rupees 6,000 per year'), 'Preserves benefit details with Rupees');
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
// TEST 7: Apple Siri-Style Voice Prioritization over Harsh Legacy Voices
// ============================================================================
console.log('▶ Test 7: Apple Siri-Style Voice Prioritization');
const mockMacVoices = [
  { name: 'Rishi', lang: 'en-IN', voiceURI: 'en-rishi', default: false },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'en-samantha', default: true },
  { name: 'Daniel', lang: 'en-GB', voiceURI: 'en-daniel', default: false },
  { name: 'Google हिन्दी', lang: 'hi-IN', voiceURI: 'hi-google', default: false },
  { name: 'Microsoft Swara Natural - Hindi (India)', lang: 'hi-IN', voiceURI: 'hi-swara', default: false },
];

// Evaluate Samantha on Apple device
const samanthaEval = evaluateEnglishVoice(mockMacVoices[1], true);
assert(samanthaEval.isSiriStyle, 'Samantha is recognized as Apple Natural Siri-style voice');
assert.strictEqual(samanthaEval.displayLabel, 'Samantha (Apple Natural - Siri-style)');

// Evaluate unenhanced Rishi
const rishiEval = evaluateEnglishVoice(mockMacVoices[0], true);
assert(!rishiEval.isSiriStyle, 'Unenhanced Rishi is NOT marked as Siri-style');
assert.strictEqual(rishiEval.displayLabel, 'Rishi (Indian English - Standard)');

// On Apple devices, Samantha must be prioritized over legacy robotic Rishi
assert(samanthaEval.score > rishiEval.score, 'Apple natural Siri-style voice scored higher than unenhanced voice');

// Best English voice selection on Apple devices
const categories = getVoiceCategories(mockMacVoices);
assert(categories.englishVoices.length >= 3, 'Finds all English voices');

// User preference override
const preferredOverride = selectBestVoice(mockMacVoices, 'hi', 'hi-swara');
assert.strictEqual(preferredOverride.voiceURI, 'hi-swara', 'Honors user preferred voice');

console.log('✅ Test 7 Passed: Apple Siri-style natural voice prioritized over robotic voice without false labels.');

// ============================================================================
// TEST 8: Settings Persistence & Initial Acoustic Defaults (Rate 0.88, Volume 0.85, Pitch 1.0)
// ============================================================================
console.log('▶ Test 8: Settings Persistence and Acoustic Parameters');
assert.strictEqual(DEFAULT_TTS_SETTINGS.rate, 0.88, 'Default speech rate must be 0.88');
assert.strictEqual(DEFAULT_TTS_SETTINGS.pitch, 1.0, 'Default pitch must be 1.0');
assert.strictEqual(DEFAULT_TTS_SETTINGS.volume, 0.85, 'Default volume must be 0.85');

saveTtsSettings({ speed: 'calm', rate: 0.88, volume: 0.85, pitch: 1.0, preferredVoiceEn: 'en-samantha' });
const loaded = loadTtsSettings();
assert.strictEqual(loaded.speed, 'calm');
assert.strictEqual(loaded.rate, 0.88);
assert.strictEqual(loaded.volume, 0.85);
assert.strictEqual(loaded.pitch, 1.0);
assert.strictEqual(loaded.preferredVoiceEn, 'en-samantha');
assert.strictEqual(SPEED_RATES[loaded.speed], 0.88);
console.log('✅ Test 8 Passed: Acoustic defaults (rate 0.88, volume 0.85, pitch 1.0) verified and persisted.');

console.log('\n🎉 ALL 8 TEXT-TO-SPEECH UNIT TESTS PASSED WITH 100% SUCCESS!\n');
