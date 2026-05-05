import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
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
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { Employee } from "@/types/employees/employees";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import EmailLabel from "@/app/components/labels/email-label";
import Tag from "@/app/components/tag/tag";
import PhoneLabel from "@/app/components/labels/phone-label";

type OnCallGroupEmployeesTableProps = {
    employees: Employee[];
    isLoading: boolean;
    searchQuery: string;
    onAddEmployee?: () => void;
    renderActions?: (employee: Employee) => ReactNode;
};

const OnCallGroupEmployeesTableComponent = ({
    employees,
    isLoading,
    searchQuery,
    onAddEmployee,
    renderActions,
}: OnCallGroupEmployeesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Employee>(renderActions);

    const columns = useMemo<ColumnDef<Employee>[]>(() => {
        const cols: ColumnDef<Employee>[] = [
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
                accessorKey: "first_name",
                header: t("on-call.groups.employees.columns.name", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original} link />,
            },
            {
                accessorKey: "email",
                header: t("on-call.groups.employees.columns.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
            },
            {
                accessorKey: "phone",
                header: t("on-call.groups.employees.columns.phone", "Phone"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const phone = row.original.phone;
                    return phone ? (
                        <PhoneLabel data={phone} variant="black" link />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "job_title",
                header: t("on-call.groups.employees.columns.jobTitle", "Job Title"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const name = row.original.job_title?.name;
                    return name ? <Tag text={name} /> : <span className="text-muted-foreground">-</span>;
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
                    <div className="flex justify-center items-center">
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" as const },
            });
        }

        return cols;
    }, [t, renderActions]);

    return (
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
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("on-call.groups.employees.noResultsFound", "No results found")
                                            : t("on-call.groups.employees.noEmployees", "No employees")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "on-call.groups.employees.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "on-call.groups.employees.noEmployeesDescription",
                                                "No employees assigned to this group."
                                              )}
                                    </p>
                                </div>
                                {onAddEmployee && (
                                    <Button variant="outline" onClick={onAddEmployee}>
                                        <Plus className="h-4 w-4" />
                                        {t("on-call.groups.employees.addEmployee", "Add employee")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const employee = row.original as Employee;
                    return wrapRowWithContextMenu(
                        employee,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
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
    );
};

export const OnCallGroupEmployeesTable = memo(OnCallGroupEmployeesTableComponent);
export default OnCallGroupEmployeesTable;
