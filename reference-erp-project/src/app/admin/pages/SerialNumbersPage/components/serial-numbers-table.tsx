import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FileDigit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { SerialNumber } from "@/types/general/serial-numbers";
import Tag from "@/app/components/tag/tag";
import { generateNextDocumentNumber } from "@/utils/miscelanea";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type SerialNumbersTableColumnKey =
    | "id"
    | "name"
    | "entity"
    | "value"
    | "last_num_value"
    | "next_num_value"
    | "actions";

interface SerialNumbersTableProps {
    data: SerialNumber[];
    isLoading?: boolean;
    hiddenColumns?: SerialNumbersTableColumnKey[] | SerialNumbersTableColumnKey;
    renderActions?: (serialNumber: SerialNumber) => ReactNode;
    onRowClick?: (serialNumber: SerialNumber) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const SerialNumbersTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateActionLabel,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: SerialNumbersTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<SerialNumber>(renderActions);

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
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "name",
                header: t("admin.serialNumbers.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="font-medium text-sm">
                        {row.getValue("name") || <span className="text-muted-foreground">-</span>}
                    </div>
                ),
            },
            {
                accessorKey: "entity",
                header: t("admin.serialNumbers.entity", "Entity"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const entity = row.getValue("entity") as string;
                    return <Tag text={entity} className="capitalize" />;
                },
            },
            {
                accessorKey: "value",
                header: t("admin.serialNumbers.pattern", "Pattern"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="text-sm font-mono">
                        {row.getValue("value") || <span className="text-muted-foreground">-</span>}
                    </div>
                ),
            },
            {
                accessorKey: "last_num_value",
                header: t("admin.serialNumbers.lastNumber", "Last Number"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div className="text-sm font-semibold">
                        {row.getValue("last_num_value") ?? 0}
                    </div>
                ),
            },
            {
                accessorKey: "next_num_value",
                header: t("admin.serialNumbers.nextNumber", "Next Number"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const pattern = row.getValue("value") as string;
                    const lastNum = (row.getValue("last_num_value") as number) ?? 0;
                    const nextDocNumber = generateNextDocumentNumber(pattern, lastNum);
                    return (
                        <div className="text-sm font-semibold text-primary font-mono">
                            {nextDocNumber || lastNum + 1}
                        </div>
                    );
                },
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
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
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions]);

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
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <FileDigit className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle ||
                                                (searchQuery
                                                    ? t("admin.serialNumbers.noResultsFound", "No serial numbers found")
                                                    : t("admin.serialNumbers.noSerialNumbersTitle", "No serial numbers yet"))}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription ||
                                                (searchQuery
                                                    ? t("admin.serialNumbers.noResultsDescription", "No serial numbers match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("admin.serialNumbers.noSerialNumbersDescription", "Create your first serial number to get started"))}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("admin.serialNumbers.addSerialNumber", "Add Serial Number")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const serialNumber = row.original as SerialNumber;
                        return wrapRowWithContextMenu(
                            serialNumber,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows && onRowClick ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick?.(serialNumber)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>,
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const SerialNumbersTable = memo(SerialNumbersTableComponent);
export default SerialNumbersTable;
