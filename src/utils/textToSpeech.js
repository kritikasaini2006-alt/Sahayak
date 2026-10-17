/**
 * Natural Bilingual Text-To-Speech (TTS) Engine for Sahayak AI Assistant.
 *
 * Capabilities:
 * 1. Automatic natural voice ranking for Indian English (en-IN) and Hindi (hi-IN).
 * 2. Mixed Hindi-English text detection (Devanagari vs Latin phonetics).
 * 3. Text sanitization for human-sounding speech:
 *    - Strips markdown, bullet glyphs, code fences, and raw JSON.
 *    - Replaces raw URLs with friendly phrases ("Official portal link available").
 *    - Summarizes structured scheme cards into natural spoken sentences.
 *    - Injects natural punctuation pauses around headings, lists, and paragraphs.
 * 4. Punctuation-aware sentence chunking to defeat the Chromium 15-second silent freeze bug.
 * 5. Deterministic Play / Pause / Resume / Restart / Stop lifecycle without browser pause drift.
 * 6. Session-persistent voice and speed settings (Slow 0.85x, Normal 1.0x, Fast 1.2x).
 */

export const TTS_STORAGE_KEY = 'sahayak_tts_settings';

export const SPEED_RATES = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.2,
};

export const DEFAULT_TTS_SETTINGS = {
  speed: 'normal',
  preferredVoiceHi: null,
  preferredVoiceEn: null,
};

/**
 * Checks if browser Speech Synthesis is supported.
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Loads stored TTS preferences from localStorage with fallback defaults.
 */
export function loadTtsSettings() {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_TTS_SETTINGS };
  try {
    const raw = localStorage.getItem(TTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TTS_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      speed: ['slow', 'normal', 'fast'].includes(parsed.speed) ? parsed.speed : 'normal',
      preferredVoiceHi: typeof parsed.preferredVoiceHi === 'string' ? parsed.preferredVoiceHi : null,
      preferredVoiceEn: typeof parsed.preferredVoiceEn === 'string' ? parsed.preferredVoiceEn : null,
    };
  } catch (e) {
    return { ...DEFAULT_TTS_SETTINGS };
  }
}

/**
 * Saves TTS preferences to localStorage.
 */
export function saveTtsSettings(settings) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const current = loadTtsSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return null;
  }
}

/**
 * Categorizes and ranks voices for Hindi and Indian English.
 */
export function getVoiceCategories(voices = []) {
  const hindi = [];
  const indianEnglish = [];
  const otherEnglish = [];

  for (const voice of voices) {
    const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
    const name = (voice.name || '').toLowerCase();

    const isNatural = /natural|neural|google|online|apple|siri|microsoft/i.test(voice.name);

    if (lang.startsWith('hi') || /hindi|हिन्दी|देवनागरी/.test(name)) {
      hindi.push({
        voice,
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        isNatural,
        isRecommended: /google.*(हिन्दी|hindi)|swara|lekha|kalpana|neerja|natural.*hindi/i.test(name),
      });
    } else if (lang.includes('en-in') || /india|indian|rishi|veena/.test(name)) {
      indianEnglish.push({
        voice,
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        isNatural,
        isRecommended: /google.*(india|en-in)|rishi|veena|neerja|ravi|natural.*india/i.test(name),
      });
    } else if (lang.startsWith('en')) {
      otherEnglish.push({
        voice,
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        isNatural,
        isRecommended: /google.*(us|uk)|samantha|daniel|natural/i.test(name),
      });
    }
  }

  const sortFn = (a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.isNatural && !b.isNatural) return -1;
    if (!a.isNatural && b.isNatural) return 1;
    return a.name.localeCompare(b.name);
  };

  hindi.sort(sortFn);
  indianEnglish.sort(sortFn);
  otherEnglish.sort(sortFn);

  return { hindi, indianEnglish, otherEnglish };
}

/**
 * Finds the best voice for a given target language ('hi' or 'en').
 */
export function selectBestVoice(voices, targetLang, preferredVoiceURI = null) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  if (preferredVoiceURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (preferred) return preferred;
  }

  const { hindi, indianEnglish, otherEnglish } = getVoiceCategories(voices);

  if (targetLang === 'hi') {
    if (hindi.length > 0) return hindi[0].voice;
    if (indianEnglish.length > 0) return indianEnglish[0].voice;
  } else {
    if (indianEnglish.length > 0) return indianEnglish[0].voice;
    if (otherEnglish.length > 0) return otherEnglish[0].voice;
  }

  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Detects whether the text is predominantly Devanagari Hindi or English.
 */
