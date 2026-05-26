import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewInvoiceButton from '@/app/components/buttons/new-invoice-button';
import InvoicesTable from '@/app/components/tables/invoices-table';
import InvoiceModal from '@/app/components/modals/invoice-modal';
import { useInvoices } from '@/contexts/InvoicesContext';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const { refreshInvoices } = useInvoices();
  const [modalOpen, setModalOpen] = useState(false);

  const handleInvoiceCreated = async () => {
    await refreshInvoices();
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader
            title={t('pages.invoices.title')}
            description={t('pages.invoices.description')}
          />
        </div>
        <NewInvoiceButton onInvoiceCreated={handleInvoiceCreated} />
      </div>

      <InvoicesTable />

      <InvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}
