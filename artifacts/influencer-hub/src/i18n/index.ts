import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import mrCommon from './locales/mr/common.json';

const STORAGE_KEY = 'influencer_hub_language';

const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'hi', 'mr'].includes(saved)) {
      return saved;
    }
  } catch (_e) {}
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enCommon },
      hi: { translation: hiCommon },
      mr: { translation: mrCommon },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation key "${key}" for languages:`, lngs, `Falling back to "${fallbackValue}"`);
      }
    },
  });

// Persist language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lng;
  } catch (_e) {}
});

export default i18n;
