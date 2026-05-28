import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Invoice } from '@/api/invoices';
import InvoiceModal from '@/app/pages/invoices/components/invoice-modal';

export interface NewInvoiceButtonProps {
  onSubmit?: (invoice: Invoice) => void | Promise<void>;
}

export default function NewInvoiceButton({ onSubmit }: NewInvoiceButtonProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const handleInvoiceCreated = async (invoice: Invoice) => {
    await onSubmit?.(invoice);
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
        {t('pages.invoices.newInvoice', 'New Invoice')}
      </Button>
      <InvoiceModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSubmit={handleInvoiceCreated}
      />
    </>
  );
}
