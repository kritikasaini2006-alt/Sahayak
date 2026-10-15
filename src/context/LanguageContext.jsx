import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { en } from '../locales/en';
import { hi } from '../locales/hi';
import {
  SCHEME_TRANSLATIONS,
  CATEGORY_TRANSLATIONS,
  BENEFICIARY_TRANSLATIONS,
  SCHEME_TYPE_TRANSLATIONS,
  STATUS_TRANSLATIONS,
} from '../data/schemeTranslations';

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
   * Localizes a scheme's field (e.g. title, shortDescription, financialBenefit, ministry)
   */
  const getSchemeText = useCallback(
    (scheme, field) => {
      if (!scheme) return '';
      if (language === 'hi' && SCHEME_TRANSLATIONS[scheme.id]?.[field]) {
        return SCHEME_TRANSLATIONS[scheme.id][field];
      }
      return scheme[field] || '';
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
      getSchemeText: (s, f) => s?.[f] || '',
      getCategoryText: (c) => c || '',
      getBeneficiaryText: (b) => b || '',
      getSchemeTypeText: (s) => s || '',
      getStatusText: (st) => st || '',
      supportedLanguages: SUPPORTED_LANGS,
    };
  }
  return context;
}

