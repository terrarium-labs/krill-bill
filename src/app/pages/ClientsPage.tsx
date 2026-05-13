import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewClientButton from '@/app/components/buttons/new-client-button';
import { getTextColorClasses } from '@/app/utils/colors';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.clients.title')}
        description={t('pages.clients.description')}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t('pages.clients.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        <NewClientButton />
      </div>

      {/* Empty State */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('pages.clients.noClients')}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t('pages.clients.addFirstClient')}
          </p>
          <NewClientButton />
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: '0', label: t('pages.clients.totalClients'), color: 'purple' },
          { value: '€0.00', label: t('pages.clients.totalRevenue'), color: 'green' },
          { value: '0', label: t('pages.clients.activeContracts'), color: 'blue' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent>
              <div className={`text-4xl font-bold ${getTextColorClasses(stat.color)}`}>{stat.value}</div>
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
