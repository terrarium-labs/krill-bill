import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/app/components/page-header';
import SerialNumbersTable from './components/serial-numbers-table';
import SerialNumberModal from './components/serial-number-modal';
import { DeleteModal } from '@/app/components/modals/delete-modal';
import { SerialNumber } from '@/types/serial-numbers';

// Mock API functions (replace with real API calls)
const mockSerialNumbers: SerialNumber[] = [
  {
    id: '1',
    entity: 'sales_invoices',
    name: 'SI',
    value: 'SI-[YYYY]-%%%%',
    last_num_value: 100,
  },
  {
    id: '2',
    entity: 'purchase_invoices',
    name: 'PI',
    value: 'PI-[MM]/[YYYY]-%%%',
    last_num_value: 45,
  },
];

export default function SettingsSerialNumbersPage() {
  const { t } = useTranslation();
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serialNumberToDelete, setSerialNumberToDelete] = useState<SerialNumber | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load serial numbers
  useEffect(() => {
    const timer = setTimeout(() => {
      setSerialNumbers(mockSerialNumbers);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async (data: Omit<SerialNumber, 'id'>) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newSerialNumber: SerialNumber = {
        ...data,
        id: Date.now().toString(),
      };
      setSerialNumbers([...serialNumbers, newSerialNumber]);
      toast.success(t('toasts.serialNumberCreated'));
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string, data: Omit<SerialNumber, 'id'>) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setSerialNumbers(
        serialNumbers.map((sn) => (sn.id === id ? { ...data, id } : sn))
      );
      toast.success(t('toasts.serialNumberUpdated'));
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (serialNumber: SerialNumber) => {
    setSerialNumberToDelete(serialNumber);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serialNumberToDelete) return;
    
    setDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setSerialNumbers(serialNumbers.filter((sn) => sn.id !== serialNumberToDelete.id));
      toast.success(t('toasts.serialNumberDeleted'));
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = (id: string) => {
    const sn = serialNumbers.find((s) => s.id === id);
    if (sn) {
      handleDeleteClick(sn);
    }
  };

  const filteredNumbers = serialNumbers.filter(
    (sn) =>
      sn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sn.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editingNumber = editingId
    ? serialNumbers.find((sn) => sn.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('serialNumbers.deleteTitle', 'Delete Serial Number?')}
        description={t('serialNumbers.deleteDescription', `Are you sure you want to delete "${serialNumberToDelete?.name}"? This action cannot be undone.`)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleting}
        deleteText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
      />
      <PageHeader
        title={t('pages.serialNumbers.title')}
        description={t('pages.serialNumbers.description')}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t('pages.serialNumbers.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          {t('pages.serialNumbers.newSerialNumber')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <SerialNumbersTable
          data={filteredNumbers}
          isLoading={isLoading}
          onEdit={(sn) => {
            setEditingId(sn.id);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          searchQuery={searchQuery}
          emptyStateActionLabel={t('pages.serialNumbers.newSerialNumber')}
          onEmptyStateAction={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
        />
      </div>

      {/* Modal */}
      <SerialNumberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={(data) => {
          if (editingId) {
            return handleEdit(editingId, data);
          } else {
            return handleCreate(data);
          }
        }}
        initialData={editingNumber || undefined}
        mode={editingNumber ? 'edit' : 'create'}
        isSubmitting={isSubmitting}
        onClose={() => {
          setEditingId(null);
          setIsSubmitting(false);
        }}
      />
    </div>
  );
}
