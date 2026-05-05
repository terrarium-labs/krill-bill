import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Settings2 } from "lucide-react";
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
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { OnCallConfig } from "@/types/field-service/on-call/configs";

export type OnCallHistoryTableColumnKey =
    | "id"
    | "requirements"
    | "resting_time_after_call"
    | "execution_error"
    | "actions";

export interface OnCallHistoryTableProps {
    configs: OnCallConfig[];
    isLoading: boolean;
    searchQuery?: string;
    renderActions?: (config: OnCallConfig) => ReactNode;
    hiddenColumns?: OnCallHistoryTableColumnKey[] | OnCallHistoryTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const OnCallHistoryTableComponent = ({
    configs,
    isLoading,
    searchQuery = "",
    renderActions,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: OnCallHistoryTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<OnCallConfig>(renderActions, configs);

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

    const columns = useMemo<ColumnDef<OnCallConfig>[]>(() => {
        const cols: ColumnDef<OnCallConfig>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon={true}
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "requirements",
                header: t("on-call.configs.columns.requirements", "Requirements"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.getValue("requirements") as string} />
                ),
            },
            {
                accessorKey: "resting_time_after_call",
                header: t("on-call.configs.columns.restingTimeAfterCall", "Resting time after call"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <span className="text-sm">{row.getValue("resting_time_after_call") as number}</span>
                ),
            },
            {
                accessorKey: "execution_error",
                header: t("on-call.configs.columns.executionError", "Execution error"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.getValue("execution_error") as string | null | undefined} />
                ),
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
                data={configs}
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
                                className="h-50 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Settings2 className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("on-call.configs.noResultsFound", "No results found")
                                                : t("on-call.configs.noConfigs", "No on call configs")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("on-call.configs.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("on-call.configs.noConfigsDescription", "On call configs will appear here when created.")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const config = row.original as OnCallConfig;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50"
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(config, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const OnCallHistoryTable = memo(OnCallHistoryTableComponent);
export default OnCallHistoryTable;
