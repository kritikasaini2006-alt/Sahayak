/**
 * Vercel Serverless Function & Backend Handler for Sahayak AI Gemini Chatbot.
 *
 * Security, Reliability & Privacy:
 * - Reads GEMINI_API_KEY strictly from server-side environment variables.
 * - Never exposes API secrets or provider credentials to client-side code.
 * - Enforces input size validation (max 2,000 chars per prompt).
 * - Enforces server-side rate limiting (30 requests/min per client IP).
 * - Sanitizes citizen profile data and enforces bounded parameters.
 * - Protects citizen privacy: NEVER logs citizen prompts, credentials, or full profiles.
 * - Handles timeouts (15s abort controller) and rate limits (429) gracefully.
 * - If GEMINI_API_KEY is absent or API is unreachable, provides an authentic,
 *   clearly labeled Offline Demo Mode response (never pretending it came from Gemini).
 */

const VERIFIED_SCHEMES_KNOWLEDGE = `
VERIFIED SCHEME KNOWLEDGE BASE:
1. PM-KISAN (Pradhan Mantri Kisan Samman Nidhi): ₹6,000/year in 3 equal installments of ₹2,000 via DBT for landholding farmer families. Requires Aadhaar-linked bank account and land records (Khatauni). Excludes institutional landholders and income tax payees. Portal: pmkisan.gov.in.
2. Ayushman Bharat (AB-PMJAY): ₹5 Lakh cashless hospital cover per family per year for secondary & tertiary hospitalization. Covers SECC 2011/BPL families and ALL senior citizens aged 70+ universally (Cabinet decision Sep 2024). Portal: pmjay.gov.in.
3. PMAY-G (Pradhan Mantri Awas Yojana - Gramin): Financial assistance of ₹1.20 Lakh (plains) to ₹1.30 Lakh (hilly areas) + ₹12,000 for toilet to rural homeless and kutcha house families. Excludes families owning a pucca house. Portal: pmayg.nic.in.
4. Sukanya Samriddhi Yojana (SSY): Small savings deposit for girl child below 10 years of age. 8.2% tax-free interest rate (EEE status). Max 2 accounts per family. Deposit ₹250 to ₹1.5 Lakh/year. Portal: indiapost.gov.in.
5. PM MUDRA Yojana (PMMY): Collateral-free business loans up to ₹10-20 Lakhs for non-farm micro enterprises (Shishu up to ₹50k, Kishore up to ₹5L, Tarun up to ₹10L). Portal: mudra.org.in.
6. PM Vishwakarma: Holistic support for traditional artisans across 18 family trades (carpenter, blacksmith, tailor, potter, etc.). ₹15,000 toolkit grant + 5% subsidized credit up to ₹3 Lakhs. Portal: pmvishwakarma.gov.in.
7. IGNOAPS (National Old Age Pension): Monthly pension for elderly citizens aged 60+ belonging to BPL households. Supplemented by state top-ups. Portal: nsap.nic.in.
8. PMUY 2.0 (Ujjwala Yojana): Deposit-free LPG connection + free first refill and stove for adult women from poor/BPL households. Portal: pmuy.gov.in.
9. PM SVANidhi: Collateral-free working capital micro-loans (₹10k, ₹20k, ₹50k) with 7% interest subsidy for urban street vendors and hawkers. Portal: pmsvanidhi.mohua.gov.in.
10. PM-KMY (Kisan Maan-Dhan Yojana): Guaranteed ₹3,00,00/month pension for small/marginal farmers upon reaching 60 years. Entry age 18-40. 50:50 matching government contribution. Portal: maandhan.in.
`;

// Rate Limiter: max 30 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const ipRequestHistory = new Map();

/**
 * Checks in-memory sliding window rate limits.
 */
