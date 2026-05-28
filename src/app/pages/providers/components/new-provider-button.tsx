import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ProviderModal from '@/app/pages/providers/components/provider-modal';

interface NewProviderButtonProps {
  onSubmit?: () => Promise<void>;
}

export default function NewProviderButton({ onSubmit }: NewProviderButtonProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const handleProviderCreated = async () => {
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
        {t('pages.providers.newProvider')}
      </Button>
      <ProviderModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleProviderCreated} />
    </>
  );
}
