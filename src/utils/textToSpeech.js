/**
 * Natural Bilingual Text-To-Speech (TTS) Engine for Sahayak AI Assistant.
 *
 * Key Capabilities:
 * 1. Apple Siri-Style & Natural Voice Prioritization:
 *    - Automatically detects Apple devices (macOS / iOS) and prioritizes genuine Siri voices
 *      (e.g., "Siri", "Siri Voice 1..4") and Apple Natural vocal models (e.g., "Samantha", "Ava", "Zoe", "Allison").
 *    - Prioritizes natural Indian English (e.g., Google English India, Apple Enhanced) when available;
 *      otherwise uses smooth, calm, conversational Apple natural voices (Samantha/Daniel/Siri).
 *    - Never hardcodes voices without dynamic existence validation.
 *    - Accurately labels voices without falsely claiming generic browser synthesizers are Siri.
 * 2. Tuned Acoustic Parameters for Warm, Natural Speech:
 *    - Default Speech Rate: 0.88 (smooth, conversational Siri-like pacing, avoiding rushed or robotic speech)
 *    - Default Pitch: 1.0 (natural pitch)
 *    - Default Volume: 0.85 (clear, warm, non-blaring loudness)
 * 3. Dynamic Voice-Matching Language Tag:
 *    - Dynamically pairs `utterance.lang` with `selectedVoice.lang` (e.g. `en-US` for Samantha, `en-GB` for Daniel,
 *      `en-IN` for Indian English, `hi-IN` for Hindi) to prevent cross-accent phonetic distortion.
 * 4. Comprehensive Pronunciation & Text Cleaning:
 *    - Strips markdown, emojis, HTML tags, bullet glyphs, code fences, and raw JSON.
 *    - Replaces currency symbols naturally (e.g. "₹6,000" -> "Rupees 6,000" in English, "6,000 रुपये" in Hindi).
 *    - Replaces URLs with friendly spoken phrase ("Official source link available").
 *    - Naturally summarizes structured scheme cards (Title, Benefit, Eligibility criteria).
 *    - Injects sensible sentence pauses around headings, numbered steps, and bullet points.
 * 5. Punctuation-Aware Sentence Chunking:
 *    - Circumvents the Chromium 15-second speech synthesis lockup bug.
 * 6. Session Persistence:
 *    - Persists chosen voice, rate, pitch, and volume in localStorage (`sahayak_tts_settings`).
 */

export const TTS_STORAGE_KEY = 'sahayak_tts_settings';

// Speech rate presets: default is 0.88 for smooth Siri-style pacing
export const SPEED_RATES = {
  slow: 0.85,
  calm: 0.88,   // Siri-style calm & natural default
  normal: 0.88, // Standard default
  standard: 1.0,
  fast: 1.15,
};

export const DEFAULT_TTS_SETTINGS = {
  rate: 0.88,
  pitch: 1.0,
  volume: 0.85,
  speed: 'calm',
  preferredVoiceHi: null,
  preferredVoiceEn: null,
};

/**
 * Detects whether the current client is an Apple device (Mac / iPhone / iPad).
 */
