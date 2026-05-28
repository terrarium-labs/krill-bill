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
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { generateNextDocumentNumber } from '@/app/utils/serial-number-patterns';

export type SerialNumberTableColumnKey =
  | 'name'
  | 'entity'
  | 'pattern'
  | 'nextNumber'
  | 'actions';

interface SerialNumbersTableProps {
  data: SerialNumber[];
  isLoading?: boolean;
  /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
  hiddenColumns?: SerialNumberTableColumnKey[] | SerialNumberTableColumnKey;
  renderActions?: (serialNumber: SerialNumber) => ReactNode;
  onRowClick?: (serialNumber: SerialNumber) => void;
  clickableRows?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onEmptyStateAction?: () => void;
  emptyStateActionLabel?: string;
  searchQuery?: string;
  /** TanStack column visibility (from preferences) */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /** TanStack column order */
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  /** TanStack column sizing */
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  onEdit: (serialNumber: SerialNumber) => void;
  onDelete: (id: string) => void;
}

const SerialNumbersTableComponent = ({
  data,
  isLoading = false,
  hiddenColumns = [],
  renderActions,
  onRowClick,
  clickableRows = true,
  emptyStateTitle,
  emptyStateDescription,
  onEmptyStateAction,
  emptyStateActionLabel,
  searchQuery = '',
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

    if (renderActions) {
      cols.push({
        id: 'actions',
        enableResizing: false,
        size: 52,
        header: ({ header }) => (
          <TableColumnHeader
            column={header.column}
            className="justify-center items-center flex"
            title=""
          />
        ),
        cell: ({ row }) => (
          <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            {renderActions(row.original)}
          </div>
        ),
        meta: { sticky: 'right' },
      });
    }

    return cols;
  }, [t, renderActions]);

  const defaultEmptyTitle = searchQuery
    ? t('pages.serialNumbers.noResultsFound', 'No serial numbers found')
    : t('pages.serialNumbers.noResults', 'No serial numbers yet');

  const defaultEmptyDescription = searchQuery
    ? t('pages.serialNumbers.noResultsDescription', "No serial numbers match your search for '{{searchQuery}}'", {
        searchQuery,
      })
    : t('pages.serialNumbers.createFirst', 'Start by creating your first serial number pattern');

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
          emptyState={
            <TableRowRaw className="hover:bg-transparent">
              <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                <div className="flex items-center justify-center space-y-4 flex-col">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-lg font-medium">
                      {emptyStateTitle || defaultEmptyTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {emptyStateDescription || defaultEmptyDescription}
                    </p>
                  </div>
                  {(onEmptyStateAction || onEmptyStateAction) && (
                    <div className="flex items-center gap-2">
                      {onEmptyStateAction && (
                        <Button variant="outline" onClick={onEmptyStateAction}>
                          <Plus className="h-4 w-4" />
                          {emptyStateActionLabel || t('pages.serialNumbers.newSerialNumber', 'Add Serial Number')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TableCellRaw>
            </TableRowRaw>
          }
        >
          {({ row }) => {
            const serialNumber = row.original as SerialNumber;
            return (
              <TableRowRaw
                key={row.id}
                className={clickableRows ? 'hover:bg-muted/50 cursor-pointer' : 'hover:bg-muted/50'}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => clickableRows && onRowClick?.(serialNumber)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} cell={cell} />
                ))}
                {!renderActions && (
                  <TableCellRaw className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(serialNumber);
                        }}
                        title={t('buttons.edit', 'Edit')}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t('common.confirmDelete', 'Are you sure?'))) {
                            onDelete(serialNumber.id);
                          }
                        }}
                        title={t('buttons.delete', 'Delete')}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCellRaw>
                )}
              </TableRowRaw>
            );
          }}
        </TableBody>
      </TableProvider>
    </div>
  );
};

export const SerialNumbersTable = memo(SerialNumbersTableComponent);
export default SerialNumbersTable;
