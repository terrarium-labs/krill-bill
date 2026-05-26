# Page Architecture Skill

## Overview
This skill documents the pattern for creating and maintaining page components in Krill Bill. Pages integrate tables, modals, forms, and state management to provide complete feature experiences.

## File Location
Page components are stored in `/src/app/pages/` and represent major features:
- `InvoicesPage.tsx` - Invoice listing and management
- `ClientsPage.tsx` - Client management
- `ProvidersPage.tsx` - Provider management
- `SettingsSerialNumbersPage.tsx` - Serial number pattern configuration
- `DashboardPage.tsx` - Analytics and overview

## Page Architecture

### Reference Implementation: SettingsSerialNumbersPage

The `SettingsSerialNumbersPage.tsx` demonstrates the complete page pattern:

```typescript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/app/components/page-header';
import SerialNumbersTable from '../components/tables/serial-numbers-table';
import SerialNumberModal from '../components/modals/serial-number-modal';
import { SerialNumber } from '@/types/serial-numbers';

// 1. Import API Functions
import { fetchSerialNumbers, createSerialNumber, updateSerialNumber, deleteSerialNumber } from '@/api/serial-numbers';

export default function SettingsSerialNumbersPage() {
  const { t } = useTranslation();

  // 2. Define State
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Load Initial Data
  useEffect(() => {
    loadSerialNumbers();
  }, []);

  const loadSerialNumbers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchSerialNumbers();
      if (error) {
        toast.error(t('toasts.error.loadingFailed', 'Failed to load serial numbers'));
        return;
      }
      setSerialNumbers(data);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle CRUD Operations
  const handleCreate = async (data: Omit<SerialNumber, 'id'>) => {
    setIsSubmitting(true);
    try {
      const { data: created, error } = await createSerialNumber(data);
      if (error) {
        toast.error(t('toasts.error.creatingFailed'));
        return;
      }
      setSerialNumbers([...serialNumbers, created]);
      toast.success(t('toasts.serialNumberCreated'));
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string, data: Omit<SerialNumber, 'id'>) => {
    setIsSubmitting(true);
    try {
      const { data: updated, error } = await updateSerialNumber(id, data);
      if (error) {
        toast.error(t('toasts.error.updatingFailed'));
        return;
      }
      setSerialNumbers(
        serialNumbers.map((sn) => (sn.id === id ? updated : sn))
      );
      toast.success(t('toasts.serialNumberUpdated'));
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure?'))) {
      return;
    }

    try {
      const { error } = await deleteSerialNumber(id);
      if (error) {
        toast.error(t('toasts.error.deletingFailed'));
        return;
      }
      setSerialNumbers(serialNumbers.filter((sn) => sn.id !== id));
      toast.success(t('toasts.serialNumberDeleted'));
    } catch (error) {
      toast.error(t('toasts.error.unexpectedError'));
    }
  };

  // 5. Filter Data
  const filteredNumbers = serialNumbers.filter(
    (sn) =>
      sn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sn.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editingNumber = editingId
    ? serialNumbers.find((sn) => sn.id === editingId)
    : null;

  // 6. Render Page
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('pages.serialNumbers.title')}
        description={t('pages.serialNumbers.description')}
      />

      {/* Search and Actions Bar */}
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
            className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-theme text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus size={18} />
          {t('pages.serialNumbers.newSerialNumber')}
        </button>
      </div>

      {/* Table */}
      <SerialNumbersTable
        data={filteredNumbers}
        isLoading={isLoading}
        onEdit={(sn) => {
          setEditingId(sn.id);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <SerialNumberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={(data) =>
          editingId
            ? handleEdit(editingId, data)
            : handleCreate(data)
        }
        isSubmitting={isSubmitting}
        initialData={editingNumber}
      />
    </div>
  );
}
```

### Reference Implementation: ClientsPage

The `ClientsPage.tsx` demonstrates the list page pattern with stats:

```typescript
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/app/components/page-header';
import NewClientButton from '@/app/components/buttons/new-client-button';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('pages.clients.title')}
        description={t('pages.clients.description')}
      />

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t('pages.clients.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <NewClientButton />
      </div>

      {/* Empty State */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('pages.clients.noClients')}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t('pages.clients.addFirstClient')}
          </p>
          <div className="mt-6">
            <NewClientButton />
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: '0', label: t('pages.clients.totalClients'), color: 'purple' },
          { value: '€0.00', label: t('pages.clients.totalRevenue'), color: 'green' },
          { value: '0', label: t('pages.clients.activeContracts'), color: 'blue' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent>
              <div className={`text-4xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </div>
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Page Patterns

