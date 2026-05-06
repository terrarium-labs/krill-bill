import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Language } from '@/i18n';
import i18n from '@/i18n';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'en'
  );

  // Initialize i18n language on mount
  useEffect(() => {
    const storedLang = (localStorage.getItem('language') as Language) || 'en';
    i18n.changeLanguage(storedLang);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
    i18n.changeLanguage(newLang);
  }, []);

  const contextValue = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage]
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