export function checkRateLimit(clientIp = 'default') {
  const now = Date.now();
  const record = ipRequestHistory.get(clientIp);

  if (!record || now > record.resetTime) {
    ipRequestHistory.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Generates the structured system instruction for the AI assistant.
 */
export function generateSystemPrompt(language = 'en', profile = null) {
  let profileContext = 'Citizen Profile: Anonymous user (no profile details provided).';
  if (profile && (profile.age || profile.occupation || profile.state)) {
    profileContext = `Citizen Profile Provided:
- Age: ${profile.age || 'Not specified'} years
- Gender: ${profile.gender || 'Not specified'}
- State/UT: ${profile.state || 'Not specified'}
- Residence: ${profile.areaType || 'Not specified'} area
- Occupation: ${profile.occupation ? String(profile.occupation).replace('_', ' ') : 'Not specified'}
${profile.farmerLandholding ? `- Farmer Landholding: ${profile.farmerLandholding}` : ''}
${profile.artisanTrade ? `- Traditional Trade: ${profile.artisanTrade}` : ''}
- Annual Household Income: ₹${profile.annualIncome !== undefined && profile.annualIncome !== '' ? Number(profile.annualIncome).toLocaleString('en-IN') : 'Not specified'}
- Ration Card: ${profile.rationCard || 'Not specified'}
- Housing Status: ${profile.housingType || 'Not specified'}
- Girl Child <= 10: ${profile.hasGirlChildUnder10 || 'Not specified'}
- Disability Status: ${profile.hasDisability || 'Not specified'}`;
  }

  const langInstruction =
    language === 'hi'
      ? 'PRIMARY LANGUAGE: Respond in fluent, polite, accessible Hindi (हिन्दी). Use easy-to-understand Hindi without overly complex bureaucratic terms. When citing portals or numbers, you can include them in English or Devanagari.'
      : 'PRIMARY LANGUAGE: Respond in clear, accessible Indian English. Avoid bureaucratic legalese.';

  return `You are Sahayak AI (सहायक AI), a helpful, empathetic, and neutral civic-tech assistant helping Indian citizens understand government welfare schemes, criteria, and documentation.

${langInstruction}

${profileContext}

${VERIFIED_SCHEMES_KNOWLEDGE}

OPERATIONAL PRINCIPLES:
1. Ground answers strictly in official central and state government guidelines.
2. Distinguish verified statutory facts from general guidance.
3. If citizen profile details are available, tailor the eligibility explanation to their profile.
4. If essential criteria are missing (e.g. land records, age, ration card), explicitly explain what is needed rather than guessing or assuming.
5. NEVER claim that an application was submitted, approved, processed, or officially verified.
6. Always direct citizens to verified official government portals (.gov.in) or Common Service Centres (CSCs) for official applications.
7. Keep responses concise, structured (bullet points for documents or steps), and easy to read on mobile devices.`;
}

/**
 * Generates an authentic offline sample response when GEMINI_API_KEY is not configured or unavailable.
 */
export function generateOfflineSampleReply(prompt, language = 'en', profile = null) {
  const q = String(prompt).toLowerCase();

  if (language === 'hi') {
    if (q.includes('किसान') || q.includes('farmer') || q.includes('kisan')) {
      return `**पीएम-किसान (PM-KISAN) योजना:**\n\n• **मुख्य लाभ:** सभी पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष वित्तीय सहायता (₹2,000 की 3 समान किस्तों में)।\n• **पात्रता:** जिनके नाम पर कृषि योग्य भूमि दर्ज है और जिनका बैंक खाता आधार से लिंक (e-KYC) है।\n• **आवश्यक दस्तावेज:** आधार कार्ड, खतौनी/जमाबंदी (भूमि दस्तावेज), और बैंक पासबुक।\n• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*नोट:* आधिकारिक पंजीकरण के लिए अपने नजदीकी जन सेवा केंद्र (CSC) या pmkisan.gov.in पोर्टल पर जाएं।`;
    }
    if (q.includes('आयुष्मान') || q.includes('स्वास्थ्य') || q.includes('health') || q.includes('hospital')) {
      return `**आयुष्मान भारत (AB-PMJAY) योजना:**\n\n• **स्वास्थ्य कवर:** प्रति परिवार प्रति वर्ष ₹5,00,000 तक का मुफ्त कैशलेस इलाज।\n• **पात्रता:** SECC 2011 सूची में शामिल परिवार, राशन कार्ड (BPL/AAY) धारक, तथा **70 वर्ष और उससे अधिक आयु के सभी वरिष्ठ नागरिक** (यूनिवर्सल कवर)।\n• **कार्ड कैसे बनवाएं:** अपने आधार कार्ड और राशन कार्ड के साथ नजदीकी सरकारी अस्पताल या पंजीकृत निजी अस्पताल में 'आयुष्मान मित्र' से संपर्क करें।\n• **आधिकारिक पोर्टल:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`;
    }
    if (q.includes('सुकन्या') || q.includes('लड़की') || q.includes('girl') || q.includes('daughter')) {
      return `**सुकन्या समृद्धि योजना (SSY):**\n\n• **पात्रता:** 10 वर्ष या उससे कम उम्र की बालिकाओं के नाम पर खाता खोला जा सकता है।\n• **ब्याज दर:** 8.2% वार्षिक (सरकारी अधिसूचित) तथा धारा 80C के तहत 100% टैक्स फ्री (EEE)।\n• **न्यूनतम जमा:** प्रति वित्तीय वर्ष मात्र ₹250 (अधिकतम ₹1.5 लाख)।\n• **आवेदन स्थान:** नजदीकी भारतीय डाकघर (Post Office) या अधिकृत राष्ट्रीयकृत बैंक।`;
    }
    return `नमस्ते! सहायक AI में आपका स्वागत है।\n\nसरकारी कल्याणकारी योजनाओं के बारे में सही जानकारी प्राप्त करने के लिए आप किसी भी योजना (जैसे पीएम-किसान, आयुष्मान भारत, पीएम आवास, सुकन्या समृद्धि, मुद्रा ऋण, विश्वकर्मा योजना) के बारे में पूछ सकते हैं।\n\nकृपया अपनी उम्र, राज्य, और व्यवसाय बताएं ताकि हम आपको सही पात्रता बता सकें।`;
  }

  // English fallback responses
  if (q.includes('farmer') || q.includes('kisan') || q.includes('agriculture')) {
    return `**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account in 3 equal installments of ₹2,000.\n• **Eligibility:** All landholding farmer families with cultivable land in their names. Must complete Aadhaar e-KYC. High-income taxpayers are excluded.\n• **Required Documents:** Aadhaar Card, Land Records (Khatauni/Jamabandi), Bank Passbook with Aadhaar linkage.\n• **Official Portal:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*Official Next Step:* Visit pmkisan.gov.in or your nearest Common Service Centre (CSC) to submit official e-KYC.`;
  }
  if (q.includes('ayushman') || q.includes('health') || q.includes('hospital') || q.includes('medical')) {
    return `**Ayushman Bharat (AB-PMJAY):**\n\n• **Benefit:** Cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.\n• **Eligibility:** Families identified in SECC 2011 deprivation criteria, active NFSA BPL/AAY ration card holders, and **all senior citizens aged 70+** regardless of income (expanded universal cover).\n• **Where to apply:** Visit any empanelled public or private hospital with your Aadhaar and Ration Card to verify eligibility with the Ayushman Mitra desk.\n• **Official Portal:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`;
  }
  if (q.includes('sukanya') || q.includes('girl') || q.includes('daughter') || q.includes('education')) {
    return `**Sukanya Samriddhi Yojana (SSY):**\n\n• **Eligibility:** Girl child who is an Indian resident and under 10 years of age on account opening date.\n• **Benefit:** High government-guaranteed interest rate (8.2% p.a.) with Triple Tax Exemption (EEE) under Section 80C.\n• **Deposit Limits:** Minimum ₹250 per financial year; maximum ₹1,50,000.\n• **Where to open:** Any India Post Office branch or authorized commercial bank with the child's birth certificate and guardian's KYC.`;
  }
  if (q.includes('artisan') || q.includes('vishwakarma') || q.includes('carpenter') || q.includes('tailor')) {
    return `**PM Vishwakarma Scheme:**\n\n• **Benefit:** ₹15,000 modern toolkit incentive, skill training with ₹500/day stipend, and collateral-free enterprise credit up to ₹3,00,000 at subsidized 5% interest.\n• **Eligibility:** Traditional artisans working with hands and tools in one of 18 designated family trades (e.g. carpenter, blacksmith, tailor, potter, barber, mason).\n• **How to Apply:** Visit nearest Common Service Centre (CSC) for biometric registration on [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in).`;
  }
  if (q.includes('loan') || q.includes('mudra') || q.includes('business') || q.includes('shop')) {
    return `**Pradhan Mantri MUDRA Yojana (PMMY):**\n\n• **Benefit:** Collateral-free institutional credit up to ₹10 Lakhs (and up to ₹20 Lakhs under Tarun Plus) across Shishu (up to ₹50k), Kishore (up to ₹5L), and Tarun tiers.\n• **Eligibility:** Any Indian citizen with a viable non-farm business proposal in manufacturing, retail, services, or crafts.\n• **Where to Apply:** Apply online via [udyamimitra.in](https://udyamimitra.in) or visit your nearest commercial/regional rural bank.`;
  }

  return `Namaste! I am your Sahayak AI Civic Assistant.\n\nI can help guide you through official eligibility rules, required documents, and application steps for Indian Central & State welfare initiatives, including:\n• **PM-KISAN** (Farmer income support)\n• **Ayushman Bharat** (₹5 Lakh health assurance)\n• **PMAY-G** (Rural pucca housing grants)\n• **Sukanya Samriddhi** (Girl child savings)\n• **PM MUDRA & SVANidhi** (Micro-enterprise credit)\n• **PM Vishwakarma** (Artisan toolkit & grants)\n\nAsk any question or specify your state, age, and occupation for tailored guidance.`;
}

/**
 * Handles incoming chat API requests.
 */
export async function processChatRequest({
  prompt,
  history = [],
  language = 'en',
  profile = null,
  clientIp = null,
}) {
  // 1. Rate limiting check
  if (clientIp) {
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        body: {
          error: `Too many requests. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
          isRateLimited: true,
          retryAfter: rateCheck.retryAfter,
        },
      };
    }
  }

  // 2. Validate input presence and type
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return {
      status: 400,
      body: { error: 'Invalid request: "prompt" text string is required.' },
    };
  }

  // 3. Constrain maximum prompt size (2,000 characters)
  if (prompt.length > 2000) {
    return {
      status: 400,
      body: { error: 'Request rejected: prompt exceeds maximum allowable limit of 2,000 characters.' },
    };
  }

  // 4. Sanitize profile parameters to prevent prototype pollution or unbounded strings
  let sanitizedProfile = null;
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    sanitizedProfile = {
      age: profile.age && !isNaN(Number(profile.age)) ? Math.min(120, Math.max(1, Number(profile.age))) : '',
      gender: typeof profile.gender === 'string' ? profile.gender.slice(0, 50) : '',
      state: typeof profile.state === 'string' ? profile.state.slice(0, 50) : '',
      areaType: typeof profile.areaType === 'string' ? profile.areaType.slice(0, 50) : '',
      occupation: typeof profile.occupation === 'string' ? profile.occupation.slice(0, 50) : '',
      farmerLandholding: typeof profile.farmerLandholding === 'string' ? profile.farmerLandholding.slice(0, 50) : '',
      artisanTrade: typeof profile.artisanTrade === 'string' ? profile.artisanTrade.slice(0, 50) : '',
      annualIncome:
        profile.annualIncome !== undefined && profile.annualIncome !== '' && !isNaN(Number(profile.annualIncome))
          ? Math.max(0, Number(profile.annualIncome))
          : '',
      rationCard: typeof profile.rationCard === 'string' ? profile.rationCard.slice(0, 50) : '',
      housingType: typeof profile.housingType === 'string' ? profile.housingType.slice(0, 50) : '',
      hasGirlChildUnder10: typeof profile.hasGirlChildUnder10 === 'string' ? profile.hasGirlChildUnder10.slice(0, 20) : '',
      hasDisability: typeof profile.hasDisability === 'string' ? profile.hasDisability.slice(0, 20) : '',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  // If no Gemini API key is configured on the server, respond in clearly labeled Demo Mode
  if (!apiKey || apiKey.trim() === '') {
    const reply = generateOfflineSampleReply(prompt, language, sanitizedProfile);
    return {
      status: 200,
      body: {
        reply,
        isDemoMode: true,
        demoReason: 'GEMINI_API_KEY is not configured in server environment. Running in Offline Demo Mode.',
        modelUsed: 'offline_catalog_engine',
        sources: ['india.gov.in', 'myscheme.gov.in'],
      },
    };
  }

  const systemInstruction = generateSystemPrompt(language, sanitizedProfile);

  // Construct Google Gemini generateContent payload
  const contents = [];

  // Add conversation history (up to last 6 turns, each message text capped at 1,000 chars)
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach((msg) => {
      if (msg && typeof msg.text === 'string' && msg.text.trim()) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.slice(0, 1000).trim() }],
        });
      }
    });
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt.trim() }],
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle Rate Limit (429)
      if (response.status === 429) {
        return {
          status: 429,
          body: {
            error: 'Gemini service is currently busy (Rate Limit). Please wait a moment and try again.',
            isRateLimited: true,
          },
        };
      }

      // Safe logging: Never log user prompt or citizen data to server logs
      console.error(`Gemini API Error (HTTP ${response.status})`);

      // Fallback gracefully to offline sample response if Gemini service errors
      const fallbackReply = generateOfflineSampleReply(prompt, language, sanitizedProfile);
      return {
        status: 200,
        body: {
          reply: fallbackReply,
          isDemoMode: true,
          demoReason: `Gemini API returned status ${response.status}. Served verified offline catalog guidance.`,
          modelUsed: 'offline_catalog_engine',
          sources: ['india.gov.in', 'myscheme.gov.in'],
        },
      };
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    const replyText =
      candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]
        ? candidate.content.parts[0].text
        : 'I apologize, but I could not formulate a response. Please try rephrasing your question.';

    return {
      status: 200,
      body: {
        reply: replyText,
        isDemoMode: false,
        modelUsed: model,
        sources: ['Official Gazette Rules', 'National Portal of India'],
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        status: 504,
        body: {
          error: 'The request to the AI service timed out after 15 seconds. Please check your connection and retry.',
          isTimeout: true,
        },
      };
    }

    // Safe error logging: only log error name, never citizen prompt
    console.error('Fetch error connecting to Gemini API:', err?.name || 'NetworkError');

    // Fallback to offline catalog demo
    const fallbackReply = generateOfflineSampleReply(prompt, language, sanitizedProfile);
    return {
      status: 200,
      body: {
        reply: fallbackReply,
        isDemoMode: true,
        demoReason: 'Network error connecting to Gemini API. Served verified offline catalog guidance.',
        modelUsed: 'offline_catalog_engine',
        sources: ['india.gov.in', 'myscheme.gov.in'],
      },
    };
  }
}

/**
 * Standard Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // Set standard CORS and Security Headers
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
    // Check request payload size limit (max 32KB)
    if (req.body && typeof req.body === 'string' && req.body.length > 32768) {
      return res.status(413).json({ error: 'Payload Too Large: Maximum request body size is 32 KB.' });
    }

    // Extract client IP for rate limiting
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await processChatRequest({ ...payload, clientIp });
    return res.status(result.status).json(result.body);
  } catch (error) {
    // Safe error log
    console.error('Server error processing chat request:', error?.name || 'InternalError');
    return res.status(500).json({ error: 'Internal server error processing request.' });
  }
}
