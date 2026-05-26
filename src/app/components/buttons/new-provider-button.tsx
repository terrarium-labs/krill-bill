import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ProviderModal from '@/app/components/modals/provider-modal';
import { useProviders } from '@/contexts/ProvidersContext';

export default function NewProviderButton() {
  const { t } = useTranslation();
  const { refreshProviders } = useProviders();
  const [modalOpen, setModalOpen] = useState(false);

  const handleProviderCreated = async () => {
    await refreshProviders();
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
        {t('pages.providers.newProvider')}
      </Button>
      <ProviderModal open={modalOpen} onOpenChange={setModalOpen} onProviderCreated={handleProviderCreated} />
    </>
  );
}
