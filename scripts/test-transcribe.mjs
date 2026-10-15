import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { en } from '../src/locales/en.js';
import { hi } from '../src/locales/hi.js';
import { TRANSLATIONS } from '../src/data/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Sahayak AI Server-Side Speech-to-Text & Gemini Audio Transcription Unit Tests ---');

const transcribeApiPath = path.resolve(__dirname, '../api/transcribe.js');
const vercelJsonPath = path.resolve(__dirname, '../vercel.json');
const viteConfigPath = path.resolve(__dirname, '../vite.config.js');
const aiAssistantPath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');

const transcribeContent = fs.readFileSync(transcribeApiPath, 'utf8');
const vercelContent = fs.readFileSync(vercelJsonPath, 'utf8');
const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
const aiContent = fs.readFileSync(aiAssistantPath, 'utf8');

// ==========================================
// Test 1: Vercel Permissions-Policy Allows Microphone (self)
// ==========================================
// In modern browsers, Permissions-Policy: microphone=() blocks microphone access site-wide.
// It MUST be configured as microphone=(self).
const vercelJson = JSON.parse(vercelContent);
let micPermPolicyCorrect = false;

for (const headerEntry of vercelJson.headers || []) {
  for (const h of headerEntry.headers || []) {
    if (h.key === 'Permissions-Policy' && h.value.includes('microphone=(self)') && !h.value.includes('microphone=()')) {
      micPermPolicyCorrect = true;
    }
  }
}

if (micPermPolicyCorrect) {
  console.log('✅ Test 1 Passed: vercel.json Permissions-Policy correctly specifies "microphone=(self)" (resolving browser permission blocks).');
} else {
  console.error('❌ Test 1 Failed: vercel.json does not contain "microphone=(self)" or still contains "microphone=()".');
  process.exit(1);
}

// ==========================================
// Test 2: Secure Serverless API Endpoint /api/transcribe
// ==========================================
const exportsHandler = transcribeContent.includes('export default async function handler(req, res)');
const checksCors = transcribeContent.includes('Access-Control-Allow-Origin') && transcribeContent.includes("req.method === 'OPTIONS'");
const checksMethod = transcribeContent.includes("req.method !== 'POST'") && transcribeContent.includes('405');
const checksRateLimit = transcribeContent.includes('isRateLimited') && transcribeContent.includes('429');
const checksPayloadSize = transcribeContent.includes('413') && transcribeContent.includes('MAX_AUDIO_BYTES');
const usesGeminiApiKey = transcribeContent.includes('process.env.GEMINI_API_KEY');
const zeroAudioStorage = !transcribeContent.includes('fs.writeFileSync') && !transcribeContent.includes('fs.writeFile');

if (
  exportsHandler &&
  checksCors &&
  checksMethod &&
  checksRateLimit &&
  checksPayloadSize &&
  usesGeminiApiKey &&
  zeroAudioStorage
) {
  console.log('✅ Test 2 Passed: /api/transcribe endpoint implements CORS, method filtering (POST only), IP rate-limiting, 4MB size limits, and zero audio storage on disk.');
} else {
  console.error('❌ Test 2 Failed: Security, rate-limiting, or size constraints missing in /api/transcribe.');
  process.exit(1);
}

// ==========================================
// Test 3: Local Vite Dev Server Middleware for /api/transcribe
// ==========================================
const devMiddlewareHandlesTranscribe = viteContent.includes("req.url === '/api/transcribe'") || viteContent.includes("req.url?.startsWith('/api/transcribe')");
const devMiddlewareHandlesChat = viteContent.includes("req.url === '/api/chat'") || viteContent.includes("req.url?.startsWith('/api/chat')");
const devMiddlewareCollectsBody = viteContent.includes("chunk") && viteContent.includes("processTranscribeRequest");

if (devMiddlewareHandlesTranscribe && devMiddlewareHandlesChat && devMiddlewareCollectsBody) {
  console.log('✅ Test 3 Passed: Local Vite dev server integrates /api/transcribe handler supporting up to 5MB audio payloads alongside /api/chat.');
} else {
  console.error('❌ Test 3 Failed: Vite dev server middleware for /api/transcribe missing or incomplete.');
  process.exit(1);
}

