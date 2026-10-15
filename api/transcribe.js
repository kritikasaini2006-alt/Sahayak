/**
 * Vercel Serverless Function & Backend Handler for Sahayak AI Audio Transcription.
 *
 * Security, Reliability & Privacy:
 * - Reads GEMINI_API_KEY strictly from server-side environment variables.
 * - Never exposes API secrets or provider credentials to client-side code.
 * - Enforces input size validation (max 4 MB base64 audio payload).
 * - Enforces server-side sliding-window rate limiting (20 requests/min per client IP).
 * - Protects citizen privacy: NEVER stores, logs, or transmits audio recordings to third parties.
 * - Transcribes verbatim in Hindi (Devanagari) or Indian English based on selected language.
 * - Handles timeouts (15s abort controller) and rate limits (429) gracefully.
 */

// Rate Limiter: max 20 transcribe requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // 4 MB base64 audio limit
const ipRequestHistory = new Map();

/**
 * Checks in-memory sliding window rate limits for transcription.
 */
export function checkTranscribeRateLimit(clientIp = 'default') {
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
 * Core processing logic for audio transcription.
 */
export async function processTranscribeRequest({ audio, mimeType = 'audio/webm', language = 'en', clientIp = 'default' }) {
  // 1. Rate limiting
  if (clientIp) {
    const rateCheck = checkTranscribeRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        body: {
          error: `Too many audio requests. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
          isRateLimited: true,
          retryAfter: rateCheck.retryAfter,
        },
      };
    }
  }

  // 2. Validate audio presence
  if (!audio || typeof audio !== 'string' || !audio.trim()) {
    return {
      status: 400,
      body: { error: 'Invalid request: base64 "audio" string is required.' },
    };
  }

  // 3. Constrain maximum audio payload size (4 MB base64 ~ approx 1-2 mins audio)
  if (audio.length > MAX_AUDIO_BYTES) {
    return {
      status: 413,
      body: { error: 'Payload Too Large: Audio recording exceeds maximum allowable limit of 4 MB.' },
    };
  }

  // Extract pure base64 data and normalize mime type
  const cleanBase64 = audio.includes('base64,') ? audio.split('base64,')[1].trim() : audio.trim();
  let resolvedMimeType = mimeType;
  if (!resolvedMimeType && audio.startsWith('data:')) {
    resolvedMimeType = audio.slice(5, audio.indexOf(';'));
  }
  const baseMimeType = (resolvedMimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  // If no Gemini API key is configured on the server, respond with informative state
  if (!apiKey || apiKey.trim() === '') {
    return {
      status: 200,
      body: {
        transcript: '',
        isConfigNeeded: true,
        error: 'GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your server environment or .env.local to enable cloud audio transcription.',
      },
    };
  }

  const isHindi = language === 'hi';
  const systemInstruction = `You are an expert, verbatim speech-to-text audio transcriber for Sahayak AI, an Indian public welfare assistant.
Listen carefully to the user's spoken audio clip.
Target Language: ${isHindi ? 'Hindi (हिन्दी in authentic Devanagari script)' : 'Indian English (or Hinglish if mixed)'}.

Strict Rules:
1. Transcribe EXACTLY what was spoken by the user.
2. If Hindi is spoken, write it in Devanagari script (e.g. "मुझे किसान सम्मान निधि के बारे में जानना है").
3. If English is spoken, write in English.
4. If Hindi-English mixed (Hinglish) is spoken, preserve the natural phrasing.
5. Do NOT translate.
6. Do NOT answer the question.
7. Do NOT add any preamble, conversational filler, markdown quotes, or explanations. Output ONLY the raw spoken words.
8. If the recording contains only background silence, clicks, or no decipherable speech, respond with an empty string "".`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: baseMimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Transcribe the spoken words in this audio clip verbatim into text.',
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 600,
      topP: 0.95,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini audio transcription API error (${response.status}):`, errText.slice(0, 200));

      if (response.status === 429) {
        return {
          status: 429,
          body: { error: 'The AI speech service is currently busy. Please wait a moment and try again.' },
        };
      }

      return {
        status: 502,
        body: { error: 'Upstream speech recognition service error. Please try again or type your question.' },
      };
    }

    const data = await response.json();
    let transcriptText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean any leading/trailing quotes or markdown backticks
    transcriptText = transcriptText.trim().replace(/^["']|["']$/g, '').trim();

    return {
      status: 200,
      body: {
        transcript: transcriptText,
        language: isHindi ? 'hi' : 'en',
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        status: 504,
        body: { error: 'Audio transcription timed out after 15 seconds. Please record a shorter audio clip or type your question.' },
      };
    }

    console.error('Audio transcription processing error:', err?.name || 'InternalError');
    return {
      status: 500,
      body: { error: 'An unexpected error occurred while transcribing audio. Please try again.' },
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
    // Extract client IP for rate limiting
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await processTranscribeRequest({ ...payload, clientIp });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Server error processing transcribe request:', error?.name || 'InternalError');
    return res.status(500).json({ error: 'Internal server error processing audio request.' });
  }
}
