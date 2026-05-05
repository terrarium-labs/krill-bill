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
import EmailLabel from "@/app/components/labels/email-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

type TimePolicyEmployeesTableColumnKey = "id" | "name" | "email" | "actions";

interface TimePolicyEmployeesTableProps {
    data: any[];
    isLoading?: boolean;
    hiddenColumns?: TimePolicyEmployeesTableColumnKey[];
    renderActions?: (employee: any) => ReactNode;
    onRowClick?: (employee: any) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    searchQuery?: string;
}

const TimePolicyEmployeesTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    searchQuery = "",
}: TimePolicyEmployeesTableProps) => {
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
                header: t("timePolicies.employees.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original} link />,
            },
            {
                accessorKey: "email",
                header: t("timePolicies.employees.columns.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.getValue("email")} variant="black" link />,
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
            const key = ("accessorKey" in col ? col.accessorKey : col.id) as TimePolicyEmployeesTableColumnKey;
            return !hiddenColumns.includes(key);
        });
    }, [t, renderActions, hiddenColumns]);

    return (
        <TableProvider data={data} columns={columns} enableColumnResizing>
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
                                            ? t("timePolicies.employees.noResultsFound", "No results found")
                                            : t("timePolicies.employees.noEmployees", "No employees")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "timePolicies.employees.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "timePolicies.employees.noEmployeesDescription",
                                                "No employees assigned to this time policy."
                                              )}
                                    </p>
                                </div>
                                {!searchQuery && onEmptyStateAction && (
                                    <Button variant="outline" onClick={onEmptyStateAction}>
                                        <Plus className="h-4 w-4" />
                                        {t("timePolicies.employees.addEmployee", "Add employee")}
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
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={clickableRows && onRowClick ? () => onRowClick(employee) : undefined}
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

export const TimePolicyEmployeesTable = memo(TimePolicyEmployeesTableComponent);
export default TimePolicyEmployeesTable;
