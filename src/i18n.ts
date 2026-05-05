// Simple i18n translations
const translations = {
  es: {
    sidebar: {
      dashboard: 'Panel Principal',
      settings: 'Configuración',
      general: 'General',
      serialPatterns: 'Patrones Seriales',
    },
    footer: {
      version: 'Versión',
    },
  },
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      settings: 'Settings',
      general: 'General',
      serialPatterns: 'Serial Patterns',
    },
    footer: {
      version: 'Version',
    },
  },
};

export type Language = 'es' | 'en';

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

export function getAllTranslations(lang: Language) {
  return translations[lang];
}
