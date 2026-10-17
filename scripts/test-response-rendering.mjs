/**
 * Test Suite: AI Assistant Response Rendering & Universal Parser
 *
 * Verifies:
 * 1. Recommendation response with 3 schemes (cards with title, benefit, criteria, docs, portal).
 * 2. Single-choice question with 4 options (interactive choices with label & value).
 * 3. Question with allowSkip: true.
 * 4. Plain-text non-JSON response (human readable, no JSON keys/braces).
 * 5. Malformed/truncated JSON (recovers clean reply without throwing or showing JSON syntax).
 * 6. Historical conversation with raw JSON strings restored from storage is cleanly normalized.
 */

import assert from 'assert';
import { parseStructuredResponse, normalizeMessage } from '../src/utils/responseParser.js';
import { saveConversation, getConversations } from '../src/utils/chatStorage.js';

console.log('--- Sahayak AI Response Rendering & Universal Parser Unit Tests ---\n');

// Mock localStorage for Node test runner
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// ============================================================================
// CASE 1: Recommendation response with 3 schemes
// ============================================================================
console.log('▶ Case 1: Recommendation response with 3 schemes');
const rawCase1 = JSON.stringify({
  reply: 'Based on your rural location and landholding farmer status, here are 3 government welfare schemes for you:',
  questionType: 'recommendations',
  fieldKey: null,
  allowSkip: false,
  options: [],
  recommendedSchemes: [
    {
      id: 'pm-kisan',
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      benefit: '₹6,000 per year in 3 equal installments of ₹2,000 via DBT',
      keyCriteria: 'Small and marginal landholding farmer families with cultivable land',
      documentsRequired: ['Aadhaar Card', 'Land ownership papers (Khatauni)', 'Active bank account details'],
      portalUrl: 'https://pmkisan.gov.in',
    },
    {
      id: 'pm-kmy',
      title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
      benefit: 'Guaranteed pension of ₹3,000/month after 60 years of age',
      keyCriteria: 'Small and marginal farmers aged 18 to 40 with up to 2 hectares cultivable land',
      documentsRequired: ['Aadhaar Card', 'Khasra/Khatauni land records', 'Savings bank account'],
      portalUrl: 'https://maandhan.in',
    },
    {
      id: 'ayushman-bharat',
      title: 'Ayushman Bharat (AB-PMJAY)',
      benefit: '₹5 Lakh per family per year for secondary and tertiary hospitalization',
      keyCriteria: 'Listed in SECC 2011 rural deprivation criteria D1 to D7',
      documentsRequired: ['Aadhaar Card', 'Ration Card', 'PMJAY Family ID'],
      portalUrl: 'https://pmjay.gov.in',
    },
  ],
});

const parsedCase1 = parseStructuredResponse(rawCase1, 'en');

assert.strictEqual(parsedCase1.questionType, 'recommendations', 'questionType must be recommendations');
assert.strictEqual(parsedCase1.recommendedSchemes.length, 3, 'Must contain exactly 3 schemes');
assert.strictEqual(parsedCase1.reply.includes('{'), false, 'Reply must not contain {');
assert.strictEqual(parsedCase1.reply.includes('"reply"'), false, 'Reply must not contain "reply"');
assert.strictEqual(parsedCase1.reply.includes('recommendedSchemes'), false, 'Reply must not contain raw keys');

// Verify scheme details
const s1 = parsedCase1.recommendedSchemes[0];
assert.strictEqual(s1.title, 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)');
assert.strictEqual(s1.benefit.includes('₹6,000'), true);
assert.strictEqual(s1.keyCriteria.includes('cultivable land'), true);
assert.strictEqual(s1.documentsRequired.length, 3);
assert.strictEqual(s1.portalUrl, 'https://pmkisan.gov.in');
console.log('✅ Case 1 Passed: 3 schemes correctly parsed into structured cards with clean reply text.');

// ============================================================================
// CASE 2: Single-choice question with 4 options
// ============================================================================
console.log('▶ Case 2: Single-choice question with 4 options');
const rawCase2 = `\`\`\`json
{
  "reply": "What is your approximate annual household income?",
  "questionType": "single_choice",
  "fieldKey": "annualIncome",
  "allowSkip": true,
  "options": [
    { "label": "Below ₹1 Lakh", "value": "below_1l" },
    { "label": "₹1 Lakh - ₹2.5 Lakhs", "value": "1l_2.5l" },
    { "label": "₹2.5 Lakhs - ₹8 Lakhs", "value": "2.5l_8l" },
    { "label": "Above ₹8 Lakhs", "value": "above_8l" }
  ]
}
\`\`\``;

const parsedCase2 = parseStructuredResponse(rawCase2, 'en');
assert.strictEqual(parsedCase2.reply, 'What is your approximate annual household income?');
assert.strictEqual(parsedCase2.questionType, 'single_choice');
assert.strictEqual(parsedCase2.fieldKey, 'annualIncome');
assert.strictEqual(parsedCase2.allowSkip, true);
assert.strictEqual(parsedCase2.options.length, 4);
assert.strictEqual(parsedCase2.options[0].label, 'Below ₹1 Lakh');
assert.strictEqual(parsedCase2.options[0].value, 'below_1l');
assert.strictEqual(parsedCase2.options[3].label, 'Above ₹8 Lakhs');
assert.strictEqual(parsedCase2.options[3].value, 'above_8l');
console.log('✅ Case 2 Passed: Single-choice question with 4 options correctly extracted from code fences.');

