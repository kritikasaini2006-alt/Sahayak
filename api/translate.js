/**
 * Vercel Serverless Function & Backend Handler for Sahayak AI Translation.
 *
 * Security, Reliability & Privacy:
 * - Reads GEMINI_API_KEY exclusively from server-side environment variables.
 * - Never exposes API secrets or provider credentials to client-side code.
 * - Translates complete AI-generated responses (markdown headings, paragraphs, bullet points, options, scheme cards).
 * - Preserves scheme names, official portal URLs, scheme IDs, dates, rupee amounts (₹), and legal citations accurately.
 * - Provides reliable offline translation fallback when GEMINI_API_KEY is not configured or during network issues.
 * - Enforces sliding window rate limits and input size bounds.
 */

import { checkRateLimit, DEFAULT_OPTIONS_BY_FIELD } from './chat.js';

// Canonical Verified Scheme Translations for Offline Mode
const VERIFIED_SCHEMES_TRANSLATIONS = {
  'pm-kisan': {
    hi: {
      title: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)',
      benefit: '₹6,000 / वर्ष (DBT के माध्यम से ₹2,000 की 3 समान किस्तें)',
      keyCriteria: 'कृषि योग्य भूमि वाले किसान परिवार',
      documentsRequired: ['आधार कार्ड', 'भूमि स्वामित्व अभिलेख (खतौनी)', 'बैंक पासबुक'],
    },
    en: {
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      benefit: '₹6,000 / year (3 equal installments of ₹2,000 via DBT)',
      keyCriteria: 'Landholding farmer family with cultivable land',
      documentsRequired: ['Aadhaar Card', 'Land Records (Khatauni)', 'Bank Passbook'],
    },
  },
  'pm-jay': {
    hi: {
      title: 'आयुष्मान भारत - पीएम जन आरोग्य योजना (AB-PMJAY)',
      benefit: 'प्रति परिवार प्रति वर्ष ₹5,00,000 तक का कैशलेस द्वितीयक एवं तृतीयक अस्पताल कवर',
      keyCriteria: 'SECC 2011 / BPL परिवार तथा 70 वर्ष या अधिक के सभी वरिष्ठ नागरिक',
      documentsRequired: ['आधार कार्ड', 'राशन कार्ड'],
    },
    en: {
      title: 'Ayushman Bharat - PM-JAY',
      benefit: 'Up to ₹5,00,000 cashless secondary and tertiary hospital cover per family / year',
      keyCriteria: 'SECC 2011 / BPL or all senior citizens aged 70+',
      documentsRequired: ['Aadhaar Card', 'Ration Card'],
    },
  },
  'sukanya-samriddhi': {
    hi: {
      title: 'सुकन्या समृद्धि योजना (SSY)',
      benefit: '8.2% वार्षिक गारंटीकृत ब्याज दर + धारा 80C के तहत 100% टैक्स छूट (EEE)',
      keyCriteria: '10 वर्ष तक की बालिका',
      documentsRequired: ['बालिका का जन्म प्रमाण पत्र', 'अभिभावक का आधार कार्ड', 'पते का प्रमाण'],
    },
    en: {
      title: 'Sukanya Samriddhi Yojana (SSY)',
      benefit: '8.2% p.a. guaranteed interest rate + 100% tax exemption under 80C',
      keyCriteria: 'Girl child aged 10 years or below',
      documentsRequired: ['Birth Certificate of Girl Child', "Guardian's Aadhaar", 'Address Proof'],
    },
  },
  'pm-vishwakarma': {
    hi: {
      title: 'पीएम विश्वकर्मा योजना',
      benefit: '₹15,000 टूलकिट अनुदान + 5% रियायती ब्याज पर ₹3,00,000 तक का संपार्श्विक-मुक्त ऋण',
      keyCriteria: '18 पारिवारिक शिल्पों में काम करने वाले पारंपरिक कारीगर',
      documentsRequired: ['आधार कार्ड', 'आधार लिंक मोबाइल', 'बैंक खाता विवरण', 'शिल्प प्रमाण'],
    },
    en: {
      title: 'PM Vishwakarma Scheme',
      benefit: '₹15,000 toolkit grant + up to ₹3,00,000 collateral-free credit at 5% interest',
      keyCriteria: 'Traditional artisans in 18 designated trades',
      documentsRequired: ['Aadhaar Card', 'Mobile linked to Aadhaar', 'Bank Account details', 'Trade Proof'],
    },
  },
};

