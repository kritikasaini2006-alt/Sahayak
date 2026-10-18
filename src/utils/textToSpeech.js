/**
 * Natural Bilingual Text-To-Speech (TTS) Engine for Sahayak AI Assistant.
 *
 * Designed for maximum clarity and comprehension for Indian citizens:
 * 1. Authentic Indian Voice Prioritization:
 *    - Strictly prioritizes authentic Indian English (en-IN) voices (e.g. Google English India,
 *      Microsoft Neerja/Prabhat, Apple Aman, Rishi, Tara) for English speech.
 *    - Strictly prioritizes native Hindi (hi-IN) voices (e.g. Google हिन्दी, Microsoft Swara,
 *      Apple Lekha) for Devanagari Hindi speech.
 *    - Never forces US/UK accents or Siri imitation on Indian citizens.
 * 2. Tuned Acoustic Parameters for Clear Comprehension:
 *    - Default Speech Rate: 0.88 (calm, steady, unhurried pacing for easy understanding)
 *    - Default Pitch: 1.0 (natural vocal pitch)
 *    - Default Volume: 0.90 (crisp, comfortable loudness)
 * 3. Dynamic Script & Language Pairing:
 *    - Sets utterance.lang to 'en-IN' for Indian English and 'hi-IN' for Hindi.
 *    - In mixed responses, automatically routes Devanagari sentences to the native Hindi voice
 *      and English terms/sentences to the Indian English voice.
 * 4. Comprehensive Pronunciation & Text Cleaning:
 *    - Cleans Markdown, emojis, HTML tags, code fences, and raw JSON wrappers.
 *    - Normalizes Indian scheme names and acronyms (e.g. "PM-KISAN" -> "PM Kisan", "DBT" -> "D B T").
 *    - Normalizes Indian currency & numbers (e.g. "₹1.20 lakh" -> "Rupees 1.20 Lakh", "₹6,000" -> "Rupees 6,000" / "6,000 रुपये").
 *    - Replaces bare URLs with friendly spoken notices.
 *    - Preserves headings and numbered steps with natural punctuation pauses.
 * 5. Sentence Chunking:
 *    - Circumvents browser speech synthesis lockup and prevents skipping or overlapping speech.
 */

export const TTS_STORAGE_KEY = 'sahayak_tts_settings';

// Speech rate presets: default is 0.88 for calm & natural comprehension
export const SPEED_RATES = {
  slow: 0.85,
  calm: 0.88,
  normal: 0.88,
  standard: 1.0,
  fast: 1.15,
};

