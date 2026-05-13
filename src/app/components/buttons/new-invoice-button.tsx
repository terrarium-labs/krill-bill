import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import InvoiceModal from '@/app/components/modals/invoice-modal';

export default function NewInvoiceButton() {
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
        {t('pages.invoices.newInvoice')}
      </Button>
      <InvoiceModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
