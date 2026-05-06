import { useState } from 'react';
import { Plus } from 'lucide-react';
import InvoiceModal from '@/app/components/modals/invoice-modal';

export default function NewInvoice() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <Plus size={18} />
        Invoice
      </button>
      <InvoiceModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
