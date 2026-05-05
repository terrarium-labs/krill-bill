import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, ReactNode } from "react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Users } from "lucide-react";
import { Employee } from "@/types/employees/employees";
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";
import EmailLabel from "@/app/components/labels/email-label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys that can be hidden
export type GroupEmployeesTableColumnKey =
    | "id"
    | "name"
    | "email"
    | "role"
    | "actions";

export interface GroupEmployeesTableProps {
    employees: Employee[];
    isLoading: boolean;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: GroupEmployeesTableColumnKey[] | GroupEmployeesTableColumnKey;
    /** Custom render function for the actions column. If not provided, no actions column will be shown */
    renderActions?: (employee: Employee, allEmployees: Employee[]) => ReactNode;
    /** Called when a row is clicked (optional) */
    onRowClick?: (employee: Employee) => void;
    /** Whether rows should be clickable (shows cursor pointer) */
    clickableRows?: boolean;
    /** Custom empty state message */
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    /** Custom action for empty state */
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
}

const GroupEmployeesTableComponent = ({
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
}: GroupEmployeesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Employee>(renderActions, employees);

    // Normalize hiddenColumns to always be an array
    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) {
            return hiddenColumns;
        }
        return [hiddenColumns];
    }, [hiddenColumns]);

    const isColumnVisible = (key: GroupEmployeesTableColumnKey) =>
        !hiddenColumnsArray.includes(key);

    const columns = useMemo<ColumnDef<Employee>[]>(() => {
        const cols: ColumnDef<Employee>[] = [];

        // ID Column
        if (isColumnVisible("id")) {
            cols.push({
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const employee = row.original;
                    return (
                        <IdBadge
                            id={employee.id}
                            hideIcon={true}
                            customTooltip={t("common.copyId", "Copy ID")}
                        />
                    );
                },
            });
        }

        // Name Column
        if (isColumnVisible("name")) {
            cols.push({
                accessorKey: "name",
                header: t("employees.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const employee = row.original;
                    return <EmployeeLabel data={employee} link />;
                },
            });
        }

        // Email Column
        if (isColumnVisible("email")) {
            cols.push({
                accessorKey: "email",
                header: t("employees.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const email = row.getValue("email") as string;
                    return <EmailLabel data={email} variant="black" link />;
                },
            });
        }


        // Role Column
        if (isColumnVisible("role")) {
            cols.push({
                accessorKey: "role",
                header: t("employees.role", "Role"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const role = row.original.job_title;
                    return role?.name ? <Tag text={role?.name } /> : <span className="text-muted-foreground">-</span>;
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
                cell: ({ row }) => {
                    const employee = row.original;
                    return renderActions(employee, employees);
                },
                meta: {
                    sticky: "right",
                },
            });
        }

        return cols;
    }, [t, hiddenColumnsArray, renderActions, employees]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider data={employees} columns={columns} enableColumnResizing>
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
                                            {emptyStateTitle || t("employees.noEmployeesTitle", "No employees yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || t(
                                                "employees.noEmployeesDescription",
                                                "Start by adding your first employee"
                                            )}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("employees.addEmployee", "Add Employee")}
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

export const GroupEmployeesTable = memo(GroupEmployeesTableComponent);

export default GroupEmployeesTable;
