import { useTranslation } from 'react-i18next';
import { getTextColorClasses } from '@/utils/colors';
import NewInvoice from '@/app/components/buttons/NewInvoice';
import NewClient from '@/app/components/buttons/NewClient';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('pages.dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pages.dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <NewInvoice />
          <NewClient />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        {[
          { value: '0', label: t('pages.dashboard.invoicesCreated'), color: 'green' },
          { value: '0', label: t('pages.dashboard.totalAmount'), color: 'blue' },
          { value: '0', label: t('pages.dashboard.clients'), color: 'purple' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className={`text-4xl font-bold ${getTextColorClasses(stat.color)}`}>{stat.value}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</p>
          </div>
        ))}
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
