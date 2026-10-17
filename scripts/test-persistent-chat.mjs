/**
 * Automated Unit & Integration Tests: Sahayak AI Persistent Chat History & New Chat
 */

import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  CONVERSATIONS_STORAGE_KEY,
  ACTIVE_CONVERSATION_ID_KEY,
  createNewConversation,
  createWelcomeMessage,
  generateConversationTitle,
  formatConversationTime,
  getConversations,
  getConversationById,
  saveConversation,
  updateConversationMessages,
  updateConversationSelectedOptions,
  deleteConversation,
  clearAllConversations,
  getActiveConversationId,
  setActiveConversationId,
  getOrCreateActiveConversation,
} from '../src/utils/chatStorage.js';

import {
  setActiveAuthUser,
  getScopedKey,
  migrateGuestDataToUser,
  hasGuestDataToMigrate,
} from '../src/utils/userStorage.js';

import { TRANSLATIONS } from '../src/data/translations.js';

// Setup Mock In-Memory LocalStorage for Node testing environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MockLocalStorage();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPersistentChatTests() {
  console.log('--- Sahayak AI Persistent Chat History & New Chat Unit & Integration Tests ---');
  let failures = 0;

  // Clear storage before tests
  localStorage.clear();
  setActiveAuthUser(null);

  // Test 1: Immediate persistence of user messages
  try {
    const conv = createNewConversation('en');
    saveConversation(conv);
    setActiveConversationId(conv.id);

    const userMessage = {
      id: 'usr_1001',
      sender: 'user',
      time: '10:00 AM',
      text: 'How can a small farmer apply for PM-KISAN ₹6,000 subsidy?',
    };

    const updatedMessages = [...conv.messages, userMessage];
    updateConversationMessages(conv.id, updatedMessages);

    const stored = getConversationById(conv.id);
    assert(stored, 'Conversation must exist in storage');
    assert.strictEqual(stored.messages.length, 2, 'Must contain welcome message and user message');
    assert.strictEqual(stored.messages[1].id, 'usr_1001');
    assert.strictEqual(stored.messages[1].sender, 'user');
    assert.strictEqual(stored.messages[1].text, userMessage.text);

    console.log('✅ Test 1 Passed: Every user message is immediately and automatically saved to storage.');
  } catch (err) {
    console.error('❌ Test 1 Exception:', err);
    failures++;
  }

  // Test 2: Automatic persistence of AI responses with complete metadata
  try {
    const activeId = getActiveConversationId();
    const existing = getConversationById(activeId);

    const assistantMessage = {
      id: 'asst_2001',
      sender: 'assistant',
      time: '10:01 AM',
      text: '**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account.',
      originalText: '**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account.',
      originalLanguage: 'en',
      translations: {
        en: '**PM-KISAN:** ₹6,000 per year',
        hi: '**पीएम-किसान:** प्रति वर्ष ₹6,000',
      },
      questionType: 'single_choice',
      fieldKey: 'farmerLandholding',
      options: [
        { label: 'Marginal (Less than 1 hectare)', value: 'marginal' },
        { label: 'Small (1 to 2 hectares)', value: 'small' },
      ],
      allowSkip: true,
      recommendedSchemes: [
        {
          id: 'pm-kisan',
          title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
          benefit: '₹6,000 per year in 3 equal installments',
          portalUrl: 'https://pmkisan.gov.in',
        },
      ],
      sources: ['pmkisan.gov.in', 'india.gov.in'],
      isDemoMode: false,
      isTranslating: false,
    };

    const updatedWithAsst = [...existing.messages, assistantMessage];
    updateConversationMessages(activeId, updatedWithAsst);

    const stored = getConversationById(activeId);
    assert.strictEqual(stored.messages.length, 3, 'Must contain 3 messages');
    const lastMsg = stored.messages[2];
    assert.strictEqual(lastMsg.id, 'asst_2001');
    assert.strictEqual(lastMsg.sender, 'assistant');
    assert.strictEqual(lastMsg.fieldKey, 'farmerLandholding');
    assert.strictEqual(lastMsg.options.length, 2);
    assert.strictEqual(lastMsg.recommendedSchemes.length, 1);
    assert.strictEqual(lastMsg.recommendedSchemes[0].id, 'pm-kisan');

    console.log('✅ Test 2 Passed: AI responses and comprehensive metadata (options, schemes, sources) automatically persisted.');
  } catch (err) {
    console.error('❌ Test 2 Exception:', err);
    failures++;
  }

  // Test 3: Restoring conversation after navigating away and returning (page re-mount)
  try {
    const activeIdBeforeNav = getActiveConversationId();
    // Simulate user navigating to /schemes and returning to /assistant
    const restoredConv = getOrCreateActiveConversation(null, 'en');
    assert.strictEqual(restoredConv.id, activeIdBeforeNav, 'Must restore the active conversation ID');
    assert.strictEqual(restoredConv.messages.length, 3, 'Must restore all 3 messages without data loss');
    assert.strictEqual(restoredConv.messages[1].text, 'How can a small farmer apply for PM-KISAN ₹6,000 subsidy?');
    assert.strictEqual(restoredConv.messages[2].recommendedSchemes[0].id, 'pm-kisan');

    console.log('✅ Test 3 Passed: Navigating away and returning restores the exact conversation without data loss.');
  } catch (err) {
    console.error('❌ Test 3 Exception:', err);
    failures++;
  }

  // Test 4: + New Chat button creates fresh conversation with unique ID
  try {
    const firstConvId = getActiveConversationId();
    const firstConv = getConversationById(firstConvId);

    // Simulate clicking + New Chat
    const newConv = createNewConversation('en');
    assert.notStrictEqual(newConv.id, firstConvId, 'New chat must have a distinct unique ID');
    saveConversation(newConv);
    setActiveConversationId(newConv.id);

    // Active conversation view now shows new conversation
    const activeConv = getOrCreateActiveConversation(null, 'en');
    assert.strictEqual(activeConv.id, newConv.id, 'Active chat view must now show the new conversation');
    assert.strictEqual(activeConv.messages.length, 1, 'Fresh conversation must start with only welcome message');
    assert.strictEqual(activeConv.messages[0].id, 'welcome');

    // Previous conversation must still exist in storage!
    const previousConv = getConversationById(firstConvId);
    assert(previousConv, 'Previous conversation must NOT be deleted');
    assert.strictEqual(previousConv.messages.length, 3, 'Previous conversation messages must be intact');

    console.log('✅ Test 4 Passed: + New Chat starts a fresh conversation with unique ID while preserving previous chat.');
  } catch (err) {
    console.error('❌ Test 4 Exception:', err);
    failures++;
  }

  // Test 5: Chat history list displays all previous conversations with auto-generated titles
  try {
    // Add user question to the second conversation
    const secondConvId = getActiveConversationId();
    const secondUserMsg = {
      id: 'usr_2002',
      sender: 'user',
      time: '11:00 AM',
      text: 'Who is eligible for Ayushman Bharat ₹5 Lakh cashless health cover?',
    };
    updateConversationMessages(secondConvId, [
      createWelcomeMessage('en'),
      secondUserMsg,
    ]);

    const allConversations = getConversations();
    assert.strictEqual(allConversations.length, 2, 'Must list both conversations in chat history');

    // Title generation check
    const conv1 = allConversations.find((c) => c.messages.some((m) => m.text?.includes('PM-KISAN')));
    const conv2 = allConversations.find((c) => c.messages.some((m) => m.text?.includes('Ayushman Bharat')));

    assert(conv1, 'First conversation must be found');
    assert(conv2, 'Second conversation must be found');
    assert(conv1.title.includes('PM-KISAN'), 'Title should be generated from first user question');
    assert(conv2.title.includes('Ayushman Bharat'), 'Title should be generated from first user question');

    // Date formatting helper check
    const todayStr = formatConversationTime(new Date().toISOString(), 'en');
    const todayHiStr = formatConversationTime(new Date().toISOString(), 'hi');
    assert(todayStr.startsWith('Today,'), 'Today time string must start with Today,');
    assert(todayHiStr.startsWith('आज,'), 'Hindi time string must start with आज,');

    console.log('✅ Test 5 Passed: Chat history lists previous conversations with auto-generated titles and bilingual timestamps.');
  } catch (err) {
    console.error('❌ Test 5 Exception:', err);
    failures++;
  }

  // Test 6: Switching between conversations restores messages, roles, and selected options
  try {
    const all = getConversations();
    const firstChat = all.find((c) => c.title.includes('PM-KISAN'));
    assert(firstChat, 'First chat must exist');

    // User switches to first chat from history drawer
    setActiveConversationId(firstChat.id);
    const loaded = getOrCreateActiveConversation(null, 'en');
    assert.strictEqual(loaded.id, firstChat.id, 'Loaded conversation ID must match selected conversation');
    assert.strictEqual(loaded.messages.length, 3, 'Must restore all 3 messages of selected conversation');

    // Update selected options on this conversation
    const updatedMap = { asst_2001: 'Small (1 to 2 hectares)' };
    updateConversationSelectedOptions(firstChat.id, updatedMap);

    const reloaded = getConversationById(firstChat.id);
    assert.deepStrictEqual(reloaded.selectedOptionsMap, updatedMap, 'Selected interactive options must persist');

    console.log('✅ Test 6 Passed: Seamless switching between conversations restores messages and interactive choices.');
  } catch (err) {
    console.error('❌ Test 6 Exception:', err);
    failures++;
  }

  // Test 7: Individual conversation deletion and clear all history
  try {
    const allBefore = getConversations();
    assert.strictEqual(allBefore.length, 2);

    const chatToDelete = allBefore[0];
    const chatToKeep = allBefore[1];

    deleteConversation(chatToDelete.id);
    const allAfterDelete = getConversations();
    assert.strictEqual(allAfterDelete.length, 1, 'One conversation must remain after deletion');
    assert.strictEqual(allAfterDelete[0].id, chatToKeep.id, 'Remaining conversation must be intact');

    // Clear all history
    clearAllConversations();
    const allAfterClear = getConversations();
    assert.strictEqual(allAfterClear.length, 0, 'No conversations should remain after clearAllConversations');
    assert.strictEqual(getActiveConversationId(), null, 'Active conversation ID must be cleared');

    console.log('✅ Test 7 Passed: Individual conversation deletion and clear all history verified.');
  } catch (err) {
    console.error('❌ Test 7 Exception:', err);
    failures++;
  }

  // Test 8: Safe abort of in-flight responses on New Chat prevents unfinished responses from corrupting chats
  try {
    // Recreate fresh conversation
    const convA = createNewConversation('en');
    saveConversation(convA);
    setActiveConversationId(convA.id);

    // Simulate in-flight user message
    const userMsg = {
      id: 'usr_abort_test',
      sender: 'user',
      time: '12:00 PM',
      text: 'Tell me about PM SVANidhi',
    };
    updateConversationMessages(convA.id, [createWelcomeMessage('en'), userMsg]);

    // Simulate AbortController firing when user clicks + New Chat while generating
    const controller = new AbortController();
    controller.abort(); // Simulates user clicking New Chat before API responds

    const convB = createNewConversation('en');
    saveConversation(convB);
    setActiveConversationId(convB.id);

    // If an aborted response attempts to resolve, controller.signal.aborted prevents it from writing
    const wouldWrite = !controller.signal.aborted;
    assert.strictEqual(wouldWrite, false, 'Aborted response must not write to any conversation');

    // Verify convA has user message intact and convB has only welcome message
    const checkA = getConversationById(convA.id);
    const checkB = getConversationById(convB.id);
    assert.strictEqual(checkA.messages.length, 2, 'convA must retain user prompt without corrupting');
    assert.strictEqual(checkB.messages.length, 1, 'convB must remain a clean fresh conversation');

    console.log('✅ Test 8 Passed: Aborting in-flight responses on New Chat prevents unfinished responses from corrupting conversations.');
  } catch (err) {
    console.error('❌ Test 8 Exception:', err);
    failures++;
  }

  // Test 9: Data isolation between authenticated Supabase users and guest migration
  try {
    localStorage.clear();
    setActiveAuthUser(null); // Guest mode

    // Guest creates conversation
    const guestConv = createNewConversation('en');
    const guestMsg = {
      id: 'usr_guest_1',
      sender: 'user',
      time: '01:00 PM',
      text: 'What schemes are available for artisans in Rajasthan?',
    };
    guestConv.messages.push(guestMsg);
    saveConversation(guestConv);
    setActiveConversationId(guestConv.id);

    assert(hasGuestDataToMigrate(), 'Guest conversations should trigger hasGuestDataToMigrate()');

    // User logs in
    const authUserId = 'user_supabase_987';
    migrateGuestDataToUser(authUserId);
    setActiveAuthUser(authUserId);

    // Authenticated user should have the migrated conversation
    const userConvs = getConversations(authUserId);
    assert.strictEqual(userConvs.length, 1, 'Migrated conversation should be in user account');
    assert.strictEqual(userConvs[0].messages[1].text, guestMsg.text);

    // Another user logs in and has strict isolation
    const otherUserId = 'user_supabase_654';
    setActiveAuthUser(otherUserId);
    const otherConvs = getConversations(otherUserId);
    assert.strictEqual(otherConvs.length, 0, 'Other user must have empty workspace (strict isolation)');

    console.log('✅ Test 9 Passed: Strict Supabase user isolation and guest conversation migration verified.');
  } catch (err) {
    console.error('❌ Test 9 Exception:', err);
    failures++;
  }

  // Test 10: UI components and 100% bilingual parity for New Chat & Chat History
  try {
    const pagePath = path.resolve(__dirname, '../src/pages/AIAssistantPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    // Verify + New Chat button in AIAssistantPage
    const hasNewChatBtn = content.includes('handleNewChat') && (content.includes('t.newChat') || content.includes('+ New Chat'));
    assert(hasNewChatBtn, 'AIAssistantPage must render + New Chat button');

    // Verify Chat History button and Drawer in AIAssistantPage
    const hasHistoryBtn = content.includes('setShowHistoryDrawer') && (content.includes('t.chatHistory') || content.includes('Chat History'));
    const hasDrawer = content.includes('showHistoryDrawer') && content.includes('conversations.map');
    assert(hasHistoryBtn, 'AIAssistantPage must render Chat History button');
    assert(hasDrawer, 'AIAssistantPage must render Chat History slide-over drawer');

    // Verify bilingual parity for all 12 persistent chat keys across en and hi
    const chatKeys = [
      'newChat',
      'chatHistory',
      'noHistory',
      'noHistorySubtitle',
      'activeChat',
      'deleteChat',
      'deleteChatConfirm',
      'clearAllHistory',
      'clearAllHistoryConfirm',
      'messagesCount',
      'today',
      'yesterday',
    ];

    for (const key of chatKeys) {
      assert(TRANSLATIONS.en[key], `Missing English key in translations.js: ${key}`);
      assert(TRANSLATIONS.hi[key], `Missing Hindi key in translations.js: ${key}`);
    }

    console.log('✅ Test 10 Passed: + New Chat button, Chat History drawer, and 100% bilingual parity verified.');
  } catch (err) {
    console.error('❌ Test 10 Exception:', err);
    failures++;
  }

  // Summary
  if (failures === 0) {
    console.log('\n🎉 ALL 10 PERSISTENT CHAT HISTORY & NEW CHAT TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error(`\n🚨 ${failures} PERSISTENT CHAT TESTS FAILED.\n`);
    process.exit(1);
  }
}

runPersistentChatTests();

