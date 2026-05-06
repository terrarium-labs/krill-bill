import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewInvoice from '@/app/components/buttons/NewInvoice';
import { getTextColorClasses } from '@/utils/colors';

export default function Invoices() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.invoices.title')}
        description={t('pages.invoices.description')}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            placeholder={t('pages.invoices.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:placeholder-gray-500"
          />
        </div>
        <NewInvoice />
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('pages.invoices.noInvoices')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-sm">
            {t('pages.invoices.createFirstInvoice')}
          </p>
          <div className="mt-6">
            <NewInvoice />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: '0', label: t('pages.invoices.totalInvoices'), color: 'blue' },
          { value: '€0.00', label: t('pages.invoices.totalAmount'), color: 'green' },
          { value: '0', label: t('pages.invoices.pending'), color: 'amber' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className={`text-4xl font-bold ${getTextColorClasses(stat.color)}`}>{stat.value}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
