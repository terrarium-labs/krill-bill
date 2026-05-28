import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ClientModal from '@/app/pages/clients/components/client-modal';

interface NewClientButtonProps {
  onSubmit?: () => Promise<void>;
}

export default function NewClientButton({ onSubmit }: NewClientButtonProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClientCreated = async () => {
    await onSubmit?.();
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
      <ClientModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleClientCreated} />
    </>
  );
}
