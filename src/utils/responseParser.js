/**
 * Universal Response Parser & Message Normalizer for Sahayak AI Assistant.
 *
 * Guarantees:
 * 1. Only human-readable text is displayed as the message body (never raw JSON, braces, or quotation marks).
 * 2. Question control metadata (questionType, fieldKey, allowSkip) are separated from visible text.
 * 3. Options are parsed into clean { label, value } pairs for interactive rendering.
 * 4. Recommended schemes are parsed into structured card models.
 * 5. Handles already-parsed JS objects, JSON strings, Markdown code blocks (```json ... ```),
 *    plain text responses, and malformed/truncated JSON gracefully without crashing.
 */

import { DEFAULT_OPTIONS_BY_FIELD } from '../data/chatOptions.js';

const VALID_QUESTION_TYPES = ['none', 'single_choice', 'multi_choice', 'recommendations'];

/**
 * Sanitizes an array of interactive options.
 * Ensures every option has a non-empty label and value.
 */
export function sanitizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .filter((opt) => opt !== null && opt !== undefined)
    .map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        const val = String(opt).trim().slice(0, 100);
        return val ? { label: val, value: val } : null;
      }
      if (typeof opt === 'object') {
        const rawLabel = opt.label !== undefined && opt.label !== null ? String(opt.label).trim() : '';
        const rawValue = opt.value !== undefined && opt.value !== null ? String(opt.value).trim() : '';
        const label = (rawLabel || rawValue || opt.text || opt.title || '').toString().slice(0, 100).trim();
        const value = (rawValue || rawLabel || opt.id || label).toString().slice(0, 100).trim();
        if (!label && !value) return null;
        return { label: label || value, value: value || label };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Sanitizes recommended schemes into structured card objects.
 */
export function sanitizeSchemes(schemes) {
  if (!Array.isArray(schemes)) return [];
  return schemes
    .filter((s) => s && typeof s === 'object')
    .map((s) => {
      const title = String(s.title || s.name || s.schemeName || '').trim();
      if (!title) return null;

      const id = String(s.id || title.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100);
      const benefit = String(s.benefit || s.benefits || s.assistance || '').trim();
      const keyCriteria = String(s.keyCriteria || s.criteria || s.eligibility || '').trim();
      const documentsRequired = Array.isArray(s.documentsRequired || s.documents)
        ? (s.documentsRequired || s.documents).map((d) => String(d).trim()).filter(Boolean)
        : [];
      const portalUrl = String(s.portalUrl || s.url || s.link || 'https://www.india.gov.in').trim();

      return {
        id,
        title,
        benefit,
        keyCriteria,
        documentsRequired,
        portalUrl: portalUrl || 'https://www.india.gov.in',
      };
    })
    .filter(Boolean);
}

/**
 * Extracts and parses a JSON object from text containing:
 * - Direct JSON
 * - Markdown code blocks (```json ... ``` or ``` ... ```)
 * - Leading/trailing conversational prose around a JSON object
 */
export function extractJsonFromText(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Direct JSON.parse
  try {
    const direct = JSON.parse(trimmed);
    if (direct && typeof direct === 'object') return direct;
  } catch {}

  // 2. Markdown code block extraction
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  // 3. Slice from first '{' to last '}'
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}

    // 4. Clean trailing commas & retry
    try {
      const cleaned = candidate
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, (m) => (m.includes('\n') ? '\n' : ' '));
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  return null;
}

/**
 * Recovers human-readable reply from malformed or truncated JSON strings.
 */
function recoverMalformedJson(text) {
  if (typeof text !== 'string') return null;

  // Look for complete "reply": "..."
  const replyMatch = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s) ||
                     text.match(/'reply'\s*:\s*'((?:[^'\\]|\\.)*)'/s);
  if (replyMatch && replyMatch[1]) {
    const reply = replyMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();

    const typeMatch = text.match(/"questionType"\s*:\s*"([a-z_]+)"/);
    const questionType = typeMatch && VALID_QUESTION_TYPES.includes(typeMatch[1])
      ? typeMatch[1]
      : 'none';

    const fieldMatch = text.match(/"fieldKey"\s*:\s*"([^"]+)"/);
    const fieldKey = fieldMatch ? fieldMatch[1] : null;
    const allowSkip = /"allowSkip"\s*:\s*true/.test(text);

    return {
      reply,
      questionType,
      fieldKey,
      allowSkip,
      options: [],
      recommendedSchemes: [],
    };
  }

  // Look for truncated "reply": "... (without closing quote)
  const truncatedReplyMatch = text.match(/"reply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)$/s);
  if (truncatedReplyMatch && truncatedReplyMatch[1]) {
    const reply = truncatedReplyMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();
    if (reply) {
      return {
        reply,
        questionType: 'none',
        fieldKey: null,
        allowSkip: false,
        options: [],
        recommendedSchemes: [],
      };
    }
  }

  return null;
}

/**
 * Recursively unwraps stringified JSON nested inside `reply`.
 */
function unwrapNestedReply(replyText) {
  let current = replyText;
  let iterations = 0;
  while (
    typeof current === 'string' &&
    iterations < 3 &&
    (current.trim().startsWith('{') || current.trim().startsWith('```'))
  ) {
    iterations++;
    const extracted = extractJsonFromText(current) || recoverMalformedJson(current);
    if (extracted && typeof extracted.reply === 'string' && extracted.reply.trim() && extracted.reply !== current) {
      current = extracted.reply.trim();
    } else {
      break;
    }
  }
  return current;
}

/**
 * Universal Parser: converts any raw Gemini / server output into a standardized message object.
 *
 * @param {string|object} rawInput - Server response or text string.
 * @param {string} language - Active language ('en' | 'hi').
 * @returns {object} Standardized message model.
 */
