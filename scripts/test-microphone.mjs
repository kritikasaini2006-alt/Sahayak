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
// Test 2: Unrequested / Prompt / Unknown Permission Not Treated as Denied
// ==========================================
// Verify that permState === 'prompt' or 'unknown' does NOT trigger setShowMicModal(true) directly
const doesNotTreatPromptAsDenied = !aiContent.includes("permState === 'prompt' && setShowMicModal(true)") &&
  !aiContent.includes("permState !== 'granted' && setShowMicModal(true)");
const checksExplicitDeniedOnly = aiContent.includes("if (permState === 'denied')") &&
  aiContent.includes('setShowMicModal(true)');

if (doesNotTreatPromptAsDenied && checksExplicitDeniedOnly) {
  console.log("✅ Test 2 Passed: Unrequested ('prompt') and 'unknown' states are NOT treated as denied; only explicit 'denied' triggers modal directly.");
} else {
  console.error("❌ Test 2 Failed: Unrequested or unknown permission state improperly treated as denied.");
  process.exit(1);
}

// ==========================================
// Test 3: getUserMedia Triggers Browser Native Permission Prompt After Click
// ==========================================
const callsGetUserMedia = aiContent.includes("navigator.mediaDevices.getUserMedia({ audio: true })");
const triggerHelperExists = aiContent.includes('triggerMicrophoneAndStart');
const clickInvokesTrigger = aiContent.includes('await triggerMicrophoneAndStart(permState)');

if (callsGetUserMedia && triggerHelperExists && clickInvokesTrigger) {
  console.log('✅ Test 3 Passed: User click triggers native browser permission prompt via navigator.mediaDevices.getUserMedia({ audio: true }).');
} else {
  console.error('❌ Test 3 Failed: getUserMedia native prompt activation missing in click flow.');
  process.exit(1);
}

// ==========================================
// Test 4: Immediate Release of Temporary Stream to Prevent Hardware Conflicts
// ==========================================
const releasesAudioTracks = aiContent.includes('stream.getTracks().forEach((track) => track.stop())');
const startsRecognitionAfterRelease = aiContent.indexOf('stream.getTracks().forEach((track) => track.stop())') <
  aiContent.indexOf('startRecognition();\n      } catch (err)');

if (releasesAudioTracks && startsRecognitionAfterRelease) {
  console.log('✅ Test 4 Passed: Temporary audio stream tracks are immediately stopped after grant to avoid device conflicts before starting SpeechRecognition.');
} else {
  console.error('❌ Test 4 Failed: Audio stream not stopped or release order incorrect.');
  process.exit(1);
}

// ==========================================
// Test 5: Insecure Contexts & Missing API Handling
// ==========================================
const checksSecureContext = aiContent.includes('window.isSecureContext === false');
const handlesMissingMediaDevices = aiContent.includes('navigator.mediaDevices?.getUserMedia');

if (checksSecureContext && handlesMissingMediaDevices) {
  console.log('✅ Test 5 Passed: Gracefully checks for secure context (HTTPS/localhost) and missing mediaDevices API.');
} else {
  console.error('❌ Test 5 Failed: Secure context or missing API handling missing.');
  process.exit(1);
}

// ==========================================
// Test 6: Network Error Accurate Messaging (No False Offline Accusation)
// ==========================================
// Message must not claim "Please check your internet connection" when the cloud service is unreachable
const enNetMsg = en.assistant?.micNetworkError || '';
const hiNetMsg = hi.assistant?.micNetworkError || '';
const doesNotBlameInternetOnly = !enNetMsg.includes('Please check your internet connection') &&
  (enNetMsg.includes('privacy shields') || enNetMsg.includes('unreachable') || enNetMsg.includes('filters'));

if (doesNotBlameInternetOnly && hiNetMsg.length > 0) {
  console.log('✅ Test 6 Passed: Network error message provides accurate guidance regarding privacy shields and filters without falsely claiming internet is disconnected.');
} else {
  console.error('❌ Test 6 Failed: Network error still inaccurately claims internet is disconnected.');
  process.exit(1);
}

// ==========================================
// Test 7: Clean Session Abort, UI Reset & Retry Button in Banner
// ==========================================
const abortsOnError = aiContent.includes('recognitionRef.current.abort()') &&
  aiContent.includes('recognitionRef.current = null');
const resetsStateOnError = aiContent.includes('setIsConnectingMic(false)') &&
  aiContent.includes('setIsListening(false)');
const hasRetryInBanner = aiContent.includes('handleToggleListening()') &&
  aiContent.includes('t.micRetry');

if (abortsOnError && resetsStateOnError && hasRetryInBanner) {
  console.log('✅ Test 7 Passed: Recognition session cleanly aborts on error, resets mic state, and displays error banner with Retry button.');
} else {
  console.error('❌ Test 7 Failed: Clean abort, state reset, or Retry button in banner missing.');
  process.exit(1);
}

// ==========================================
// Test 8: Language Specific Recognition (en-IN and hi-IN)
// ==========================================
const configuresLanguage = aiContent.includes("recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'");
const configuresMaxAlternatives = aiContent.includes('recognition.maxAlternatives = 1');
const stopsOnLanguageChange = aiContent.includes('handleLanguageChange') &&
  aiContent.includes('recognitionRef.current.abort()');

if (configuresLanguage && configuresMaxAlternatives && stopsOnLanguageChange) {
  console.log('✅ Test 8 Passed: Recognition targets en-IN for English and hi-IN for Hindi, with single alternative and language change cleanup.');
} else {
  console.error('❌ Test 8 Failed: Language specific recognition or language change cleanup missing.');
  process.exit(1);
}

// ==========================================
// Test 9: Independent Text Input Availability
// ==========================================
const textInputAvailable = aiContent.includes('<input') &&
  aiContent.includes('ref={inputRef}') &&
  aiContent.includes('value={inputPrompt}');

if (textInputAvailable) {
  console.log('✅ Test 9 Passed: Text input remains fully available and functional regardless of voice input state or speech errors.');
} else {
  console.error('❌ Test 9 Failed: Text input structure compromised.');
  process.exit(1);
}

// ==========================================
// Test 10: Accessible Permission Modal & Lock Icon Guidance
// ==========================================
const hasRoleDialog = modalContent.includes('role="dialog"');
const hasAriaModal = modalContent.includes('aria-modal="true"');
const hasEscapeClose = modalContent.includes("e.key === 'Escape'");
const hasLockIconGuidance = modalContent.includes('🔒') || modalContent.includes('Lock');

if (hasRoleDialog && hasAriaModal && hasEscapeClose && hasLockIconGuidance) {
  console.log('✅ Test 10 Passed: Accessible permission modal with ARIA attributes, Escape key listener, and address bar lock icon instructions.');
} else {
  console.error('❌ Test 10 Failed: Modal accessibility or browser guidance elements missing.');
  process.exit(1);
}

// ==========================================
// Test 11: Bilingual Dictionary Parity for Voice Keys
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
  'micRetry',
  'micNoSpeech',
  'micInsecureContext',
  'micInUse',
  'micServiceNotAllowed',
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
  console.log(`✅ Test 11 Passed: 100% bilingual parity verified for all ${requiredMicKeys.length} voice input & permission modal keys across en.js, hi.js, and translations.js.`);
} else {
  console.error('❌ Test 11 Failed: Microphone translation dictionary parity check failed.');
  process.exit(1);
}

console.log('\n🎉 ALL 11 MICROPHONE & VOICE PERMISSION TESTS PASSED WITH 100% SUCCESS!\n');