export function isAppleDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  return /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

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

    const speed = ['slow', 'calm', 'normal', 'standard', 'fast'].includes(parsed.speed)
      ? parsed.speed
      : 'calm';

    const rate = typeof parsed.rate === 'number' && parsed.rate >= 0.5 && parsed.rate <= 1.5
      ? parsed.rate
      : (SPEED_RATES[speed] || 0.88);

    const volume = typeof parsed.volume === 'number' && parsed.volume >= 0.1 && parsed.volume <= 1.0
      ? parsed.volume
      : 0.85;

    const pitch = typeof parsed.pitch === 'number' && parsed.pitch >= 0.5 && parsed.pitch <= 1.5
      ? parsed.pitch
      : 1.0;

    return {
      speed,
      rate,
      volume,
      pitch,
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
 * Accurately scores and categorizes an English voice based on quality,
 * genuine Siri availability, natural Apple models, and platform environment.
 */
export function evaluateEnglishVoice(voice, onApple = false) {
  const name = voice.name || '';
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const isIndian = lang.includes('en-in') || /india|indian/i.test(name);

  const hasSiri = /\bsiri\b/i.test(name);
  const isEnhanced = /\b(enhanced|premium)\b/i.test(name);
  const isAppleNaturalModel = /\b(samantha|ava|zoe|allison|serena|oliver|susan|kate|victoria)\b/i.test(name);
  const isGoogle = /google/i.test(name);
  const isMicrosoftNatural = /microsoft.*(natural|online|neural|jenny|aria|guy|neerja|ravi)/i.test(name);

  let label = voice.name;
  let score = 400;
  let isSiri = false;
  let isSiriStyle = false;
  let isNatural = false;

  if (hasSiri) {
    score = 1000;
    label = `${voice.name} (Apple Siri)`;
    isSiri = true;
    isNatural = true;
    isSiriStyle = true;
  } else if (onApple && isIndian && isEnhanced) {
    score = 960;
    label = `${voice.name} (Apple Natural - Indian English)`;
    isNatural = true;
    isSiriStyle = true;
  } else if (onApple && isEnhanced && isAppleNaturalModel) {
    score = 950;
    label = `${voice.name} (Apple Enhanced - Siri-style)`;
    isNatural = true;
    isSiriStyle = true;
  } else if (onApple && isAppleNaturalModel) {
    score = 930;
    label = `${voice.name} (Apple Natural - Siri-style)`;
    isNatural = true;
    isSiriStyle = true;
  } else if (isIndian && (isGoogle || isMicrosoftNatural)) {
    score = 920;
    label = `${voice.name} (Natural Indian English)`;
    isNatural = true;
  } else if (onApple && isEnhanced) {
    score = 900;
    label = `${voice.name} (Apple Enhanced)`;
    isNatural = true;
  } else if (isGoogle) {
    score = 880;
    label = `${voice.name} (Google Natural)`;
    isNatural = true;
  } else if (isMicrosoftNatural) {
    score = 870;
    label = `${voice.name} (Microsoft Natural)`;
    isNatural = true;
  } else if (/\b(daniel|karen|moira|tessa|flo|eddy|reed|shelley)\b/i.test(name)) {
    score = 750;
    label = `${voice.name} (Apple Voice)`;
    isNatural = true;
  } else if (isIndian) {
    score = 600;
    label = `${voice.name} (Indian English - Standard)`;
  } else {
    score = 450;
    label = `${voice.name} (Standard)`;
  }

  return {
    voice,
    name: voice.name,
    displayLabel: label,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
    isSiri,
    isSiriStyle,
    isNatural,
    isRecommended: score >= 900,
    score,
  };
}

/**
 * Categorizes and ranks voices for Hindi and English.
 */
export function getVoiceCategories(voices = []) {
  const onApple = isAppleDevice();
  const hindi = [];
  const englishVoices = [];
  const indianEnglish = [];
  const otherEnglish = [];

  for (const voice of voices) {
    const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
    const name = (voice.name || '').toLowerCase();

    // Hindi Voices
    if (lang.startsWith('hi') || /hindi|हिन्दी|देवनागरी/.test(name)) {
      const isNatural = /natural|neural|google|online|apple|siri|microsoft|lekha|swara|kalpana|neerja/i.test(voice.name);
      hindi.push({
        voice,
        name: voice.name,
        displayLabel: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        isNatural,
        isRecommended: /google.*(हिन्दी|hindi)|swara|lekha|kalpana|neerja|natural.*hindi/i.test(name),
        score: isNatural ? 900 : 500,
      });
    }

    // English Voices
    if (lang.startsWith('en') || /english/.test(name)) {
      const evalVoice = evaluateEnglishVoice(voice, onApple);
      englishVoices.push(evalVoice);

      if (lang.includes('en-in') || /india|indian/.test(name)) {
        indianEnglish.push(evalVoice);
      } else {
        otherEnglish.push(evalVoice);
      }
    }
  }

  // Sort Hindi voices
  hindi.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.name.localeCompare(b.name);
  });

  // Sort English voices strictly by acoustic quality score
  englishVoices.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  indianEnglish.sort((a, b) => b.score - a.score);
  otherEnglish.sort((a, b) => b.score - a.score);

  return { hindi, englishVoices, indianEnglish, otherEnglish };
}