// Known Standard Offline Reply Pairs (for offline fidelity)
const KNOWN_OFFLINE_TEMPLATES = [
  {
    en: `**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account in 3 equal installments of ₹2,000.\n• **Eligibility:** All landholding farmer families with cultivable land in their names. Must complete Aadhaar e-KYC. High-income taxpayers are excluded.\n• **Required Documents:** Aadhaar Card, Land Records (Khatauni/Jamabandi), Bank Passbook with Aadhaar linkage.\n• **Official Portal:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*Official Next Step:* Visit pmkisan.gov.in or your nearest Common Service Centre (CSC) to submit official e-KYC.`,
    hi: `**पीएम-किसान (PM-KISAN) योजना:**\n\n• **मुख्य लाभ:** सभी पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष वित्तीय सहायता (₹2,000 की 3 समान किस्तों में)।\n• **पात्रता:** जिनके नाम पर कृषि योग्य भूमि दर्ज है और जिनका बैंक खाता आधार से लिंक (e-KYC) है।\n• **आवश्यक दस्तावेज:** आधार कार्ड, खतौनी/जमाबंदी (भूमि दस्तावेज), और बैंक पासबुक।\n• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*नोट:* आधिकारिक पंजीकरण के लिए अपने नजदीकी जन सेवा केंद्र (CSC) या pmkisan.gov.in पोर्टल पर जाएं।`,
  },
  {
    en: `**Ayushman Bharat (AB-PMJAY):**\n\n• **Benefit:** Cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.\n• **Eligibility:** Families identified in SECC 2011 deprivation criteria, active NFSA BPL/AAY ration card holders, and **all senior citizens aged 70+** regardless of income (expanded universal cover).\n• **Where to apply:** Visit any empanelled public or private hospital with your Aadhaar and Ration Card to verify eligibility with the Ayushman Mitra desk.\n• **Official Portal:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`,
    hi: `**आयुष्मान भारत (AB-PMJAY) योजना:**\n\n• **स्वास्थ्य कवर:** प्रति परिवार प्रति वर्ष ₹5,00,000 तक का मुफ्त कैशलेस इलाज।\n• **पात्रता:** SECC 2011 सूची में शामिल परिवार, राशन कार्ड (BPL/AAY) धारक, तथा **70 वर्ष और उससे अधिक आयु के सभी वरिष्ठ नागरिक** (यूनिवर्सल कवर)।\n• **कार्ड कैसे बनवाएं:** अपने आधार कार्ड और राशन कार्ड के साथ नजदीकी सरकारी अस्पताल या पंजीकृत निजी अस्पताल में 'आयुष्मान मित्र' से संपर्क करें।\n• **आधिकारिक पोर्टल:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`,
  },
  {
    en: `**Sukanya Samriddhi Yojana (SSY):**\n\n• **Eligibility:** Girl child who is an Indian resident and under 10 years of age on account opening date.\n• **Benefit:** High government-guaranteed interest rate (8.2% p.a.) with Triple Tax Exemption (EEE) under Section 80C.\n• **Deposit Limits:** Minimum ₹250 per financial year; maximum ₹1,50,000.\n• **Where to open:** Any India Post Office branch or authorized commercial bank with the child's birth certificate and guardian's KYC.`,
    hi: `**सुकन्या समृद्धि योजना (SSY):**\n\n• **पात्रता:** 10 वर्ष या उससे कम उम्र की बालिकाओं के नाम पर खाता खोला जा सकता है।\n• **ब्याज दर:** 8.2% वार्षिक (सरकारी अधिसूचित) तथा धारा 80C के तहत 100% टैक्स फ्री (EEE)।\n• **न्यूनतम जमा:** प्रति वित्तीय वर्ष मात्र ₹250 (अधिकतम ₹1.5 लाख)।\n• **आवेदन स्थान:** नजदीकी भारतीय डाकघर (Post Office) या अधिकृत राष्ट्रीयकृत बैंक।`,
  },
  {
    en: `**PM Vishwakarma Scheme:**\n\n• **Benefit:** ₹15,000 modern toolkit incentive, skill training with ₹500/day stipend, and collateral-free enterprise credit up to ₹3,00,000 at subsidized 5% interest.\n• **Eligibility:** Traditional artisans working with hands and tools in one of 18 designated family trades (e.g. carpenter, blacksmith, tailor, potter, barber, mason).\n• **How to Apply:** Visit nearest Common Service Centre (CSC) for biometric registration on [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in).`,
    hi: `**पीएम विश्वकर्मा योजना:**\n\n• **लाभ:** ₹15,000 का आधुनिक टूलकिट प्रोत्साहन, ₹500/दिन वजीफे के साथ कौशल प्रशिक्षण, तथा 5% रियायती ब्याज पर ₹3,00,000 तक का संपार्श्विक-मुक्त उद्यम ऋण।\n• **पात्रता:** 18 निर्दिष्ट पारंपरिक शिल्पों में हाथों और औजारों से काम करने वाले कारीगर।\n• **आवेदन:** [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in) पर नजदीकी जन सेवा केंद्र (CSC) के माध्यम से बायोमेट्रिक पंजीकरण।`,
  },
  {
    en: 'Namaste! To identify verified government welfare schemes tailored to you, please select your **State or Union Territory**:',
    hi: 'नमस्ते! आपके लिए उपयुक्त कल्याणकारी योजनाएं खोजने हेतु, कृपया अपना **राज्य या केंद्र शासित प्रदेश** चुनें:',
  },
  {
    en: 'Please tell me your age so I can find government schemes that are relevant to you.',
    hi: 'कृपया मुझे अपनी उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।',
  },
  {
    en: 'Please enter a valid age between 1 and 120 so I can find government schemes that are relevant to you.',
    hi: 'कृपया 1 से 120 वर्ष के बीच एक मान्य उम्र बताएं ताकि मैं आपके लिए उपयुक्त सरकारी योजनाएं खोज सकूँ।',
  },
  {
    en: 'Please select your **Age Group** so we can verify schemes targeted to youth, adults, or senior citizens:',
    hi: 'कृपया अपना **आयु वर्ग** चुनें ताकि हम उम्र के आधार पर लागू योजनाओं (जैसे युवा, वयस्क या वरिष्ठ नागरिक पेंशन) की जांच कर सकें:',
  },
  {
    en: 'Please select your **Primary Occupation or Livelihood** to check occupational support initiatives:',
    hi: 'कृपया अपना **मुख्य व्यवसाय या आजीविका** चुनें ताकि हम व्यावसायिक सहायता योजनाओं की जांच कर सकें:',
  },
  {
    en: `Namaste! I am your Sahayak AI Civic Assistant.\n\nI can help you understand Indian Central and State government welfare schemes, check eligibility criteria, identify necessary documents, and guide you to official application portals.\n\nYou can ask me questions in English or हिन्दी (Hindi). How can I assist you or your family today?`,
    hi: `नमस्ते! मैं आपका सहायक नागरिक AI (Sahayak AI) सलाहकार हूँ।\n\nमैं आपको भारत सरकार और राज्य सरकारों की कल्याणकारी योजनाओं, पात्रता शर्तों, आवश्यक दस्तावेजों को समझने और आधिकारिक आवेदन पोर्टलों तक पहुँचने में मदद कर सकता हूँ।\n\nआप मुझसे हिन्दी या English में सवाल पूछ सकते हैं। आज मैं आपकी या आपके परिवार की क्या सहायता कर सकता हूँ?`,
  },
];

