import { useApp } from '@/contexts/app-context';

type Theme = 'light' | 'dark' | 'system';

/**
 * Custom hook for theme management
 * @deprecated Use useApp() from AppContext instead
 * Kept for backward compatibility
 */
export function useTheme() {
  const { theme, setTheme, toggleTheme } = useApp();

  return {
    theme: theme as Theme,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    toggleTheme,
  };
}
