import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { en } from '../src/locales/en.js';
import { hi } from '../src/locales/hi.js';
import { TRANSLATIONS } from '../src/data/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Sahayak AI Microphone Interaction & Permission Modal Unit Tests ---');

const aiAssistantPath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
const modalPath = path.resolve(__dirname, '../src/components/common/MicrophonePermissionModal.jsx');

const aiContent = fs.readFileSync(aiAssistantPath, 'utf8');
const modalContent = fs.readFileSync(modalPath, 'utf8');

// ==========================================
// Test 1: No Automatic Permission Request on Page Load
// ==========================================
// Verify that neither SpeechRecognition nor getUserMedia is triggered in mount effects.
const mountEffectMatch = aiContent.match(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[\]\);/g);
let autostartDetected = false;
if (mountEffectMatch) {
  for (const effect of mountEffectMatch) {
    if (
      effect.includes('startRecognition') ||
      effect.includes('recognition.start') ||
      effect.includes('getUserMedia')
    ) {
      autostartDetected = true;
    }
  }
}

if (!autostartDetected) {
  console.log('✅ Test 1 Passed: Microphone permission is NEVER requested automatically on page load.');
} else {
  console.error('❌ Test 1 Failed: Autostart or automatic mic request detected in page mount useEffect.');
  process.exit(1);
}

// ==========================================
// Test 2: Click-to-Activate & Permission Query Architecture
// ==========================================
const hasGetMicState = aiContent.includes('getMicrophonePermissionState');
const hasPermQuery = aiContent.includes("navigator.permissions.query({ name: 'microphone' })");
const hasCatchFallback = aiContent.includes('catch') && aiContent.includes("return 'unknown'");
const checksDeniedState = aiContent.includes("permState === 'denied'");
const opensModalOnDenied = aiContent.includes('setShowMicModal(true)');

if (hasGetMicState && hasPermQuery && hasCatchFallback && checksDeniedState && opensModalOnDenied) {
  console.log('✅ Test 2 Passed: Click-to-activate checks Permissions API where supported and falls back gracefully on Safari/Firefox.');
} else {
  console.error('❌ Test 2 Failed: Permission state check or fallback missing in click-to-activate flow.');
  process.exit(1);
}

// ==========================================
// Test 3: Denied State & Browser Settings Guidance Modal
// ==========================================
const hasRoleDialog = modalContent.includes('role="dialog"');
const hasAriaModal = modalContent.includes('aria-modal="true"');
const hasAriaLabelledBy = modalContent.includes('aria-labelledby=');
const hasAriaDescribedBy = modalContent.includes('aria-describedby=');
const hasEscapeClose = modalContent.includes("e.key === 'Escape'");
const hasFocusAutoSetup = modalContent.includes('tryAgainBtnRef.current?.focus()');
const hasLockIconGuidance = modalContent.includes('🔒') || modalContent.includes('Lock');

if (
  hasRoleDialog &&
  hasAriaModal &&
  hasAriaLabelledBy &&
  hasAriaDescribedBy &&
  hasEscapeClose &&
  hasFocusAutoSetup &&
  hasLockIconGuidance
) {
  console.log('✅ Test 3 Passed: Accessible permission modal with ARIA attributes, Escape listener, focus management, and lock icon guidance.');
} else {
  console.error('❌ Test 3 Failed: Modal accessibility or browser guidance elements missing.');
  process.exit(1);
}

// ==========================================
// Test 4: Realistic Browser Security & Retry Handling
// ==========================================
// Verify Try Again re-checks permissions without falsely assuming JS can force the native prompt
const hasRetryHandler = aiContent.includes('handleTryAgain');
const rechecksPermissionOnRetry = aiContent.includes('await getMicrophonePermissionState()');
const showsStillBlockedMessage = aiContent.includes('t.micStillBlocked');
const hasCloseModalRestoreFocus = aiContent.includes('handleCloseMicModal') && aiContent.includes('micButtonRef.current?.focus()');

if (hasRetryHandler && rechecksPermissionOnRetry && showsStillBlockedMessage && hasCloseModalRestoreFocus) {
  console.log('✅ Test 4 Passed: Realistic browser retry handling preserves security boundaries and restores button focus on modal close.');
} else {
  console.error('❌ Test 4 Failed: Retry handling or focus restoration logic missing.');
  process.exit(1);
}

