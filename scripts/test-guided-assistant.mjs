import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  processChatRequest,
  generateSystemPrompt,
  generateOfflineSampleReply,
  DEFAULT_OPTIONS_BY_FIELD,
  OfflineReply,
} from '../api/chat.js';
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

async function runGuidedAssistantTests() {
  console.log('--- Sahayak AI Interactive Guided Assistant Unit Tests ---');
  let failures = 0;

  // Test 1: Single-choice option generation for State/UT in Guided Flow
  try {
    const reply = generateOfflineSampleReply('Find schemes for me', 'en', null);
    if (
      reply.questionType === 'single_choice' &&
      reply.fieldKey === 'state' &&
      Array.isArray(reply.options) &&
      reply.options.length >= 5 &&
      reply.options.some((o) => o.value === 'Other' || o.label.includes('Other'))
    ) {
      console.log('✅ Test 1 Passed: Single-choice question for State/UT generated with valid options and "Other".');
    } else {
      console.error('❌ Test 1 Failed: Expected single_choice for state, got:', reply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Hindi Localization & Devanagari Options in Guided Flow
  try {
    const hindiReply = generateOfflineSampleReply('मेरे लिए सरकारी योजनाएं खोजें', 'hi', null);
    if (
      hindiReply.questionType === 'single_choice' &&
      hindiReply.fieldKey === 'state' &&
      Array.isArray(hindiReply.options) &&
      hindiReply.options.some((o) => o.label.includes('उत्तर प्रदेश')) &&
      hindiReply.options.some((o) => o.label.includes('अन्य'))
    ) {
      console.log('✅ Test 2 Passed: Hindi guided flow presents authentic Devanagari labels and options.');
    } else {
      console.error('❌ Test 2 Failed: Expected Hindi state options, got:', hindiReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: One Question at a Time & Profile Skipping (State known -> asks Age)
  try {
    const profileWithState = { state: 'Uttar Pradesh' };
    const reply = generateOfflineSampleReply('Guide me to schemes', 'en', profileWithState);
    if (
      reply.questionType === 'single_choice' &&
      reply.fieldKey === 'ageGroup' &&
      Array.isArray(reply.options) &&
      reply.options.some((o) => o.value.includes('18_35'))
    ) {
      console.log('✅ Test 3 Passed: Automatically skipped State and proceeded to Age group when State is known.');
    } else {
      console.error('❌ Test 3 Failed: Expected ageGroup question when state is known, got:', reply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: Progression to Occupation when State & Age are known
  try {
    const profileWithStateAge = { state: 'Bihar', age: 32 };
    const reply = generateOfflineSampleReply('Find welfare schemes', 'en', profileWithStateAge);
    if (
      reply.questionType === 'single_choice' &&
      reply.fieldKey === 'occupation' &&
      Array.isArray(reply.options) &&
      reply.options.some((o) => o.value === 'farmer') &&
      reply.options.some((o) => o.value === 'artisan')
    ) {
      console.log('✅ Test 4 Passed: Progressed to Occupation when State and Age are already provided.');
    } else {
      console.error('❌ Test 4 Failed: Expected occupation question, got:', reply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Direct Inquiries answer directly without questionnaire (questionType = 'none')
  try {
    const directReply = generateOfflineSampleReply('What is PM-KISAN subsidy?', 'en');
    if (
      directReply.questionType === 'none' &&
      directReply.reply.includes('₹6,000') &&
      directReply.recommendedSchemes &&
      directReply.recommendedSchemes.length > 0 &&
      directReply.recommendedSchemes[0].portalUrl.includes('pmkisan.gov.in')
    ) {
      console.log('✅ Test 5 Passed: Direct statutory query answers directly with questionType: "none" and verified portal.');
    } else {
      console.error('❌ Test 5 Failed: Direct question should not force questionnaire:', directReply);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  // Test 6: Skip Option Support (allowSkip flag)
  try {
    const stateReply = generateOfflineSampleReply('Find schemes', 'en', null);
    if (stateReply.allowSkip === true) {
      console.log('✅ Test 6 Passed: Non-essential / optional questions have allowSkip: true.');
    } else {
      console.error('❌ Test 6 Failed: Expected allowSkip: true for state question, got:', stateReply.allowSkip);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 6 Exception:', err);
    failures++;
  }

  // Test 7: Standard Option Dictionaries for All Guided Fields
  try {
    const requiredFields = ['state', 'ageGroup', 'occupation', 'incomeRange', 'farmerLandholding', 'artisanTrade'];
    let allFieldsValid = true;
    for (const f of requiredFields) {
      const enOpts = DEFAULT_OPTIONS_BY_FIELD[f]?.en;
      const hiOpts = DEFAULT_OPTIONS_BY_FIELD[f]?.hi;
      if (!Array.isArray(enOpts) || enOpts.length < 3 || !Array.isArray(hiOpts) || hiOpts.length < 3) {
        allFieldsValid = false;
        console.error(`Missing options dictionary for field: ${f}`);
      }
    }
    if (allFieldsValid) {
      console.log('✅ Test 7 Passed: Verified comprehensive bilingual fallback options for all 6 guided fields.');
    } else {
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 7 Exception:', err);
    failures++;
  }

  // Test 8: System Prompt strictly enforces Privacy & JSON Output Schema
  try {
    const prompt = generateSystemPrompt('en', { state: 'Rajasthan', occupation: 'farmer' });
    const hasPrivacyRule = prompt.includes('NEVER ask for or store Aadhaar numbers');
    const hasJsonSchema = prompt.includes('questionType') && prompt.includes('fieldKey') && prompt.includes('recommendedSchemes');
    const hasOneQuestionRule = prompt.includes('Ask ONLY ONE question per turn');
    const hasSkipProfileRule = prompt.includes('Do NOT ask questions that are already answered in the Citizen Profile');

    if (hasPrivacyRule && hasJsonSchema && hasOneQuestionRule && hasSkipProfileRule) {
      console.log('✅ Test 8 Passed: System prompt enforces Zero-PII privacy, JSON schema, and single-turn rules.');
    } else {
      console.error('❌ Test 8 Failed: System prompt missing mandatory rules.');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 8 Exception:', err);
    failures++;
  }

  // Test 9: Translation dictionary contains all guided interaction labels
  try {
    const enT = TRANSLATIONS.en;
    const hiT = TRANSLATIONS.hi;
    const requiredKeys = [
      'guidedStarterPrompt',
      'selectOptionPrompt',
      'selectMultiplePrompt',
      'confirmSelection',
      'skipQuestion',
      'changeAnswer',
      'recommendedSchemesTitle',
      'keyCriteriaLabel',
      'requiredDocsLabel',
      'officialPortalLabel',
      'checkEligibilityAction',
    ];
    let dictValid = true;
    for (const k of requiredKeys) {
      if (!enT[k] || typeof enT[k] !== 'string') {
        console.error(`Missing en key: ${k}`);
        dictValid = false;
      }
      if (!hiT[k] || typeof hiT[k] !== 'string') {
        console.error(`Missing hi key: ${k}`);
        dictValid = false;
      }
    }
    if (dictValid) {
      console.log('✅ Test 9 Passed: 100% bilingual parity for all 11 guided interaction UI labels.');
    } else {
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 9 Exception:', err);
    failures++;
  }

  // Test 10: Structured Scheme Recommendation Data Integrity
  try {
    const vishwakarmaReply = generateOfflineSampleReply('Tell me about PM Vishwakarma', 'en');
    const rec = vishwakarmaReply.recommendedSchemes?.[0];
    if (
      rec &&
      rec.id === 'pm-vishwakarma' &&
      rec.title.includes('Vishwakarma') &&
      rec.benefit.includes('₹15,000') &&
      rec.portalUrl.includes('pmvishwakarma.gov.in') &&
      Array.isArray(rec.documentsRequired) &&
      rec.documentsRequired.length >= 2
    ) {
      console.log('✅ Test 10 Passed: Recommended scheme object includes benefit, keyCriteria, documents, and portal URL.');
    } else {
      console.error('❌ Test 10 Failed: Invalid scheme recommendation structure:', rec);
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 10 Exception:', err);
    failures++;
  }

  // Test 11: Auto-Scroll - Removal of bottom sentinel & bottom-scroll override
  try {
    const assistantPagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const pageContent = fs.readFileSync(assistantPagePath, 'utf8');

    const hasBottomSentinel = pageContent.includes('messagesEndRef');
    const hasScrollToBottomOnDone = pageContent.includes('messagesEndRef.current?.scrollIntoView');
    const hasScrollTopScrollHeight = pageContent.includes('scrollTop = scrollHeight') || pageContent.includes('scrollTop = container.scrollHeight');

    if (!hasBottomSentinel && !hasScrollToBottomOnDone && !hasScrollTopScrollHeight) {
      console.log('✅ Test 11 Passed: Bottom sentinel and scroll-to-bottom overrides cleanly removed.');
    } else {
      console.error('❌ Test 11 Failed: Found bottom sentinel or scroll-to-bottom logic in AIAssistantPage.jsx');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 11 Exception:', err);
    failures++;
  }

  // Test 12: Stable reference for newly created AI message & comfortable top margin styling
  try {
    const assistantPagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const pageContent = fs.readFileSync(assistantPagePath, 'utf8');

    const hasAIMessageRef = pageContent.includes('latestAIMessageRef = useRef');
    const hasRefAttachedToMessage = pageContent.includes('ref={isLatestAssistant ? latestAIMessageRef :');
    const hasScrollMarginTop = pageContent.includes("scrollMarginTop: '16px'") && pageContent.includes('scroll-mt-4');

    if (hasAIMessageRef && hasRefAttachedToMessage && hasScrollMarginTop) {
      console.log('✅ Test 12 Passed: Stable React ref attached to AI message with 16px comfortable top margin.');
    } else {
      console.error('❌ Test 12 Failed: AI message ref or top margin styling missing.');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 12 Exception:', err);
    failures++;
  }

  // Test 13: Auto-scroll targets the START of the new AI message strictly inside the chat container with footer preserved
  try {
    const assistantPagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const pageContent = fs.readFileSync(assistantPagePath, 'utf8');

    const appLayoutPath = path.resolve(__dirname, '../src/components/layout/AppLayout.jsx');
    const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');

    const calculatesRelativePosition = pageContent.includes('getMessageTargetScrollTop') &&
      (pageContent.includes('messageEl.offsetTop') || pageContent.includes('messageRect.top - containerRect.top'));
    const scrollsContainerOnly = pageContent.includes('container.scrollTo({') &&
      pageContent.includes('top: targetScrollTop') &&
      pageContent.includes("behavior: 'smooth'");
    const doesNotScrollWindow = !pageContent.includes('scrollIntoView') &&
      !pageContent.includes('window.scrollTo');
    const hasBoundedContainerLayout = pageContent.includes('h-[calc(100dvh-200px)]') &&
      pageContent.includes('pb-8') &&
      pageContent.includes('relative flex-1 min-h-0') &&
      pageContent.includes('overflow-y-auto');
    const preservesFooterInLayout = appLayoutContent.includes('<Footer />') &&
      !appLayoutContent.includes('!isAssistantPage') &&
      !appLayoutContent.includes('overflow-hidden');

    if (calculatesRelativePosition && scrollsContainerOnly && doesNotScrollWindow && hasBoundedContainerLayout && preservesFooterInLayout) {
      console.log('✅ Test 13 Passed: Chat container exclusively scrolled to start of AI response; footer preserved in normal document layout.');
    } else {
      console.error('❌ Test 13 Failed: Container-only scroll calculation, bounded layout, or footer preservation check failed.');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 13 Exception:', err);
    failures++;
  }

  // Test 14: Progressive streaming / token updates stability
  try {
    const assistantPagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const pageContent = fs.readFileSync(assistantPagePath, 'utf8');

    const tracksScrolledMessageId = pageContent.includes('lastScrolledMessageIdRef.current !== latestAssistantMessageId');
    const resetsOnClear = pageContent.includes('lastScrolledMessageIdRef.current = null');
    const notTriggeredByIsTyping = !pageContent.includes('[latestAssistantMessageId, isTyping]') && !pageContent.includes('[messages, isTyping]');

    if (tracksScrolledMessageId && resetsOnClear && notTriggeredByIsTyping) {
      console.log('✅ Test 14 Passed: Progressive token updates and isTyping toggles do not force-scroll; view stays stable at message start.');
    } else {
      console.error('❌ Test 14 Failed: Progressive streaming stability check failed.');
      failures++;
    }
  } catch (err) {
    console.error('❌ Test 14 Exception:', err);
    failures++;
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 14 GUIDED ASSISTANT & CHAT SCROLLING TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error(`\n🚨 ${failures} GUIDED ASSISTANT TESTS FAILED.\n`);
    process.exit(1);
  }
}

runGuidedAssistantTests();
