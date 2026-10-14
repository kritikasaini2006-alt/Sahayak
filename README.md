# Sahayak AI (सहायक AI)

> **Civic-Tech Welfare Schemes Discovery & Application Guidance Platform for Indian Citizens**

Sahayak AI is an independent, prototype civic technology platform designed to simplify, clarify, and democratize access to Indian Central and State government welfare schemes. Millions of eligible households miss out on vital benefits due to fragmented portals, bureaucratic jargon, or reliance on unauthorized intermediaries. Sahayak AI bridges this gap with structured eligibility screening, verified document preparation checklists, conversational AI guidance, and a user-managed application tracker.

---

## ⚠️ Important Disclaimer & Non-Affiliation Notice

**Sahayak AI is an independent civic technology prototype.**
- Sahayak AI is **NOT** affiliated with, authorized by, sponsored by, or endorsed by the Government of India, any state government, or any statutory authority.
- All welfare scheme criteria, financial benefits, document checklists, and application steps are curated strictly from publicly published official sources (e.g. [india.gov.in](https://www.india.gov.in), [myscheme.gov.in](https://www.myscheme.gov.in), and respective ministry portals).
- Sahayak AI does **NOT** process official government applications, collect official fees, or claim to submit or approve applications on behalf of citizens.
- Citizens are directed to authenticated official `.gov.in` portals and authorized Common Service Centres (CSCs) for official registrations and biometrics.
- **No official security certifications (e.g., STQC, ISO 27001, CERT-In) or government authorizations are claimed or implied.**

---

## 🛡️ Security & Data Privacy Principles

1. **Zero Collection of Sensitive Credentials:**
   - Sahayak AI **NEVER** requests, collects, or stores Aadhaar numbers, bank account numbers, UPI PINs, passwords, OTPs, or biometric details.
   - Sahayak AI does **NOT** request or store citizen document images or identity files.
2. **Server-Side AI API Secrets:**
   - Gemini API keys (`GEMINI_API_KEY`) are read strictly on the server side via environment variables.
   - No API secrets or provider credentials are ever bundled into client-side JavaScript or committed to Git (`.gitignore` protects `.env` files).
3. **Privacy-Preserving Logs:**
   - The backend server does **NOT** log citizen prompts, personal identifiers, document details, or full profiles.
   - Logs record only high-level HTTP status codes and error categories.
4. **Local-First Workspace Storage:**
   - Saved schemes, personal preparation notes, reminder dates, and document checklist ticks are stored locally on your device via browser `localStorage`.
   - Workspace data can be exported as JSON or cleared at any time with one click.
5. **Rate Limiting & Request Constraining:**
   - Serverless endpoints enforce request size constraints (prompts capped at 2,000 characters; request bodies capped at 32 KB).
   - In-memory rate limiting prevents abuse (maximum 30 requests per minute per IP address).

---

## 🛠️ Architecture & Tech Stack

```text
                                  ┌────────────────────────┐
                                  │   Browser Frontend     │
                                  │  (React 18 + Vite SPA) │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │  Client Data Layer      │                     │  Serverless API / Dev   │
         │  (applicationStorage)   │                     │  (/api/chat.js)         │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │   Local Browser State   │                     │  Google Gemini 1.5      │
         │ (localStorage / JSON)   │                     │  or Offline Demo Mode   │
         └─────────────────────────┘                     └─────────────────────────┘
```

- **Frontend**: React 18 with Vite, JavaScript (ESM)
- **Styling**: Tailwind CSS with custom civic color scheme (Deep Navy `#1b365d` & Teal/Emerald `#0d9488`)
- **Icons**: Lucide React
- **Routing**: React Router DOM (v6)
- **Speech APIs**: Browser-native SpeechRecognition (STT) and SpeechSynthesis (TTS)
- **Serverless API**: Vercel-compatible Node.js endpoint with Vite development middleware

---

## 📁 Repository Structure

```text
sahayak/
├── api/
│   └── chat.js                   # Vercel serverless function (Gemini API + Rate Limiter + Offline Fallback)
├── scripts/
│   ├── run-all-tests.mjs         # Master automated test runner (runs all 4 suites)
│   ├── test-eligibility.mjs      # Unit tests for eligibility engine & rule logic
│   ├── test-guidance.mjs         # Unit tests for document checklists & privacy rules
│   ├── test-applications.mjs     # Unit tests for applicationStorage data layer & JSON export
│   └── test-chat.mjs             # Integration tests for /api/chat, rate limiting & demo mode
├── src/
│   ├── components/
│   │   ├── applications/         # Application Dashboard, Saved Schemes List, Record Modal
│   │   ├── common/               # Badge, Button, SchemeCard, Navbar, Footer, DisclaimerBanner
│   │   ├── eligibility/          # Multi-step screener steps, stepper, results cards
│   │   ├── guidance/             # SchemeGuidanceView (document checklist, step walkthrough)
│   │   ├── layout/               # AppLayout container
│   │   └── schemes/              # SchemeFilterSidebar, SchemeDetailModal
│   ├── data/
│   │   ├── mockSchemes.js        # 10 curated verified public welfare schemes
│   │   ├── sampleProfiles.js     # Fictional citizen testing profiles
│   │   ├── schemeGuidance.js     # Verified documents, prerequisites, and instructions
│   │   ├── schemeRules.js        # Declarative statutory eligibility evaluation rules
│   │   ├── statesAndDistricts.js # 36 States/UTs and livelihood occupation taxonomy
│   │   └── translations.js       # Extensible multilingual strings (English & Hindi)
│   ├── pages/
│   │   ├── HomePage.jsx              # Landing page with search, workflows, and highlights
│   │   ├── DiscoverSchemesPage.jsx   # Searchable catalog with multi-dimensional filters
│   │   ├── CheckEligibilityPage.jsx  # Multi-step citizen eligibility screener
│   │   ├── AIAssistantPage.jsx       # Gemini chat interface with STT/TTS & Offline Demo
│   │   ├── MyApplicationsPage.jsx    # Applications dashboard, saved schemes & document wallet
│   │   ├── AboutPage.jsx             # Mission, FAQs, and transparency declarations
│   │   └── NotFoundPage.jsx          # Accessible 404 page
│   └── utils/
│       ├── applicationStorage.js     # Data layer for saved schemes, applications, and JSON export
│       ├── eligibilityEngine.js      # Rules evaluation engine & profile sanitization
│       └── cn.js                     # Tailwind class merge utility
├── .env.example                  # Environment variables template
├── package.json                  # Scripts and dependencies
├── tailwind.config.js            # Tailwind theme tokens
└── vite.config.js                # Vite build config & local dev API middleware
```

---

## 🔑 Environment Variables

To configure the server-side Gemini integration:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the required variables in `.env.local`:
   ```env
   # Google Gemini API Key (Server-side ONLY; never expose as VITE_*)
   # Obtain from Google AI Studio: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_actual_api_key_here

   # Gemini Model Identifier (Default: gemini-1.5-flash)
   GEMINI_MODEL=gemini-1.5-flash
   ```

> **Note:** If `GEMINI_API_KEY` is omitted, Sahayak AI automatically operates in a clearly labeled **Offline Demo Mode**, answering queries using the verified catalog rules without breaking.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended; tested on v20+)
- npm (v9+)

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 4. Run Automated Tests
```bash
npm test
```
Executes all 4 unit and integration test suites:
- `scripts/test-eligibility.mjs` (7 tests)
- `scripts/test-guidance.mjs` (5 tests)
- `scripts/test-applications.mjs` (5 tests)
- `scripts/test-chat.mjs` (7 tests)

### 5. Production Build
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

---

## 🌐 Deployment Instructions (Vercel)

Sahayak AI is configured for seamless zero-config deployment on [Vercel](https://vercel.com) using the included `vercel.json`:

### Option A: Manual Deployment via Vercel CLI
1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. Link project and deploy:
   ```bash
   vercel
   ```
3. Set production environment variables when prompted or via the dashboard:
   ```bash
   vercel env add GEMINI_API_KEY production
   vercel env add GEMINI_MODEL production
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Git-Connected Deployment via Vercel Dashboard
1. **Connect Repository:** Link this Git repository to a new Vercel project in the [Vercel Dashboard](https://vercel.com/new).
2. **Framework Preset:** Vite (detected automatically via `vercel.json`).
3. **Build & Output Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   - In Vercel Project Settings -> **Environment Variables**, add:
     - `GEMINI_API_KEY`: Your Google AI Studio API key (kept secure and server-side only).
     - `GEMINI_MODEL`: `gemini-1.5-flash` (or preferred model).
5. **Direct Route Handling & API:**
   - `vercel.json` automatically configures SPA fallback (`/(.*)` -> `/index.html`) so refreshing routes like `/schemes` or `/applications` works without 404 errors.
   - Serverless endpoint `/api/chat` is automatically routed with strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, etc.).

---

## ⚠️ Known Limitations

1. **Self-Reported Eligibility:** Eligibility evaluations are algorithmic estimates based on public scheme rules. Formal statutory eligibility is subject to physical verification by revenue authorities and administrative scrutiny.
2. **State Specificity:** Several Central Sector and Centrally Sponsored schemes vary in implementation or matching grants across states. State-specific variations are noted in scheme guidance cards.
3. **Local Storage Bound:** For prototype simplicity, saved schemes and user notes reside in the user's browser `localStorage`. Switching browsers or clearing cache deletes local data unless exported beforehand via the **Export JSON** feature.
4. **Browser Speech Support:** Speech-to-Text (STT) requires browser Web Speech API support (`SpeechRecognition` or `webkitSpeechRecognition`), typically available in Chrome, Edge, and Safari.
