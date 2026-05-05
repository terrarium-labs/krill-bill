import { memo, useMemo, ReactNode } from "react";
import { FileText, Banknote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmployeeContract } from "@/types/employees/contracts";
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
import IdBadge from "@/app/components/id-badge";
import CurrencyLabel from "@/app/components/labels/currency-label";
import DurationLabel from "@/app/components/labels/duration-label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type ContractTableColumnKey =
    | "id"
    | "type"
    | "date"
    | "duration"
    | "start_date"
    | "end_date"
    | "annual_gross_salary"
    | "num_salary_payments_per_year"
    | "price_per_hour"
    | "overtime_price_per_hour"
    | "is_active"
    | "actions";

export interface ContractsTableProps {
    contracts: EmployeeContract[];
    isLoading?: boolean;
    amountsVisible?: boolean;
    clickableRows?: boolean;
    /** Columns to hide from the table */
    hiddenColumns?: ContractTableColumnKey[] | ContractTableColumnKey;
    onRowClick?: (contract: EmployeeContract) => void;
    renderActions?: (contract: EmployeeContract) => ReactNode;
    activeSwitchEditable?: boolean;
    togglingActiveId?: string | null;
    onActivateToggle?: (contract: EmployeeContract, checked: boolean) => void;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
}

const ContractsTableComponent = ({
    contracts,
    isLoading = false,
    amountsVisible = false,
    clickableRows = true,
    hiddenColumns = [],
    onRowClick,
    renderActions,
    activeSwitchEditable = false,
    togglingActiveId = null,
    onActivateToggle,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
}: ContractsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<EmployeeContract>(renderActions);

    const isColumnVisible = (key: ContractTableColumnKey) =>
        !hiddenColumns.includes(key);

    const columns = useMemo<ColumnDef<EmployeeContract>[]>(() => {
        const cols: ColumnDef<EmployeeContract>[] = [];

        // ID Column
        if (isColumnVisible("id")) {
            cols.push({
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const contract = row.original;
                    return (
                        <IdBadge id={contract.id!} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            });
        }

        // Type Column
        if (isColumnVisible("type")) {
            cols.push({
                accessorKey: "type",
                header: t("employees.contracts.type", "Type"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const type = row.getValue("type") as string;
                    return <Tag text={type.replace("_", " ")} className="capitalize" />;
                },
            });
        }

        // Start Date Column
        if (isColumnVisible("start_date")) {
            cols.push({
                accessorKey: "start_date",
                header: t("employees.contracts.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const date = row.getValue("start_date") as string;
                    return <DateLabel data={date} options={{ hide: ["hours", "minutes", "seconds"] }} />;
                },
            });
        }

        // End Date Column
        if (isColumnVisible("end_date")) {
            cols.push({
                accessorKey: "end_date",
                header: t("employees.contracts.endDate", "End Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const date = row.getValue("end_date") as string | null;
                    return <DateLabel data={date} options={{ hide: ["hours", "minutes", "seconds"] }} />;
                },
            });
        }

        // Duration Column
        if (isColumnVisible("duration")) {
            cols.push({
                id: "duration",
                accessorKey: "end_date",
                header: t("employees.contracts.duration", "Duration"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const contract = row.original;
                    return (
                        <DurationLabel
                            startDate={contract.start_date}
                            endDate={contract.end_date}
                        />
                    );
                },
            });
        }

        // Annual Salary Column
        if (isColumnVisible("annual_gross_salary")) {
            cols.push({
                accessorKey: "annual_gross_salary",
                header: t("employees.contracts.annualSalary", "Annual Salary"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const salary = row.getValue("annual_gross_salary") as number;
                    return (
                        <CurrencyLabel
                            data={salary != null ? salary : null}
                            blurred={!amountsVisible}
                        />
                    );
                },
            });
        }

        // Payments Per Year Column
        if (isColumnVisible("num_salary_payments_per_year")) {
            cols.push({
                accessorKey: "num_salary_payments_per_year",
                header: t("employees.contracts.paymentsPerYear", "Payments/Year"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const payments = row.getValue("num_salary_payments_per_year") as number;
                    return (
                        <div className="text-sm text-center flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            {payments}
                        </div>
                    );
                },
            });
        }

        // Price per Hour Column
        if (isColumnVisible("price_per_hour")) {
            cols.push({
                accessorKey: "price_per_hour",
                header: t("employees.contracts.pricePerHour", "Hourly price"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const contract = row.original;
                    return (
                        <CurrencyLabel
                            data={contract.price_per_hour != null ? contract.price_per_hour : null}
                            blurred={!amountsVisible}
                        />
                    );
                },
            });
        }

        // Overtime Price per Hour Column
        if (isColumnVisible("overtime_price_per_hour")) {
            cols.push({
                accessorKey: "overtime_price_per_hour",
                header: t("employees.contracts.overtimePricePerHour", "Overtime price"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const contract = row.original;
                    return (
                        <CurrencyLabel
                            data={contract.overtime_price_per_hour != null ? contract.overtime_price_per_hour : null}
                            blurred={!amountsVisible}
                        />
                    );
                },
            });
        }

        // Active Column
        if (isColumnVisible("is_active")) {
            cols.push({
                accessorKey: "is_active",
                header: t("employees.contracts.active", "Active"),
                enableResizing: true,
                size: 85,
                cell: ({ row }) => {
                    const contract = row.original;
                    const isToggling = togglingActiveId === contract.id;
                    return (
                        <div
                            className="flex justify-start items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Switch
                                checked={contract.is_active}
                                onCheckedChange={
                                    activeSwitchEditable && onActivateToggle
                                        ? (checked) => onActivateToggle(contract, checked)
                                        : undefined
                                }
                                disabled={activeSwitchEditable ? isToggling : true}
                            />
                        </div>
                    );
                },
            });
        }

        // Actions Column
        if (isColumnVisible("actions") && renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={""}
                    />
                ),
                cell: ({ row }) => (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" as const },
            });
        }

        return cols;
    }, [t, amountsVisible, hiddenColumns, renderActions, activeSwitchEditable, togglingActiveId, onActivateToggle]);

    const defaultEmptyTitle = searchQuery
        ? t("employees.contracts.noResultsFound", "No contracts found")
        : t("employees.contracts.noContractsTitle", "No contracts yet");

    const defaultEmptyDescription = searchQuery
        ? t("employees.contracts.noResultsDescription", "No contracts match your search for '{{searchQuery}}'", { searchQuery })
        : t("employees.contracts.noContractsDescription", "Start by adding the first contract");

    return (
        <TableProvider data={contracts} columns={columns} enableColumnResizing>
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
                                {onEmptyStateAction && (
                                    <Button variant="outline" onClick={onEmptyStateAction}>
                                        {emptyStateActionLabel || t("employees.contracts.addContract", "Add Contract")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const contract = row.original as EmployeeContract;
                    const rowContent = (
                        <TableRowRaw
                            key={row.id}
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => clickableRows && onRowClick && onRowClick(contract)}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );

                    return wrapRowWithContextMenu(contract, rowContent);
                }}
            </TableBody>
        </TableProvider>
    );
};

export const ContractsTable = memo(ContractsTableComponent);

export default ContractsTable;
