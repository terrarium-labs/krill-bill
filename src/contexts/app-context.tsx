import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Language } from '@/i18n';
import i18n from '@/i18n';

interface AppContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
}

// Color palette in OKLch format for all 21 colors
const COLOR_PALETTES: Record<string, Record<string, string>> = {
    red: {
        '50': 'oklch(0.982 0.013 25.331)',
        '100': 'oklch(0.96 0.034 25.331)',
        '200': 'oklch(0.918 0.074 25.331)',
        '300': 'oklch(0.861 0.139 25.331)',
        '400': 'oklch(0.783 0.231 25.331)',
        '500': 'oklch(0.677 0.245 27.325)',
        '600': 'oklch(0.577 0.245 27.325)',
        '700': 'oklch(0.495 0.208 26.889)',
        '800': 'oklch(0.419 0.167 28.191)',
        '900': 'oklch(0.357 0.131 28.565)',
        '950': 'oklch(0.181 0.065 28.191)',
    },
    orange: {
        '50': 'oklch(0.985 0.012 70.08)',
        '100': 'oklch(0.963 0.035 70.08)',
        '200': 'oklch(0.916 0.085 70.08)',
        '300': 'oklch(0.842 0.164 71.688)',
        '400': 'oklch(0.741 0.243 76.99)',
        '500': 'oklch(0.628 0.266 81.265)',
        '600': 'oklch(0.551 0.237 82.47)',
        '700': 'oklch(0.456 0.197 82.914)',
        '800': 'oklch(0.388 0.158 83.357)',
        '900': 'oklch(0.332 0.125 83.801)',
        '950': 'oklch(0.171 0.063 84.244)',
    },
    amber: {
        '50': 'oklch(0.987 0.01 76.99)',
        '100': 'oklch(0.966 0.032 76.99)',
        '200': 'oklch(0.922 0.082 77.437)',
        '300': 'oklch(0.853 0.157 78.327)',
        '400': 'oklch(0.759 0.247 81.265)',
        '500': 'oklch(0.639 0.283 84.151)',
        '600': 'oklch(0.544 0.254 84.594)',
        '700': 'oklch(0.447 0.213 85.481)',
        '800': 'oklch(0.379 0.171 85.925)',
        '900': 'oklch(0.323 0.138 86.812)',
        '950': 'oklch(0.166 0.07 86.368)',
    },
    yellow: {
        '50': 'oklch(0.987 0.012 99.604)',
        '100': 'oklch(0.962 0.039 99.604)',
        '200': 'oklch(0.913 0.098 100.489)',
        '300': 'oklch(0.841 0.174 101.379)',
        '400': 'oklch(0.75 0.264 102.704)',
        '500': 'oklch(0.643 0.317 105.159)',
        '600': 'oklch(0.549 0.287 106.044)',
        '700': 'oklch(0.45 0.241 106.934)',
        '800': 'oklch(0.381 0.194 107.379)',
        '900': 'oklch(0.324 0.156 108.269)',
        '950': 'oklch(0.167 0.081 107.824)',
    },
    lime: {
        '50': 'oklch(0.986 0.014 127.715)',
        '100': 'oklch(0.962 0.042 128.602)',
        '200': 'oklch(0.909 0.101 130.371)',
        '300': 'oklch(0.839 0.178 132.586)',
        '400': 'oklch(0.752 0.264 135.522)',
        '500': 'oklch(0.643 0.317 140.961)',
        '600': 'oklch(0.544 0.278 142.213)',
        '700': 'oklch(0.445 0.231 142.213)',
        '800': 'oklch(0.376 0.186 142.658)',
        '900': 'oklch(0.318 0.151 143.103)',
        '950': 'oklch(0.162 0.078 143.548)',
    },
    green: {
        '50': 'oklch(0.975 0.009 142.476)',
        '100': 'oklch(0.958 0.025 143.604)',
        '200': 'oklch(0.897 0.06 145.546)',
        '300': 'oklch(0.813 0.106 148.267)',
        '400': 'oklch(0.706 0.169 150.024)',
        '500': 'oklch(0.586 0.221 151.618)',
        '600': 'oklch(0.527 0.196 152.934)',
        '700': 'oklch(0.453 0.169 154.226)',
        '800': 'oklch(0.383 0.118 155.504)',
        '900': 'oklch(0.329 0.093 156.986)',
        '950': 'oklch(0.179 0.051 157.715)',
    },
    emerald: {
        '50': 'oklch(0.976 0.007 163.603)',
        '100': 'oklch(0.955 0.021 164.731)',
        '200': 'oklch(0.903 0.052 166.419)',
        '300': 'oklch(0.831 0.108 168.1)',
        '400': 'oklch(0.733 0.168 169.5)',
        '500': 'oklch(0.602 0.222 171.108)',
        '600': 'oklch(0.541 0.199 172.402)',
        '700': 'oklch(0.462 0.167 173.693)',
        '800': 'oklch(0.389 0.125 175.385)',
        '900': 'oklch(0.329 0.101 176.683)',
        '950': 'oklch(0.176 0.054 176.683)',
    },
    teal: {
        '50': 'oklch(0.976 0.007 198.72)',
        '100': 'oklch(0.953 0.023 200.624)',
        '200': 'oklch(0.899 0.057 201.528)',
        '300': 'oklch(0.823 0.114 202.432)',
        '400': 'oklch(0.72 0.175 202.432)',
        '500': 'oklch(0.589 0.226 202.432)',
        '600': 'oklch(0.523 0.201 203.336)',
        '700': 'oklch(0.442 0.171 204.24)',
        '800': 'oklch(0.369 0.133 205.144)',
        '900': 'oklch(0.31 0.109 206.048)',
        '950': 'oklch(0.159 0.057 206.953)',
    },
    cyan: {
        '50': 'oklch(0.982 0.01 215.158)',
        '100': 'oklch(0.955 0.032 216.063)',
        '200': 'oklch(0.901 0.08 217.875)',
        '300': 'oklch(0.824 0.142 219.686)',
        '400': 'oklch(0.721 0.216 220.591)',
        '500': 'oklch(0.589 0.277 220.591)',
        '600': 'oklch(0.515 0.238 220.091)',
        '700': 'oklch(0.434 0.199 219.492)',
        '800': 'oklch(0.363 0.156 219.084)',
        '900': 'oklch(0.306 0.127 219.084)',
        '950': 'oklch(0.156 0.066 219.084)',
    },
    sky: {
        '50': 'oklch(0.981 0.013 234.994)',
        '100': 'oklch(0.955 0.039 232.809)',
        '200': 'oklch(0.901 0.099 231.901)',
        '300': 'oklch(0.823 0.177 229.716)',
        '400': 'oklch(0.722 0.253 227.531)',
        '500': 'oklch(0.591 0.303 224.343)',
        '600': 'oklch(0.507 0.266 223.435)',
        '700': 'oklch(0.423 0.221 223.435)',
        '800': 'oklch(0.359 0.175 224.343)',
        '900': 'oklch(0.306 0.142 225.251)',
        '950': 'oklch(0.158 0.074 224.343)',
    },
    blue: {
        '50': 'oklch(0.982 0.012 254.604)',
        '100': 'oklch(0.956 0.036 253.696)',
        '200': 'oklch(0.903 0.089 252.878)',
        '300': 'oklch(0.824 0.161 252.424)',
        '400': 'oklch(0.721 0.239 252.87)',
        '500': 'oklch(0.586 0.296 256.109)',
        '600': 'oklch(0.503 0.265 257.017)',
        '700': 'oklch(0.418 0.218 258.941)',
        '800': 'oklch(0.355 0.177 261.121)',
        '900': 'oklch(0.301 0.144 264.361)',
        '950': 'oklch(0.154 0.075 265.269)',
    },
    indigo: {
        '50': 'oklch(0.982 0.015 272.217)',
        '100': 'oklch(0.954 0.045 272.217)',
        '200': 'oklch(0.901 0.108 273.125)',
        '300': 'oklch(0.821 0.184 273.533)',
        '400': 'oklch(0.712 0.265 274.441)',
        '500': 'oklch(0.585 0.309 276.361)',
        '600': 'oklch(0.499 0.278 277.269)',
        '700': 'oklch(0.413 0.229 278.177)',
        '800': 'oklch(0.349 0.186 279.085)',
        '900': 'oklch(0.296 0.152 279.992)',
        '950': 'oklch(0.152 0.08 280.9)',
    },
    violet: {
        '50': 'oklch(0.982 0.018 288.653)',
        '100': 'oklch(0.952 0.053 289.561)',
        '200': 'oklch(0.898 0.126 289.561)',
        '300': 'oklch(0.817 0.198 290.469)',
        '400': 'oklch(0.707 0.279 291.833)',
        '500': 'oklch(0.58 0.323 294.181)',
        '600': 'oklch(0.495 0.281 296.529)',
        '700': 'oklch(0.41 0.231 300.269)',
        '800': 'oklch(0.345 0.188 301.685)',
        '900': 'oklch(0.293 0.154 303.1)',
        '950': 'oklch(0.15 0.082 305.45)',
    },
    purple: {
        '50': 'oklch(0.981 0.022 304.617)',
        '100': 'oklch(0.948 0.063 305.525)',
        '200': 'oklch(0.893 0.147 306.433)',
        '300': 'oklch(0.809 0.222 307.34)',
        '400': 'oklch(0.696 0.303 308.248)',
        '500': 'oklch(0.569 0.334 309.613)',
        '600': 'oklch(0.481 0.287 310.521)',
        '700': 'oklch(0.398 0.236 311.429)',
        '800': 'oklch(0.333 0.191 312.794)',
        '900': 'oklch(0.282 0.156 313.702)',
        '950': 'oklch(0.144 0.082 315.067)',
    },
    fuchsia: {
        '50': 'oklch(0.981 0.025 318.825)',
        '100': 'oklch(0.944 0.074 319.732)',
        '200': 'oklch(0.887 0.174 320.64)',
        '300': 'oklch(0.809 0.258 321.995)',
        '400': 'oklch(0.694 0.353 322.902)',
        '500': 'oklch(0.548 0.368 323.81)',
        '600': 'oklch(0.462 0.31 323.81)',
        '700': 'oklch(0.382 0.255 324.717)',
        '800': 'oklch(0.312 0.207 324.717)',
        '900': 'oklch(0.263 0.169 324.717)',
        '950': 'oklch(0.134 0.09 325.624)',
    },
    pink: {
        '50': 'oklch(0.982 0.018 331.234)',
        '100': 'oklch(0.946 0.052 331.234)',
        '200': 'oklch(0.893 0.122 330.326)',
        '300': 'oklch(0.816 0.207 329.419)',
        '400': 'oklch(0.704 0.295 328.511)',
        '500': 'oklch(0.556 0.335 327.149)',
        '600': 'oklch(0.476 0.287 326.241)',
        '700': 'oklch(0.397 0.236 326.241)',
        '800': 'oklch(0.328 0.191 326.241)',
        '900': 'oklch(0.279 0.156 326.241)',
        '950': 'oklch(0.143 0.082 326.241)',
    },
    rose: {
        '50': 'oklch(0.982 0.015 343.201)',
        '100': 'oklch(0.954 0.043 343.201)',
        '200': 'oklch(0.903 0.101 343.201)',
        '300': 'oklch(0.835 0.177 343.201)',
        '400': 'oklch(0.738 0.271 343.201)',
        '500': 'oklch(0.614 0.329 343.661)',
        '600': 'oklch(0.527 0.296 344.57)',
        '700': 'oklch(0.44 0.244 345.478)',
        '800': 'oklch(0.371 0.198 346.386)',
        '900': 'oklch(0.315 0.163 347.294)',
        '950': 'oklch(0.162 0.086 348.202)',
    },
    slate: {
        '50': 'oklch(0.978 0 0)',
        '100': 'oklch(0.952 0 0)',
        '200': 'oklch(0.902 0 0)',
        '300': 'oklch(0.83 0 0)',
        '400': 'oklch(0.704 0 0)',
        '500': 'oklch(0.556 0 0)',
        '600': 'oklch(0.439 0 0)',
        '700': 'oklch(0.369 0 0)',
        '800': 'oklch(0.282 0 0)',
        '900': 'oklch(0.232 0 0)',
        '950': 'oklch(0.129 0 0)',
    },
    gray: {
        '50': 'oklch(0.986 0.002 261.325)',
        '100': 'oklch(0.962 0.002 261.325)',
        '200': 'oklch(0.911 0.002 261.325)',
        '300': 'oklch(0.834 0.002 261.325)',
        '400': 'oklch(0.703 0.002 261.325)',
        '500': 'oklch(0.556 0.003 261.325)',
        '600': 'oklch(0.439 0.003 261.325)',
        '700': 'oklch(0.369 0.003 261.325)',
        '800': 'oklch(0.281 0.003 261.325)',
        '900': 'oklch(0.231 0.003 261.325)',
        '950': 'oklch(0.129 0.001 261.325)',
    },
    zinc: {
        '50': 'oklch(0.986 0 0)',
        '100': 'oklch(0.963 0 0)',
        '200': 'oklch(0.913 0.001 0)',
        '300': 'oklch(0.837 0.001 0)',
        '400': 'oklch(0.709 0.002 0)',
        '500': 'oklch(0.56 0.002 0)',
        '600': 'oklch(0.442 0.002 0)',
        '700': 'oklch(0.371 0.001 0)',
        '800': 'oklch(0.282 0.001 0)',
        '900': 'oklch(0.231 0.001 0)',
        '950': 'oklch(0.129 0.001 0)',
    },
    stone: {
        '50': 'oklch(0.985 0.001 56.216)',
        '100': 'oklch(0.961 0.001 56.216)',
        '200': 'oklch(0.911 0.002 56.216)',
        '300': 'oklch(0.834 0.002 56.216)',
        '400': 'oklch(0.703 0.004 56.216)',
        '500': 'oklch(0.556 0.004 56.216)',
        '600': 'oklch(0.439 0.004 56.216)',
        '700': 'oklch(0.369 0.005 56.216)',
        '800': 'oklch(0.281 0.005 56.216)',
        '900': 'oklch(0.231 0.007 56.216)',
        '950': 'oklch(0.129 0.004 56.216)',
    },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function applyAccentColorVariables(colorName: string) {
    const palette = COLOR_PALETTES[colorName];
    if (!palette) return;

    for (const [shade, value] of Object.entries(palette)) {
        document.documentElement.style.setProperty(`--accent-${shade}`, value);
    }
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(
        () => (localStorage.getItem('language') as Language) || 'en'
    );

    const [accentColor, setAccentColorState] = useState<string>(
        () => localStorage.getItem('accentColor') || 'green'
    );

    // Initialize i18n language and accent color on mount
    useEffect(() => {
        const storedLang = (localStorage.getItem('language') as Language) || 'en';
        i18n.changeLanguage(storedLang);

        const storedAccentColor = localStorage.getItem('accentColor') || 'green';
        applyAccentColorVariables(storedAccentColor);
    }, []);

    const setLanguage = useCallback((newLang: Language) => {
        setLanguageState(newLang);
        localStorage.setItem('language', newLang);
        i18n.changeLanguage(newLang);
    }, []);

    const setAccentColor = useCallback((color: string) => {
        setAccentColorState(color);
        localStorage.setItem('accentColor', color);
        applyAccentColorVariables(color);
    }, []);

    const contextValue = useMemo(
        () => ({ language, setLanguage, accentColor, setAccentColor }),
        [language, setLanguage, accentColor, setAccentColor]
    );

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
