import { SCHEME_RULES } from '../data/schemeRules.js';
import { MOCK_SCHEMES } from '../data/mockSchemes.js';
import { getScopedKey } from './userStorage.js';

export const PROFILE_STORAGE_KEY = 'sahayak_citizen_profile';

/**
 * Sanitizes profile to ensure only necessary non-sensitive fields are stored.
 */
export function sanitizeProfileForStorage(profile) {
  if (!profile || typeof profile !== 'object') return {};

  return {
    age: profile.age ? Number(profile.age) : '',
    gender: profile.gender || '',
    state: profile.state || '',
    areaType: profile.areaType || '',
    occupation: profile.occupation || '',
    artisanTrade: profile.artisanTrade || '',
    farmerLandholding: profile.farmerLandholding || '',
    annualIncome: profile.annualIncome !== '' && profile.annualIncome !== undefined ? Number(profile.annualIncome) : '',
    socialCategory: profile.socialCategory || '',
    rationCard: profile.rationCard || '',
    housingType: profile.housingType || '',
    hasGirlChildUnder10: profile.hasGirlChildUnder10 || '',
    hasDisability: profile.hasDisability || '',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Saves profile to localStorage.
 */
export function saveCitizenProfile(profile) {
  try {
    const clean = sanitizeProfileForStorage(profile);
    localStorage.setItem(getScopedKey(PROFILE_STORAGE_KEY), JSON.stringify(clean));
    return clean;
  } catch (error) {
    console.error('Failed to save citizen profile to localStorage:', error);
    return null;
  }
}

/**
 * Loads citizen profile from localStorage.
 */
export function loadCitizenProfile() {
  try {
    const raw = localStorage.getItem(getScopedKey(PROFILE_STORAGE_KEY));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load citizen profile from localStorage:', error);
    return null;
  }
}

/**
 * Clears stored citizen profile from localStorage.
 */
export function clearCitizenProfile() {
  try {
    localStorage.removeItem(getScopedKey(PROFILE_STORAGE_KEY));
    return true;
  } catch (error) {
    console.error('Failed to clear citizen profile from localStorage:', error);
    return false;
  }
}

/**
 * Reusable eligibility evaluation engine.
 * Evaluates citizen profile against all scheme rules.
 */
export function evaluateEligibility(profile, rules = SCHEME_RULES, schemes = MOCK_SCHEMES) {
  const schemeMap = new Map(schemes.map((s) => [s.id, s]));

  const evaluations = rules.map((rule) => {
    const schemeData = schemeMap.get(rule.schemeId) || {
      id: rule.schemeId,
      title: rule.title,
      category: 'General Welfare',
      level: 'Government Scheme',
      shortDescription: '',
      financialBenefit: '',
      officialPortal: rule.officialPortal || 'https://www.india.gov.in',
      documentsRequired: [],
    };

    const evaluationResult = rule.evaluate(profile);

    return {
      schemeId: rule.schemeId,
      scheme: schemeData,
      status: evaluationResult.status, // 'likely_eligible' | 'possibly_eligible' | 'not_eligible'
      reasons: evaluationResult.reasons || [],
      unmet: evaluationResult.unmet || [],
      missing: evaluationResult.missing || [],
      verified: rule.verified,
      rulesConfidence: rule.rulesConfidence,
      sourceDocument: rule.sourceDocument,
      officialPortal: rule.officialPortal || schemeData.officialPortal,
    };
  });

  const likely = evaluations.filter((e) => e.status === 'likely_eligible');
  const possibly = evaluations.filter((e) => e.status === 'possibly_eligible');
  const notEligible = evaluations.filter((e) => e.status === 'not_eligible');

  return {
    likely,
    possibly,
    notEligible,
    all: [...likely, ...possibly, ...notEligible],
    summary: {
      likelyCount: likely.length,
      possiblyCount: possibly.length,
      notEligibleCount: notEligible.length,
      totalEvaluated: evaluations.length,
    },
  };
}