/**
 * Finds the best voice for a given target language ('hi' or 'en').
 * Strictly avoids harsh robotic voices by selecting verified natural/Siri-style voices first.
 */
export function selectBestVoice(voices, targetLang, preferredVoiceURI = null) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  // 1. Honor explicit user saved preference
  if (preferredVoiceURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (preferred) return preferred;
  }

  const { hindi, englishVoices } = getVoiceCategories(voices);

  // 2. Hindi selection
  if (targetLang === 'hi') {
    if (hindi.length > 0) return hindi[0].voice;
    // Fallback if no Hindi voice: highest ranked natural voice
    if (englishVoices.length > 0) return englishVoices[0].voice;
  } else {
    // 3. English selection: highest ranked natural / Siri-style voice
    if (englishVoices.length > 0) return englishVoices[0].voice;
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
 * Converts currency, URLs, markdown, HTML, and emojis into smooth phonetic equivalents.
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

  // 2. Strip HTML tags
  let clean = rawText.replace(/<[^>]+>/g, ' ');

  // 3. Strip code blocks entirely
  clean = clean.replace(/```[\s\S]*?```/g, '');

  // 4. Strip emojis for clean, non-garbled speech
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');

  // 5. Convert markdown links: [Title](url) -> Title
  clean = clean.replace(/\[([^\]]+)\]\((?:https?:\/\/[^\)]+)\)/g, '$1');

  // 6. Convert bare URLs into brief natural spoken phrase
  const urlPhrase = language === 'hi'
    ? ' (आधिकारिक पोर्टल लिंक उपलब्ध है) '
    : ' (Official source link available) ';
  clean = clean.replace(/https?:\/\/[^\s\)\],]+/g, urlPhrase);

  // 7. If structured recommended schemes are present, append natural spoken summary
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

  // 8. Natural currency and unit pronunciation across entire text
  if (language === 'hi' || /[\u0900-\u097F]/.test(clean)) {
    clean = clean
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये ')
      .replace(/%\s*/g, ' प्रतिशत ')
      .replace(/\/month\b/gi, ' प्रति माह ')
      .replace(/\/year\b/gi, ' प्रति वर्ष ');
  } else {
    clean = clean
      .replace(/₹\s*([0-9,]+)/g, 'Rupees $1 ')
      .replace(/%\s*/g, ' percent ')
      .replace(/\/month\b/gi, ' per month ')
      .replace(/\/year\b/gi, ' per year ');
  }

  // 9. Headings: `# Title` or `## Title` -> `Title. `
  clean = clean.replace(/^[ \t]*#+[ \t]+(.+)$/gm, '$1. ');

  // 10. Numbered lists: `1. Item` -> `1. Item. `
  clean = clean.replace(/^[ \t]*(\d+)[.)][ \t]+(.+)$/gm, '$1. $2. ');

  // 11. Bullet points: `* Item` or `- Item` or `• Item` -> `Item. `
  clean = clean.replace(/^[ \t]*[*\-•◆▶➤✓✔★][ \t]+(.+)$/gm, '$1. ');

  // 12. Markdown formatting: bold, italic, strikethrough, inline code
  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  // 13. Remove decorative symbols and table delimiters
  clean = clean.replace(/[•◆▶➤✓✔★|~—_]/g, ' ');

  // 14. Normalize duplicate punctuation and whitespace
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
