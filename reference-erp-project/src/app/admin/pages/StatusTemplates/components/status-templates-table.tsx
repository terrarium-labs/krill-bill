import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ListChecks, CheckSquare } from "lucide-react";
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
import { StatusTemplate } from "@/types/general/status-templates";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import ColorLabel from "@/app/components/labels/color-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import TextLabel from "@/app/components/labels/text-label";

export type StatusTemplateTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "color"
    | "statuses"
    | "actions";

interface StatusTemplatesTableProps {
    data: StatusTemplate[];
    isLoading?: boolean;
    hiddenColumns?: StatusTemplateTableColumnKey[] | StatusTemplateTableColumnKey;
    renderActions?: (statusTemplate: StatusTemplate) => ReactNode;
    onRowClick?: (statusTemplate: StatusTemplate) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const StatusTemplatesTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    onEmptyStateAction,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: StatusTemplatesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<StatusTemplate>(renderActions);

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

    const columns = useMemo<ColumnDef<StatusTemplate>[]>(() => [
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
            header: t("statusTemplates.columns.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => (
                <TextLabel data={row.original.name} className="font-medium" />
            ),
        },
        {
            accessorKey: "description",
            header: t("statusTemplates.columns.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => (
                <TextLargeLabel data={row.original.description} />
            ),
        },
        {
            accessorKey: "color",
            header: t("statusTemplates.columns.color", "Color"),
            enableResizing: true,
            size: 85,
            cell: ({ row }) => {
                const color = row.original.color;
                if (!color) return <span>-</span>;
                return <ColorLabel data={color || "blue"} />;
            },
        },
        {
            accessorKey: "statuses",
            header: t("statusTemplates.columns.statuses", "Statuses"),
            enableResizing: true,
            size: 85,
            cell: ({ row }) => {
                const statuses = row.original.statuses || [];
                return (
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        {statuses.length || 0}
                    </div>
                );
            },
        },
        {
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
                    {renderActions?.(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        },
    ], [t, renderActions]);

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
                                    <ListChecks className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("statusTemplates.noTemplates", "No status templates found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("statusTemplates.getStarted", "Get started by creating a new status template")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button onClick={onEmptyStateAction} variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t("statusTemplates.addStatusTemplate", "New Status Template")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const statusTemplate = row.original as StatusTemplate;
                        return wrapRowWithContextMenu(
                            statusTemplate,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={() => clickableRows && onRowClick?.(statusTemplate)}
                                data-state={row.getIsSelected() && "selected"}
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

export const StatusTemplatesTable = memo(StatusTemplatesTableComponent);
export default StatusTemplatesTable;