### 1. CRUD List Page Pattern

For pages that list and manage items:

```typescript
export default function ListPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchItems();
      if (error) {
        toast.error(t('errors.loadFailed'));
        return;
      }
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: CreateItemInput) => {
    try {
      const { data: created, error } = await createItem(data);
      if (error) throw new Error(error);
      setItems([...items, created]);
      toast.success(t('toasts.created'));
      setModalOpen(false);
    } catch (error) {
      toast.error(t('errors.createFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    
    try {
      const { error } = await deleteItem(id);
      if (error) throw new Error(error);
      setItems(items.filter(i => i.id !== id));
      toast.success(t('toasts.deleted'));
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('pages.title')} />
      
      <SearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        onAdd={() => setModalOpen(true)}
      />
      
      <ItemsTable
        data={filteredItems}
        isLoading={isLoading}
        onEdit={(item) => setEditingId(item.id)}
        onDelete={handleDelete}
      />
      
      <ItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
```

### 2. Empty State Pattern

```typescript
function EmptyState() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold">No items yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Get started by creating your first item
        </p>
        <div className="mt-6">
          <Button onClick={handleCreate}>Create Item</Button>
        </div>
      </div>
    </Card>
  );
}
```

### 3. Stats Card Pattern

```typescript
interface StatCardProps {
  value: string;
  label: string;
  color?: 'purple' | 'green' | 'blue' | 'orange';
  icon?: ReactNode;
}

function StatCard({ value, label, color = 'blue', icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className={`text-4xl font-bold text-${color}-600`}>
            {value}
          </div>
          {icon}
        </div>
        <p className="text-muted-foreground text-sm">{label}</p>
      </CardContent>
    </Card>
  );
}
```

### 4. Search and Filter Pattern

```typescript
function SearchBar({ query, onChange, onAdd }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
        />
      </div>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-theme text-white rounded-lg hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
      >
        <Plus size={18} />
        Add New
      </button>
    </div>
  );
}
```

## State Management Patterns

### Loading State
```typescript
if (isLoading) {
  return <LoadingSkeleton />;
}
```

### Error State
```typescript
if (error) {
  return (
    <Card>
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold">Something went wrong</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => loadData()}>Try Again</Button>
      </div>
    </Card>
  );
}
```

### Empty State
```typescript
if (items.length === 0) {
  return <EmptyState onCreateNew={handleCreateNew} />;
}
```

## Page Composition Example

### Complete Invoice Page
```typescript
export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const { data, error } = await fetchInvoices();
    if (!error) setInvoices(data);
    setIsLoading(false);
  };

  const handleCreateInvoice = async (data: InvoiceData) => {
    const { data: created, error } = await createInvoice(data);
    if (!error) {
      setInvoices([...invoices, created]);
      setModalOpen(false);
      toast.success(t('toasts.invoiceCreated'));
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.includes(searchQuery) ||
    inv.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PageHeader
        title={t('pages.invoices.title')}
        description={t('pages.invoices.description')}
      />

      {/* Search and Actions */}
      <SearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        onAdd={() => setModalOpen(true)}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard value={invoices.length} label={t('stats.total')} />
        <StatCard value={calculateTotal(invoices)} label={t('stats.revenue')} />
        <StatCard value={calculatePending(invoices)} label={t('stats.pending')} />
        <StatCard value={calculateOverdue(invoices)} label={t('stats.overdue')} />
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState onCreateNew={() => setModalOpen(true)} />
      ) : (
        <InvoicesTable
          data={filteredInvoices}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onDownload={handleDownloadPDF}
        />
      )}

      {/* Modal */}
      <InvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onInvoiceCreated={handleCreateInvoice}
      />
    </div>
  );
}
```

## Best Practices

1. **State Organization**: Group related state together
2. **Effect Dependencies**: Keep useEffect dependencies minimal and correct
3. **Error Handling**: Always provide error feedback to users
4. **Loading States**: Show loading indicators during async operations
5. **Empty States**: Provide helpful empty state UI and actions
6. **Search/Filter**: Implement client-side filtering for better UX
7. **Confirmation**: Confirm destructive actions with dialogs
8. **Toast Notifications**: Use toast for success/error feedback
9. **Responsive Design**: Ensure mobile-friendly layouts
10. **Accessibility**: Use semantic HTML and keyboard navigation
