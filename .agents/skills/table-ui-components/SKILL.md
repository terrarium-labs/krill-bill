# Table & UI Components Skill

## Overview
This skill documents the pattern for creating and maintaining table and UI components in Krill Bill. Tables use TanStack React Table for complex functionality with responsive design.

## File Location
- **Tables**: `/src/app/components/tables/` - Complex data displays with sorting, filtering, resizing
- **UI Components**: `/src/components/ui/` - Reusable shadcn-based components

## Table Architecture

### Reference Implementation: SerialNumbersTable

The `serial-numbers-table.tsx` demonstrates the complete table pattern:

```typescript
import { memo, useMemo, type ReactNode } from 'react';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SerialNumber } from '@/types/serial-numbers';
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableHead,
  TableBody,
  TableCell,
  TableColumnHeader,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
} from '@/components/ui/shadcn-io/table';
import type { OnChangeFn } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

// 1. Define Column Key Type
export type SerialNumberTableColumnKey = 'name' | 'entity' | 'pattern' | 'nextNumber' | 'actions';

// 2. Define Props Interface
interface SerialNumbersTableProps {
  data: SerialNumber[];
  isLoading?: boolean;
  hiddenColumns?: SerialNumberTableColumnKey[];
  renderActions?: (item: SerialNumber) => ReactNode;
  onRowClick?: (item: SerialNumber) => void;
  clickableRows?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  onEdit: (item: SerialNumber) => void;
  onDelete: (id: string) => void;
}

// 3. Create Memoized Component
const SerialNumbersTableComponent = ({
  data,
  isLoading = false,
  hiddenColumns = [],
  renderActions,
  onRowClick,
  clickableRows = true,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  onEdit,
  onDelete,
}: SerialNumbersTableProps) => {
  const { t } = useTranslation();

  // 4. Process Hidden Columns
  const hiddenColumnsArray = useMemo(() => {
    if (Array.isArray(hiddenColumns)) return hiddenColumns;
    return hiddenColumns ? [hiddenColumns] : [];
  }, [hiddenColumns]);

  const effectiveColumnVisibility = useMemo<VisibilityState | undefined>(() => {
    if (hiddenColumnsArray.length === 0) return columnVisibility;
    const structural = hiddenColumnsArray.reduce<VisibilityState>((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    return { ...(columnVisibility ?? {}), ...structural };
  }, [columnVisibility, hiddenColumnsArray]);

  // 5. Define Columns
  const columns = useMemo<ColumnDef<SerialNumber>[]>(() => {
    const cols: ColumnDef<SerialNumber>[] = [
      {
        accessorKey: 'name',
        header: t('table.name'),
        enableResizing: true,
        size: 120,
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
        ),
      },
      {
        id: 'entity',
        header: t('table.entity'),
        enableResizing: true,
        size: 140,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[color:var(--accent-background)] text-[color:var(--accent-color)] border border-[color:var(--accent-border)]">
            {row.original.entity.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        id: 'pattern',
        header: t('table.pattern'),
        enableResizing: true,
        size: 180,
        cell: ({ row }) => (
          <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {row.original.value}
          </code>
        ),
      },
      {
        id: 'nextNumber',
        header: t('table.nextNumber'),
        enableResizing: true,
        size: 160,
        cell: ({ row }) => (
          <div className="font-mono text-sm font-semibold text-primary bg-primary/10 rounded px-2 py-1 inline-block">
            {generateNextDocumentNumber(row.original.value, row.original.last_num_value) || '-'}
          </div>
        ),
      },
    ];

    // Actions column (optional)
    if (renderActions) {
      cols.push({
        id: 'actions',
        enableResizing: false,
        size: 52,
        header: ({ header }) => (
          <TableColumnHeader column={header.column} />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            {renderActions(row.original)}
          </div>
        ),
      });
    }

    return cols;
  }, [t, renderActions]);

  // 6. Render Table
  return (
    <div className="w-full overflow-x-auto">
      <TableProvider
        data={data}
        columns={columns}
        enableColumnResizing
        columnVisibility={effectiveColumnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        columnSizing={columnSizing}
        onColumnSizingChange={onColumnSizingChange}
      >
        <TableHeader>
          {({ headerGroup }) => (
            <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
              {({ header }) => <TableHead key={header.id} header={header} />}
            </TableHeaderGroup>
          )}
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingState={<TableSkeleton columnCount={columns.length} />}
          emptyState={<EmptyState />}
        >
          {({ row }) => (
            <TableRowRaw
              key={row.id}
              className={clickableRows ? 'hover:bg-muted/50 cursor-pointer' : ''}
              onClick={() => clickableRows && onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} cell={cell} />
              ))}
            </TableRowRaw>
          )}
        </TableBody>
      </TableProvider>
    </div>
  );
};

export const SerialNumbersTable = memo(SerialNumbersTableComponent);
```

## Key Patterns

### 1. Column Definition Pattern

