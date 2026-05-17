import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';
import nb from './locales/nb/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en as Record<string, unknown> },
      nb: { translation: nb as Record<string, unknown> },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'nb'],
    detection: {
      order: ['localStorage', 'navigator'],
      cacheUserLanguage: true,
    } as object,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
