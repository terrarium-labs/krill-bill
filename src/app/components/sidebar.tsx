import { ChevronLeft, Home, Settings, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { useApp } from '../../contexts/app-context';
import { getTranslation, type Language } from '../../i18n';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'sidebar.dashboard', href: '/', icon: Home },
  {
    label: 'sidebar.settings',
    icon: Settings,
    children: [
      { label: 'sidebar.general', href: '/admin/settings' },
      { label: 'sidebar.serialPatterns', href: '/admin/serial-numbers' },
    ],
  },
];

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();
  const { theme, setTheme, language, setLanguage } = useApp();
  const [expandedSettings, setExpandedSettings] = useState(false);

  const t = (key: string) => getTranslation(language, key);

  const isSettingsActive = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 flex flex-col ${
          open ? 'w-64' : 'w-0 lg:w-20'
        }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {open && <span className="font-bold text-lg dark:text-white">Krill Bill</span>}
          <button
            onClick={() => onOpenChange(!open)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isSettingsItem = item.label === 'sidebar.settings';
            const isActive = item.href ? location.pathname === item.href : isSettingsActive;

            if (item.children) {
              // Parent item (Settings)
              return (
                <div key={item.label}>
                  <button
                    onClick={() => open && setExpandedSettings(!expandedSettings)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-l-4 border-green-700'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                    {open && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{t(item.label)}</span>
                        <ChevronLeft
                          size={16}
                          className={`transform transition-transform ${expandedSettings ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>

                  {/* Children items */}
                  {open && expandedSettings && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      {item.children.map((child) => {
                        const childIsActive = child.href && location.pathname === child.href;
                        return (
                          <Link
                            key={child.label}
                            to={child.href || '#'}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              childIsActive
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {t(child.label)}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular item
            return (
              <Link
                key={item.href}
                to={item.href || '#'}
                onClick={() => !open && onOpenChange(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-l-4 border-green-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                {open && <span className="text-sm font-medium">{t(item.label)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme & Language Controls */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Language Selector */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold"
            title={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
          >
            {language.toUpperCase()}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {open && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="font-semibold">{t('footer.version')} 0.1.0</p>
              <p>Krill Bill SaaS</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