export function parseStructuredResponse(rawInput, language = 'en') {
  const defaultResult = {
    reply: '',
    questionType: 'none',
    fieldKey: null,
    allowSkip: false,
    options: [],
    recommendedSchemes: [],
    isDemoMode: false,
    sources: ['india.gov.in', 'myscheme.gov.in'],
  };

  if (!rawInput && rawInput !== 0) {
    return defaultResult;
  }

  // 1. If already an object (e.g. from response.json())
  if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
    const rawReply = rawInput.reply !== undefined ? rawInput.reply : (rawInput.text || rawInput.message || '');
    let cleanReply = typeof rawReply === 'string' ? rawReply.trim() : String(rawReply || '');

    // Check if reply itself is a stringified JSON object
    if (cleanReply.startsWith('{') || cleanReply.startsWith('```') || cleanReply.includes('"reply"')) {
      const nested = extractJsonFromText(cleanReply) || recoverMalformedJson(cleanReply);
      if (nested && typeof nested.reply === 'string') {
        cleanReply = unwrapNestedReply(nested.reply);
        const nestedOptions = sanitizeOptions(nested.options);
        const nestedSchemes = sanitizeSchemes(nested.recommendedSchemes);
        const nestedType = VALID_QUESTION_TYPES.includes(nested.questionType) ? nested.questionType : 'none';

        return {
          reply: cleanReply,
          questionType: nestedType !== 'none' ? nestedType : (VALID_QUESTION_TYPES.includes(rawInput.questionType) ? rawInput.questionType : 'none'),
          fieldKey: nested.fieldKey || rawInput.fieldKey || null,
          allowSkip: nested.allowSkip !== undefined ? !!nested.allowSkip : !!rawInput.allowSkip,
          options: nestedOptions.length > 0 ? nestedOptions : sanitizeOptions(rawInput.options),
          recommendedSchemes: nestedSchemes.length > 0 ? nestedSchemes : sanitizeSchemes(rawInput.recommendedSchemes),
          isDemoMode: !!rawInput.isDemoMode,
          sources: rawInput.sources || defaultResult.sources,
          modelUsed: rawInput.modelUsed,
        };
      }
    }

    cleanReply = unwrapNestedReply(cleanReply);

    let sanitizedQuestionType = VALID_QUESTION_TYPES.includes(rawInput.questionType)
      ? rawInput.questionType
      : 'none';
    let sanitizedFieldKey = typeof rawInput.fieldKey === 'string' && rawInput.fieldKey ? rawInput.fieldKey : null;
    let sanitizedOptions = sanitizeOptions(rawInput.options);
    let sanitizedSchemes = sanitizeSchemes(rawInput.recommendedSchemes);

    // Inject default options if fieldKey is known and options were empty
    if (
      (sanitizedQuestionType === 'single_choice' || sanitizedQuestionType === 'multi_choice') &&
      sanitizedOptions.length === 0 &&
      sanitizedFieldKey &&
      DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey]
    ) {
      sanitizedOptions = DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey][language] || DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey].en;
    }

    return {
      reply: cleanReply,
      questionType: sanitizedQuestionType,
      fieldKey: sanitizedFieldKey,
      allowSkip: !!rawInput.allowSkip,
      options: sanitizedOptions,
      recommendedSchemes: sanitizedSchemes,
      isDemoMode: !!rawInput.isDemoMode,
      demoReason: rawInput.demoReason,
      sources: rawInput.sources || defaultResult.sources,
      modelUsed: rawInput.modelUsed,
    };
  }

  // 2. If rawInput is a string
  const strInput = String(rawInput).trim();
  if (!strInput) {
    return defaultResult;
  }

  // Try extracting structured JSON object from string
  const parsedJson = extractJsonFromText(strInput);
  if (parsedJson && typeof parsedJson === 'object') {
    return parseStructuredResponse(parsedJson, language);
  }

  // Try recovering from malformed/truncated JSON
  if (strInput.includes('"reply"') || strInput.includes("'reply'")) {
    const recovered = recoverMalformedJson(strInput);
    if (recovered) {
      return parseStructuredResponse(recovered, language);
    }
  }

  // 3. Fallback: Pure plain text response (never wrap in JSON keys)
  return {
    reply: strInput,
    questionType: 'none',
    fieldKey: null,
    allowSkip: false,
    options: [],
    recommendedSchemes: [],
    isDemoMode: false,
    sources: defaultResult.sources,
  };
}

/**
 * Normalizes a stored message to ensure its text is strictly human-readable
 * and structured metadata is safely extracted if previously saved as raw JSON.
 */
export function normalizeMessage(msg, language = 'en') {
  if (!msg || typeof msg !== 'object') return msg;

  if (msg.sender === 'assistant' && typeof msg.text === 'string') {
    const trimmed = msg.text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.includes('"reply"')) {
      const parsed = parseStructuredResponse(trimmed, language);
      if (parsed.reply && parsed.reply !== trimmed) {
        return {
          ...msg,
          text: parsed.reply,
          originalText: parsed.reply,
          questionType: msg.questionType && msg.questionType !== 'none' ? msg.questionType : parsed.questionType,
          fieldKey: msg.fieldKey || parsed.fieldKey,
          allowSkip: msg.allowSkip !== undefined ? msg.allowSkip : parsed.allowSkip,
          options: msg.options && msg.options.length > 0 ? msg.options : parsed.options,
          recommendedSchemes: msg.recommendedSchemes && msg.recommendedSchemes.length > 0 ? msg.recommendedSchemes : parsed.recommendedSchemes,
        };
      }
    }
  }

  return msg;
}