export function detectScriptLanguage(text, defaultLang = 'en') {
  if (!text) return defaultLang;
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagariCount > 0) return 'hi';
  return defaultLang === 'hi' ? 'hi' : 'en';
}

/**
 * Cleans assistant response text into natural, spoken speech.
 */
export function prepareSpokenText(message, language = 'en') {
  if (!message) return '';

  let rawText = '';
  let schemes = [];

  if (typeof message === 'string') {
    rawText = message;
  } else if (typeof message === 'object') {
    rawText = message.text || message.reply || '';
    schemes = Array.isArray(message.recommendedSchemes) ? message.recommendedSchemes : [];
  }

  if (!rawText && schemes.length === 0) return '';

  // 1. If rawText contains serialized JSON, extract human-readable reply
  if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.reply) {
        rawText = parsed.reply;
        if (Array.isArray(parsed.recommendedSchemes) && schemes.length === 0) {
          schemes = parsed.recommendedSchemes;
        }
      }
    } catch {}
  }

  // 2. Remove code blocks entirely
  let clean = rawText.replace(/```[\s\S]*?```/g, '');

  // 3. Convert markdown links: [Title](url) -> Title
  clean = clean.replace(/\[([^\]]+)\]\((?:https?:\/\/[^\)]+)\)/g, '$1');

  // 4. Convert bare URLs into brief natural spoken phrase
  const urlPhrase = language === 'hi'
    ? ' (आधिकारिक पोर्टल लिंक उपलब्ध है) '
    : ' (Official source link available) ';
  clean = clean.replace(/https?:\/\/[^\s\)\],]+/g, urlPhrase);

  // 5. Headings: `# Title` or `## Title` -> `Title. `
  clean = clean.replace(/^[ \t]*#+[ \t]+(.+)$/gm, '$1. ');

  // 6. Numbered lists: `1. Item` -> `1. Item. `
  clean = clean.replace(/^[ \t]*(\d+)[.)][ \t]+(.+)$/gm, '$1. $2. ');

  // 7. Bullet points: `* Item` or `- Item` or `• Item` -> `Item. `
  clean = clean.replace(/^[ \t]*[*\-•◆▶➤✓✔★][ \t]+(.+)$/gm, '$1. ');

  // 8. Markdown formatting: bold, italic, strikethrough, inline code
  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  // 9. Remove decorative symbols and table delimiters
  clean = clean.replace(/[•◆▶➤✓✔★|~—_]/g, ' ');

  // 10. If structured recommended schemes are present, append natural spoken summary
  if (schemes.length > 0) {
    const isHi = language === 'hi' || /[\u0900-\u097F]/.test(clean);
    const schemeSummaries = schemes.map((s, idx) => {
      const num = idx + 1;
      const title = s.title || s.schemeName || '';
      const benefit = s.benefit ? (isHi ? `मुख्य लाभ: ${s.benefit}। ` : `Benefit: ${s.benefit}. `) : '';
      const criteria = s.keyCriteria ? (isHi ? `पात्रता: ${s.keyCriteria}। ` : `Key eligibility: ${s.keyCriteria}. `) : '';
      return isHi
        ? `योजना ${num}: ${title}। ${benefit}${criteria}`
        : `Scheme ${num}: ${title}. ${benefit}${criteria}`;
    }).join(' ');

    const intro = isHi
      ? '। अनुशंसित सरकारी योजनाएं: '
      : '. Recommended government schemes: ';

    clean = clean.trim() + ' ' + intro + schemeSummaries;
  }

  // 11. Normalize duplicate punctuation and whitespace
  clean = clean
    .replace(/([.!?।])\s*([.!?।])+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

/**
 * Splits text into natural sentence / clause chunks to prevent
 * Chromium 15-second speech synthesis lockup and provide natural breathing pauses.
 */
export function splitIntoSpokenChunks(cleanText, defaultLang = 'en') {
  if (!cleanText) return [];

  const rawSentences = cleanText
    .split(/(?<=[.!?;\n।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    if (currentChunk && (currentChunk.length + sentence.length + 1 <= 160)) {
      currentChunk += ' ' + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (sentence.length > 200) {
        const subParts = sentence.split(/(?<=[,])\s+/);
        let subChunk = '';
        for (const part of subParts) {
          if (subChunk && (subChunk.length + part.length + 1 <= 160)) {
            subChunk += ' ' + part;
          } else {
            if (subChunk) chunks.push(subChunk.trim());
            subChunk = part;
          }
        }
        if (subChunk) currentChunk = subChunk.trim();
        else currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((chunk) => {
    const isDevanagari = /[\u0900-\u097F]/.test(chunk);
    return {
      text: chunk,
      lang: isDevanagari ? 'hi' : defaultLang,
    };
  });
}
