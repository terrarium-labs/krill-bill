import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import { ColorPicker } from '@/app/components/color-picker';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import CustomDropdownMenu from '@/app/components/dropdown-menu';
import LanguageButton from '@/app/components/buttons/language-button';

export default function SettingsGeneralPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, accentColor, setAccentColor } = useApp();
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
        title={t('pages.settingsGeneral.title', 'General Settings')}
        description={t('pages.settingsGeneral.description', 'Configure general application settings')}
      />

      {/* General Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
        <div>
          <p className="text-md font-semibold text-foreground">{t('settings.general', 'General')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.displayLocalization', 'Display and localization preferences')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Theme */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('settings.theme', 'Theme')}
            </label>
            <div className="flex items-center gap-0 w-full">
              {/* Light Button */}
              <button
                onClick={() => {
                  if (theme !== 'light') setTheme('light');
                }}
                className={`flex-1 inline-flex items-center justify-center h-9 gap-2 px-4 text-sm font-medium transition-all border border-r-0 border-border rounded-l-md ${theme === 'light'
                    ? 'bg-[color:var(--accent-600)] border-[color:var(--accent-800)] text-white hover:bg-[color:var(--accent-700)]'
                    : 'bg-card text-foreground'
                  }`}
              >
                <Sun size={18} />
                <span>{t('buttons.light', 'Light')}</span>
              </button>

              {/* Dark Button */}
              <button
                onClick={() => {
                  if (theme !== 'dark') setTheme('dark');
                }}
                className={`flex-1 inline-flex items-center justify-center h-9 gap-2 px-4 text-sm font-medium transition-all border border-r-0 border-border ${theme === 'dark'
                    ? 'bg-[color:var(--accent-600)] border-[color:var(--accent-400)] text-white hover:bg-[color:var(--accent-700)]'
                    : 'bg-card text-foreground'
                  }`}
              >
                <Moon size={18} />
                <span>{t('buttons.dark', 'Dark')}</span>
              </button>

              {/* System Button */}
              <button
                onClick={() => {
                  if (theme !== 'system') setTheme('system');
                }}
                className={`flex-1 inline-flex items-center justify-center h-9 gap-2 px-4 text-sm font-medium transition-all border border-border rounded-r-md ${theme === 'system'
                    ? 'bg-[color:var(--accent-600)] border-[color:var(--accent-800)] text-white hover:bg-[color:var(--accent-700)]'
                    : 'bg-card text-foreground'
                  }`}
              >
                <Monitor size={18} />
                <span>{t('buttons.system', 'System')}</span>
              </button>
            </div>
          </div>

          {/* Accent Color Picker */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('settings.accentColor', 'Accent Color')}
            </label>
            <ColorPicker
              selectedColor={accentColor}
              onColorChange={setAccentColor}
            />
          </div>

          {/* Language */}
          <div className="col-span-1 md:col-span-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('settings.language', 'Language')}
            </label>
            <CustomDropdownMenu
              items={[
                {
                  label: t('languages.en', 'English'),
                  icon: 'Globe',
                  onClick: () => setLanguage('en'),
                  className: language === 'en' ? 'bg-[color:var(--accent-600)] text-white font-semibold' : '',
                },
                {
                  label: t('languages.es', 'Spanish'),
                  icon: 'Globe',
                  onClick: () => setLanguage('es'),
                  className: language === 'es' ? 'bg-[color:var(--accent-600)] text-white font-semibold' : '',
                },
              ]}
              trigger={<LanguageButton />}
              align="start"
            />
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-border">
        <div>
          <p className="text-md font-semibold text-foreground">{t('settings.businessInfo', 'Business Info')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.basicBusinessInfo', 'Basic business information')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.businessName', 'Business Name')}
            </label>
            <input
              type="text"
              name="businessName"
              value={businessData.businessName}
              onChange={handleInputChange}
              placeholder={t('settings.businessNamePlaceholder', 'Your business name')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.email', 'Email')}
            </label>
            <input
              type="email"
              name="email"
              value={businessData.email}
              onChange={handleInputChange}
              placeholder={t('common.email', 'Email') + '@example.com'}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.phone', 'Phone')}
            </label>
            <input
              type="tel"
              name="phone"
              value={businessData.phone}
              onChange={handleInputChange}
              placeholder={t('common.phone', 'Phone')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.website', 'Website')}
            </label>
            <input
              type="url"
              name="website"
              value={businessData.website}
              onChange={handleInputChange}
              placeholder={t('settings.websitePlaceholder', 'https://example.com')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-border">
        <div>
          <p className="text-md font-semibold text-foreground">{t('settings.address', 'Address')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.businessLocation', 'Business location and address')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.addressLine1', 'Address Line 1')}
            </label>
            <input
              type="text"
              name="addressLine1"
              value={businessData.addressLine1}
              onChange={handleInputChange}
              placeholder={t('settings.addressLine1Placeholder', 'Street address')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.addressLine2', 'Address Line 2')}
            </label>
            <input
              type="text"
              name="addressLine2"
              value={businessData.addressLine2}
              onChange={handleInputChange}
              placeholder={t('settings.addressLine2Placeholder', 'Apartment, suite, unit, etc.')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.city', 'City')}
            </label>
            <input
              type="text"
              name="city"
              value={businessData.city}
              onChange={handleInputChange}
              placeholder={t('settings.cityPlaceholder', 'City')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.postalCode', 'Postal Code')}
            </label>
            <input
              type="text"
              name="postalCode"
              value={businessData.postalCode}
              onChange={handleInputChange}
              placeholder={t('settings.postalCodePlaceholder', 'Postal code')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.stateProvince', 'State / Province')}
            </label>
            <input
              type="text"
              name="state"
              value={businessData.state}
              onChange={handleInputChange}
              placeholder={t('settings.stateProvincePlaceholder', 'State or province')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.country', 'Country')}
            </label>
            <select
              name="country"
              value={businessData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ES">{t('countries.spain', 'Spain')}</option>
              <option value="FR">{t('countries.france', 'France')}</option>
              <option value="DE">{t('countries.germany', 'Germany')}</option>
              <option value="IT">{t('countries.italy', 'Italy')}</option>
              <option value="PT">{t('countries.portugal', 'Portugal')}</option>
              <option value="US">{t('countries.unitedStates', 'United States')}</option>
              <option value="MX">{t('countries.mexico', 'Mexico')}</option>
              <option value="GB">{t('countries.unitedKingdom', 'United Kingdom')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-border">
        <div>
          <p className="text-md font-semibold text-foreground">{t('settings.invoiceSettings', 'Invoice Settings')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.defaultInvoiceSettings', 'Default settings for invoices')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.currency', 'Currency')}
            </label>
            <select
              name="currency"
              value={businessData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="EUR">{t('currencies.eur', 'EUR - Euro')}</option>
              <option value="USD">{t('currencies.usd', 'USD - US Dollar')}</option>
              <option value="GBP">{t('currencies.gbp', 'GBP - British Pound')}</option>
              <option value="JPY">{t('currencies.jpy', 'JPY - Japanese Yen')}</option>
              <option value="CHF">{t('currencies.chf', 'CHF - Swiss Franc')}</option>
              <option value="CAD">{t('currencies.cad', 'CAD - Canadian Dollar')}</option>
              <option value="AUD">{t('currencies.aud', 'AUD - Australian Dollar')}</option>
              <option value="MXN">{t('currencies.mxn', 'MXN - Mexican Peso')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.defaultDueDays', 'Default Due Days')}
            </label>
            <input
              type="number"
              name="defaultDueDays"
              value={businessData.defaultDueDays}
              onChange={handleInputChange}
              min="0"
              max="365"
              placeholder={t('settings.defaultDueDaysPlaceholder', '30')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('settings.defaultPaymentTerms', 'Default payment terms in days')}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end py-6 border-t border-border">
        <Button variant="theme">
          {t('settings.saveChanges', 'Save Changes')}
        </Button>
      </div>
    </div>
  );
}