// Offline civic glossary for phrase replacement fallback
const CIVIC_PHRASES = [
  ['**Benefit:**', '**मुख्य लाभ:**'],
  ['• **Benefit:**', '• **मुख्य लाभ:**'],
  ['**Eligibility:**', '**पात्रता:**'],
  ['• **Eligibility:**', '• **पात्रता:**'],
  ['**Required Documents:**', '**आवश्यक दस्तावेज:**'],
  ['• **Required Documents:**', '• **आवश्यक दस्तावेज:**'],
  ['**Official Portal:**', '**आधिकारिक पोर्टल:**'],
  ['• **Official Portal:**', '• **आधिकारिक पोर्टल:**'],
  ['**Where to apply:**', '**आवेदन कहां करें:**'],
  ['• **Where to apply:**', '• **आवेदन कहां करें:**'],
  ['**How to Apply:**', '**आवेदन कैसे करें:**'],
  ['• **How to Apply:**', '• **आवेदन कैसे करें:**'],
  ['*Official Next Step:*', '*आधिकारिक अगला कदम:*'],
  ['*Note:*', '*नोट:*'],
  ['Verified Government Welfare Schemes', 'सुझाई गई सरकारी कल्याणकारी योजनाएं'],
  ['Recommended Government Welfare Schemes', 'सुझाई गई सरकारी कल्याणकारी योजनाएं'],
  ['Please choose an option:', 'कृपया नीचे एक विकल्प चुनें:'],
  ['Select all that apply, then confirm:', 'लागू होने वाले सभी विकल्प चुनें, फिर पुष्टि करें:'],
  ['Confirm Selection', 'चयन की पुष्टि करें'],
  ['Skip this question →', 'यह प्रश्न छोड़ें →'],
  ['Change Answer', 'उत्तर बदलें'],
];