// ============================================================================
// CASE 3: Skip-enabled question
// ============================================================================
console.log('▶ Case 3: Skip-enabled question');
const rawCase3 = {
  reply: 'Please select your state or union territory:',
  questionType: 'single_choice',
  fieldKey: 'state',
  allowSkip: true,
  options: [
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'Bihar', value: 'Bihar' },
  ],
};

const parsedCase3 = parseStructuredResponse(rawCase3, 'en');
assert.strictEqual(parsedCase3.allowSkip, true, 'allowSkip must be boolean true');
assert.strictEqual(parsedCase3.options.length, 2);
console.log('✅ Case 3 Passed: allowSkip correctly preserved as internal control metadata.');

// ============================================================================
// CASE 4: Normal plain text response (non-JSON)
// ============================================================================
console.log('▶ Case 4: Normal plain text response (non-JSON)');
const rawCase4 = 'Namaste! Welcome to Sahayak AI. I can guide you through central and state welfare initiatives including PM-KISAN, Ayushman Bharat, and PMAY-G.';

const parsedCase4 = parseStructuredResponse(rawCase4, 'en');
assert.strictEqual(parsedCase4.reply, rawCase4);
assert.strictEqual(parsedCase4.questionType, 'none');
assert.strictEqual(parsedCase4.fieldKey, null);
assert.strictEqual(parsedCase4.allowSkip, false);
assert.strictEqual(parsedCase4.options.length, 0);
assert.strictEqual(parsedCase4.recommendedSchemes.length, 0);
assert.strictEqual(parsedCase4.reply.startsWith('{'), false);
console.log('✅ Case 4 Passed: Normal plain text response preserved verbatim without adding JSON artifacts.');

// ============================================================================
// CASE 5: Malformed JSON response
// ============================================================================
console.log('▶ Case 5: Malformed JSON response');
const rawCase5 = '{"reply": "PM Vishwakarma provides traditional craftspeople with ₹15,000 modern toolkit incentives and subsidized loans up to ₹3 Lakhs at 5% interest rate.", "questionType": "recommendations", "recommendedSchemes": [{"title": "PM Vishwakarma", "bene';

const parsedCase5 = parseStructuredResponse(rawCase5, 'en');
assert.strictEqual(parsedCase5.reply.includes('PM Vishwakarma provides traditional craftspeople'), true);
assert.strictEqual(parsedCase5.reply.includes('₹15,000 modern toolkit incentives'), true);
assert.strictEqual(parsedCase5.reply.includes('{'), false, 'Reply must NOT have braces');
assert.strictEqual(parsedCase5.reply.includes('"reply"'), false, 'Reply must NOT have "reply" key');
assert.strictEqual(parsedCase5.reply.includes('"bene'), false, 'Reply must NOT have broken tokens');
console.log('✅ Case 5 Passed: Malformed truncated JSON recovered clean human-readable reply without crashing.');

// ============================================================================
// CASE 6: Restored historical conversation containing structured messages
// ============================================================================
console.log('▶ Case 6: Restored historical conversation containing structured messages');
mockStorage.clear();

const historicalConversation = {
  id: 'conv_historical_123',
  title: 'PM-KISAN Query',
  language: 'en',
  messages: [
    {
      id: 'msg_u1',
      sender: 'user',
      text: 'I am a small farmer in UP. Am I eligible for PM-KISAN?',
    },
    {
      id: 'msg_a1',
      sender: 'assistant',
      // Legacy unparsed string stored previously in database/localStorage
      text: JSON.stringify({
        reply: 'Yes, as a landholding farmer family in Uttar Pradesh with cultivable land, you qualify for PM-KISAN receiving ₹6,000 annually.',
        questionType: 'single_choice',
        fieldKey: 'farmerLandholding',
        allowSkip: false,
        options: [
          { label: 'Yes, I have Khatauni records', value: 'has_records' },
          { label: 'No land in my name', value: 'no_land' },
        ],
        recommendedSchemes: [],
      }),
    },
  ],
};

// Save to storage
saveConversation(historicalConversation);

// Retrieve from storage
const loaded = getConversations();
assert.strictEqual(loaded.length, 1);
const restoredAssistantMsg = loaded[0].messages.find((m) => m.sender === 'assistant');

assert.strictEqual(restoredAssistantMsg.text.startsWith('{'), false, 'Restored text must NOT start with {');
assert.strictEqual(restoredAssistantMsg.text.includes('"reply"'), false, 'Restored text must NOT contain "reply"');
assert.strictEqual(
  restoredAssistantMsg.text,
  'Yes, as a landholding farmer family in Uttar Pradesh with cultivable land, you qualify for PM-KISAN receiving ₹6,000 annually.'
);
assert.strictEqual(restoredAssistantMsg.questionType, 'single_choice');
assert.strictEqual(restoredAssistantMsg.options.length, 2);
assert.strictEqual(restoredAssistantMsg.options[0].label, 'Yes, I have Khatauni records');
assert.strictEqual(restoredAssistantMsg.options[0].value, 'has_records');
console.log('✅ Case 6 Passed: Historical conversation with raw JSON automatically normalized on restore.\n');

console.log('🎉 ALL 6 RESPONSE RENDERING & UNIVERSAL PARSER TESTS PASSED WITH 100% SUCCESS!\n');