```typescript
// Simple column with custom render
{
  accessorKey: 'name',
  header: t('table.name'),
  enableResizing: true,
  size: 120,
  cell: ({ row }) => (
    <div className="font-medium">{row.original.name}</div>
  ),
}

// Computed column (no direct accessor)
{
  id: 'computed',
  header: t('table.computed'),
  cell: ({ row }) => {
    // Compute value from row data
    const computed = row.original.value * 2;
    return <span>{computed}</span>;
  },
}

// Badge/Status column
{
  id: 'status',
  header: t('table.status'),
  cell: ({ row }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-accent/10 text-accent">
      {row.original.status}
    </span>
  ),
}
```

### 2. Empty State Pattern

```typescript
const EmptyState = () => {
  return (
    <TableRowRaw className="hover:bg-transparent">
      <TableCellRaw className="h-96 text-center" colSpan={columns.length}>
        <div className="flex items-center justify-center space-y-4 flex-col">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium">
              {emptyStateTitle || t('table.noResults')}
            </h3>
            <p className="text-muted-foreground">
              {emptyStateDescription}
            </p>
          </div>
          {onEmptyStateAction && (
            <Button variant="outline" onClick={onEmptyStateAction}>
              <Plus className="h-4 w-4" />
              {emptyStateActionLabel}
            </Button>
          )}
        </div>
      </TableCellRaw>
    </TableRowRaw>
  );
};
```

### 3. Actions Column Pattern

```typescript
// Render custom actions
{
  id: 'actions',
  enableResizing: false,
  size: 52,
  cell: ({ row }) => (
    <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(row.original);
        }}
      >
        <Edit2 size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(t('common.confirmDelete'))) {
            onDelete(row.original.id);
          }
        }}
      >
        <Trash2 size={16} className="text-destructive" />
      </Button>
    </div>
  ),
}
```

### 4. Loading State Pattern

```typescript
<TableBody
  isLoading={isLoading}
  loadingState={<TableSkeleton columnCount={columns.length} />}
>
  {/* Table rows */}
</TableBody>
```

## Responsive Design

### Mobile-First Approach

```typescript
// Hide columns on small screens
const effectiveVisibility = useMemo(() => {
  const isMobile = window.innerWidth < 768;
  return {
    ...columnVisibility,
    description: !isMobile, // Only show on desktop
    actions: true, // Always show actions
  };
}, [columnVisibility]);
```

### Overflow Handling

```typescript
// Container with horizontal scroll on mobile
<div className="w-full overflow-x-auto">
  <TableProvider data={data} columns={columns}>
    {/* Table content */}
  </TableProvider>
</div>
```

## State Management in Tables

### Column Visibility State
```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
```

### Column Sizing
```typescript
const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
```

### Column Order
```typescript
const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
```

## Performance Optimization

### 1. Memoization
```typescript
// Memoize the entire component
export const SerialNumbersTable = memo(SerialNumbersTableComponent);

// Memoize column definitions
const columns = useMemo<ColumnDef<T>[]>(() => {
  // ... column definitions
}, [dependencies]);
```

### 2. Event Delegation
```typescript
// Stop event bubbling for interactive elements
<button onClick={(e) => {
  e.stopPropagation();
  handleAction();
}}>
  Action
</button>
```

## Integration with Pages

### Usage in Page Component

```typescript
export default function SerialNumbersPage() {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    loadSerialNumbers();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('pages.serialNumbers.title')} />
      
      <SerialNumbersTable
        data={serialNumbers}
        isLoading={isLoading}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

## Common Column Types Reference

### Text Column
```typescript
{ accessorKey: 'name', header: t('table.name') }
```

### Number Column
```typescript
{
  accessorKey: 'amount',
  header: t('table.amount'),
  cell: ({ row }) => (
    <span className="font-mono">
      €{parseFloat(row.original.amount).toFixed(2)}
    </span>
  ),
}
```

### Date Column
```typescript
{
  accessorKey: 'createdAt',
  header: t('table.createdAt'),
  cell: ({ row }) => (
    new Date(row.original.createdAt).toLocaleDateString()
  ),
}
```

### Boolean/Status Column
```typescript
{
  id: 'active',
  header: t('table.active'),
  cell: ({ row }) => (
    <span className={row.original.active ? 'text-green-600' : 'text-red-600'}>
      {row.original.active ? '✓ Active' : '✗ Inactive'}
    </span>
  ),
}
```

## Best Practices

1. **Always Use Types**: Import and use proper TypeScript types for data
2. **Memoization**: Wrap components and expensive computations with `useMemo` and `memo`
3. **Translation Keys**: Use translation keys for all user-facing text
4. **Event Handling**: Use `stopPropagation()` to prevent row click bubbling
5. **Empty States**: Always provide meaningful empty state messages
6. **Loading States**: Show skeleton loaders for better UX
7. **Column Sizing**: Set reasonable default sizes for columns
8. **Accessibility**: Use semantic HTML and proper ARIA attributes
9. **Responsive**: Test tables on mobile and ensure horizontal scroll works
10. **Actions**: Keep action buttons in a dedicated column with proper spacing