/**
 * Fallback translation function for offline demo mode or when Gemini is unreachable.
 */
export function performOfflineTranslation(text, targetLang = 'hi', fieldKey = null, options = [], recommendedSchemes = []) {
  const isTargetHi = targetLang === 'hi';
  const trimmed = String(text || '').trim();

  // 1. Exact template match
  for (const tpl of KNOWN_OFFLINE_TEMPLATES) {
    if (isTargetHi && (trimmed === tpl.en.trim() || trimmed.includes(tpl.en.trim()))) {
      return {
        translatedText: tpl.hi,
        translatedOptions: translateOptionsOffline(options, fieldKey, targetLang),
        translatedSchemes: translateSchemesOffline(recommendedSchemes, targetLang),
        isDemoMode: true,
      };
    }
    if (!isTargetHi && (trimmed === tpl.hi.trim() || trimmed.includes(tpl.hi.trim()))) {
      return {
        translatedText: tpl.en,
        translatedOptions: translateOptionsOffline(options, fieldKey, targetLang),
        translatedSchemes: translateSchemesOffline(recommendedSchemes, targetLang),
        isDemoMode: true,
      };
    }
  }

  // 2. Phrase-level replacement
  let translatedText = trimmed;
  for (const [enPhrase, hiPhrase] of CIVIC_PHRASES) {
    if (isTargetHi) {
      translatedText = translatedText.split(enPhrase).join(hiPhrase);
    } else {
      translatedText = translatedText.split(hiPhrase).join(enPhrase);
    }
  }

  return {
    translatedText,
    translatedOptions: translateOptionsOffline(options, fieldKey, targetLang),
    translatedSchemes: translateSchemesOffline(recommendedSchemes, targetLang),
    isDemoMode: true,
  };
}

/**
 * Translates clickable options using fieldKey or label lookup.
 */
