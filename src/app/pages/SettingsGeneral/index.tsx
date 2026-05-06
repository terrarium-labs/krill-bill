import { useTranslation } from 'react-i18next';
import PageHeader from '@/app/components/page-header';

export default function SettingsGeneral() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.settingsGeneral.title')}
        description={t('pages.settingsGeneral.description')}
      />

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('pages.settingsGeneral.comingSoon')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('pages.settingsGeneral.comingSoonDesc')}
        </p>
      </div>
    </div>
  );
}
