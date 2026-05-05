export const supportedLanguages = [
    { code: 'en', name: 'English', flag: 'emojione:flag-for-united-states' },
    { code: 'es', name: 'Español', flag: 'emojione:flag-for-spain' },
    { code: 'ca', name: 'Català', flag: '/cat.png' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

export const getLanguageInfo = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
};

export const isLanguageSupported = (code: string): code is SupportedLanguage => {
    return supportedLanguages.some(lang => lang.code === code);
}; 