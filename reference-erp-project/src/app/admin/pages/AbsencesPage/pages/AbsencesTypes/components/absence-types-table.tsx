import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
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
import { DynamicIcon } from "lucide-react/dynamic";
import { AbsenceType } from "@/types/general/absences";
import IdBadge from "@/app/components/id-badge";
import ColorLabel from "@/app/components/labels/color-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type AbsenceTypeTableColumnKey = "id" | "name" | "description" | "color" | "actions";

interface AbsenceTypesTableProps {
    absenceTypes: AbsenceType[];
    isLoading: boolean;
    hiddenColumns?: AbsenceTypeTableColumnKey[] | AbsenceTypeTableColumnKey;
    renderActions?: (absenceType: AbsenceType) => ReactNode;
    onRowClick?: (absenceType: AbsenceType) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const AbsenceTypesTableComponent = ({
    absenceTypes,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: AbsenceTypesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<AbsenceType>(renderActions);

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

    const columns = useMemo<ColumnDef<AbsenceType>[]>(() => {
        const cols: ColumnDef<AbsenceType>[] = [
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
                header: t("absences.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const absenceType = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            {absenceType.icon_url && (
                                <DynamicIcon name={absenceType.icon_url as any} className="h-4 w-4" />
                            )}
                            <div className="font-medium">{absenceType.name}</div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("absences.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const description = row.getValue("description") as string;
                    return <span>{description || "-"}</span>;
                },
            },
            {
                accessorKey: "color",
                header: t("absences.columns.color", "Color"),
                enableResizing: true,
                size: 85,
                cell: ({ row }) => {
                    const color = row.getValue("color") as string;
                    return <ColorLabel data={color} />;
                },
            },
        ];

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
                    {renderActions?.(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        });

        return cols;
    }, [t, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={absenceTypes}
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
                                    <Calendar className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("absences.types.noResultsFound", "No results found")
                                                : t("absences.types.noTypes", "No absence types found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("absences.types.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("absences.types.noTypesDescription", "No absence types found")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Calendar className="h-4 w-4" />
                                            {t("absences.types.addType", "New type")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const absenceType = row.original as AbsenceType;
                        return wrapRowWithContextMenu(
                            absenceType,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={() => onRowClick?.(absenceType)}
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

export const AbsenceTypesTable = memo(AbsenceTypesTableComponent);
export default AbsenceTypesTable;
