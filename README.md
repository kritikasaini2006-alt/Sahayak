# Sahayak AI (सहायक AI)

> **Next-Generation Civic-Tech Welfare Assistant for Indian Citizens**

Sahayak AI is an independent civic-tech platform designed to simplify, clarify, and democratize access to Central and State government welfare schemes. Millions of eligible households miss out on vital benefits due to fragmented portals, bureaucratic jargon, or reliance on unauthorized intermediaries. Sahayak AI bridges this gap with structured eligibility screening, document checklists, and conversational guidance.

---

## ⚠️ Important Disclaimer & Non-Affiliation Notice

**Sahayak AI is an independent civic technology initiative.**  
- Sahayak AI is **NOT** affiliated with, authorized by, or endorsed by the Government of India, any state government, or any statutory authority.
- All welfare scheme criteria, financial benefits, and documentation checklists displayed on this platform are curated from publicly accessible official sources (e.g., [india.gov.in](https://www.india.gov.in), [myscheme.gov.in](https://www.myscheme.gov.in), and respective ministry portals).
- Sahayak AI does **NOT** process official government applications or collect fees. Citizens are directed to authenticated official government portals and authorized Common Service Centres (CSCs) for official submissions.

---

## 🛠 Tech Stack

- **Framework**: React 18 + Vite (JavaScript)
- **Styling**: Tailwind CSS with custom civic color palette (Navy Blue `#1b365d` & Teal/Emerald `#0d9488`)
- **Icons**: Lucide React
- **Routing**: React Router DOM (v6)
- **Typography**: Inter / System UI

---

## 📁 Project Structure

```text
sahayak/
├── index.html                  # HTML entry point with metadata and Inter font
├── package.json                # Project dependencies and scripts
├── postcss.config.js           # PostCSS configuration for Tailwind
├── tailwind.config.js          # Custom civic navy/teal color theme & shadows
├── vite.config.js              # Vite configuration
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Routing configuration for all 6 pages
    ├── index.css               # Global Tailwind directives and custom scrollbars
    ├── assets/                 # Static media and assets
    ├── components/
    │   ├── common/
    │   │   ├── Badge.jsx             # Reusable status and category pill badge
    │   │   ├── Button.jsx            # Standardized accessible civic button
    │   │   ├── DisclaimerBanner.jsx  # Prominent non-affiliation transparency banner
    │   │   ├── Footer.jsx            # Trust footer with official portal directory
    │   │   ├── Navbar.jsx            # Responsive header with mobile navigation
    │   │   └── SchemeCard.jsx        # Scheme card with eligibility & document details
    │   └── layout/
    │       └── AppLayout.jsx         # Shared layout shell (Banner + Nav + Outlet + Footer)
    ├── data/
    │   └── mockSchemes.js            # Curated public domain welfare schemes dataset
    ├── pages/
    │   ├── HomePage.jsx              # Hero, search, 4-step workflow, high-impact schemes
    │   ├── DiscoverSchemesPage.jsx   # Directory with category filters and search
    │   ├── CheckEligibilityPage.jsx  # Multi-step demographic & livelihood screener
    │   ├── AIAssistantPage.jsx       # Conversational AI assistant interface (demo)
    │   ├── MyApplicationsPage.jsx    # Saved schemes and document readiness tracker
    │   ├── AboutPage.jsx             # Project mission, principles, and FAQs
    │   └── NotFoundPage.jsx          # Accessible 404 error page
    └── utils/
        └── cn.js                     # Classnames & Tailwind merge utility
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000` (or `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```

---

## 📱 Pages Implemented

1. **Home (`/`)**: Civic-tech hero, fast search bar, core pillars, 4-step guidance model, featured central schemes, and AI consultation CTA.
2. **Discover Schemes (`/schemes`)**: Searchable catalog with category filtering across agriculture, healthcare, housing, pensions, and micro-loans.
3. **Check Eligibility (`/eligibility`)**: 3-step preliminary questionnaire matching user demographics to eligible public schemes.
4. **AI Assistant (`/assistant`)**: Clean civic chat interface with suggested prompts and responses referencing verified official `.gov.in` portals.
5. **My Applications (`/applications`)**: Local browser workspace with saved schemes and an essential document readiness checklist.
6. **About (`/about`)**: Civic-tech mission statement, strict non-affiliation disclaimer, and transparency FAQs.

