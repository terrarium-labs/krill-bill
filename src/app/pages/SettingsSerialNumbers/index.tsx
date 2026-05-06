import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/app/components/page-header';
import SerialNumbersTable from './components/serial-numbers-table';
import SerialNumberModal from './components/serial-number-modal';
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

export default function SettingsSerialNumbers() {
  const { t } = useTranslation();
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load serial numbers
  useEffect(() => {
    const timer = setTimeout(() => {
      setSerialNumbers(mockSerialNumbers);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = (data: Omit<SerialNumber, 'id'>) => {
    const newSerialNumber: SerialNumber = {
      ...data,
      id: Date.now().toString(),
    };
    setSerialNumbers([...serialNumbers, newSerialNumber]);
    toast.success(t('toasts.serialNumberCreated'));
    setModalOpen(false);
  };

  const handleEdit = (id: string, data: Omit<SerialNumber, 'id'>) => {
    setSerialNumbers(
      serialNumbers.map((sn) => (sn.id === id ? { ...data, id } : sn))
    );
    toast.success(t('toasts.serialNumberUpdated'));
    setModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSerialNumbers(serialNumbers.filter((sn) => sn.id !== id));
    toast.success(t('toasts.serialNumberDeleted'));
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
      <PageHeader
        title={t('pages.serialNumbers.title')}
        description={t('pages.serialNumbers.description')}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            placeholder={t('pages.serialNumbers.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:placeholder-gray-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          {t('pages.serialNumbers.newSerialNumber')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-green-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('pages.serialNumbers.loading')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SerialNumbersTable
            data={filteredNumbers}
            onEdit={(sn) => {
              setEditingId(sn.id);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Modal */}
      <SerialNumberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={(data) => {
          if (editingId) {
            handleEdit(editingId, data);
          } else {
            handleCreate(data);
          }
        }}
        initialData={editingNumber || undefined}
        mode={editingNumber ? 'edit' : 'create'}
      />
    </div>
  );
}
