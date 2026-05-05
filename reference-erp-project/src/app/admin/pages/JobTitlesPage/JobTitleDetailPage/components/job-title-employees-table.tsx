import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus } from "lucide-react";
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
import EmailLabel from "@/app/components/labels/email-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

interface JobTitleEmployee {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    [key: string]: any;
}

interface JobTitleEmployeesTableProps {
    employees: JobTitleEmployee[];
    isLoading: boolean;
    searchQuery: string;
    onAddEmployee?: () => void;
    renderActions?: (employee: JobTitleEmployee) => ReactNode;
}

const JobTitleEmployeesTableComponent = ({
    employees,
    isLoading,
    searchQuery,
    onAddEmployee,
    renderActions,
}: JobTitleEmployeesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<JobTitleEmployee>(renderActions);

    const columns = useMemo<ColumnDef<JobTitleEmployee>[]>(() => {
        const allColumns: ColumnDef<JobTitleEmployee>[] = [
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
                header: t("jobTitles.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original as any} link />,
            },
            {
                accessorKey: "email",
                header: t("jobTitles.columns.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
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

        return allColumns;
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
                        <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                            <div className="flex items-center justify-center space-y-4 flex-col">
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("jobTitles.employees.noResultsFound", "No results found")
                                            : t("jobTitles.employees.noEmployees", "No employees")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "jobTitles.employees.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "jobTitles.employees.noEmployeesDescription",
                                                "No employees assigned to this job title."
                                              )}
                                    </p>
                                </div>
                                {onAddEmployee && (
                                    <Button variant="outline" onClick={onAddEmployee}>
                                        <Plus className="h-4 w-4" />
                                        {t("jobTitles.employees.addEmployee", "Add employee")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const employee = row.original as JobTitleEmployee;
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

export const JobTitleEmployeesTable = memo(JobTitleEmployeesTableComponent);
export default JobTitleEmployeesTable;
