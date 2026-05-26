import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewClientButton from '@/app/components/buttons/new-client-button';
import ClientsTable from '@/app/components/tables/clients-table';
import ClientModal from '@/app/components/modals/client-modal';
import { useClients } from '@/contexts/ClientsContext';
import { Client } from '@/types/clients';

export default function ClientsPage() {
  const { t } = useTranslation();
  const { refreshClients } = useClients();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientCreated = async () => {
    await refreshClients();
    setModalOpen(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader
            title={t('pages.clients.title')}
            description={t('pages.clients.description')}
          />
        </div>
        <NewClientButton />
      </div>

      <ClientsTable onEdit={handleEditClient} />

      <ClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={selectedClient || undefined}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
