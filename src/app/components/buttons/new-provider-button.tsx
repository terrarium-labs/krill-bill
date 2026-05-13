import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ProviderModal from '@/app/components/modals/provider-modal';

export default function NewProviderButton() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

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
      <ProviderModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
