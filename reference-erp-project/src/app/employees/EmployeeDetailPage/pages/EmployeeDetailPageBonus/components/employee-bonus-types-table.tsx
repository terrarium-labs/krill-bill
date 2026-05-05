import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    TableBody,
    TableCell,
    TableColumnHeader,
    TableHead,
    TableHeader,
    TableHeaderGroup,
    TableProvider,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableCell as TableCellRaw, TableRow as TableRowRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import DateLabel from "@/app/components/labels/date-label";
import { BonusTypeEmployee } from "@/types/employees/bonus-types";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

type EmployeeBonusTypesTableProps = {
    bonusTypeEmployees: BonusTypeEmployee[];
    isLoading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    searchQuery: string;
    readOnly?: boolean;
    onLoadMore: () => void;
    onAdd?: () => void;
    renderActions?: (item: BonusTypeEmployee) => ReactNode;
};

const EmployeeBonusTypesTableComponent = ({
    bonusTypeEmployees,
    isLoading,
    loadingMore,
    hasMore,
    searchQuery,
    readOnly = false,
    onLoadMore,
    onAdd,
    renderActions,
}: EmployeeBonusTypesTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<BonusTypeEmployee>(renderActions);

    const columns = useMemo<ColumnDef<BonusTypeEmployee>[]>(() => {
        const cols: ColumnDef<BonusTypeEmployee>[] = [
            {
                accessorKey: "org_bonus_type.name",
                header: t("admin.bonusTypes.name", "Bonus Type"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLabel data={row.original.org_bonus_type?.name} />,
            },
            {
                accessorKey: "org_bonus_type.description",
                header: t("admin.bonusTypes.description", "Description"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => <TextLargeLabel data={row.original.org_bonus_type?.description} />,
            },
            {
                accessorKey: "amount",
                header: t("admin.bonusTypes.amount", "Amount"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <CurrencyLabel data={row.original.amount} />,
            },
            {
                accessorKey: "created_at",
                header: t("common.assignedAt", "Assigned At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel
                        data={row.original.created_at}
                        options={{ hide: ["hours", "minutes", "seconds"] }}
                    />
                ),
            },
        ];

        if (!readOnly) {
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
                        {renderActions && renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, readOnly, renderActions]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider data={bonusTypeEmployees} columns={columns} enableColumnResizing>
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
                                    className="h-64 text-center hover:bg-transparent"
                                    colSpan={columns.length}
                                >
                                    <div className="flex items-center justify-center space-y-4 flex-col">
                                        <Gift className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {searchQuery
                                                    ? t("employees.bonusTypes.noResultsFound", "No bonus types found")
                                                    : t("employees.bonusTypes.noBonusTypesTitle", "No bonus types assigned")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? t(
                                                          "employees.bonusTypes.noResultsDescription",
                                                          "No bonus types match your search for '{{searchQuery}}'",
                                                          { searchQuery }
                                                      )
                                                    : t(
                                                          "employees.bonusTypes.noBonusTypesDescription",
                                                          "No bonus types have been assigned yet"
                                                      )}
                                            </p>
                                        </div>
                                        {!readOnly && onAdd && (
                                            <Button variant="outline" onClick={onAdd}>
                                                <Plus className="h-4 w-4" />
                                                {t("employees.bonusTypes.assignBonusType", "Assign Bonus Type")}
                                            </Button>
                                        )}
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                            const item = row.original as BonusTypeEmployee;
                            const rowEl = (
                                <TableRowRaw
                                    key={row.id}
                                    className="hover:bg-muted/50"
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} cell={cell} />
                                    ))}
                                </TableRowRaw>
                            );
                            return readOnly ? rowEl : wrapRowWithContextMenu(item, rowEl);
                        }}
                    </TableBody>
                </TableProvider>
            </div>

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore || isLoading}
                        className="min-w-32"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}
        </>
    );
};

export const EmployeeBonusTypesTable = memo(EmployeeBonusTypesTableComponent);
export default EmployeeBonusTypesTable;