function translateOptionsOffline(options = [], fieldKey = null, targetLang = 'hi') {
  if (fieldKey && DEFAULT_OPTIONS_BY_FIELD[fieldKey]?.[targetLang]) {
    return DEFAULT_OPTIONS_BY_FIELD[fieldKey][targetLang];
  }

  if (!Array.isArray(options) || options.length === 0) return [];

  // If already matches targetLang format
  return options.map((opt) => {
    const val = opt.value || opt.label;
    // Check all fields in DEFAULT_OPTIONS_BY_FIELD for a match on value
    for (const fKey of Object.keys(DEFAULT_OPTIONS_BY_FIELD)) {
      const match = DEFAULT_OPTIONS_BY_FIELD[fKey][targetLang]?.find((o) => o.value === val);
      if (match) return match;
    }
    return {
      label: opt.label || val,
      value: val,
    };
  });
}

/**
 * Translates recommended schemes using VERIFIED_SCHEMES_TRANSLATIONS.
 */
function translateSchemesOffline(schemes = [], targetLang = 'hi') {
  if (!Array.isArray(schemes) || schemes.length === 0) return [];

  return schemes.map((s) => {
    const known = VERIFIED_SCHEMES_TRANSLATIONS[s.id]?.[targetLang];
    if (known) {
      return {
        ...s,
        title: known.title,
        benefit: known.benefit,
        keyCriteria: known.keyCriteria,
        documentsRequired: known.documentsRequired,
      };
    }
    return s;
  });
}

/**
 * Generates prompt instruction for Gemini translation engine.
 */
function buildGeminiTranslationPrompt(targetLang, sourceLang = 'auto') {
  const targetDesc =
    targetLang === 'hi'
      ? 'fluent, polite, natural Devanagari Hindi (हिन्दी). Use standard Hindi civic terms.'
      : 'clear, accessible Indian English. Avoid overly bureaucratic legalese.';

  return `You are an expert bilingual civic-tech translation engine for Sahayak AI (सहायक AI), India's public welfare assistance platform.
Your task is to translate an AI Assistant response faithfully into ${targetDesc}.

STRICT TRANSLATION RULES:
1. FAITHFUL & COMPLETE TRANSLATION:
   - Translate the entire message completely: headings, introductory sentences, bullet points, explanations, advice, and closing sentences.
   - Do not summarize, truncate, or omit any sentences.
2. PRESERVE FACTUAL INTEGRITY (DO NOT ALTER):
   - Keep official scheme names and acronyms accurate (e.g. PM-KISAN, Ayushman Bharat, AB-PMJAY, PMAY-G, Sukanya Samriddhi Yojana, SSY, PM MUDRA, PM Vishwakarma, PM SVANidhi).
   - Keep all official government portal URLs exactly as they are (e.g. https://pmkisan.gov.in, https://beneficiary.nha.gov.in).
   - Keep all numbers, statutory amounts (e.g. ₹6,000, ₹5,00,000, ₹15,000), percentages (e.g. 8.2%, 5%), and years/dates exact.
3. PRESERVE MARKDOWN FORMATTING:
   - Keep all **bold text**, • or - bullet points, [link text](url) anchors, and paragraph line breaks.
4. JSON RESPONSE FORMAT:
   You MUST return a strictly valid JSON object matching this schema:
   {
     "translatedText": "(string) The complete translated markdown text"
   }`;
}

/**
 * Translates a single text using Gemini API with model fallback.
 */
