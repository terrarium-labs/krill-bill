import type {
  Cell,
  Column,
  ColumnDef,
  ColumnOrderState,
  ColumnResizeMode,
  ColumnSizingState,
  Header,
  HeaderGroup,
  OnChangeFn,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { atom, useAtom } from 'jotai';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { createContext, memo, useCallback, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHeader as TableHeaderRaw,
  TableHead as TableHeadRaw,
  Table as TableRaw,
  TableRow as TableRowRaw,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type { ColumnDef, VisibilityState, ColumnOrderState, ColumnSizingState } from '@tanstack/react-table';

// Extend the ColumnMeta type to include sticky property and className
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    sticky?: 'left' | 'right';
    className?: string;
  }
}

const sortingAtom = atom<SortingState>([]);

export const TableContext = createContext<{
  data: unknown[];
  columns: ColumnDef<unknown, unknown>[];
  table: Table<unknown> | null;
  enableColumnResizing?: boolean;
  lastResizableColumnId?: string;
}>({
  data: [],
  columns: [],
  table: null,
  enableColumnResizing: false,
  lastResizableColumnId: undefined,
});

export type TableProviderProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
  className?: string;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  columnResizeMode?: ColumnResizeMode;
  enableColumnResizing?: boolean;
};

export function TableProvider<TData, TValue>({
  columns,
  data,
  children,
  className,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  columnResizeMode = 'onChange',
  enableColumnResizing,
}: TableProviderProps<TData, TValue>) {
  const [sorting, setSorting] = useAtom(sortingAtom);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode,
    enableColumnResizing,
    onSortingChange: (updater) => {
      // @ts-expect-error updater is a function that returns a sorting object
      const newSorting = updater(sorting);
      setSorting(newSorting);
    },
    onColumnVisibilityChange,
    onColumnOrderChange,
    onColumnSizingChange,
    state: {
      sorting,
      ...(columnVisibility !== undefined && { columnVisibility }),
      ...(columnOrder !== undefined && { columnOrder }),
      ...(columnSizing !== undefined && { columnSizing }),
    },
  });

  // Find the last column that can be resized — it will expand to fill remaining width.
  let lastResizableColumnId: string | undefined;
  if (enableColumnResizing) {
    const flatHeaders = table.getFlatHeaders();
    for (let i = flatHeaders.length - 1; i >= 0; i--) {
      if (flatHeaders[i].column.getCanResize()) {
        lastResizableColumnId = flatHeaders[i].id;
        break;
      }
    }
  }

  return (
    <TableContext.Provider
      value={{
        data,
        columns: columns as never,
        table: table as never,
        enableColumnResizing,
        lastResizableColumnId,
      }}
    >
      <TableRaw
        className={cn(className, enableColumnResizing && 'table-fixed')}
        style={
          enableColumnResizing
            ? {
                // width:100% fills the container; minWidth prevents columns from
                // squishing below their defined sizes (triggers horizontal scroll instead).
                width: '100%',
                minWidth: table.getTotalSize(),
              }
            : undefined
        }
      >
        {children}
      </TableRaw>
    </TableContext.Provider>
  );
}

export type TableHeadProps = {
  header: Header<unknown, unknown>;
  className?: string;
};

export const TableHead = memo(({ header, className }: TableHeadProps) => {
  const { enableColumnResizing, lastResizableColumnId } = useContext(TableContext);
  const isSticky = header.column.columnDef.meta?.sticky;
  const stickyClasses = isSticky === 'right' ? 'sticky right-0 border-b bg-background last:border-b-0' : '';
  const metaClassName = header.column.columnDef.meta?.className;
  const canResize = header.column.getCanResize();
  const isResizing = header.column.getIsResizing();
  const headerDef = header.column.columnDef.header;
  const isStringHeader = typeof headerDef === 'string';
  // The last resizable column gets no explicit width so it expands to fill remaining space.
  const isLastResizable = enableColumnResizing && header.id === lastResizableColumnId;

  const content = header.isPlaceholder
    ? null
    : isStringHeader
      ? <span className="truncate">{headerDef}</span>
      : flexRender(headerDef, header.getContext());

  return (
    <TableHeadRaw
      className={cn(className, stickyClasses, metaClassName, canResize && 'relative select-none')}
      style={enableColumnResizing && !isLastResizable ? { width: header.getSize() } : undefined}
      title={isStringHeader ? headerDef : undefined}
      key={header.id}
    >
      {/* overflow-hidden lives on a child, not the <th>, so the absolute resize handle isn't clipped */}
      <div className={cn('flex min-w-0 overflow-hidden', canResize && 'pr-2')}>
        {content}
      </div>
      {canResize && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity hover:opacity-100',
            isResizing && 'bg-primary opacity-100',
          )}
        />
      )}
    </TableHeadRaw>
  );
});

