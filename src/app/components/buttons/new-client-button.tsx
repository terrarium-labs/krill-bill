import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ClientModal from '@/app/components/modals/client-modal';
import { useClients } from '@/contexts/ClientsContext';

export default function NewClientButton() {
  const { t } = useTranslation();
  const { refreshClients } = useClients();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClientCreated = async () => {
    await refreshClients();
    setModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="theme"
        className="flex items-center gap-2"
      >
        <Plus size={18} />
        {t('pages.clients.newClient')}
      </Button>
      <ClientModal open={modalOpen} onOpenChange={setModalOpen} onClientCreated={handleClientCreated} />
    </>
  );
}