async function translateTextWithGemini(text, targetLang, apiKey) {
  const primaryModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-3.5-flash-lite';
  const fallbackModel = primaryModel === 'gemini-3.5-flash-lite' ? 'gemini-3.5-flash' : 'gemini-3.5-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel];

  const systemInstruction = buildGeminiTranslationPrompt(targetLang);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `Translate the following text to ${targetLang === 'hi' ? 'Hindi' : 'English'}:\n\n${text}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.15,
      topK: 30,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  };

  for (const model of modelsToTry) {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput) continue;

      let parsed = null;
      try {
        parsed = JSON.parse(rawOutput);
      } catch {
        const cleaned = rawOutput.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {}
      }

      if (parsed?.translatedText && typeof parsed.translatedText === 'string') {
        return { translatedText: parsed.translatedText.trim(), modelUsed: model };
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

/**
 * Core translation request handler for both single-message and batch requests.
 */
export async function processTranslateRequest({
  text = null,
  options = [],
  recommendedSchemes = [],
  fieldKey = null,
  messages = null,
  targetLanguage = 'hi',
  sourceLanguage = 'en',
  clientIp = null,
} = {}) {
  // 1. Rate limiting check
  if (clientIp) {
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        body: {
          error: `Too many translation requests. Please wait ${rateCheck.retryAfter} seconds.`,
          isRateLimited: true,
          retryAfter: rateCheck.retryAfter,
        },
      };
    }
  }

  const targetLang = targetLanguage === 'hi' ? 'hi' : 'en';
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

  // 2. Handle batch translation of multiple messages
  if (Array.isArray(messages) && messages.length > 0) {
    const translations = [];

    for (const msg of messages) {
      const msgText = msg.text || '';
      const msgOptions = msg.options || [];
      const msgSchemes = msg.recommendedSchemes || [];
      const msgFieldKey = msg.fieldKey || null;

      let translatedText = null;
      let modelUsed = null;

      // Try Gemini translation if key is present
      if (apiKey) {
        const geminiResult = await translateTextWithGemini(msgText, targetLang, apiKey);
        if (geminiResult) {
          translatedText = geminiResult.translatedText;
          modelUsed = geminiResult.modelUsed;
        }
      }

      // If Gemini translation unavailable or in offline mode, use offline translation
      if (!translatedText) {
        const offlineResult = performOfflineTranslation(
          msgText,
          targetLang,
          msgFieldKey,
          msgOptions,
          msgSchemes
        );
        translatedText = offlineResult.translatedText;
      }

      // Localize options & schemes
      const translatedOptions = translateOptionsOffline(msgOptions, msgFieldKey, targetLang);
      const translatedSchemes = translateSchemesOffline(msgSchemes, targetLang);

      translations.push({
        id: msg.id,
        translatedText,
        translatedOptions,
        translatedSchemes,
        targetLanguage: targetLang,
        isDemoMode: !modelUsed,
        modelUsed,
      });
    }

    return {
      status: 200,
      body: {
        translations,
        targetLanguage: targetLang,
      },
    };
  }

  // 3. Handle single message translation
  if (text !== null && text !== undefined) {
    let translatedText = null;
    let modelUsed = null;

    if (apiKey) {
      const geminiResult = await translateTextWithGemini(text, targetLang, apiKey);
      if (geminiResult) {
        translatedText = geminiResult.translatedText;
        modelUsed = geminiResult.modelUsed;
      }
    }

    if (!translatedText) {
      const offlineResult = performOfflineTranslation(
        text,
        targetLang,
        fieldKey,
        options,
        recommendedSchemes
      );
      translatedText = offlineResult.translatedText;
    }

    const translatedOptions = translateOptionsOffline(options, fieldKey, targetLang);
    const translatedSchemes = translateSchemesOffline(recommendedSchemes, targetLang);

    return {
      status: 200,
      body: {
        translatedText,
        translatedOptions,
        translatedSchemes,
        targetLanguage: targetLang,
        isDemoMode: !modelUsed,
        modelUsed,
      },
    };
  }

  return {
    status: 400,
    body: { error: 'Invalid request: either "text" or "messages" array is required.' },
  };
}

/**
 * Standard Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    if (req.body && typeof req.body === 'string' && req.body.length > 32768) {
      return res.status(413).json({ error: 'Payload Too Large: Maximum request body size is 32 KB.' });
    }

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await processTranslateRequest({ ...payload, clientIp });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Server error processing translation request:', error?.name || 'InternalError');
    return res.status(500).json({ error: 'Internal server error processing translation.' });
  }
}
