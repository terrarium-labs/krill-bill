import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewInvoiceButton from '@/app/pages/invoices/components/new-invoice-button';
import InvoicesTable from '@/app/pages/invoices/components/invoices-table';
import InvoiceModal from '@/app/pages/invoices/components/invoice-modal';
import { useInvoices } from '@/app/pages/invoices/contexts/InvoicesContext';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const { invoices, isLoading, refreshInvoices } = useInvoices();
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
        <NewInvoiceButton onSubmit={handleInvoiceCreated} />
      </div>

      <InvoicesTable invoices={invoices} isLoading={isLoading} onRefresh={refreshInvoices} />

      <InvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleInvoiceCreated}
      />
    </div>
  );
}
