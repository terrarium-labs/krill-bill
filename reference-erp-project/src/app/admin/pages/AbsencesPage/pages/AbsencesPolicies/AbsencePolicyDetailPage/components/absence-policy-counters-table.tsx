import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlarmClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
    TableColumnHeader,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { CYCLE_START } from "@/utils/absence_policy_conters";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";
import { formatDate } from "@/utils/miscelanea";
import { AbsenceCounter } from "@/types/general/absences";
import IconLabel from "@/app/components/labels/icon-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type AbsencePolicyCounterTableColumnKey =
    | "id"
    | "name"
    | "value"
    | "cycle_start"
    | "cycle_duration"
    | "admin_only"
    | "absence_type"
    | "start_date"
    | "end_date"
    | "theoretical_end_date"
    | "actions";

export interface AbsencePolicyCountersTableProps {
    counters: AbsenceCounter[];
    isLoading: boolean;
    hiddenColumns?: AbsencePolicyCounterTableColumnKey[];
    renderActions?: (counter: AbsenceCounter) => ReactNode;
    onRowClick?: (counter: AbsenceCounter) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
}

const AbsencePolicyCountersTableComponent = ({
    counters,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
}: AbsencePolicyCountersTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<AbsenceCounter>(renderActions);

    const columns = useMemo<ColumnDef<AbsenceCounter>[]>(() => {
        const allColumns: ColumnDef<AbsenceCounter>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "name",
                header: t("absence-policies.counters.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="font-medium">{row.original.name}</div>
                    </div>
                ),
            },
            {
                accessorKey: "value",
                header: t("absence-policies.counters.columns.value", "Value"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const counter = row.original;
                    if (counter.is_unlimited) {
                        return <Tag text={t("absence-policies.counters.unlimited", "Unlimited")} />;
                    }
                    return (
                        <div>
                            {counter.value} {counter.unit}
                        </div>
                    );
                },
            },
            {
                accessorKey: "cycle_start",
                header: t("absence-policies.counters.columns.cycleStart", "Cycle Start"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const cycleStart = row.getValue("cycle_start") as string;
                    const cycleLabel = CYCLE_START.find((c) => c.value === cycleStart)?.label || cycleStart;
                    return <div>{cycleLabel}</div>;
                },
            },
            {
                accessorKey: "cycle_duration",
                header: t("absence-policies.counters.columns.duration", "Duration"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const duration = row.getValue("cycle_duration") as number;
                    return (
                        <div>
                            {duration} {t("absence-policies.counters.months", "months")}
                        </div>
                    );
                },
            },
            {
                accessorKey: "admin_only",
                header: t("absence-policies.counters.columns.adminOnly", "Admin Only"),
                enableResizing: true,
                size: 85,
                cell: ({ row }) => {
                    const adminOnly = row.getValue("admin_only") as boolean;
                    return adminOnly ? (
                        <Tag text={t("common.yes", "Yes")} color="green" />
                    ) : (
                        <Tag text={t("common.no", "No")} color="gray" />
                    );
                },
            },
            {
                accessorKey: "absence_types",
                header: t("absence-policies.counters.columns.absenceTypes", "Absence Types"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const absenceTypes = row.original.absence_types || [];
                    if (absenceTypes.length === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <IconLabel
                            data={absenceTypes.map((type) => ({
                                icon: type.icon_url,
                                text: type.name,
                                color: type.color,
                            }))}
                            variant="truncate"
                        />
                    );
                },
            },
            {
                accessorKey: "start_date",
                header: t("absence-policies.counters.columns.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const startDate = row.getValue("start_date") as string;
                    if (!startDate) return <span className="text-muted-foreground">-</span>;
                    return <div className="text-sm">{formatDate(startDate, { showTime: false })}</div>;
                },
            },
            {
                accessorKey: "end_date",
                header: t("absence-policies.counters.columns.endDate", "End Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const endDate = row.getValue("end_date") as string;
                    if (!endDate) return <span className="text-muted-foreground">-</span>;
                    return <div className="text-sm">{formatDate(endDate, { showTime: false })}</div>;
                },
            },
            {
                accessorKey: "theoretical_end_date",
                header: t("absence-policies.counters.columns.expiryDate", "Expiry Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const theoreticalEndDate = row.getValue("theoretical_end_date") as string;
                    if (!theoreticalEndDate) return <span className="text-muted-foreground">-</span>;
                    return <div className="text-sm">{formatDate(theoreticalEndDate, { showTime: false })}</div>;
                },
            },
        ];

        if (renderActions) {
            allColumns.push({
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
                    <div className="flex justify-center items-center">
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return allColumns.filter((col) => {
            const columnId = ("accessorKey" in col ? col.accessorKey : col.id) as AbsencePolicyCounterTableColumnKey;
            return !hiddenColumns.includes(columnId);
        });
    }, [t, hiddenColumns, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider data={counters} columns={columns} enableColumnResizing>
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
                                    <AlarmClock className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("absence-policies.counters.noCounters", "No counters found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t(
                                                "absence-policies.counters.noCountersDescription",
                                                "No counters have been configured for this policy"
                                            )}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {t("absence-policies.counters.addCounter", "Add Counter")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const counter = row.original as AbsenceCounter;
                        return wrapRowWithContextMenu(
                            counter,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : ""}
                                onClick={() => onRowClick && onRowClick(counter)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const AbsencePolicyCountersTable = memo(AbsencePolicyCountersTableComponent);
export default AbsencePolicyCountersTable;
