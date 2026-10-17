/**
 * Persistent Chat Storage & Conversation Management for Sahayak AI Assistant
 *
 * Capabilities:
 * 1. Automatic persistence: saves every user question and AI response immediately.
 * 2. Multi-conversation support: creates unique IDs for new conversations (+ New Chat).
 * 3. Chat history: preserves titles, timestamps, messages, options, schemes, and metadata.
 * 4. User data isolation: scopes storage to authenticated Supabase user ID via userStorage,
 *    with automatic guest-to-user migration on login.
 * 5. Safe recovery: handles empty, corrupted, or missing storage gracefully.
 */

import { getScopedKey } from './userStorage.js';
import { TRANSLATIONS } from '../data/translations.js';
import { normalizeMessage } from './responseParser.js';

export { normalizeMessage };

export const CONVERSATIONS_STORAGE_KEY = 'sahayak_chat_conversations';
export const ACTIVE_CONVERSATION_ID_KEY = 'sahayak_active_conversation_id';

/**
 * Safe JSON parser with fallback
 */
export function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Generates a clean, readable conversation title from the first user question
 */
export function generateConversationTitle(text, language = 'en') {
  if (!text || typeof text !== 'string') {
    return language === 'hi' ? 'नयी बातचीत' : 'New Conversation';
  }

  // Clean markdown tokens, bullets, and excessive whitespace
  let clean = text
    .replace(/[*#_~`[\]()]/g, '')
    .replace(/^[•\-–—]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return language === 'hi' ? 'नयी बातचीत' : 'New Conversation';
  }

  // Truncate at maximum 42 characters with ellipsis
  if (clean.length > 42) {
    clean = clean.slice(0, 42).trim() + '...';
  }

  return clean;
}

/**
 * Creates the standard Sahayak AI initial welcome message
 */
export function createWelcomeMessage(language = 'en') {
  const currentLang = language === 'hi' ? 'hi' : 'en';
  const welcomeText = TRANSLATIONS[currentLang]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage;

  return {
    id: 'welcome',
    sender: 'assistant',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: welcomeText,
    originalText: welcomeText,
    originalLanguage: currentLang,
    translations: {
      en: TRANSLATIONS.en.welcomeMessage,
      hi: TRANSLATIONS.hi.welcomeMessage,
    },
    sources: ['india.gov.in', 'myscheme.gov.in'],
    isDemoMode: false,
    isTranslating: false,
  };
}

/**
 * Creates a brand new conversation object with a unique ID
 */
export function createNewConversation(language = 'en') {
  const currentLang = language === 'hi' ? 'hi' : 'en';
  const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    title: currentLang === 'hi' ? 'नयी बातचीत' : 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: currentLang,
    messages: [createWelcomeMessage(currentLang)],
    selectedOptionsMap: {},
    multiDrafts: {},
  };
}

/**
 * Formats conversation date/time for history display in en or hi
 */
export function formatConversationTime(isoDateStr, language = 'en') {
  if (!isoDateStr) return '';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();

    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return language === 'hi' ? `आज, ${timeStr}` : `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return language === 'hi' ? `कल, ${timeStr}` : `Yesterday, ${timeStr}`;
    }

    return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

/**
 * Retrieves all saved conversations for the current user or guest, sorted newest first
 */
export function getConversations(userId = null) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const storageKey = getScopedKey(CONVERSATIONS_STORAGE_KEY, userId);
    const raw = localStorage.getItem(storageKey);
    const parsed = safeJsonParse(raw, []);

    if (!Array.isArray(parsed)) return [];

    // Filter valid conversations, normalize messages, and sort by updatedAt descending
    return parsed
      .filter((c) => c && typeof c === 'object' && c.id && Array.isArray(c.messages))
      .map((c) => ({
        ...c,
        messages: c.messages.map((m) => normalizeMessage(m, c.language)),
      }))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  } catch (err) {
    console.error('Failed to load conversations from storage:', err);
    return [];
  }
}

/**
 * Retrieves a single conversation by its ID
 */
export function getConversationById(id, userId = null) {
  if (!id) return null;
  const all = getConversations(userId);
  return all.find((c) => c.id === id) || null;
}

/**
 * Saves or updates a conversation in storage
 */
export function saveConversation(conversation, userId = null) {
  if (!conversation || !conversation.id || typeof localStorage === 'undefined') {
    return conversation;
  }

  try {
    const storageKey = getScopedKey(CONVERSATIONS_STORAGE_KEY, userId);
    const all = getConversations(userId);

    // Auto-generate title if default and conversation has at least one user question
    const userMsg = Array.isArray(conversation.messages)
      ? conversation.messages.find((m) => m.sender === 'user')
      : null;

    let title = conversation.title;
    if (
      userMsg &&
      (!title || title === 'New Conversation' || title === 'नयी बातचीत')
    ) {
      title = generateConversationTitle(userMsg.text, conversation.language);
    }

    // Deduplicate messages by ID and normalize their content
    const uniqueMessages = [];
    const seenMsgIds = new Set();
    if (Array.isArray(conversation.messages)) {
      for (const m of conversation.messages) {
        if (m && m.id && !seenMsgIds.has(m.id)) {
          seenMsgIds.add(m.id);
          uniqueMessages.push(normalizeMessage(m, conversation.language));
        }
      }
    }

    const updatedConv = {
      ...conversation,
      title: title || (conversation.language === 'hi' ? 'नयी बातचीत' : 'New Conversation'),
      messages: uniqueMessages,
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = all.findIndex((c) => c.id === conversation.id);
    let nextList;
    if (existingIdx !== -1) {
      nextList = [...all];
      nextList[existingIdx] = updatedConv;
    } else {
      nextList = [updatedConv, ...all];
    }

    localStorage.setItem(storageKey, JSON.stringify(nextList));
    return updatedConv;
  } catch (err) {
    console.error('Failed to save conversation:', err);
    return conversation;
  }
}

/**
 * Convenience method to update messages and selected options of an active conversation
 */
export function updateConversationMessages(conversationId, messages, selectedOptionsMap = {}, userId = null) {
  if (!conversationId) return null;
  const existing = getConversationById(conversationId, userId);
  if (!existing) {
    const newConv = {
      ...createNewConversation(),
      id: conversationId,
      messages,
      selectedOptionsMap,
    };
    return saveConversation(newConv, userId);
  }

  return saveConversation(
    {
      ...existing,
      messages,
      selectedOptionsMap,
    },
    userId
  );
}

/**
 * Convenience method to update selected options of an active conversation
 */
export function updateConversationSelectedOptions(conversationId, selectedOptionsMap, userId = null) {
  if (!conversationId) return null;
  const existing = getConversationById(conversationId, userId);
  if (!existing) return null;

  return saveConversation(
    {
      ...existing,
      selectedOptionsMap,
    },
    userId
  );
}

/**
 * Deletes a conversation by its ID
 */
export function deleteConversation(id, userId = null) {
  if (!id || typeof localStorage === 'undefined') return false;
  try {
    const storageKey = getScopedKey(CONVERSATIONS_STORAGE_KEY, userId);
    const all = getConversations(userId);
    const filtered = all.filter((c) => c.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));

    // If active conversation was deleted, clear active ID
    const activeId = getActiveConversationId(userId);
    if (activeId === id) {
      const nextActive = filtered.length > 0 ? filtered[0].id : null;
      setActiveConversationId(nextActive, userId);
    }
    return true;
  } catch (err) {
    console.error('Failed to delete conversation:', err);
    return false;
  }
}

/**
 * Clears all conversations for the user or guest
 */
export function clearAllConversations(userId = null) {
  if (typeof localStorage === 'undefined') return;
  try {
    const storageKey = getScopedKey(CONVERSATIONS_STORAGE_KEY, userId);
    const activeKey = getScopedKey(ACTIVE_CONVERSATION_ID_KEY, userId);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(activeKey);
  } catch (err) {
    console.error('Failed to clear all conversations:', err);
  }
}

/**
 * Gets the active conversation ID
 */
export function getActiveConversationId(userId = null) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const activeKey = getScopedKey(ACTIVE_CONVERSATION_ID_KEY, userId);
    return localStorage.getItem(activeKey) || null;
  } catch {
    return null;
  }
}

/**
 * Sets the active conversation ID
 */
export function setActiveConversationId(id, userId = null) {
  if (typeof localStorage === 'undefined') return;
  try {
    const activeKey = getScopedKey(ACTIVE_CONVERSATION_ID_KEY, userId);
    if (id) {
      localStorage.setItem(activeKey, id);
    } else {
      localStorage.removeItem(activeKey);
    }
  } catch (err) {
    console.error('Failed to set active conversation ID:', err);
  }
}

/**
 * Restores or initializes the active conversation on page mount / navigation
 */
export function getOrCreateActiveConversation(userId = null, language = 'en') {
  const activeId = getActiveConversationId(userId);
  if (activeId) {
    const existing = getConversationById(activeId, userId);
    if (existing) {
      return existing;
    }
  }

  // If no active ID but saved conversations exist, pick the most recent one
  const all = getConversations(userId);
  if (all.length > 0) {
    const latest = all[0];
    setActiveConversationId(latest.id, userId);
    return latest;
  }

  // Otherwise create a fresh new conversation and save it
  const fresh = createNewConversation(language);
  saveConversation(fresh, userId);
  setActiveConversationId(fresh.id, userId);
  return fresh;
}

