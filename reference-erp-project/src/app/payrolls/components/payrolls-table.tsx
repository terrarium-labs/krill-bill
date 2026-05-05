import { memo, useMemo, type ReactNode } from "react";
import { FileText, Plus, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Payroll } from "@/types/employees/payrolls";
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
import { formatDate } from "@/utils/miscelanea";
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { Button } from "@/components/ui/button";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type PayrollTableColumnKey =
    | "id"
    | "employee"
    | "period"
    | "payment_date"
    | "earnings_total"
    | "deductions_total"
    | "net_amount_to_receive"
    | "company_costs_total"
    | "gross_payroll_amount"
    | "actions";

interface PayrollsTableProps {
    payrolls: Payroll[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: PayrollTableColumnKey[] | PayrollTableColumnKey;
    renderActions?: (payroll: Payroll) => ReactNode;
    onRowClick?: (payroll: Payroll) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    onEmptyStateSecondaryAction?: () => void;
    emptyStateActionLabel?: string;
    emptyStateSecondaryActionLabel?: string;
    searchQuery?: string;
    amountsVisible?: boolean;
    /** TanStack column visibility (from usePayrollsTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const PayrollsTableComponent = ({
    payrolls,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    onEmptyStateSecondaryAction,
    emptyStateActionLabel,
    emptyStateSecondaryActionLabel,
    searchQuery = "",
    amountsVisible = false,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: PayrollsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Payroll>(renderActions);

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

    const columns = useMemo<ColumnDef<Payroll>[]>(() => {
        const cols: ColumnDef<Payroll>[] = [
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
                id: "employee",
                header: t("payrolls.employee", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original.employee} link />,
            },
            {
                id: "period",
                header: t("payrolls.period", "Period"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const { start_date, end_date } = row.original;
                    if (!start_date && !end_date) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <div className="text-sm whitespace-nowrap">
                            {start_date ? formatDate(start_date, { showTime: false, useUTC: true, showYear: true }) : "-"}{" "}
                            -{" "}
                            {end_date ? formatDate(end_date, { showTime: false, useUTC: true, showYear: true }) : "-"}
                        </div>
                    );
                },
            },
            {
                accessorKey: "payment_date",
                header: t("payrolls.paymentDate", "Payment Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const paymentDate = row.getValue("payment_date") as string;
                    return (
                        <div className="text-sm">
                            {paymentDate
                                ? formatDate(paymentDate, { showTime: false, useUTC: true })
                                : <span className="text-muted-foreground">-</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: "earnings_total",
                header: t("payrolls.earningsTotal", "Earnings"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <CurrencyLabel
                        data={row.original.earnings_total != null ? { value: row.original.earnings_total } : null}
                        variant="gain"
                        blurred={!amountsVisible}
                    />
                ),
            },
            {
                accessorKey: "deductions_total",
                header: t("payrolls.deductionsTotal", "Deductions"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <CurrencyLabel
                        data={row.original.deductions_total != null ? row.original.deductions_total : null}
                        variant="negative-loss"
                        blurred={!amountsVisible}
                    />
                ),
            },
            {
                accessorKey: "net_amount_to_receive",
                header: t("payrolls.netAmount", "Net Amount"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <CurrencyLabel
                        data={row.original.net_amount_to_receive != null ? { value: row.original.net_amount_to_receive } : null}
                        blurred={!amountsVisible}
                        className="font-semibold"
                    />
                ),
            },
            {
                accessorKey: "company_costs_total",
                header: t("payrolls.companyContributions", "Company Contrib."),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => (
                    <CurrencyLabel
                        data={row.original.company_costs_total != null ? { value: row.original.company_costs_total } : null}
                        blurred={!amountsVisible}
                    />
                ),
            },
            {
                accessorKey: "gross_payroll_amount",
                header: t("payrolls.companyCost", "Company Cost"),
                enableResizing: true,
                size: 140,
                cell: ({ row }) => (
                    <CurrencyLabel
                        data={row.original.gross_payroll_amount != null ? { value: row.original.gross_payroll_amount } : null}
                        blurred={!amountsVisible}
                    />
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
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, amountsVisible, renderActions]);

    const defaultEmptyTitle = searchQuery
        ? t("payrolls.noResultsFound", "No payrolls found")
        : t("payrolls.noPayrollsTitle", "No payrolls yet");

    const defaultEmptyDescription = searchQuery
        ? t("payrolls.noResultsDescription", "No payrolls match your search for '{{searchQuery}}'", { searchQuery })
        : t("payrolls.noPayrollsDescriptionOrg", "Start by adding your first payroll or import from a file");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={payrolls}
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
                                    {(onEmptyStateAction || onEmptyStateSecondaryAction) && (
                                        <div className="flex items-center gap-2">
                                            {onEmptyStateAction && (
                                                <Button variant="outline" onClick={onEmptyStateAction}>
                                                    <Plus className="h-4 w-4" />
                                                    {emptyStateActionLabel || t("payrolls.addPayroll", "Add Payroll")}
                                                </Button>
                                            )}
                                            {onEmptyStateSecondaryAction && (
                                                <Button onClick={onEmptyStateSecondaryAction}>
                                                    <Upload className="h-4 w-4" />
                                                    {emptyStateSecondaryActionLabel || t("payrolls.importPayrolls", "Import Payrolls")}
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
                        const payroll = row.original as Payroll;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick?.(payroll)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(payroll, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const PayrollsTable = memo(PayrollsTableComponent);
export default PayrollsTable;