TableHead.displayName = 'TableHead';

export type TableHeaderGroupProps = {
  headerGroup: HeaderGroup<unknown>;
  children: (props: { header: Header<unknown, unknown> }) => ReactNode;
};

export const TableHeaderGroup = ({
  headerGroup,
  children,
}: TableHeaderGroupProps) => (
  <TableRowRaw key={headerGroup.id}>
    {headerGroup.headers.map((header) => children({ header }))}
  </TableRowRaw>
);

export type TableHeaderProps = {
  className?: string;
  children: (props: { headerGroup: HeaderGroup<unknown> }) => ReactNode;
};

export const TableHeader = ({ className, children }: TableHeaderProps) => {
  const { table } = useContext(TableContext);

  return (
    <TableHeaderRaw className={className}>
      {table?.getHeaderGroups().map((headerGroup) => children({ headerGroup }))}
    </TableHeaderRaw>
  );
};

export interface TableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function TableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: TableColumnHeaderProps<TData, TValue>) {
  // Extract inline event handlers to prevent unnecessary re-renders
  const handleSortAsc = useCallback(() => {
    column.toggleSorting(false);
  }, [column]);

  const handleSortDesc = useCallback(() => {
    column.toggleSorting(true);
  }, [column]);

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            size="sm"
            variant="ghost"
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleSortAsc}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type TableCellProps = {
  cell: Cell<unknown, unknown>;
  className?: string;
};

export const TableCell = ({ cell, className }: TableCellProps) => {
  const { enableColumnResizing, lastResizableColumnId } = useContext(TableContext);
  const isSticky = cell.column.columnDef.meta?.sticky;
  const stickyClasses = isSticky === 'right' ? 'sticky right-0 border-b bg-background last:border-b-0' : '';
  const metaClassName = cell.column.columnDef.meta?.className;
  const canResize = cell.column.getCanResize();
  const isLastResizable = enableColumnResizing && cell.column.id === lastResizableColumnId;

  return (
    <TableCellRaw
      className={cn(
        className,
        stickyClasses,
        metaClassName,
        // Clip overflowing content in fixed-layout cells.
        // The last resizable column still clips but fills remaining width naturally.
        enableColumnResizing && canResize && 'overflow-hidden',
      )}
      style={
        enableColumnResizing && !isLastResizable
          ? { width: cell.column.getSize(), maxWidth: cell.column.getSize() }
          : undefined
      }
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCellRaw>
  );
};

export type TableRowProps = {
  row: Row<unknown>;
  children: (props: { cell: Cell<unknown, unknown> }) => ReactNode;
  className?: string;
};

export const TableRow = ({ row, children, className }: TableRowProps) => (
  <TableRowRaw
    className={className}
    data-state={row.getIsSelected() && 'selected'}
    key={row.id}
  >
    {row.getVisibleCells().map((cell) => children({ cell }))}
  </TableRowRaw>
);

export type TableBodyProps = {
  children: (props: { row: Row<unknown> }) => ReactNode;
  className?: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
};

export const TableBody = ({
  children,
  className,
  isLoading = false,
  emptyState,
  loadingState
}: TableBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows;

  return (
    <TableBodyRaw className={className}>
      {isLoading ? (
        loadingState || (
          <TableRowRaw>
            <TableCellRaw className="h-24 text-center" colSpan={columns.length}>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span>Loading...</span>
              </div>
            </TableCellRaw>
          </TableRowRaw>
        )
      ) : rows?.length ? (
        rows.map((row) => children({ row }))
      ) : (
        emptyState || (
          <TableRowRaw>
            <TableCellRaw className="h-24 text-center" colSpan={columns.length}>
              No results.
            </TableCellRaw>
          </TableRowRaw>
        )
      )}
    </TableBodyRaw>
  );
};
