import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Check, Plus, Users, X } from "lucide-react";
import { Employee } from "@/types/employees/employees";
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import TextLabel from "@/app/components/labels/text-label";
import CountryLabel from "@/app/components/labels/country-label";
import EmailLabel from "@/app/components/labels/email-label";
import PhoneLabel from "@/app/components/labels/phone-label";
import DateLabel from "@/app/components/labels/date-label";
import WorkplaceLabel from "@/app/components/labels/workplace-label";
import { Button } from "@/components/ui/button";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import Tag from "@/app/components/tag/tag";

// ---------------------------------------------------------------------------
// Overflow helpers — show first item + "+N" badge; full list in tooltip
// ---------------------------------------------------------------------------

/** String-based overflow tags (e.g. groups). */
function OverflowStringTags({ items }: { items: { id: string; name: string }[] }) {
    if (!items.length) return <span className="text-muted-foreground">-</span>;
    const [first, ...rest] = items;
    if (!rest.length) return <Tag text={first.name} />;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-default">
                        <Tag text={first.name} />
                        <span className="text-xs font-medium text-muted-foreground">
                            +{rest.length}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="flex flex-col gap-0.5 max-w-48">
                    {rest.map((item) => (
                        <span key={item.id} className="text-xs">{item.name}</span>
                    ))}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/** Employee-based overflow (e.g. absence supervisors). */
function OverflowEmployeeTags({ employees }: { employees: Employee[] }) {
    if (!employees.length) return <span className="text-muted-foreground">-</span>;
    const [first, ...rest] = employees;
    if (!rest.length) return <EmployeeLabel data={first} />;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-default">
                        <EmployeeLabel data={first} />
                        <span className="text-xs font-medium text-muted-foreground">
                            +{rest.length}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="flex flex-col gap-0.5 max-w-48">
                    {rest.map((emp) => (
                        <span key={emp.id} className="text-xs">
                            {emp.first_name} {emp.last_name}
                        </span>
                    ))}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export type EmployeeTableColumnKey =
    | "id"
    | "name"
    | "email"
    | "phone"
    | "role"
    | "status"
    | "city"
    | "country"
    | "date_of_birth"
    | "nationality"
    | "state_province"
    | "postal_code"
    | "address_line_1"
    | "address_line_2"
    | "national_id_number"
    | "tax_id_number"
    | "workplace"
    | "absence_policy"
    | "time_policy"
    | "reporting_to"
    | "reporting_absence_to"
    | "groups"
    | "is_supervisor"
    | "is_absence_supervisor"
    | "actions";

export interface EmployeesTableProps {
    employees: Employee[];
    isLoading: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: EmployeeTableColumnKey[] | EmployeeTableColumnKey;
    renderActions?: (employee: Employee, allEmployees: Employee[]) => ReactNode;
    onRowClick?: (employee: Employee) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    /** TanStack column visibility state (from useEmployeeTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order state */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing state */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const EmployeesTableComponent = ({
    employees,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: EmployeesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Employee>(renderActions, employees);

    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) return hiddenColumns;
        return [hiddenColumns];
    }, [hiddenColumns]);

    /**
     * Merge structural hiddenColumns into columnVisibility so that
     * columns hidden by the embedding context (e.g. compact views) cannot
     * be re-shown by the user preference state.
     */
    const effectiveColumnVisibility = useMemo<VisibilityState | undefined>(() => {
        if (hiddenColumnsArray.length === 0) return columnVisibility;
        const structural = hiddenColumnsArray.reduce<VisibilityState>((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        return { ...(columnVisibility ?? {}), ...structural };
    }, [columnVisibility, hiddenColumnsArray]);

    const columns = useMemo<ColumnDef<Employee>[]>(() => {
        const cols: ColumnDef<Employee>[] = [
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
                accessorKey: "name",
                header: t("employees.name", "Name"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmployeeLabel data={row.original} />,
            },
            {
                accessorKey: "email",
                header: t("employees.email", "Email"),
                enableResizing: true,
                size: 220,
                cell: ({ row }) => (
                    <EmailLabel data={row.getValue("email") as string} variant="black" link />
                ),
            },
            {
                accessorKey: "phone",
                header: t("employees.phone", "Phone"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => (
                    <PhoneLabel data={row.getValue("phone") as string} variant="black" link />
                ),
            },
            {
                accessorKey: "role",
                header: t("employees.role", "Role"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => {
                    const role = row.original.job_title;
                    return role?.name ? (
                        <Tag text={role.name} />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "city",
                header: t("employees.city", "City"),
                enableResizing: true,
                size: 140,
                cell: ({ row }) => <TextLabel data={row.getValue("city") as string} />,
            },
            {
                accessorKey: "country",
                header: t("employees.country", "Country"),
                enableResizing: true,
                size: 140,
                cell: ({ row }) => <CountryLabel data={row.getValue("country") as string} />,
            },
            {
                accessorKey: "status",
                header: t("employees.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const status = row.original.status;
                    return status ? (
                        <Tag text={status} />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "date_of_birth",
                header: t("employees.dateOfBirth", "Date of Birth"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <DateLabel
                        data={row.original.date_of_birth}
                        options={{ hide: ["hours", "minutes", "seconds"] }}
                    />
                ),
            },
            {
                accessorKey: "nationality",
                header: t("employees.nationality", "Nationality"),
                enableResizing: true,
                size: 140,
                cell: ({ row }) => <CountryLabel data={row.original.nationality} />,
            },
            {
                accessorKey: "state_province",
                header: t("employees.stateProvince", "State / Province"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <TextLabel data={row.original.state_province} />,
            },
            {
                accessorKey: "postal_code",
                header: t("employees.postalCode", "Postal Code"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <TextLabel data={row.original.postal_code} />,
            },
            {
                id: "workplace",
                header: t("employees.workplace", "Workplace"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <WorkplaceLabel data={row.original.org_user_workplace} link />
                ),
            },
            {
                id: "absence_policy",
                header: t("employees.absencePolicy", "Absence Policy"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.org_absence_policy?.name ?? null} />
                ),
            },
            {
                id: "time_policy",
                header: t("employees.timePolicy", "Time Policy"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.org_time_policy?.name ?? null} />
                ),
            },
            {
                id: "reporting_to",
                header: t("employees.reportingTo", "Reports To"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    row.original.reporting_to
                        ? <EmployeeLabel data={row.original.reporting_to} />
                        : <span className="text-muted-foreground">-</span>
                ),
            },
            {
                id: "groups",
                header: t("employees.groups", "Groups"),
                enableResizing: true,
                size: 220,
                cell: ({ row }) => (
                    <OverflowStringTags items={row.original.groups ?? []} />
                ),
            },
            {
                accessorKey: "address_line_1",
                header: t("employees.addressLine1", "Address Line 1"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <TextLabel data={row.original.address_line_1} />,
            },
            {
                accessorKey: "address_line_2",
                header: t("employees.addressLine2", "Address Line 2"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <TextLabel data={row.original.address_line_2} />,
            },
            {
                accessorKey: "national_id_number",
                header: t("employees.nationalIdNumber", "National ID"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <TextLabel data={row.original.national_id_number} />,
            },
            {
                accessorKey: "tax_id_number",
                header: t("employees.taxIdNumber", "Tax ID"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <TextLabel data={row.original.tax_id_number} />,
            },
            {
                id: "reporting_absence_to",
                header: t("employees.reportingAbsenceTo", "Absence Supervisor"),
                enableResizing: true,
                size: 220,
                cell: ({ row }) => (
                    <OverflowEmployeeTags employees={row.original.reporting_absence_to ?? []} />
                ),
            },
            {
                id: "is_supervisor",
                header: t("employees.isSupervisor", "Supervisor"),
                enableResizing: true,
                size: 110,
                cell: ({ row }) =>
                    row.original.is_supervisor ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                    ),
            },
            {
                id: "is_absence_supervisor",
                header: t("employees.isAbsenceSupervisor", "Absence Supervisor"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) =>
                    row.original.is_absence_supervisor ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
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
                cell: ({ row }) => renderActions(row.original, employees),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, employees]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={employees}
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
                                    <Users className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle ||
                                                t("employees.noEmployeesTitle", "No employees yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription ||
                                                t(
                                                    "employees.noEmployeesDescription",
                                                    "Start by adding your first employee",
                                                )}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel ||
                                                t("employees.addEmployee", "Add Employee")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const employee = row.original as Employee;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick?.(employee)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );

                        return wrapRowWithContextMenu(employee, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const EmployeesTable = memo(EmployeesTableComponent);

export default EmployeesTable;