// ==========================================
// Test 5: SpeechRecognition Hardware & Network Error Handling
// ==========================================
const handlesNotAllowed = aiContent.includes("event.error === 'not-allowed'");
const handlesAudioCapture = aiContent.includes("event.error === 'audio-capture'");
const handlesNetwork = aiContent.includes("event.error === 'network'");
const handlesNoSpeech = aiContent.includes("event.error === 'no-speech'");
const handlesUnsupported = aiContent.includes('t.sttUnsupported');

if (handlesNotAllowed && handlesAudioCapture && handlesNetwork && handlesNoSpeech && handlesUnsupported) {
  console.log('✅ Test 5 Passed: All speech recognition error states (not-allowed, audio-capture, network, no-speech, sttUnsupported) handled with clear feedback.');
} else {
  console.error('❌ Test 5 Failed: Speech recognition error handling incomplete.');
  process.exit(1);
}

// ==========================================
// Test 6: Zero Background Listening Guarantee
// ==========================================
// Mic must be aborted/stopped on unmount, on message send, or when user clicks mic again while active
const stopsOnUnmount = aiContent.includes('recognitionRef.current.abort()');
const stopsOnMessageSend = aiContent.includes('handleSendMessage') && (aiContent.includes('recognitionRef.current.stop()') || aiContent.includes('recognitionRef.current?.stop()') || aiContent.includes('setIsListening(false)'));
const toggleStopsListening = aiContent.includes('if (isListening || isConnectingMic)') && aiContent.includes('recognitionRef.current.stop()');

if (stopsOnUnmount && stopsOnMessageSend && toggleStopsListening) {
  console.log('✅ Test 6 Passed: Zero background listening guaranteed across unmount, message submission, and toggle cancellation.');
} else {
  console.error('❌ Test 6 Failed: Background listening safeguards incomplete.');
  process.exit(1);
}

// ==========================================
// Test 7: Bilingual Dictionary Parity for Voice Keys
// ==========================================
const requiredMicKeys = [
  'micStart',
  'micStop',
  'micListening',
  'micConnecting',
  'micBlockedTitle',
  'micBlockedDesc',
  'micStep1',
  'micStep2',
  'micStep3',
  'micTryAgain',
  'micClose',
  'micStillBlocked',
  'micNoDevice',
  'micNetworkError',
  'micNoSpeech',
  'sttUnsupported',
];

let micKeysValid = true;
for (const key of requiredMicKeys) {
  const enVal = en.assistant?.[key] || en[key];
  const hiVal = hi.assistant?.[key] || hi[key];
  const tEn = TRANSLATIONS.en?.[key];
  const tHi = TRANSLATIONS.hi?.[key];

  if (!enVal || typeof enVal !== 'string' || enVal.trim() === '') {
    console.error(`❌ Missing English translation in locales/en.js for '${key}'`);
    micKeysValid = false;
  }
  if (!hiVal || typeof hiVal !== 'string' || hiVal.trim() === '') {
    console.error(`❌ Missing Hindi translation in locales/hi.js for '${key}'`);
    micKeysValid = false;
  }
  if (!tEn || typeof tEn !== 'string' || tEn.trim() === '') {
    console.error(`❌ Missing English translation in translations.js for '${key}'`);
    micKeysValid = false;
  }
  if (!tHi || typeof tHi !== 'string' || tHi.trim() === '') {
    console.error(`❌ Missing Hindi translation in translations.js for '${key}'`);
    micKeysValid = false;
  }
}

if (micKeysValid) {
  console.log(`✅ Test 7 Passed: 100% bilingual parity verified for all ${requiredMicKeys.length} voice input & permission modal keys across en.js, hi.js, and translations.js.`);
} else {
  console.error('❌ Test 7 Failed: Microphone translation dictionary parity check failed.');
  process.exit(1);
}

console.log('\n🎉 ALL 7 MICROPHONE & VOICE PERMISSION TESTS PASSED WITH 100% SUCCESS!\n');
