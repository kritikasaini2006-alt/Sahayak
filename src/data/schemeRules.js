/**
 * Scheme Eligibility Rule Specifications.
 *
 * Source: Officially published scheme guidelines (Central & State Ministries).
 * Rules are stored separately from UI presentation code.
 *
 * Each scheme specifies:
 * - id: matches mockSchemes.js id
 * - title: official scheme title
 * - verified: boolean flag indicating if rule criteria are backed by official gazettes
 * - rulesConfidence: 'official_guidelines' | 'curated_estimate'
 * - evaluator: declarative rule evaluation logic
 */

export const SCHEME_RULES = [
  {
    schemeId: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'PM-KISAN Operational Guidelines, Ministry of Agriculture & Farmers Welfare',
    officialPortal: 'https://pmkisan.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check
      if (profile.age && profile.age < 18) {
        unmet.push('Applicant must be at least 18 years old to hold registered land rights.');
      } else if (profile.age) {
        reasons.push('Age requirement met (18+ years).');
      }

      // Occupation check
      if (profile.occupation === 'farmer') {
        reasons.push('Primary occupation is agricultural farming.');
        if (profile.farmerLandholding === 'small_marginal') {
          reasons.push('Landholding falls within small and marginal farmers priority category (<= 2 hectares).');
        } else if (profile.farmerLandholding === 'landless_tenant') {
          missing.push('Tenant and landless farmers require state-specific revenue registry validation.');
        } else if (!profile.farmerLandholding) {
          missing.push('Land records (Khatauni/Jamabandi) ownership status needs confirmation.');
        }
      } else {
        unmet.push('Scheme is exclusively for landholding farmer families.');
      }

      // Exclusion criteria (institutional landholders, high taxpayers)
      if (profile.annualIncome && profile.annualIncome > 1000000) {
        unmet.push('Income tax payees are excluded under statutory PM-KISAN exclusion criteria.');
      } else if (profile.annualIncome) {
        reasons.push('Household income is within non-taxpayer threshold.');
      }

      // Status determination
      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = missing.length > 0 ? 'possibly_eligible' : 'likely_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pm-jay',
    title: 'Ayushman Bharat - PM Jan Arogya Yojana (AB-PMJAY)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'NHA AB-PMJAY Beneficiary Guidelines & Senior Citizen (70+) Cabinet Expansion',
    officialPortal: 'https://pmjay.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      const isSenior70Plus = profile.age && profile.age >= 70;
      const isBplOrAay = profile.rationCard === 'bpl' || profile.rationCard === 'aay';
      const isLowIncome = profile.annualIncome && profile.annualIncome <= 250000;

      // 70+ Senior Citizen automatic coverage (Universal regardless of income)
      if (isSenior70Plus) {
        reasons.push('Senior citizens aged 70 and above receive universal health cover under the expanded Ayushman Bharat framework.');
        return {
          status: 'likely_eligible',
          reasons,
          unmet: [],
          missing: ['Requires biometric e-KYC verification at empanelled hospital or Ayushman portal.'],
        };
      }

      // Age criteria for non-70+
      if (profile.age) {
        reasons.push(`Applicant age is ${profile.age} years.`);
      }

      // Socio-economic criteria
      if (isBplOrAay) {
        reasons.push('Holds Priority Household (BPL) or Antyodaya (AAY) ration card under NFSA.');
      } else if (profile.rationCard === 'apl') {
        unmet.push('Above Poverty Line (APL) general households are not automatically covered under central SECC criteria.');
      } else {
        missing.push('Ration card / SECC 2011 deprivation status is not provided.');
      }

      if (isLowIncome) {
        reasons.push('Annual household income meets standard vulnerability benchmarks (<= ₹2,50,000).');
      } else if (profile.annualIncome && profile.annualIncome > 600000 && !isSenior70Plus) {
        unmet.push('Higher household income generally excludes non-senior families from public insurance subsidies.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = isBplOrAay ? 'likely_eligible' : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pmay-g',
    title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'PMAY-G Scheme Guidelines, Ministry of Rural Development',
    officialPortal: 'https://pmayg.nic.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Habitation check
      if (profile.areaType === 'rural') {
        reasons.push('Applicant resides in a designated rural area.');
      } else if (profile.areaType === 'urban') {
        unmet.push('PMAY-G is specifically for rural gram panchayats (Urban applicants should apply under PMAY-Urban).');
      }

      // Age check
      if (profile.age && profile.age < 18) {
        unmet.push('Head of household must be an adult (18+ years).');
      }

      // Housing condition check
      if (profile.housingType === 'kutcha' || profile.housingType === 'homeless') {
        reasons.push('Current shelter is kutcha / dilapidated or household is homeless.');
      } else if (profile.housingType === 'pucca') {
        unmet.push('Families owning a pucca house anywhere in India are ineligible.');
      } else {
        missing.push('Verification of existing house structure (kutcha vs pucca) is required.');
      }

      // Income / Deprivation check
      if (profile.annualIncome && profile.annualIncome <= 200000) {
        reasons.push('Household income is within rural housing assistance bounds.');
      } else if (profile.annualIncome && profile.annualIncome > 400000) {
        unmet.push('Annual household income exceeds rural deprivation threshold.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        if (profile.housingType === 'kutcha' || profile.housingType === 'homeless') {
          status = 'likely_eligible';
        } else {
          status = 'possibly_eligible';
        }
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'sukanya-samriddhi',
    title: 'Sukanya Samriddhi Yojana (SSY)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'Government Savings Promotion Act & National Savings Institute (Ministry of Finance)',
    officialPortal: 'https://www.indiapost.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Either the applicant is a girl child <= 10 or has a girl child in the household
      const isGirlChildApplicant = profile.gender === 'female' && profile.age && profile.age <= 10;
      const hasGirlChildInFamily = profile.hasGirlChildUnder10 === 'yes';

      if (isGirlChildApplicant) {
        reasons.push('Applicant is a girl child under 10 years of age.');
      } else if (hasGirlChildInFamily) {
        reasons.push('Household includes a girl child under 10 years of age.');
      } else if (profile.hasGirlChildUnder10 === 'no') {
        unmet.push('Scheme strictly requires a girl child under 10 years of age.');
      } else {
        missing.push('Whether the family includes a girl child under 10 years is not specified.');
      }

      // SSY has no income ceiling
      reasons.push('No income limit (available across all income strata with government-notified tax-free interest).');

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = (isGirlChildApplicant || hasGirlChildInFamily) ? 'likely_eligible' : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pm-mudra',
    title: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'MUDRA Scheme Guidelines, Department of Financial Services',
    officialPortal: 'https://www.mudra.org.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check
      if (profile.age && profile.age < 18) {
        unmet.push('Applicant must be at least 18 years old to avail institutional credit.');
      } else if (profile.age) {
        reasons.push('Age requirement met (18+ years).');
      }

      // Occupation check
      const validOccupations = ['micro_business', 'artisan', 'daily_wage', 'farmer', 'salaried'];
      if (profile.occupation === 'micro_business' || profile.occupation === 'artisan') {
        reasons.push('Engaged in micro-enterprise, artisanal manufacturing, or small commerce.');
      } else if (profile.occupation === 'salaried' && profile.annualIncome > 1200000) {
        unmet.push('High-income corporate salaried employees are not the intended beneficiaries of micro-enterprise credit.');
      } else {
        missing.push('Detailed non-farm business plan or existing commercial unit details required.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = (profile.occupation === 'micro_business' || profile.occupation === 'artisan')
          ? 'likely_eligible'
          : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pm-vishwakarma',
    title: 'PM Vishwakarma Scheme',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'Ministry of MSME Central Sector Scheme Guidelines for PM Vishwakarma',
    officialPortal: 'https://pmvishwakarma.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check
      if (profile.age && profile.age < 18) {
        unmet.push('Applicant must be at least 18 years of age on registration date.');
      } else if (profile.age) {
        reasons.push('Age requirement met (18+ years).');
      }

      // Occupation check
      if (profile.occupation === 'artisan') {
        reasons.push('Primary occupation is recognized traditional artisan/craftsperson.');
        if (profile.artisanTrade) {
          reasons.push(`Trade identified: ${profile.artisanTrade}.`);
        } else {
          missing.push('Specific traditional trade (among 18 eligible trades) must be selected during biometric registration.');
        }
      } else {
        unmet.push('Scheme is exclusively for traditional artisans & craftspeople working with hands and tools.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = profile.occupation === 'artisan' ? 'likely_eligible' : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'nsap-oaps',
    title: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'NSAP Guidelines, Ministry of Rural Development',
    officialPortal: 'https://nsap.nic.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check (strictly 60+)
      if (profile.age && profile.age >= 60) {
        reasons.push(`Age criterion satisfied (${profile.age} years; minimum 60 years required).`);
      } else if (profile.age) {
        unmet.push(`Applicant is ${profile.age} years old. Minimum qualifying age is 60 years.`);
      }

      // Poverty Line / BPL check
      if (profile.rationCard === 'bpl' || profile.rationCard === 'aay') {
        reasons.push('Household is documented under BPL/AAY poverty category.');
      } else if (profile.annualIncome && profile.annualIncome <= 100000) {
        reasons.push('Annual income is within state Below Poverty Line benchmarks.');
      } else if (profile.annualIncome && profile.annualIncome > 200000) {
        unmet.push('Income exceeds Below Poverty Line (BPL) guidelines.');
      } else {
        missing.push('BPL certificate or local revenue authority income verification required.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = (profile.age >= 60 && (profile.rationCard === 'bpl' || profile.rationCard === 'aay' || profile.annualIncome <= 100000))
          ? 'likely_eligible'
          : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pmuy',
    title: 'Pradhan Mantri Ujjwala Yojana (PMUY 2.0)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'PMUY 2.0 Guidelines, Ministry of Petroleum and Natural Gas',
    officialPortal: 'https://pmuy.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Gender check (adult woman head of household)
      if (profile.gender === 'female' && profile.age && profile.age >= 18) {
        reasons.push('Applicant is an adult woman (18+ years).');
      } else if (profile.gender && profile.gender !== 'female') {
        unmet.push('PMUY deposit-free LPG connections are released exclusively in the name of adult women of the household.');
      } else if (!profile.gender) {
        missing.push('Gender of the primary applicant must be female for PMUY.');
      }

      // Socio-economic category
      const isDeprivedCategory =
        profile.socialCategory === 'sc' ||
        profile.socialCategory === 'st' ||
        profile.rationCard === 'aay' ||
        profile.rationCard === 'bpl';

      if (isDeprivedCategory) {
        reasons.push('Belongs to identified priority beneficiary category (SC/ST/BPL/AAY).');
      } else if (profile.annualIncome && profile.annualIncome <= 180000) {
        reasons.push('Income aligns with underprivileged household criteria.');
      } else if (profile.annualIncome && profile.annualIncome > 350000) {
        unmet.push('Income exceeds underprivileged household guidelines.');
      } else {
        missing.push('Declaration regarding lack of existing LPG connection in the family is required.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = (profile.gender === 'female' && profile.age >= 18 && (isDeprivedCategory || profile.annualIncome <= 180000))
          ? 'likely_eligible'
          : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pm-svanidhi',
    title: 'PM Street Vendor\'s AtmaNirbhar Nidhi (PM SVANidhi)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'MoHUA Scheme Guidelines for PM SVANidhi (Micro-credit for Urban Street Vendors)',
    officialPortal: 'https://pmsvanidhi.mohua.gov.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check
      if (profile.age && profile.age < 18) {
        unmet.push('Applicant must be at least 18 years old to take commercial micro-credit.');
      } else if (profile.age) {
        reasons.push('Age requirement met (18+ years).');
      }

      // Occupation check
      const isVendorOrMicro =
        profile.occupation === 'micro_business' ||
        profile.occupation === 'daily_wage';

      if (isVendorOrMicro) {
        reasons.push('Applicant livelihood aligns with urban micro-commerce / street vending.');
      } else {
        unmet.push('PM SVANidhi is strictly intended for street vendors, hawkers, and thela-walas.');
      }

      // Urban area check
      if (profile.areaType === 'urban') {
        reasons.push('Resides in urban or peri-urban municipality.');
      } else if (profile.areaType === 'rural') {
        missing.push('Vendors from rural outskirts must possess a Letter of Recommendation (LoR) from the nearest Urban Local Body.');
      }

      missing.push('Requires Certificate of Vending or Urban Local Body (ULB) recommendation.');

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = isVendorOrMicro && profile.areaType === 'urban' ? 'likely_eligible' : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
  {
    schemeId: 'pm-kmy',
    title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    verified: true,
    rulesConfidence: 'official_guidelines',
    sourceDocument: 'Department of Agriculture & Farmers Welfare PM-KMY Guidelines',
    officialPortal: 'https://maandhan.in',
    evaluate: (profile) => {
      const reasons = [];
      const unmet = [];
      const missing = [];

      // Age check (Entry age strictly 18-40)
      if (profile.age && profile.age >= 18 && profile.age <= 40) {
        reasons.push(`Entry age (${profile.age} years) is within the eligible contributory bracket (18-40 years).`);
      } else if (profile.age && profile.age > 40) {
        unmet.push(`Entry age is capped at 40 years. Applicant is ${profile.age} years old.`);
      } else if (profile.age && profile.age < 18) {
        unmet.push('Minimum entry age is 18 years.');
      }

      // Occupation check
      if (profile.occupation === 'farmer') {
        reasons.push('Primary occupation is farming.');
        if (profile.farmerLandholding === 'small_marginal') {
          reasons.push('Meets small and marginal farmer landholding limit (up to 2 hectares).');
        } else if (profile.farmerLandholding === 'large') {
          unmet.push('Farmers with landholding above 2 hectares are excluded from PM-KMY.');
        } else {
          missing.push('Land record verification needed for small/marginal criteria (<= 2 hectares).');
        }
      } else {
        unmet.push('Exclusively for small and marginal farmers.');
      }

      let status = 'not_eligible';
      if (unmet.length === 0) {
        status = (profile.occupation === 'farmer' && profile.age >= 18 && profile.age <= 40 && profile.farmerLandholding === 'small_marginal')
          ? 'likely_eligible'
          : 'possibly_eligible';
      }

      return {
        status,
        reasons,
        unmet,
        missing,
      };
    },
  },
];

