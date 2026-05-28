import { useTranslation } from 'react-i18next';
import { getTextColorClasses } from '@/app/utils/colors';
import NewInvoiceButton from '@/app/pages/invoices/components/new-invoice-button';
import NewClientButton from '@/app/pages/clients/components/new-client-button';
import PageHeader from '@/app/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={t('pages.dashboard.title')}
          description={t('pages.dashboard.subtitle')}
        />
        <div className="flex gap-2">
          <NewInvoiceButton />
          <NewClientButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        {[
          { value: '0', label: t('pages.dashboard.invoicesCreated'), color: 'green' },
          { value: '0', label: t('pages.dashboard.totalAmount'), color: 'blue' },
          { value: '0', label: t('pages.dashboard.clients'), color: 'purple' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent>
              <div className={`text-4xl font-bold ${getTextColorClasses(stat.color)}`}>{stat.value}</div>
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('pages.dashboard.gettingStarted')}</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>{t('pages.dashboard.step1')}</li>
            <li>{t('pages.dashboard.step2')}</li>
            <li>{t('pages.dashboard.step3')}</li>
            <li>{t('pages.dashboard.step4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
