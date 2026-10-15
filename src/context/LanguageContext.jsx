import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { en } from '../locales/en';
import { hi } from '../locales/hi';
import {
  SCHEME_TRANSLATIONS,
  CATEGORY_TRANSLATIONS,
  BENEFICIARY_TRANSLATIONS,
  SCHEME_TYPE_TRANSLATIONS,
  STATUS_TRANSLATIONS,
  EVALUATION_TEXT_TRANSLATIONS,
} from '../data/schemeTranslations';
import { GUIDANCE_TRANSLATIONS } from '../data/schemeGuidanceTranslations';

const STORAGE_KEY = 'sahayak_language';
const ALT_STORAGE_KEY = 'sahayak_lang';

const DICTIONARIES = { en, hi };

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(ALT_STORAGE_KEY);
      return saved === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  });

  // Sync document lang attribute
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
        if (language === 'hi') {
          document.documentElement.classList.add('lang-hi');
        } else {
          document.documentElement.classList.remove('lang-hi');
        }
      }
    } catch {}
  }, [language]);

  const changeLanguage = useCallback((newLang) => {
    const validLang = newLang === 'hi' ? 'hi' : 'en';
    setLanguageState(validLang);
    try {
      localStorage.setItem(STORAGE_KEY, validLang);
      localStorage.setItem(ALT_STORAGE_KEY, validLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = validLang;
      }
    } catch {}
  }, []);

  /**
   * Translates a dot-notation key (e.g. 'nav.home', 'home.heroTitle')
   * Automatically falls back to English if the key is missing in Hindi.
   */
  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath || typeof keyPath !== 'string') return '';

      const keys = keyPath.split('.');

      const getNested = (obj) => {
        let current = obj;
        for (const k of keys) {
          if (!current || typeof current !== 'object') return null;
          current = current[k];
        }
        return current;
      };

      // 1. Check active language dictionary
      let text = getNested(DICTIONARIES[language]);

      // 2. Fallback to English if missing or empty
      if (text === null || text === undefined || text === '') {
        text = getNested(DICTIONARIES.en);
      }

      // 3. Absolute fallback: return key path itself
      if (text === null || text === undefined) {
        return keyPath;
      }

      if (typeof text !== 'string') {
        return text;
      }

      // Replace interpolation parameters: {count}, {category}, etc.
      if (params && Object.keys(params).length > 0) {
        return text.replace(/\{(\w+)\}/g, (_, match) => {
          return params[match] !== undefined ? params[match] : `{${match}}`;
        });
      }

      return text;
    },
    [language]
  );

  /**
   * Localizes a scheme's string field (e.g. title, shortDescription, financialBenefit, ministry, applicationMode)
   * Supports passing scheme object or scheme ID string.
   */
  const getSchemeText = useCallback(
    (schemeOrId, field, fallback = '') => {
      if (!schemeOrId) return fallback || '';
      const schemeId = typeof schemeOrId === 'string' ? schemeOrId : schemeOrId?.id;
      if (language === 'hi' && schemeId && SCHEME_TRANSLATIONS[schemeId]?.[field]) {
        return SCHEME_TRANSLATIONS[schemeId][field];
      }
      if (typeof schemeOrId === 'object' && schemeOrId[field]) {
        return schemeOrId[field];
      }
      return fallback || '';
    },
    [language]
  );

  /**
   * Localizes a scheme's array field (e.g. eligibilityCriteria, documentsRequired, benefitDetails, exclusions, applicationSteps, targetBeneficiaries)
   * Supports passing scheme object or scheme ID string.
   */
  const getSchemeArray = useCallback(
    (schemeOrId, field) => {
      if (!schemeOrId) return [];
      const schemeId = typeof schemeOrId === 'string' ? schemeOrId : schemeOrId?.id;
      if (language === 'hi' && schemeId && Array.isArray(SCHEME_TRANSLATIONS[schemeId]?.[field])) {
        return SCHEME_TRANSLATIONS[schemeId][field];
      }
      if (typeof schemeOrId === 'object' && Array.isArray(schemeOrId[field])) {
        return schemeOrId[field];
      }
      return [];
    },
    [language]
  );

  /**
   * Localizes full application guidance dataset for a scheme
   */
  const getGuidanceData = useCallback(
    (guidance) => {
      if (!guidance) return guidance;
      if (language !== 'hi') return guidance;

      const schemeId = guidance.schemeId || guidance.id;
      const gTrans = GUIDANCE_TRANSLATIONS[schemeId];
      const sTrans = SCHEME_TRANSLATIONS[schemeId];

      if (!gTrans && !sTrans) return guidance;

      const localizedDocs = guidance.documents?.map((doc) => {
        const docTrans = gTrans?.documents?.find((d) => d.id === doc.id);
        if (!docTrans) return doc;
        return {
          ...doc,
          name: docTrans.name || doc.name,
          requirementType: docTrans.requirementType || doc.requirementType,
          purpose: docTrans.purpose || doc.purpose,
          issuingAuthority: docTrans.issuingAuthority || doc.issuingAuthority,
          howToObtain: docTrans.howToObtain || doc.howToObtain,
          commonMistakes: docTrans.commonMistakes || doc.commonMistakes,
          condition: docTrans.condition !== undefined ? docTrans.condition : doc.condition,
        };
      }) || guidance.documents;

      const localizedSteps = guidance.steps?.map((step) => {
        const stepTrans = gTrans?.steps?.find((s) => s.stepNumber === step.stepNumber);
        if (!stepTrans) return step;
        return {
          ...step,
          title: stepTrans.title || step.title,
          mode: stepTrans.mode || step.mode,
          description: stepTrans.description || step.description,
          tip: stepTrans.tip || step.tip,
        };
      }) || guidance.steps;

      return {
        ...guidance,
        title: sTrans?.title || guidance.title,
        ministry: sTrans?.ministry || guidance.ministry,
        stateVarianceNote: gTrans?.stateVarianceNote || guidance.stateVarianceNote,
        prerequisites: gTrans?.prerequisites || guidance.prerequisites,
        documents: localizedDocs,
        steps: localizedSteps,
        reviewChecklist: gTrans?.reviewChecklist || guidance.reviewChecklist,
      };
    },
    [language]
  );

  /**
   * Translates eligibility evaluator criteria / reason strings
   */
  const getEvaluationReasonText = useCallback(
    (reason) => {
      if (!reason || typeof reason !== 'string') return '';
      if (language === 'hi' && EVALUATION_TEXT_TRANSLATIONS[reason]) {
        return EVALUATION_TEXT_TRANSLATIONS[reason];
      }
      return reason;
    },
    [language]
  );

  /**
   * Localizes category filter names
   */
  const getCategoryText = useCallback(
    (category) => {
      if (language === 'hi' && CATEGORY_TRANSLATIONS[category]) {
        return CATEGORY_TRANSLATIONS[category];
      }
      return category || '';
    },
    [language]
  );

  /**
   * Localizes beneficiary types
   */
  const getBeneficiaryText = useCallback(
    (bType) => {
      if (language === 'hi' && BENEFICIARY_TRANSLATIONS[bType]) {
        return BENEFICIARY_TRANSLATIONS[bType];
      }
      return bType || '';
    },
    [language]
  );

  /**
   * Localizes scheme types (e.g. Central Sector Scheme)
   */
  const getSchemeTypeText = useCallback(
    (sType) => {
      if (language === 'hi' && SCHEME_TYPE_TRANSLATIONS[sType]) {
        return SCHEME_TYPE_TRANSLATIONS[sType];
      }
      return sType || '';
    },
    [language]
  );

  /**
   * Localizes application statuses (e.g. Interested, Submitted)
   */
  const getStatusText = useCallback(
    (status) => {
      if (language === 'hi' && STATUS_TRANSLATIONS[status]) {
        return STATUS_TRANSLATIONS[status];
      }
      return status || '';
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      setLanguage: changeLanguage,
      isHindi: language === 'hi',
      t,
      getSchemeText,
      getSchemeArray,
      getGuidanceData,
      getEvaluationReasonText,
      getCategoryText,
      getBeneficiaryText,
      getSchemeTypeText,
      getStatusText,
      supportedLanguages: SUPPORTED_LANGS,
    }),
    [
      language,
      changeLanguage,
      t,
      getSchemeText,
      getSchemeArray,
      getGuidanceData,
      getEvaluationReasonText,
      getCategoryText,
      getBeneficiaryText,
      getSchemeTypeText,
      getStatusText,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for non-provider environments (e.g. tests)
    return {
      language: 'en',
      changeLanguage: () => {},
      setLanguage: () => {},
      isHindi: false,
      t: (key) => key,
      getSchemeText: (s, f, fb) => (typeof s === 'object' ? s?.[f] : '') || fb || '',
      getSchemeArray: (s, f) => (typeof s === 'object' && Array.isArray(s?.[f]) ? s[f] : []),
      getGuidanceData: (g) => g,
      getEvaluationReasonText: (r) => r,
      getCategoryText: (c) => c || '',
      getBeneficiaryText: (b) => b || '',
      getSchemeTypeText: (s) => s || '',
      getStatusText: (st) => st || '',
      supportedLanguages: SUPPORTED_LANGS,
    };
  }
  return context;
}

