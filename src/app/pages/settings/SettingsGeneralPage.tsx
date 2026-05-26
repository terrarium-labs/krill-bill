import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import PageHeader from '@/app/components/page-header';
import { Button } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import { updateOrganization } from '@/api/organizations';
import { updateOrgMemberPreferences } from '@/api/org-members';
import { Organization } from '@/types/organization';

export default function SettingsGeneralPage() {
  const { t } = useTranslation();
  const { org, preferences, refreshPreferences, refreshOrg } = useOrg();
  const [isSaving, setIsSaving] = useState(false);
  const [orgData, setOrgData] = useState<Partial<Organization>>({});
  const [userLanguage, setUserLanguage] = useState('en');

  // Initialize form with org data
  useEffect(() => {
    if (org) {
      setOrgData({
        business_name: org.business_name || '',
        business_email: org.business_email || '',
        business_phone: org.business_phone || '',
        business_website: org.business_website || '',
        currency: org.currency || 'EUR',
        address_line_1: org.address_line_1 || '',
        address_line_2: org.address_line_2 || '',
        city: org.city || '',
        postal_code: org.postal_code || '',
        state: org.state || '',
        country: org.country || 'ES',
      });
    }
    if (preferences) {
      setUserLanguage(preferences.language || 'en');
    }
  }, [org, preferences]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrgData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!org) {
      toast.error('Organization not loaded');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateOrganization(org.id, orgData);

      if (error) {
        toast.error(error);
        return;
      }

      // Save language preference to org_members
      if (preferences) {
        const { error: prefError } = await updateOrgMemberPreferences(org.id, preferences.user_id, {
          language: userLanguage,
        });
        if (prefError) {
          console.error('Error saving language preference:', prefError);
        }
      }

      await refreshOrg();
      await refreshPreferences();
      toast.success(t('toasts.settingsSaved', 'Settings saved successfully'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('errors.savingSettings', 'Failed to save settings'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.settingsGeneral.title', 'General Settings')}
        description={t('pages.settingsGeneral.description', 'Configure your organization settings')}
      />

      {/* Business Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
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
              name="business_name"
              value={orgData.business_name || ''}
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
              name="business_email"
              value={orgData.business_email || ''}
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
              name="business_phone"
              value={orgData.business_phone || ''}
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
              name="business_website"
              value={orgData.business_website || ''}
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
            {t('settings.businessLocation', 'Business location')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.addressLine1', 'Street Address')}
            </label>
            <input
              type="text"
              name="address_line_1"
              value={orgData.address_line_1 || ''}
              onChange={handleInputChange}
              placeholder={t('settings.addressLine1Placeholder', 'Street address')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.addressLine2', 'Apartment/Suite')}
            </label>
            <input
              type="text"
              name="address_line_2"
              value={orgData.address_line_2 || ''}
              onChange={handleInputChange}
              placeholder={t('settings.addressLine2Placeholder', 'Apartment, suite, etc. (optional)')}
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
              value={orgData.city || ''}
              onChange={handleInputChange}
              placeholder={t('settings.cityPlaceholder', 'City')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.state', 'State')}
            </label>
            <input
              type="text"
              name="state"
              value={orgData.state || ''}
              onChange={handleInputChange}
              placeholder={t('settings.statePlaceholder', 'State')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.postalCode', 'Postal Code')}
            </label>
            <input
              type="text"
              name="postal_code"
              value={orgData.postal_code || ''}
              onChange={handleInputChange}
              placeholder={t('settings.postalCodePlaceholder', 'Postal code')}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.country', 'Country')}
            </label>
            <select
              name="country"
              value={orgData.country || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ES">Spain</option>
              <option value="US">United States</option>
              <option value="MX">Mexico</option>
              <option value="UK">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-border">
        <div>
          <p className="text-md font-semibold text-foreground">{t('settings.invoiceSettings', 'Invoice Settings')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.invoiceDefaults', 'Default invoice settings')}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.currency', 'Currency')}
            </label>
            <select
              name="currency"
              value={orgData.currency || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dollar</option>
              <option value="GBP">GBP - Pound</option>
              <option value="MXN">MXN - Peso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('settings.language', 'Language')}
            </label>
            <select
              value={userLanguage}
              onChange={(e) => setUserLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end py-6 border-t border-border">
        <Button
          variant="theme"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? t('actions.saving', 'Saving...') : t('actions.save', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}
