import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('pages.dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pages.dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-green-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pages.dashboard.invoicesCreated')}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-blue-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pages.dashboard.totalAmount')}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-purple-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pages.dashboard.clients')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('pages.dashboard.gettingStarted')}</h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>{t('pages.dashboard.step1')}</li>
          <li>{t('pages.dashboard.step2')}</li>
          <li>{t('pages.dashboard.step3')}</li>
          <li>{t('pages.dashboard.step4')}</li>
        </ul>
      </div>
    </div>
  );
}