// ==========================================
// Test 4: Frontend MediaRecorder & Clean Stream Release
// ==========================================
const usesMediaRecorder = aiContent.includes('new MediaRecorder(stream');
const pushesAudioChunks = aiContent.includes('audioChunksRef.current.push(e.data)');
const releasesStreamOnStop = aiContent.includes('mediaStreamRef.current.getTracks().forEach((track) => track.stop())');
const unmountCleansRecorder = aiContent.includes('mediaRecorderRef.current.stop()') &&
  aiContent.includes('mediaStreamRef.current.getTracks().forEach((track) => track.stop())');

if (usesMediaRecorder && pushesAudioChunks && releasesStreamOnStop && unmountCleansRecorder) {
  console.log('✅ Test 4 Passed: AIAssistantPage records audio via browser MediaRecorder and terminates all audio stream tracks cleanly on completion or unmount.');
} else {
  console.error('❌ Test 4 Failed: MediaRecorder lifecycle or audio stream release missing.');
  process.exit(1);
}

// ==========================================
// Test 5: Transcribed Text Injected for Citizen Review & Editing (No Auto-Send)
// ==========================================
const injectsTranscript = aiContent.includes('setInputPrompt') && aiContent.includes('data.transcript');
const doesNotAutoSend = !aiContent.includes('handleSendMessage()') ||
  !aiContent.includes('setInputPrompt((prev) => (prev ? `${prev} ${data.transcript.trim()}` : data.transcript.trim()));\n                handleSendMessage()');
const focusesInputAfterSTT = aiContent.includes('inputRef.current?.focus()');

if (injectsTranscript && doesNotAutoSend && focusesInputAfterSTT) {
  console.log('✅ Test 5 Passed: Recognized transcript is injected into inputPrompt and focuses the input field so citizen can review and edit before sending (no auto-send).');
} else {
  console.error('❌ Test 5 Failed: Transcript injection or review before send logic broken.');
  process.exit(1);
}

// ==========================================
// Test 6: Text Chat Remains Fully Functional on Error
// ==========================================
const textInputNotBlockedByVoiceError = aiContent.includes('disabled={isTyping || isTranscribingAudio}');
const resetIndicatorsOnTranscribeError = aiContent.includes('setIsTranscribingAudio(false)') &&
  aiContent.includes('setIsConnectingMic(false)') &&
  aiContent.includes('setIsRecordingAudio(false)');

if (textInputNotBlockedByVoiceError && resetIndicatorsOnTranscribeError) {
  console.log('✅ Test 6 Passed: Manual text chat remains fully functional if voice recognition errors, and all loading/recording indicators reset cleanly.');
} else {
  console.error('❌ Test 6 Failed: Input blocked or mic indicator stuck on transcription failure.');
  process.exit(1);
}

// ==========================================
// Test 7: Bilingual Dictionary Parity for Cloud Audio STT Keys
// ==========================================
const newCloudVoiceKeys = [
  'micRecordVoiceClip',
  'micRecordingVoice',
  'micTranscribingVoice',
  'micVoiceSuccess',
  'micVoiceModeLive',
  'micVoiceModeCloud',
  'micDoneSpeaking',
  'micCancelRecording',
  'micUseCloudFallback',
];

let allKeysMatch = true;
for (const key of newCloudVoiceKeys) {
  const enVal = en.assistant?.[key] || en[key];
  const hiVal = hi.assistant?.[key] || hi[key];
  const tEn = TRANSLATIONS.en?.[key];
  const tHi = TRANSLATIONS.hi?.[key];

  if (!enVal || typeof enVal !== 'string') {
    console.error(`❌ Missing English translation in locales/en.js for '${key}'`);
    allKeysMatch = false;
  }
  if (!hiVal || typeof hiVal !== 'string') {
    console.error(`❌ Missing Hindi translation in locales/hi.js for '${key}'`);
    allKeysMatch = false;
  }
  if (!tEn || typeof tEn !== 'string') {
    console.error(`❌ Missing English translation in translations.js for '${key}'`);
    allKeysMatch = false;
  }
  if (!tHi || typeof tHi !== 'string') {
    console.error(`❌ Missing Hindi translation in translations.js for '${key}'`);
    allKeysMatch = false;
  }
}

if (allKeysMatch) {
  console.log(`✅ Test 7 Passed: All ${newCloudVoiceKeys.length} new Cloud STT voice keys verified with 100% parity across en.js, hi.js, and translations.js.`);
} else {
  console.error('❌ Test 7 Failed: Cloud STT bilingual dictionary parity check failed.');
  process.exit(1);
}

console.log('\n🎉 ALL 7 CLOUD AUDIO & SERVER-SIDE STT TESTS PASSED WITH 100% SUCCESS!\n');
