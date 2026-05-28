import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import PageHeader from '@/app/components/page-header';
import { useTheme } from '@/components/theme-provider';
import { useApp } from '@/contexts/app-context';
import { useOrg } from '@/contexts/OrgContext';
import { updateOrgMemberPreferences } from '@/api/org-members';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/app/components/color-picker';

export default function SettingsProfilePage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, accentColor, setAccentColor } = useApp();
  const { org, preferences, refreshPreferences } = useOrg();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localAccentColor, setLocalAccentColor] = useState(accentColor);

  useEffect(() => {
    if (preferences) {
      setLocalTheme(preferences.theme);
      setLocalLanguage(preferences.language);
      setLocalAccentColor(preferences.accent_color);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateOrgMemberPreferences(org.id, preferences.user_id, {
        theme: localTheme as any,
        language: localLanguage as any,
        accent_color: localAccentColor,
      });

      if (error) {
        toast.error(error);
        return;
      }

      // Update global app context
      setTheme(localTheme);
      setLanguage(localLanguage);
      setAccentColor(localAccentColor);

      // Refresh preferences
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
        title={t('pages.settingsProfile.title', 'Profile Settings')}
        description={t('pages.settingsProfile.description', 'Customize your personal preferences')}
      />

      {/* Theme Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-b border-border">
        <div>
          <p className="text-md font-semibold text-foreground">
            {t('settings.theme.title', 'Theme')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.theme.description', 'Choose your preferred color theme')}
          </p>
        </div>

        <div className="col-span-3">
          <select
            value={localTheme}
            onChange={(e) => setLocalTheme(e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="light">{t('settings.theme.light', 'Light')}</option>
            <option value="dark">{t('settings.theme.dark', 'Dark')}</option>
            <option value="system">{t('settings.theme.system', 'System')}</option>
          </select>
        </div>
      </div>

      {/* Language Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-b border-border">
        <div>
          <p className="text-md font-semibold text-foreground">
            {t('settings.language.title', 'Language')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.language.description', 'Select your preferred language')}
          </p>
        </div>

        <div className="col-span-3">
          <select
            value={localLanguage}
            onChange={(e) => setLocalLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="en">{t('settings.language.english', 'English')}</option>
            <option value="es">{t('settings.language.spanish', 'Español')}</option>
          </select>
        </div>
      </div>

      {/* Accent Color Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-b border-border">
        <div>
          <p className="text-md font-semibold text-foreground">
            {t('settings.accentColor.title', 'Accent Color')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.accentColor.description', 'Choose your accent color')}
          </p>
        </div>

        <div className="col-span-3">
          <ColorPicker
            selectedColor={localAccentColor}
            onColorChange={setLocalAccentColor}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end py-6 border-t border-border">
        <Button
          variant="theme"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? t('actions.saving', 'Saving...') : t('actions.save', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}
