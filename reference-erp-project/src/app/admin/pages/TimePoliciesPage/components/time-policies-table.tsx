import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Clock, ClockArrowUp, Users, Plus } from "lucide-react";
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
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { TimePolicy } from "@/types/general/time-policies";
import { formatTimeToTravel } from "@/utils/miscelanea";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type TimePoliciesTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "flexibility"
    | "default_overtime_multiplier"
    | "number_of_employees"
    | "number_of_slots"
    | "number_of_overtime_rules"
    | "actions";

interface TimePoliciesTableProps {
    data: TimePolicy[];
    isLoading?: boolean;
    hiddenColumns?: TimePoliciesTableColumnKey[] | TimePoliciesTableColumnKey;
    renderActions?: (policy: TimePolicy) => ReactNode;
    onRowClick?: (policy: TimePolicy) => void;
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

const TimePoliciesTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns,
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
}: TimePoliciesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<TimePolicy>(renderActions);

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

    const columns = useMemo<ColumnDef<TimePolicy>[]>(() => {
        const cols: ColumnDef<TimePolicy>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "name",
                header: t("timePolicies.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLabel data={row.original.name} className="font-medium" />,
            },
            {
                accessorKey: "description",
                header: t("timePolicies.columns.description", "Description"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => <TextLargeLabel data={row.original.description as string} />,
            },
            {
                accessorKey: "flexibility",
                header: t("timePolicies.columns.flexibility", "Flexibility (min)"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const flexibility = row.original.flexibility as number;
                    return flexibility
                        ? <span>{formatTimeToTravel(flexibility)}</span>
                        : <span className="text-muted-foreground">-</span>;
                },
            },
            {
                accessorKey: "default_overtime_multiplier",
                header: t("timePolicies.columns.defaultOvertimeMultiplier", "Overtime Multiplier"),
                enableResizing: true,
                size: 170,
                cell: ({ row }) => {
                    const val = row.original.default_overtime_multiplier as number;
                    return val
                        ? <span>{val}</span>
                        : <span className="text-muted-foreground">-</span>;
                },
            },
            {
                accessorKey: "number_of_employees",
                header: t("timePolicies.columns.numberOfEmployees", "Employees"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => {
                    const val = row.original.number_of_employees as number;
                    return (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {val ? <span>{val}</span> : <span className="text-muted-foreground">-</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: "number_of_slots",
                header: t("timePolicies.columns.timeSlots", "Time Slots"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => {
                    const val = row.original.number_of_slots as number;
                    return (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {val ? <span>{val}</span> : <span className="text-muted-foreground">-</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: "number_of_overtime_rules",
                header: t("timePolicies.columns.overtimeRules", "Overtime Rules"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const val = row.original.number_of_overtime_rules as number;
                    return (
                        <div className="flex items-center gap-2">
                            <ClockArrowUp className="h-4 w-4" />
                            {val ? <span>{val}</span> : <span className="text-muted-foreground">-</span>}
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
                    <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
                ),
                cell: ({ row }) => (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Clock className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("timePolicies.noResultsFound", "No results found")
                                                : t("timePolicies.noPolicies", "No time policies found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("timePolicies.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("timePolicies.noPoliciesDescription", "Create your first time policy to get started")}
                                        </p>
                                    </div>
                                    {!searchQuery && onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {t("timePolicies.addPolicy", "New policy")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const policy = row.original;
                        return wrapRowWithContextMenu(
                            policy,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={clickableRows && onRowClick ? () => onRowClick(policy) : undefined}
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

export const TimePoliciesTable = memo(TimePoliciesTableComponent);
export default TimePoliciesTable;
