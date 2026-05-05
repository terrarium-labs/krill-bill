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
import Tag from "@/app/components/tag/tag";
import EmailLabel from "@/app/components/labels/email-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

interface WorkplaceEmployeesTableProps {
    employees: any[];
    isLoading: boolean;
    searchQuery: string;
    onAddEmployee?: () => void;
    renderActions?: (employee: any) => ReactNode;
}

const WorkplaceEmployeesTableComponent = ({
    employees,
    isLoading,
    searchQuery,
    onAddEmployee,
    renderActions,
}: WorkplaceEmployeesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<any>(renderActions);

    const columns = useMemo<ColumnDef<any>[]>(() => {
        const allColumns: ColumnDef<any>[] = [
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
                header: t("workplaces.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original} link />,
            },
            {
                accessorKey: "email",
                header: t("workplaces.columns.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
            },
            {
                accessorKey: "role",
                header: t("workplaces.columns.role", "Role"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const role = row.original.job_title;
                    return role?.name ? <Tag text={role?.name} /> : <span className="text-muted-foreground">-</span>;
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
                                            ? t("workplaces.employees.noResultsFound", "No results found")
                                            : t("workplaces.employees.noEmployees", "No employees found")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "workplaces.employees.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "workplaces.employees.noEmployeesDescription",
                                                "No employees assigned to this workplace."
                                              )}
                                    </p>
                                </div>
                                {onAddEmployee && (
                                    <Button variant="outline" onClick={onAddEmployee}>
                                        <Plus className="h-4 w-4" />
                                        {t("workplaces.employees.addEmployee", "Add employee")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const employee = row.original as any;
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

export const WorkplaceEmployeesTable = memo(WorkplaceEmployeesTableComponent);
export default WorkplaceEmployeesTable;
