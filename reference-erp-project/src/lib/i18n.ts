import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import en from '../locales/en.json';
import es from '../locales/es.json';
import ca from '../locales/ca.json';

const resources = {
    en: {
        translation: en,
    },
    es: {
        translation: es,
    },
    ca: {
        translation: ca,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: false,
        supportedLngs: ['en', 'es', 'ca'],

        interpolation: {
            escapeValue: false, // React already escapes by default
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    });

export default i18n; 