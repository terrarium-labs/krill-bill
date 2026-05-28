import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewProviderButton from '@/app/pages/providers/components/new-provider-button';
import ProvidersTable from '@/app/pages/providers/components/providers-table';
import ProviderModal from '@/app/pages/providers/components/provider-modal';
import { useProviders } from '@/app/pages/providers/contexts/ProvidersContext';
import { Provider } from '@/types/providers';

export default function ProvidersPage() {
  const { t } = useTranslation();
  const { providers, isLoading, refreshProviders } = useProviders();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleProviderCreated = async () => {
    await refreshProviders();
    setModalOpen(false);
    setSelectedProvider(null);
  };

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader
            title={t('pages.providers.title')}
            description={t('pages.providers.description')}
          />
        </div>
        <NewProviderButton onSubmit={refreshProviders} />
      </div>

      <ProvidersTable providers={providers} isLoading={isLoading} onRefresh={refreshProviders} onEdit={handleEditProvider} />

      <ProviderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        provider={selectedProvider || undefined}
        onSubmit={handleProviderCreated}
      />
    </div>
  );
}
