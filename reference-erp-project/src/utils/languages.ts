export interface Language {
    code: string;
    name: string;
    nativeName: string;
    region?: string;
}

// Languages ordered by relevance to Catalonia
export const PRIORITIZED_LANGUAGES: Language[] = [
    {
        code: 'ca',
        name: 'Catalan',
        nativeName: 'Català',
        region: 'Catalonia, Valencia, Balearic Islands'
    },
    {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        region: 'Spain, Latin America'
    },
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        region: 'Global'
    },
    {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        region: 'France, Neighboring region'
    },
    {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        region: 'Portugal, Brazil'
    },
    {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        region: 'Italy, Mediterranean'
    },
    {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        region: 'Germany, Central Europe'
    },
    {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        region: 'North Africa, Middle East'
    },
    {
        code: 'zh',
        name: 'Chinese (Mandarin)',
        nativeName: '中文',
        region: 'China, Business importance'
    },
    {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        region: 'Eastern Europe'
    },
    {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        region: 'Japan, Technology'
    }
];

// For backward compatibility
export const TOP_10_LANGUAGES = PRIORITIZED_LANGUAGES.slice(0, 10);
export const ALL_LANGUAGES = PRIORITIZED_LANGUAGES;

// Helper functions
export const getLanguageByCode = (code: string): Language | undefined => {
    return ALL_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageNames = (): string[] => {
    return ALL_LANGUAGES.map(lang => lang.name);
};

export const getLanguageCodes = (): string[] => {
    return ALL_LANGUAGES.map(lang => lang.code);
};

// Catalonia-specific exports
export const getCatalanLanguage = (): Language => {
    return PRIORITIZED_LANGUAGES[0]; // Catalan is always first
};

export const getRegionalLanguages = (): Language[] => {
    return PRIORITIZED_LANGUAGES.slice(0, 4); // Catalan, Spanish, English, French
};
