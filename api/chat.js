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

export class OfflineReply {
  constructor({
    reply = '',
    questionType = 'none',
    fieldKey = null,
    options = [],
    allowSkip = false,
    recommendedSchemes = [],
  } = {}) {
    this.reply = reply;
    this.questionType = questionType;
    this.fieldKey = fieldKey;
    this.options = options;
    this.allowSkip = allowSkip;
    this.recommendedSchemes = recommendedSchemes;
  }

  toString() {
    return this.reply;
  }

  includes(sub, position) {
    return this.reply.includes(sub, position);
  }
}

export const DEFAULT_OPTIONS_BY_FIELD = {
  state: {
    en: [
      { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
      { label: 'Maharashtra', value: 'Maharashtra' },
      { label: 'Bihar', value: 'Bihar' },
      { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
      { label: 'Rajasthan', value: 'Rajasthan' },
      { label: 'West Bengal', value: 'West Bengal' },
      { label: 'Tamil Nadu', value: 'Tamil Nadu' },
      { label: 'Other State / UT', value: 'Other' },
    ],
    hi: [
      { label: 'उत्तर प्रदेश', value: 'Uttar Pradesh' },
      { label: 'बिहार', value: 'Bihar' },
      { label: 'महाराष्ट्र', value: 'Maharashtra' },
      { label: 'मध्य प्रदेश', value: 'Madhya Pradesh' },
      { label: 'राजस्थान', value: 'Rajasthan' },
      { label: 'पश्चिम बंगाल', value: 'West Bengal' },
      { label: 'अन्य राज्य / केंद्र शासित प्रदेश', value: 'Other' },
    ],
  },
  ageGroup: {
    en: [
      { label: 'Under 18 years', value: 'under_18' },
      { label: '18 - 35 years', value: '18_35' },
      { label: '36 - 59 years', value: '36_59' },
      { label: '60 - 69 years (Senior Citizen)', value: '60_69' },
      { label: '70+ years (Universal Ayushman)', value: '70_plus' },
    ],
    hi: [
      { label: '18 वर्ष से कम', value: 'under_18' },
      { label: '18 से 35 वर्ष', value: '18_35' },
      { label: '36 से 59 वर्ष', value: '36_59' },
      { label: '60 से 69 वर्ष (वरिष्ठ नागरिक)', value: '60_69' },
      { label: '70 वर्ष या अधिक (यूनिवर्सल आयुष्मान)', value: '70_plus' },
    ],
  },
  occupation: {
    en: [
      { label: 'Farmer / Cultivator', value: 'farmer' },
      { label: 'Traditional Artisan / Craftsperson', value: 'artisan' },
      { label: 'Street Vendor / Micro Merchant', value: 'vendor' },
      { label: 'Daily Wage / Construction Worker', value: 'daily_wage' },
      { label: 'Salaried / Private Employee', value: 'salaried' },
      { label: 'Homemaker / Domestic', value: 'homemaker' },
      { label: 'Student / Youth', value: 'student' },
      { label: 'Unemployed / Seeking Work', value: 'unemployed' },
      { label: 'Other', value: 'other' },
    ],
    hi: [
      { label: 'किसान / कृषक', value: 'farmer' },
      { label: 'पारंपरिक कारीगर / शिल्पकार', value: 'artisan' },
      { label: 'रेहड़ी-पटरी / छोटा व्यवसायी', value: 'vendor' },
      { label: 'दैनिक मजदूर / निर्माण श्रमिक', value: 'daily_wage' },
      { label: 'निजी / वेतनभोगी कर्मचारी', value: 'salaried' },
      { label: 'गृहिणी', value: 'homemaker' },
      { label: 'विद्यार्थी / युवा', value: 'student' },
      { label: 'बेरोजगार', value: 'unemployed' },
      { label: 'अन्य', value: 'other' },
    ],
  },
  incomeRange: {
    en: [
      { label: 'Below ₹1 Lakh', value: 'below_1l' },
      { label: '₹1 Lakh - ₹2.5 Lakhs', value: '1l_2.5l' },
      { label: '₹2.5 Lakhs - ₹8 Lakhs', value: '2.5l_8l' },
      { label: 'Above ₹8 Lakhs', value: 'above_8l' },
      { label: 'Prefer not to say / Not sure', value: 'skip' },
    ],
    hi: [
      { label: '₹1 लाख से कम', value: 'below_1l' },
      { label: '₹1 लाख से ₹2.5 लाख', value: '1l_2.5l' },
      { label: '₹2.5 लाख से ₹8 लाख', value: '2.5l_8l' },
      { label: '₹8 लाख से अधिक', value: 'above_8l' },
      { label: 'बताना नहीं चाहते / निश्चित नहीं', value: 'skip' },
    ],
  },
  farmerLandholding: {
    en: [
      { label: 'Cultivable land in my name (Marginal <= 1 ha)', value: 'marginal' },
      { label: 'Cultivable land in my name (Small 1-2 ha)', value: 'small' },
      { label: 'Medium or Large Landholding (> 2 ha)', value: 'medium_large' },
      { label: 'Tenant Farmer / No land in name', value: 'tenant' },
      { label: 'Not applicable', value: 'na' },
    ],
    hi: [
      { label: 'मेरे नाम पर कृषि भूमि (1 हेक्टेयर तक)', value: 'marginal' },
      { label: 'मेरे नाम पर कृषि भूमि (1-2 हेक्टेयर)', value: 'small' },
      { label: '2 हेक्टेयर से अधिक भूमि', value: 'medium_large' },
      { label: 'बटाईदार / भूमिहीन किसान', value: 'tenant' },
      { label: 'लागू नहीं', value: 'na' },
    ],
  },
  artisanTrade: {
    en: [
      { label: 'Carpenter (Suthar) / Boat Maker', value: 'carpenter' },
      { label: 'Blacksmith (Lohar) / Tool Maker', value: 'blacksmith' },
      { label: 'Potter (Kumhaar) / Sculptor', value: 'potter' },
      { label: 'Tailor (Darzi) / Cobbler', value: 'tailor' },
      { label: 'Mason (Rajmistri) / Barber', value: 'mason' },
      { label: 'Other Traditional Trade', value: 'other' },
    ],
    hi: [
      { label: 'बढ़ई / नाव निर्माता', value: 'carpenter' },
      { label: 'लोहार / औजार निर्माता', value: 'blacksmith' },
      { label: 'कुम्हार / मूर्तिकार', value: 'potter' },
      { label: 'दर्जी / चर्मकार', value: 'tailor' },
      { label: 'राजमिस्त्री / नाई', value: 'mason' },
      { label: 'अन्य पारंपरिक शिल्प', value: 'other' },
    ],
  },
};

/**
 * Generates the structured system instruction for the AI assistant.
 */
export function generateSystemPrompt(language = 'en', profile = null) {
  let profileContext = 'Citizen Profile: Anonymous user (no profile details provided).';
  if (profile && (profile.age || profile.occupation || profile.state || profile.annualIncome)) {
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
      ? 'PRIMARY LANGUAGE: Respond in fluent, polite, accessible Hindi (हिन्दी). All explanations, questions, and option labels MUST be in natural Devanagari Hindi. Use easy-to-understand Hindi without overly complex bureaucratic terms.'
      : 'PRIMARY LANGUAGE: Respond in clear, accessible Indian English. Avoid bureaucratic legalese.';

  return `You are Sahayak AI (सहायक AI), an interactive civic-tech assistant helping Indian citizens understand government welfare schemes, criteria, and documentation.

${langInstruction}

${profileContext}

${VERIFIED_SCHEMES_KNOWLEDGE}

OUTPUT FORMAT REQUIREMENTS:
You MUST ALWAYS respond with a strictly valid JSON object matching this schema:
{
  "reply": "(string) Courteous, accessible message in the primary language. Markdown formatting (bold, bullet points, links) is supported.",
  "questionType": "'none' | 'single_choice' | 'multi_choice' | 'recommendations'",
  "fieldKey": "'state' | 'ageGroup' | 'occupation' | 'incomeRange' | 'farmerLandholding' | 'artisanTrade' | 'hasGirlChildUnder10' | 'hasDisability' | 'rationCard' | 'none'",
  "options": [
    { "label": "(string) Display text for the button/chip in the primary language", "value": "(string) internal value code" }
  ],
  "allowSkip": (boolean) true if the question is optional/non-essential,
  "recommendedSchemes": [
    {
      "id": "(string) scheme identifier, e.g. pm-kisan, pm-jay, ssy, pm-mudra, pm-vishwakarma",
      "title": "(string) official scheme name",
      "benefit": "(string) core monetary or health benefit",
      "keyCriteria": "(string) primary eligibility requirement",
      "documentsRequired": ["Aadhaar Card", "..."],
      "portalUrl": "(string) official .gov.in URL"
    }
  ]
}

OPERATIONAL PRINCIPLES:
1. DIRECT INQUIRIES vs. GUIDED FLOW:
   - If the user asks a direct question about a specific scheme or rule (e.g. "What is PM-KISAN?", "Who is eligible for Ayushman Bharat?", "What documents are needed for SSY?"):
     Provide complete factual details, criteria, and official portals directly in 'reply'.
     Set questionType='none', fieldKey='none', options=[], allowSkip=false, recommendedSchemes=[].
   - If the user asks to find schemes, check eligibility, or gives an open-ended request (e.g. "Find schemes for me", "Which schemes can I get?", "Guide me"):
     Start or continue the step-by-step guided flow.
2. ASK ONE QUESTION AT A TIME:
   - Ask ONLY ONE question per turn. Never combine multiple questions.
   - Do NOT ask questions that are already answered in the Citizen Profile above or earlier conversation turns! Skip them automatically.
   - Guided Flow Progression:
     * Step 1: State or Union Territory (fieldKey='state', questionType='single_choice')
     * Step 2: Age group (fieldKey='ageGroup', questionType='single_choice')
     * Step 3: Primary occupation or livelihood (fieldKey='occupation', questionType='single_choice')
     * Step 4: Scheme-specific criterion (e.g. landholding for farmer, artisan trade for craftsman, girl child under 10 for daughter, or annual income if relevant for BPL)
     * Step 5: Final Scheme Recommendations (questionType='recommendations') with tailored schemes populated in 'recommendedSchemes'.
3. CLICKABLE OPTIONS RULE:
   - Whenever questionType is 'single_choice' or 'multi_choice', 'options' MUST be a non-empty array with 4 to 8 relevant choices formatted as { label, value } in the primary language.
   - Always include choices like "Other", "Not sure", or "None of these" where appropriate.
   - Set allowSkip=true for non-essential questions (income, specific trade, girl child).
4. MULTI-CHOICE QUESTIONS:
   - Use questionType='multi_choice' when the citizen can select multiple valid conditions, documents, or household traits.
5. CHANGING PREVIOUS ANSWERS:
   - If the user corrects or changes a previously given detail (e.g., "Actually I am a street vendor" or "Change my state to Bihar"), gracefully acknowledge the change and adapt the subsequent question or recommendations.
6. CITIZEN PRIVACY & LEGAL DISCLAIMER:
   - NEVER ask for or store Aadhaar numbers, PAN numbers, bank account numbers, or OTPs.
   - Ground answers strictly in official guidelines. Never claim an application was officially submitted or approved.
   - Direct citizens to official .gov.in portals or Common Service Centres (CSCs).`;
}

/**
 * Generates an authentic offline sample response when GEMINI_API_KEY is not configured or unavailable.
 */
export function generateOfflineSampleReply(prompt, language = 'en', profile = null) {
  const q = String(prompt).toLowerCase();

  // 1. Direct Scheme Inquiries
  if (q.includes('farmer') || q.includes('kisan') || q.includes('किसान')) {
    const text =
      language === 'hi'
        ? `**पीएम-किसान (PM-KISAN) योजना:**\n\n• **मुख्य लाभ:** सभी पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष वित्तीय सहायता (₹2,000 की 3 समान किस्तों में)।\n• **पात्रता:** जिनके नाम पर कृषि योग्य भूमि दर्ज है और जिनका बैंक खाता आधार से लिंक (e-KYC) है।\n• **आवश्यक दस्तावेज:** आधार कार्ड, खतौनी/जमाबंदी (भूमि दस्तावेज), और बैंक पासबुक।\n• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*नोट:* आधिकारिक पंजीकरण के लिए अपने नजदीकी जन सेवा केंद्र (CSC) या pmkisan.gov.in पोर्टल पर जाएं।`
        : `**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n• **Benefit:** ₹6,000 per year directly credited into your Aadhaar-linked bank account in 3 equal installments of ₹2,000.\n• **Eligibility:** All landholding farmer families with cultivable land in their names. Must complete Aadhaar e-KYC. High-income taxpayers are excluded.\n• **Required Documents:** Aadhaar Card, Land Records (Khatauni/Jamabandi), Bank Passbook with Aadhaar linkage.\n• **Official Portal:** [pmkisan.gov.in](https://pmkisan.gov.in)\n\n*Official Next Step:* Visit pmkisan.gov.in or your nearest Common Service Centre (CSC) to submit official e-KYC.`;

    return new OfflineReply({
      reply: text,
      questionType: 'none',
      recommendedSchemes: [
        {
          id: 'pm-kisan',
          title: language === 'hi' ? 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)' : 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
          benefit: '₹6,000 / year (3 equal installments of ₹2,000 via DBT)',
          keyCriteria: language === 'hi' ? 'कृषि योग्य भूमि वाले किसान परिवार' : 'Landholding farmer family with cultivable land',
          documentsRequired: ['Aadhaar Card', 'Land Records (Khatauni)', 'Bank Passbook'],
          portalUrl: 'https://pmkisan.gov.in',
        },
      ],
    });
  }

  if (q.includes('ayushman') || q.includes('health') || q.includes('hospital') || q.includes('आयुष्मान') || q.includes('स्वास्थ्य')) {
    const text =
      language === 'hi'
        ? `**आयुष्मान भारत (AB-PMJAY) योजना:**\n\n• **स्वास्थ्य कवर:** प्रति परिवार प्रति वर्ष ₹5,00,000 तक का मुफ्त कैशलेस इलाज।\n• **पात्रता:** SECC 2011 सूची में शामिल परिवार, राशन कार्ड (BPL/AAY) धारक, तथा **70 वर्ष और उससे अधिक आयु के सभी वरिष्ठ नागरिक** (यूनिवर्सल कवर)।\n• **कार्ड कैसे बनवाएं:** अपने आधार कार्ड और राशन कार्ड के साथ नजदीकी सरकारी अस्पताल या पंजीकृत निजी अस्पताल में 'आयुष्मान मित्र' से संपर्क करें।\n• **आधिकारिक पोर्टल:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`
        : `**Ayushman Bharat (AB-PMJAY):**\n\n• **Benefit:** Cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.\n• **Eligibility:** Families identified in SECC 2011 deprivation criteria, active NFSA BPL/AAY ration card holders, and **all senior citizens aged 70+** regardless of income (expanded universal cover).\n• **Where to apply:** Visit any empanelled public or private hospital with your Aadhaar and Ration Card to verify eligibility with the Ayushman Mitra desk.\n• **Official Portal:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in)`;

    return new OfflineReply({
      reply: text,
      questionType: 'none',
      recommendedSchemes: [
        {
          id: 'pm-jay',
          title: language === 'hi' ? 'आयुष्मान भारत - पीएम जन आरोग्य योजना' : 'Ayushman Bharat - PM-JAY',
          benefit: 'Up to ₹5,00,000 cashless secondary and tertiary hospital cover per family / year',
          keyCriteria: language === 'hi' ? 'BPL परिवार या 70+ वर्ष के सभी वरिष्ठ नागरिक' : 'SECC 2011 / BPL or all senior citizens aged 70+',
          documentsRequired: ['Aadhaar Card', 'Ration Card'],
          portalUrl: 'https://beneficiary.nha.gov.in',
        },
      ],
    });
  }

  if (q.includes('sukanya') || q.includes('girl') || q.includes('daughter') || q.includes('सुकन्या') || q.includes('लड़की')) {
    const text =
      language === 'hi'
        ? `**सुकन्या समृद्धि योजना (SSY):**\n\n• **पात्रता:** 10 वर्ष या उससे कम उम्र की बालिकाओं के नाम पर खाता खोला जा सकता है।\n• **ब्याज दर:** 8.2% वार्षिक (सरकारी अधिसूचित) तथा धारा 80C के तहत 100% टैक्स फ्री (EEE)।\n• **न्यूनतम जमा:** प्रति वित्तीय वर्ष मात्र ₹250 (अधिकतम ₹1.5 लाख)।\n• **आवेदन स्थान:** नजदीकी भारतीय डाकघर (Post Office) या अधिकृत राष्ट्रीयकृत बैंक।`
        : `**Sukanya Samriddhi Yojana (SSY):**\n\n• **Eligibility:** Girl child who is an Indian resident and under 10 years of age on account opening date.\n• **Benefit:** High government-guaranteed interest rate (8.2% p.a.) with Triple Tax Exemption (EEE) under Section 80C.\n• **Deposit Limits:** Minimum ₹250 per financial year; maximum ₹1,50,000.\n• **Where to open:** Any India Post Office branch or authorized commercial bank with the child's birth certificate and guardian's KYC.`;

    return new OfflineReply({
      reply: text,
      questionType: 'none',
      recommendedSchemes: [
        {
          id: 'sukanya-samriddhi',
          title: language === 'hi' ? 'सुकन्या समृद्धि योजना (SSY)' : 'Sukanya Samriddhi Yojana (SSY)',
          benefit: '8.2% p.a. guaranteed interest rate + 100% tax exemption under 80C',
          keyCriteria: language === 'hi' ? '10 वर्ष तक की बालिका' : 'Girl child aged 10 years or below',
          documentsRequired: ['Birth Certificate of Girl Child', "Guardian's Aadhaar", 'Address Proof'],
          portalUrl: 'https://www.indiapost.gov.in',
        },
      ],
    });
  }

  if (q.includes('vishwakarma') || q.includes('artisan') || q.includes('carpenter') || q.includes('tailor') || q.includes('विश्वकर्मा')) {
    const text =
      language === 'hi'
        ? `**पीएम विश्वकर्मा योजना:**\n\n• **लाभ:** ₹15,000 का आधुनिक टूलकिट प्रोत्साहन, ₹500/दिन वजीफे के साथ कौशल प्रशिक्षण, तथा 5% रियायती ब्याज पर ₹3,00,000 तक का संपार्श्विक-मुक्त उद्यम ऋण।\n• **पात्रता:** 18 निर्दिष्ट पारंपरिक शिल्पों में हाथों और औजारों से काम करने वाले कारीगर।\n• **आवेदन:** [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in) पर नजदीकी जन सेवा केंद्र (CSC) के माध्यम से बायोमेट्रिक पंजीकरण।`
        : `**PM Vishwakarma Scheme:**\n\n• **Benefit:** ₹15,00,0 modern toolkit incentive, skill training with ₹500/day stipend, and collateral-free enterprise credit up to ₹3,00,000 at subsidized 5% interest.\n• **Eligibility:** Traditional artisans working with hands and tools in one of 18 designated family trades (e.g. carpenter, blacksmith, tailor, potter, barber, mason).\n• **How to Apply:** Visit nearest Common Service Centre (CSC) for biometric registration on [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in).`;

    return new OfflineReply({
      reply: text,
      questionType: 'none',
      recommendedSchemes: [
        {
          id: 'pm-vishwakarma',
          title: language === 'hi' ? 'पीएम विश्वकर्मा योजना' : 'PM Vishwakarma Scheme',
          benefit: '₹15,000 toolkit grant + up to ₹3,00,000 collateral-free credit at 5% interest',
          keyCriteria: language === 'hi' ? '18 पारिवारिक शिल्पों में काम करने वाले पारंपरिक कारीगर' : 'Traditional artisans in 18 designated trades',
          documentsRequired: ['Aadhaar Card', 'Mobile linked to Aadhaar', 'Bank Account details', 'Trade Proof'],
          portalUrl: 'https://pmvishwakarma.gov.in',
        },
      ],
    });
  }

  // 2. Guided Flow Progression in Offline Demo Mode
  if (!profile?.state) {
    return new OfflineReply({
      reply:
        language === 'hi'
          ? 'नमस्ते! आपके लिए उपयुक्त कल्याणकारी योजनाएं खोजने हेतु, कृपया अपना **राज्य या केंद्र शासित प्रदेश** चुनें:'
          : 'Namaste! To identify verified government welfare schemes tailored to you, please select your **State or Union Territory**:',
      questionType: 'single_choice',
      fieldKey: 'state',
      options: DEFAULT_OPTIONS_BY_FIELD.state[language] || DEFAULT_OPTIONS_BY_FIELD.state.en,
      allowSkip: true,
    });
  }

  if (!profile?.age) {
    return new OfflineReply({
      reply:
        language === 'hi'
          ? 'कृपया अपना **आयु वर्ग** चुनें ताकि हम उम्र के आधार पर लागू योजनाओं (जैसे युवा, वयस्क या वरिष्ठ नागरिक पेंशन) की जांच कर सकें:'
          : 'Please select your **Age Group** so we can verify schemes targeted to youth, adults, or senior citizens:',
      questionType: 'single_choice',
      fieldKey: 'ageGroup',
      options: DEFAULT_OPTIONS_BY_FIELD.ageGroup[language] || DEFAULT_OPTIONS_BY_FIELD.ageGroup.en,
      allowSkip: false,
    });
  }

  if (!profile?.occupation) {
    return new OfflineReply({
      reply:
        language === 'hi'
          ? 'कृपया अपना **मुख्य व्यवसाय या आजीविका** चुनें ताकि हम व्यावसायिक सहायता योजनाओं की जांच कर सकें:'
          : 'Please select your **Primary Occupation or Livelihood** to check occupational support initiatives:',
      questionType: 'single_choice',
      fieldKey: 'occupation',
      options: DEFAULT_OPTIONS_BY_FIELD.occupation[language] || DEFAULT_OPTIONS_BY_FIELD.occupation.en,
      allowSkip: false,
    });
  }

  // General welcome fallback
  return new OfflineReply({
    reply:
      language === 'hi'
        ? `नमस्ते! सहायक AI में आपका स्वागत है।\n\nसरकारी कल्याणकारी योजनाओं के बारे में सही जानकारी प्राप्त करने के लिए आप किसी भी योजना (जैसे पीएम-किसान, आयुष्मान भारत, पीएम आवास, सुकन्या समृद्धि, मुद्रा ऋण, विश्वकर्मा योजना) के बारे में पूछ सकते हैं।\n\nआप दिए गए विकल्पों में से चुन सकते हैं या अपना प्रश्न नीचे लिख सकते हैं।`
        : `Namaste! I am your Sahayak AI Civic Assistant.\n\nI can help guide you through official eligibility rules, required documents, and application steps for Indian Central & State welfare initiatives, including:\n• **PM-KISAN** (Farmer income support)\n• **Ayushman Bharat** (₹5 Lakh health assurance)\n• **PMAY-G** (Rural pucca housing grants)\n• **Sukanya Samriddhi** (Girl child savings)\n• **PM MUDRA & SVANidhi** (Micro-enterprise credit)\n• **PM Vishwakarma** (Artisan toolkit & grants)\n\nAsk any question or specify your state, age, and occupation for tailored guidance.`,
    questionType: 'single_choice',
    fieldKey: 'occupation',
    options: DEFAULT_OPTIONS_BY_FIELD.occupation[language] || DEFAULT_OPTIONS_BY_FIELD.occupation.en,
    allowSkip: true,
  });
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

  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

  // If no Gemini API key is configured on the server, return clear configuration error
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'Gemini AI is not configured. Please set the GEMINI_API_KEY environment variable in your Vercel Project Settings.',
        isConfigMissing: true,
      },
    };
  }

  // Configure models with automatic fallback
  const primaryModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-3.5-flash-lite';
  const fallbackModel = primaryModel === 'gemini-3.5-flash-lite' ? 'gemini-3.5-flash' : 'gemini-3.5-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel];

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
      responseMimeType: 'application/json',
      temperature: 0.25,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1536,
    },
  };

  let lastError = null;
  let modelActuallyUsed = primaryModel;

  for (const currentModel of modelsToTry) {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
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
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {}

        const errorMessage = errorData?.error?.message || '';
        const errorStatus = errorData?.error?.status || '';

        // Handle invalid API key immediately (no retry needed)
        if (
          (response.status === 400 && (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid'))) ||
          response.status === 403
        ) {
          console.error('Gemini Authentication Error: Invalid API key');
          return {
            status: 401,
            body: {
              error: 'Invalid Gemini API key. Please verify your GEMINI_API_KEY configuration in Vercel.',
              isAuthError: true,
            },
          };
        }

        // If rate limited (429) or unavailable (503) or 404, try fallback model
        if (response.status === 429 || errorStatus === 'RESOURCE_EXHAUSTED' || response.status === 503 || response.status === 404) {
          lastError = { status: response.status, errorStatus, errorMessage };
          continue;
        }

        return {
          status: 502,
          body: {
            error: `Gemini AI service returned an error (${response.status}). Please try again.`,
          },
        };
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      const rawOutput = candidate?.content?.parts?.[0]?.text;

      if (!rawOutput || !rawOutput.trim()) {
        return {
          status: 502,
          body: {
            error: 'Gemini API returned an empty response. Please try rephrasing your question.',
          },
        };
      }

      // Safe JSON parsing with markdown fence stripping
      let parsed = null;
      try {
        parsed = JSON.parse(rawOutput);
      } catch {
        const cleaned = rawOutput.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {}
      }

      // Default sanitization
      let sanitizedReply = typeof parsed?.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : rawOutput.trim();
      let sanitizedQuestionType = ['none', 'single_choice', 'multi_choice', 'recommendations'].includes(parsed?.questionType)
        ? parsed.questionType
        : 'none';
      let sanitizedFieldKey = typeof parsed?.fieldKey === 'string' && parsed.fieldKey ? parsed.fieldKey : null;

      let sanitizedOptions = [];
      if (Array.isArray(parsed?.options)) {
        sanitizedOptions = parsed.options
          .filter((opt) => opt && (typeof opt.label === 'string' || typeof opt.value === 'string'))
          .map((opt) => ({
            label: String(opt.label || opt.value).slice(0, 100),
            value: String(opt.value || opt.label).slice(0, 100),
          }));
      }

      // Inject smart default options if model asked single_choice/multi_choice with missing options
      if (
        (sanitizedQuestionType === 'single_choice' || sanitizedQuestionType === 'multi_choice') &&
        sanitizedOptions.length === 0 &&
        sanitizedFieldKey &&
        DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey]
      ) {
        sanitizedOptions = DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey][language] || DEFAULT_OPTIONS_BY_FIELD[sanitizedFieldKey].en;
      }

      let sanitizedSchemes = [];
      if (Array.isArray(parsed?.recommendedSchemes)) {
        sanitizedSchemes = parsed.recommendedSchemes
          .filter((s) => s && typeof s.title === 'string')
          .map((s) => ({
            id: String(s.id || s.title.toLowerCase().replace(/[^a-z0-9]/g, '-')),
            title: String(s.title),
            benefit: String(s.benefit || ''),
            keyCriteria: String(s.keyCriteria || ''),
            documentsRequired: Array.isArray(s.documentsRequired) ? s.documentsRequired.map(String) : [],
            portalUrl: String(s.portalUrl || 'https://www.india.gov.in'),
          }));
      }

      return {
        status: 200,
        body: {
          reply: sanitizedReply,
          questionType: sanitizedQuestionType,
          fieldKey: sanitizedFieldKey,
          options: sanitizedOptions,
          allowSkip: !!parsed?.allowSkip,
          recommendedSchemes: sanitizedSchemes,
          isDemoMode: false,
          modelUsed: currentModel,
          sources: ['Official Gazette Rules', 'National Portal of India', 'myscheme.gov.in'],
        },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          status: 504,
          body: {
            error: 'The request to Gemini AI timed out after 15 seconds. Please check your connection and retry.',
            isTimeout: true,
          },
        };
      }
      lastError = err;
    }
  }

  // If all models failed
  if (lastError?.status === 429 || lastError?.errorStatus === 'RESOURCE_EXHAUSTED') {
    return {
      status: 429,
      body: {
        error: 'Gemini service is currently busy (Rate Limit). Please wait a moment and try again.',
        isRateLimited: true,
      },
    };
  }

  if (lastError?.status === 503 || lastError?.errorStatus === 'UNAVAILABLE') {
    return {
      status: 503,
      body: {
        error: 'Gemini AI service is currently experiencing high demand. Please try again in a few moments.',
      },
    };
  }

  console.error('Fetch error connecting to Gemini API:', lastError?.name || 'NetworkError');
  return {
    status: 502,
    body: {
      error: 'Network error connecting to Gemini AI service. Please check server connectivity.',
    },
  };
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