export const DEFAULT_TTS_SETTINGS = {
  rate: 0.88,
  pitch: 1.0,
  volume: 0.90,
  speed: 'normal',
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
      : 'normal';

    const rate = typeof parsed.rate === 'number' && parsed.rate >= 0.5 && parsed.rate <= 1.5
      ? parsed.rate
      : (SPEED_RATES[speed] || 0.88);

    const volume = typeof parsed.volume === 'number' && parsed.volume >= 0.1 && parsed.volume <= 1.0
      ? parsed.volume
      : 0.90;

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
 * Evaluates an English voice with strict priority for authentic Indian English (en-IN).
 * Avoids Siri imitation or forcing US/UK accents so Indian citizens hear a natural,
 * understandable voice tailored for Indian civic terminology.
 */
export function evaluateEnglishVoice(voice) {
  const name = voice.name || '';
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const isIndian = lang.includes('en-in') || /india|indian/i.test(name);
  const isEnhanced = /\b(enhanced|premium|natural|neural|online)\b/i.test(name);
  const isGoogle = /google/i.test(name);
  const isMicrosoft = /microsoft/i.test(name);

  let label = voice.name;
  let score = 300;
  let isIndianEnglish = false;
  let isNatural = false;

  if (isIndian) {
    isIndianEnglish = true;
    if (isGoogle || (isMicrosoft && isEnhanced)) {
      // Top neural Indian English: Google English India or Microsoft Neerja/Prabhat
      score = 1000;
      label = `${voice.name} (Indian English - Neural)`;
      isNatural = true;
    } else if (isEnhanced) {
      // Enhanced Indian English models (e.g. Aman Enhanced, Rishi Enhanced)
      score = 960;
      label = `${voice.name} (Indian English - Enhanced)`;
      isNatural = true;
    } else if (/\b(aman)\b/i.test(name)) {
      // Clear, calm, unhurried Apple Indian English voice
      score = 950;
      label = `${voice.name} (Indian English - Aman)`;
      isNatural = true;
    } else if (/\b(rishi|tara)\b/i.test(name)) {
      // Standard Apple Indian English voices
      score = 920;
      label = `${voice.name} (Indian English)`;
      isNatural = true;
    } else {
      // Any other Indian English voice
      score = 900;
      label = `${voice.name} (Indian English)`;
    }
  } else {
    // Non-Indian voices are strictly fallback (score <= 500)
    // Never force US/UK or Siri accents ahead of Indian English
    if (isEnhanced || isGoogle || isMicrosoft) {
      score = 500;
      label = `${voice.name} (Natural English)`;
      isNatural = true;
    } else {
      score = 400;
      label = `${voice.name} (Standard English)`;
    }
  }

  return {
    voice,
    name: voice.name,
    displayLabel: label,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
    isIndianEnglish,
    isNatural,
    isRecommended: score >= 900,
    score,
  };
}

/**
 * Categorizes and ranks voices for Hindi (hi-IN) and English (en-IN).
 */
export function getVoiceCategories(voices = []) {
  const hindi = [];
  const englishVoices = [];
  const indianEnglish = [];
  const otherEnglish = [];

  for (const voice of voices) {
    const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
    const name = (voice.name || '').toLowerCase();

    // Hindi Voices (hi-IN)
    if (lang.startsWith('hi') || /hindi|हिन्दी|देवनागरी/.test(name)) {
      const isGoogle = /google.*(हिन्दी|hindi)/i.test(name);
      const isMicrosoft = /microsoft.*(swara|madhur|natural)/i.test(name);
      const isEnhanced = /\b(enhanced|premium)\b/i.test(name);
      const isLekha = /\blekha\b/i.test(name);
      const isNatural = isGoogle || isMicrosoft || isEnhanced || /natural|neural|online/i.test(voice.name);

      let score = 900;
      if (isGoogle) score = 1000;
      else if (isMicrosoft) score = 980;
      else if (isLekha && isEnhanced) score = 960;
      else if (isLekha) score = 940;
      else if (isNatural) score = 920;

      hindi.push({
        voice,
        name: voice.name,
        displayLabel: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        isNatural,
        isRecommended: true,
        score,
      });
    }

    // English Voices (prioritizing en-IN)
    if (lang.startsWith('en') || /english/.test(name)) {
      const evalVoice = evaluateEnglishVoice(voice);
      englishVoices.push(evalVoice);

      if (evalVoice.isIndianEnglish) {
        indianEnglish.push(evalVoice);
      } else {
        otherEnglish.push(evalVoice);
      }
    }
  }

  // Sort Hindi voices strictly by authenticity and clarity score
  hindi.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Sort English voices strictly by Indian English priority score
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
 * Strictly prioritizes Indian English (en-IN) for English and native Hindi (hi-IN) for Hindi.
 */
export function selectBestVoice(voices, targetLang, preferredVoiceURI = null) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  // 1. Honor explicit user saved preference if present
  if (preferredVoiceURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (preferred) return preferred;
  }

  const { hindi, englishVoices } = getVoiceCategories(voices);

  // 2. Hindi selection: native Hindi voice (Google हिन्दी, Microsoft Swara, Apple Lekha)
  if (targetLang === 'hi') {
    if (hindi.length > 0) return hindi[0].voice;
    // Fallback if no native Hindi voice installed: Indian English voice with en-IN
    const indianFallback = englishVoices.find((v) => v.isIndianEnglish);
    if (indianFallback) return indianFallback.voice;
    if (englishVoices.length > 0) return englishVoices[0].voice;
  } else {
    // 3. English selection: clear Indian English voice (Google English India, Aman, Neerja, Rishi)
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
 * Strips Markdown/HTML/JSON, replaces URLs with spoken phrases, normalizes
 * Indian scheme acronyms and currency/numbers for maximum clarity.
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

  // 8. Pronounce Indian government scheme acronyms cleanly without hyphen stutter
  clean = clean
    .replace(/\bPM-KISAN\b/gi, 'PM Kisan')
    .replace(/\bPM-SYM\b/gi, 'PM Shram Yogi Maandhan')
    .replace(/\bPM-JAY\b/gi, 'PM Jan Arogya Yojana')
    .replace(/\bPMAY-G\b/gi, 'PMAY Gramin')
    .replace(/\bPMAY-U\b/gi, 'PMAY Urban')
    .replace(/\bDBT\b/g, 'D B T');

  // 9. Natural Indian currency, lakh/crore, and unit pronunciation
  if (language === 'hi' || /[\u0900-\u097F]/.test(clean)) {
    clean = clean
      .replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)\s*lakh\b/gi, '$1 लाख रुपये ')
      .replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)\s*crore\b/gi, '$1 करोड़ रुपये ')
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये ')
      .replace(/%\s*/g, ' प्रतिशत ')
      .replace(/\/month\b/gi, ' प्रति माह ')
      .replace(/\/year\b/gi, ' प्रति वर्ष ')
      .replace(/\bp\.a\.\b/gi, ' प्रति वर्ष ');
  } else {
    clean = clean
      .replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)\s*lakh\b/gi, 'Rupees $1 Lakh ')
      .replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)\s*crore\b/gi, 'Rupees $1 Crore ')
      .replace(/₹\s*([0-9,]+)/g, 'Rupees $1 ')
      .replace(/%\s*/g, ' percent ')
      .replace(/\/month\b/gi, ' per month ')
      .replace(/\/year\b/gi, ' per year ')
      .replace(/\bp\.a\.\b/gi, ' per year ');
  }

  // 10. Headings: `# Title` or `## Title` -> `Title. `
  clean = clean.replace(/^[ \t]*#+[ \t]+(.+)$/gm, '$1. ');

  // 11. Numbered lists: `1. Item` -> `1. Item. `
  clean = clean.replace(/^[ \t]*(\d+)[.)][ \t]+(.+)$/gm, '$1. $2. ');

  // 12. Bullet points: `* Item` or `- Item` or `• Item` -> `Item. `
  clean = clean.replace(/^[ \t]*[*\-•◆▶➤✓✔★][ \t]+(.+)$/gm, '$1. ');

  // 13. Markdown formatting: bold, italic, strikethrough, inline code
  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  // 14. Convert colons at the end of introductory phrases into periods for clean pauses
  clean = clean.replace(/:\s*(\n|$)/g, '. $1');

  // 15. Remove decorative symbols and table delimiters
  clean = clean.replace(/[•◆▶➤✓✔★|~—_]/g, ' ');

  // 16. Normalize duplicate punctuation and whitespace
  clean = clean
    .replace(/([.!?।])\s*([.!?।])+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

/**
 * Splits text into natural sentence / clause chunks to prevent
 * Chromium 15-second speech synthesis lockup and provide natural breathing pauses.
 * Automatically identifies Devanagari Hindi vs English script on a per-chunk basis
 * for flawless bilingual playback of mixed responses.
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
    const isDevanagari = /[\u0900-\u097F]/.test(sentence);
    const currentIsDevanagari = /[\u0900-\u097F]/.test(currentChunk);

    if (currentChunk && (isDevanagari === currentIsDevanagari) && (currentChunk.length + sentence.length + 1 <= 160)) {
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
    const devanagariCount = (chunk.match(/[\u0900-\u097F]/g) || []).length;
    // If chunk contains Devanagari text, it must be spoken with Hindi voice (hi-IN)
    // If chunk contains zero Devanagari text (pure Latin/English), speak with Indian English voice (en-IN)
    const isHindi = devanagariCount > 0;
    return {
      text: chunk,
      lang: isHindi ? 'hi' : 'en',
    };
  });
}
