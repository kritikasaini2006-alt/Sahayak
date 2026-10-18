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
 * Strips robotic, unnecessary filler opening phrases from AI replies so the response
 * answers the user's actual question immediately and directly.
 */
export function stripFillerPhrases(text) {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text.trim();

  // Common robotic filler openings in English and Hindi
  const fillerPatterns = [
    /^(?:I\s+(?:would|will|am)\s+(?:be\s+)?(?:glad|happy|delighted)\s+to\s+(?:help|assist)\s+(?:you\s+)?(?:with|in|to\s+find)?|I'd\s+be\s+(?:glad|happy|delighted)\s+to\s+(?:help|assist)\s+(?:you\s+)?(?:with|in|to\s+find)?|Certainly!\s*(?:I\s+(?:would|will)\s+be\s+(?:glad|delighted|happy)\s+to\s+(?:help|assist))?|Of\s+course,?\s*I\s+can\s+help\s+(?:you\s+)?(?:with\s+that)?|Sure,?\s*I\s+can\s+help\s+(?:you\s+)?(?:with\s+that)?|Sure\s+thing!|Delighted\s+to\s+assist!)[^.\n]*[.:!]\s*/i,
    /^(?:Certainly|Of\s+course)[,!.]\s*/i,
    /^(?:मुझे\s+आपकी\s+(?:सहायता|मदद)\s+करने\s+में\s+खुशी\s+होगी|मैं\s+आपकी\s+(?:सहायता|मदद)\s+करने\s+(?:में\s+प्रसन्न|के\s+लिए\s+तैयार)\s+हूँ|निश्चित\s+रूप\s+से,?\s*(?:मैं\s+आपकी\s+(?:सहायता|मदद)\s+कर\s+सकता\s+हूँ)?|बिल्कुल,?\s*(?:मैं\s+आपकी\s+(?:सहायता|मदद)\s+कर\s+सकता\s+हूँ)?|ज़रूर,?\s*मैं\s+आपकी\s+(?:सहायता|मदद)\s+करूँगा)[^.\n!।]*[.:!।|]\s*/u,
  ];

  let prev;
  do {
    prev = cleaned;
    for (const pattern of fillerPatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
  } while (cleaned !== prev);

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Maps an exact age number to its canonical age group label in English or Hindi.
 *
 * @param {number|string} age - Citizen's age (1-120)
 * @param {string} language - Target language ('en' | 'hi')
 * @returns {string|null}
 */
export function determineAgeGroup(age, language = 'en') {
  if (age === null || age === undefined || age === '') return null;
  const num = typeof age === 'number' ? age : parseInt(age, 10);
  if (isNaN(num)) return null;
  if (num < 18) {
    return language === 'hi' ? '18 वर्ष से कम' : 'Under 18 years';
  }
  if (num <= 25) {
    return language === 'hi' ? '18–25 वर्ष' : '18–25 years';
  }
  if (num <= 40) {
    return language === 'hi' ? '26–40 वर्ष' : '26–40 years';
  }
  if (num <= 60) {
    return language === 'hi' ? '41–60 वर्ष' : '41–60 years';
  }
  return language === 'hi' ? '60 वर्ष से अधिक' : 'Above 60 years';
}

/**
 * Parses age-group phrases (e.g. "Under 18 years", "18–25 years", "18 वर्ष से कम", etc.)
 *
 * @param {string} text - User input prompt or clicked button label/value
 * @returns {{ key: string, minAge: number, maxAge: number, representativeAge: number, labelEn: string, labelHi: string } | null}
 */
export function parseAgeGroupFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim().toLowerCase();

  // 1. Under 18 years / 18 वर्ष से कम
  if (
    /under\s*18|below\s*18|< ?18|18\s*(?:and\s+)?under|18\s*से\s*कम|18\s*वर्ष\s*से\s*कम/i.test(t) ||
    t === 'under 18 years' || t === '18 वर्ष से कम' || t === 'under_18'
  ) {
    return {
      key: 'under_18',
      minAge: 1,
      maxAge: 17,
      representativeAge: 16,
      labelEn: 'Under 18 years',
      labelHi: '18 वर्ष से कम',
    };
  }

  // 2. 18–25 years / 18–25 वर्ष
  if (
    /\b18\s*[-–—to\s]+\s*25\b|18\s*से\s*25/i.test(t) ||
    t === '18–25 years' || t === '18-25 years' || t === '18–25 वर्ष' || t === '18-25 वर्ष' || t === '18_25'
  ) {
    return {
      key: '18_25',
      minAge: 18,
      maxAge: 25,
      representativeAge: 21,
      labelEn: '18–25 years',
      labelHi: '18–25 वर्ष',
    };
  }

  // 3. 26–40 years / 26–40 वर्ष
  if (
    /\b26\s*[-–—to\s]+\s*40\b|26\s*से\s*40/i.test(t) ||
    t === '26–40 years' || t === '26-40 years' || t === '26–40 वर्ष' || t === '26-40 वर्ष' || t === '26_40'
  ) {
    return {
      key: '26_40',
      minAge: 26,
      maxAge: 40,
      representativeAge: 33,
      labelEn: '26–40 years',
      labelHi: '26–40 वर्ष',
    };
  }

  // 4. 41–60 years / 41–60 वर्ष
  if (
    /\b41\s*[-–—to\s]+\s*60\b|41\s*से\s*60/i.test(t) ||
    t === '41–60 years' || t === '41-60 years' || t === '41–60 वर्ष' || t === '41-60 वर्ष' || t === '41_60'
  ) {
    return {
      key: '41_60',
      minAge: 41,
      maxAge: 60,
      representativeAge: 50,
      labelEn: '41–60 years',
      labelHi: '41–60 वर्ष',
    };
  }

  // 5. Above 60 years / 60 वर्ष से अधिक
  if (
    /above\s*60|60\s*(?:plus|\+)|> ?60|60\s*and\s*above|senior\s*citizen|60\s*वर्ष\s*से\s*अधिक|60\s*से\s*(?:ज्यादा|अधिक)/i.test(t) ||
    t === 'above 60 years' || t === '60 वर्ष से अधिक' || t === 'above_60'
  ) {
    return {
      key: 'above_60',
      minAge: 61,
      maxAge: 120,
      representativeAge: 65,
      labelEn: 'Above 60 years',
      labelHi: '60 वर्ष से अधिक',
    };
  }

  return null;
}

/**
 * Safely extracts a citizen's age from natural language text in English or Hindi.
 * Supports explicit age-group selections ("Under 18 years", "18–25 years", "41–60 वर्ष"),
 * exact numbers ("45", "34"), natural phrases ("I am 34 years old", "मेरी उम्र 34 साल है"),
 * Devanagari numerals ("३४ वर्ष"), and validates that the age is plausible (between 1 and 120).
 *
 * @param {string} text - User input prompt or option value
 * @param {string} language - Active language ('en' | 'hi')
 * @returns {{ valid: boolean, age: number|null, ageGroup?: string, ageGroupKey?: string, isAgeGroup?: boolean, reason?: string, rawNum?: number }}
 */
export function extractAgeFromText(text, language = 'en') {
  if (!text || typeof text !== 'string') {
    return { valid: false, age: null, reason: 'empty' };
  }

  // 0. Check if an explicit age group was provided (button click or typed range)
  const group = parseAgeGroupFromText(text);
  if (group) {
    return {
      valid: true,
      age: group.representativeAge,
      ageGroup: language === 'hi' ? group.labelHi : group.labelEn,
      ageGroupKey: group.key,
      isAgeGroup: true,
    };
  }

  // 1. Convert Devanagari numerals to standard digits (०-९ -> 0-9)
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let normalized = text;
  devanagariDigits.forEach((d, idx) => {
    normalized = normalized.replaceAll(d, String(idx));
  });

  const trimmed = normalized.trim().toLowerCase();

  // Guard: Negative numbers (e.g. "-5", "- 10", "minus 5")
  if (/(?:^|\s)-+\s*\d+|\bminus\b|\bnegative\b/i.test(trimmed)) {
    return { valid: false, age: null, reason: 'negative_number' };
  }

  // Guard: If the text is specifically asking about third-party scheme criteria (e.g. girl child under 10 in Sukanya),
  // do not treat as citizen's own age unless explicitly prefixed with "I am" or "my age"
  const isDaughterQuery = /(?:girl\s*child|daughter|child|sukanya|लड़की|बेटी|बच्ची)/i.test(trimmed);
  const isSelfExplicit = /(?:i(?:\s*a?m|'m)\s+|my\s+age|मेरी\s*(?:उम्र|आयु)|मैं\s*\d+\s*(?:साल|वर्ष))/i.test(trimmed);
  if (isDaughterQuery && !isSelfExplicit) {
    return { valid: false, age: null, reason: 'daughter_context' };
  }

  // 2. Pure number (e.g. "34", "42", "45")
  const pureNumMatch = trimmed.match(/^(\d{1,3})$/);
  if (pureNumMatch) {
    const num = parseInt(pureNumMatch[1], 10);
    if (num >= 1 && num <= 120) {
      return {
        valid: true,
        age: num,
        ageGroup: determineAgeGroup(num, language),
        isAgeGroup: false,
      };
    }
    return { valid: false, age: null, reason: 'out_of_range', rawNum: num };
  }

  // 3. Explicit age phrase patterns in English and Hindi
  // English: "I am 34 years old", "my age is 34", "age 34", "34 yrs", "34 years", "34 yo", "around 34"
  // Hindi: "मेरी उम्र 34 साल है", "34 वर्ष", "34 साल", "उम्र 34", "मैं 34 साल का हूँ"
  const explicitPatterns = [
    /(?:i(?:\s*a?m|'m)\s+(?:around\s+|about\s+)?|my\s+age\s+(?:is\s+)?|age\s*(?:is|:)?\s*)(\d{1,3})\s*(?:years?\s*(?:old)?|yrs?|yo)?/i,
    /(?:मेरी\s*(?:उम्र|आयु)\s*(?:है|:)?\s*|उम्र\s*(?:है|:)?\s*|आयु\s*(?:है|:)?\s*)(\d{1,3})\s*(?:साल|वर्ष)?/u,
    /मैं\s+(\d{1,3})\s*(?:साल|वर्ष)\s*क[ाी]\s*हूँ/u,
    /(?:around|about|लगभग)\s*(\d{1,3})\s*(?:years?|yrs?|साल|वर्ष)/i,
    /\b(\d{1,3})\s*(?:years?\s*(?:old)?|yrs?|yo|साल|वर्ष)\b/i,
  ];

  for (const regex of explicitPatterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 120) {
        return {
          valid: true,
          age: num,
          ageGroup: determineAgeGroup(num, language),
          isAgeGroup: false,
        };
      }
      return { valid: false, age: null, reason: 'out_of_range', rawNum: num };
    }
  }

  // 4. Standalone 1-3 digit number if text is brief (< 30 chars) and not currency/portal/phone
  if (trimmed.length <= 30 && !trimmed.includes('₹') && !trimmed.includes('rs') && !trimmed.includes('rupee')) {
    const looseMatch = trimmed.match(/\b(\d{1,3})\b/);
    if (looseMatch && looseMatch[1]) {
      const num = parseInt(looseMatch[1], 10);
      if (num >= 1 && num <= 120) {
        return {
          valid: true,
          age: num,
          ageGroup: determineAgeGroup(num, language),
          isAgeGroup: false,
        };
      }
      return { valid: false, age: null, reason: 'out_of_range', rawNum: num };
    }
  }

  // Check if an out-of-range number was provided
  const anyNumMatch = trimmed.match(/\b(\d+)\b/);
  if (anyNumMatch) {
    const num = parseInt(anyNumMatch[1], 10);
    if (num > 120 || num < 1) {
      return { valid: false, age: null, reason: 'out_of_range', rawNum: num };
    }
  }

  return { valid: false, age: null, reason: 'not_found' };
}

/**
 * Normalizes any legacy age-group prompt strings into the user's simple, friendly prompt:
 * "Please tell me your age so I can find government schemes that are relevant to you."
 */
export function normalizeAgeString(text, language = 'en') {
  if (!text || typeof text !== 'string') return text;

  const isAgeGroupQuery =
    /next,?\s*please\s+let\s+me\s+know\s+your\s+age\s+group/i.test(text) ||
    /could\s+you\s+please\s+select\s+your\s+(?:correct\s+)?age\s+group/i.test(text) ||
    /select\s+your\s+(?:correct\s+)?age\s+group\s+from\s+the\s+options/i.test(text) ||
    /please\s+select\s+your\s+\*?\*?age\s+group\*?\*?/i.test(text) ||
    /(?:options\s+below.*(?:find\s+(?:the\s+best\s+)?schemes|age)|match\s+your\s+life\s+stage)/i.test(text) ||
    /कृपया\s+अपना\s+\*?\*?आयु\s*वर्ग\*?\*?\s*चुनें/u.test(text) ||
    /नीचे\s+दिए\s+गए\s+विकल्पों\s+में\s+से.*आयु/u.test(text) ||
    /आयु\s*वर्ग\s*चुनें/u.test(text);

  if (isAgeGroupQuery) {
    return language === 'hi'
      ? 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।'
      : 'Please tell me your age so I can find government schemes that are relevant to you.';
  }

  return text;
}

/**
 * Standardizes any age-related question object to attach the canonical 5 age-group options
 * and enforce the canonical friendly age question in English and Hindi.
 */
export function normalizeAgeQuestion(message, language = 'en') {
  if (!message || typeof message !== 'object') return message;

  const rawText = String(message.reply || message.content || message.text || '');
  const isAgeField = message.fieldKey === 'age' || message.fieldKey === 'ageGroup';
  const hasAgeKeywords =
    /tell\s+me\s+your\s+age/i.test(rawText) ||
    /अपनी\s*उम्र\s*बताएं/u.test(rawText) ||
    /next,?\s*please\s+let\s+me\s+know\s+your\s+age\s+group/i.test(rawText) ||
    /could\s+you\s+please\s+select\s+your\s+(?:correct\s+)?age\s+group/i.test(rawText) ||
    /select\s+your\s+(?:correct\s+)?age\s+group\s+from\s+the\s+options/i.test(rawText) ||
    /please\s+select\s+your\s+\*?\*?age\s+group\*?\*?/i.test(rawText) ||
    /match\s+your\s+life\s+stage/i.test(rawText) ||
    /कृपया\s+अपना\s+\*?\*?आयु\s*वर्ग\*?\*?\s*चुनें/u.test(rawText) ||
    /नीचे\s+दिए\s+गए\s+विकल्पों\s+में\s+से.*आयु/u.test(rawText) ||
    /आयु\s*वर्ग\s*चुनें/u.test(rawText);

  const isSchemeRecommendation = Array.isArray(message.recommendedSchemes) && message.recommendedSchemes.length > 0;

  if ((isAgeField || hasAgeKeywords) && !isSchemeRecommendation) {
    const isInvalidRetry = /\b(?:valid\s+age|between\s+1\s+and\s+120|मान्य\s+उम्र|1\s*से\s*120)\b/i.test(rawText);

    if (isInvalidRetry) {
      const invalidReply =
        language === 'hi'
          ? 'कृपया 1 से 120 वर्ष के बीच एक मान्य उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।'
          : 'Please enter a valid age between 1 and 120 so I can find government schemes that are relevant to you.';
      if (message.reply !== undefined) message.reply = invalidReply;
      if (message.text !== undefined) message.text = invalidReply;
      if (message.content !== undefined) message.content = invalidReply;
    } else {
      const standardReply =
        language === 'hi'
          ? 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।'
          : 'Please tell me your age so I can find government schemes that are relevant to you.';
      if (message.reply !== undefined) message.reply = standardReply;
      if (message.text !== undefined) message.text = standardReply;
      if (message.content !== undefined) message.content = standardReply;
    }

    message.questionType = 'single_choice';
    message.fieldKey = 'ageGroup';
    message.options = DEFAULT_OPTIONS_BY_FIELD.ageGroup[language] || DEFAULT_OPTIONS_BY_FIELD.ageGroup.en;
    message.allowSkip = false;
  }

  return message;
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
        cleanReply = stripFillerPhrases(unwrapNestedReply(nested.reply));
        const nestedOptions = sanitizeOptions(nested.options);
        const nestedSchemes = sanitizeSchemes(nested.recommendedSchemes);
        const nestedType = VALID_QUESTION_TYPES.includes(nested.questionType) ? nested.questionType : 'none';

        return normalizeAgeQuestion({
          reply: cleanReply,
          questionType: nestedType !== 'none' ? nestedType : (VALID_QUESTION_TYPES.includes(rawInput.questionType) ? rawInput.questionType : 'none'),
          fieldKey: nested.fieldKey || rawInput.fieldKey || null,
          allowSkip: nested.allowSkip !== undefined ? !!nested.allowSkip : !!rawInput.allowSkip,
          options: nestedOptions.length > 0 ? nestedOptions : sanitizeOptions(rawInput.options),
          recommendedSchemes: nestedSchemes.length > 0 ? nestedSchemes : sanitizeSchemes(rawInput.recommendedSchemes),
          isDemoMode: !!rawInput.isDemoMode,
          sources: rawInput.sources || defaultResult.sources,
          modelUsed: rawInput.modelUsed,
        }, language);
      }
    }

    cleanReply = stripFillerPhrases(unwrapNestedReply(cleanReply));

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

    return normalizeAgeQuestion({
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
    }, language);
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
  return normalizeAgeQuestion({
    reply: strInput,
    questionType: 'none',
    fieldKey: null,
    allowSkip: false,
    options: [],
    recommendedSchemes: [],
    isDemoMode: false,
    sources: defaultResult.sources,
  }, language);
}

/**
 * Normalizes a stored message to ensure its text is strictly human-readable
 * and structured metadata is safely extracted if previously saved as raw JSON.
 */
export function normalizeMessage(msg, language = 'en') {
  if (!msg || typeof msg !== 'object') return msg;

  let resultMsg = msg;

  if (msg.sender === 'assistant' && typeof msg.text === 'string') {
    const trimmed = msg.text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.includes('"reply"')) {
      const parsed = parseStructuredResponse(trimmed, language);
      if (parsed.reply && parsed.reply !== trimmed) {
        resultMsg = {
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

  return normalizeAgeQuestion(resultMsg, language);
}
