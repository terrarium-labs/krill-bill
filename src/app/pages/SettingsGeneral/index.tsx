import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/app/components/page-header';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/components/theme-provider';
import { getBgColorClasses } from '@/utils/colors';

export default function SettingsGeneral() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useApp();
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [businessData, setBusinessData] = useState({
    businessName: '',
    email: '',
    phone: '',
    website: '',
    currency: 'EUR',
    defaultDueDays: 30,
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    state: '',
    country: 'ES',
  });
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    }

    if (languageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [languageDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: name === 'defaultDueDays' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.settingsGeneral.title')}
        description={t('pages.settingsGeneral.description')}
      />

      {/* General Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
        <div>
          <p className="text-md font-semibold text-gray-900 dark:text-white">General</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display and localization preferences
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Theme
            </label>
            <div className="flex items-center gap-0 w-fit">
              {/* Light Button */}
              <button
                onClick={() => {
                  if (theme !== 'light') setTheme('light');
                }}
                className={`flex items-center gap-2 px-4 py-2 transition-colors border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg ${
                  theme === 'light'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <Sun size={18} />
                <span className="font-medium">Light</span>
              </button>

              {/* Dark Button */}
              <button
                onClick={() => {
                  if (theme !== 'dark') setTheme('dark');
                }}
                className={`flex items-center gap-2 px-4 py-2 transition-colors border border-r-0 border-gray-300 dark:border-gray-600 ${
                  theme === 'dark'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <Moon size={18} />
                <span className="font-medium">Dark</span>
              </button>

              {/* System Button */}
              <button
                onClick={() => {
                  if (theme !== 'system') setTheme('system');
                }}
                className={`flex items-center gap-2 px-4 py-2 transition-colors border border-gray-300 dark:border-gray-600 rounded-r-lg ${
                  theme === 'system'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <Monitor size={18} />
                <span className="font-medium">System</span>
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Language
            </label>
            <div className="relative w-fit" ref={languageDropdownRef}>
              <button
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {language === 'en' ? 'English' : 'Español'} ({language.toUpperCase()})
              </button>

              {/* Dropdown menu */}
              {languageDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-t-lg ${
                      language === 'en'
                        ? `${getBgColorClasses('green')} text-green-700 dark:text-green-400 font-semibold`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('es');
                      setLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-b-lg ${
                      language === 'es'
                        ? `${getBgColorClasses('green')} text-green-700 dark:text-green-400 font-semibold`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Español
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-md font-semibold text-gray-900 dark:text-white">Business Info</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Basic business information
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              value={businessData.businessName}
              onChange={handleInputChange}
              placeholder="Your business name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={businessData.email}
              onChange={handleInputChange}
              placeholder="business@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={businessData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={businessData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-md font-semibold text-gray-900 dark:text-white">Address</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Business location and address
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Address Line 1
            </label>
            <input
              type="text"
              name="addressLine1"
              value={businessData.addressLine1}
              onChange={handleInputChange}
              placeholder="Street address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              name="addressLine2"
              value={businessData.addressLine2}
              onChange={handleInputChange}
              placeholder="Apartment, suite, unit, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={businessData.city}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={businessData.postalCode}
              onChange={handleInputChange}
              placeholder="Postal code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              State / Province
            </label>
            <input
              type="text"
              name="state"
              value={businessData.state}
              onChange={handleInputChange}
              placeholder="State or province"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Country
            </label>
            <select
              name="country"
              value={businessData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ES">Spain</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="IT">Italy</option>
              <option value="PT">Portugal</option>
              <option value="US">United States</option>
              <option value="MX">Mexico</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-md font-semibold text-gray-900 dark:text-white">Invoice Settings</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Default settings for invoices
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={businessData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="MXN">MXN - Mexican Peso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Default Due Days
            </label>
            <input
              type="number"
              name="defaultDueDays"
              value={businessData.defaultDueDays}
              onChange={handleInputChange}
              min="0"
              max="365"
              placeholder="30"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default payment terms in days
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end py-6 border-t border-gray-200 dark:border-gray-700">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
