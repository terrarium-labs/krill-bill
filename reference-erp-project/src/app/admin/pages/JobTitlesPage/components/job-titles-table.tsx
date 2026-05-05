import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Users, Loader2, Plus } from "lucide-react";
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
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableCell as TableCellRaw, TableRow as TableRowRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import { JobTitle } from "@/types/general/job-titles";
import CurrencyLabel from "@/app/components/labels/currency-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type JobTitleTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "pmc"
    | "pvp"
    | "num_employees"
    | "actions";

type JobTitlesTableProps = {
    jobTitles: JobTitle[];
    isLoading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    searchQuery: string;
    onRowClick: (jobTitleId: string) => void;
    onLoadMore: () => void;
    onAddJobTitle?: () => void;
    renderActions?: (jobTitle: JobTitle) => ReactNode;
    hiddenColumns?: JobTitleTableColumnKey[] | JobTitleTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const JobTitlesTableComponent = ({
    jobTitles,
    isLoading,
    loadingMore,
    hasMore,
    searchQuery,
    onRowClick,
    onLoadMore,
    onAddJobTitle,
    renderActions,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: JobTitlesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<JobTitle>(renderActions);

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

    const columns = useMemo<ColumnDef<JobTitle>[]>(() => {
        const cols: ColumnDef<JobTitle>[] = [
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
                accessorKey: "name",
                header: t("admin.jobTitles.name", "Job Title"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <Tag text={row.original.name} />,
            },
            {
                accessorKey: "description",
                header: t("admin.jobTitles.description", "Description"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => <TextLargeLabel data={row.original.description} />,
            },
            {
                accessorKey: "pmc",
                header: t("admin.jobTitles.pmc", "PMC"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <CurrencyLabel data={row.original.pmc} />,
            },
            {
                accessorKey: "pvp",
                header: t("admin.jobTitles.pvp", "PVP"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <CurrencyLabel data={row.original.pvp} />,
            },
            {
                accessorKey: "num_employees",
                header: t("admin.jobTitles.employeesCount", "Employees"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{row.original.num_employees || 0}</span>
                    </div>
                ),
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
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
    }, [t, renderActions]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={jobTitles}
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
                                        <Users className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {searchQuery
                                                    ? t("admin.jobTitles.noResultsFound", "No job titles found")
                                                    : t("admin.jobTitles.noJobTitlesTitle", "No job titles yet")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? t("admin.jobTitles.noResultsDescription", "No job titles match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("admin.jobTitles.noJobTitlesDescription", "Start by adding your first job title")}
                                            </p>
                                        </div>
                                        {onAddJobTitle && (
                                            <Button variant="outline" onClick={onAddJobTitle}>
                                                <Plus className="h-4 w-4" />
                                                {t("admin.jobTitles.addJobTitle", "Add Job Title")}
                                            </Button>
                                        )}
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                            const jobTitle = row.original;
                            return wrapRowWithContextMenu(
                                jobTitle,
                                <TableRowRaw
                                    key={row.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => onRowClick(jobTitle.id)}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} cell={cell} />
                                    ))}
                                </TableRowRaw>,
                            );
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

export const JobTitlesTable = memo(JobTitlesTableComponent);
export default JobTitlesTable;
