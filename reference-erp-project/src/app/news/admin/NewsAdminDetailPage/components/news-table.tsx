import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, type ReactNode } from "react";
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
import { Loader2, Newspaper, Plus } from "lucide-react";
import { NewsArticle } from "@/types/news/news";
import { Employee } from "@/types/employees/employees";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getColorFromString } from "@/utils/miscelanea";
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";
import { Button } from "@/components/ui/button";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import DateLabel from "@/app/components/labels/date-label";

export type NewsTableColumnKey =
    | "id"
    | "title"
    | "status"
    | "author"
    | "published_at"
    | "created_at"
    | "actions";

export interface NewsTableProps {
    news: NewsArticle[];
    isLoading: boolean;
    hiddenColumns?: NewsTableColumnKey[] | NewsTableColumnKey;
    renderActions?: (article: NewsArticle, allNews: NewsArticle[]) => ReactNode;
    onRowClick?: (article: NewsArticle) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    nextPageToken?: string | null;
    loadingMore?: boolean;
    onLoadMore?: () => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const NewsTableComponent = ({
    news,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
    nextPageToken = null,
    loadingMore = false,
    onLoadMore,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: NewsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<NewsArticle>(renderActions, news);

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

    const columns = useMemo<ColumnDef<NewsArticle>[]>(() => {
        const cols: ColumnDef<NewsArticle>[] = [
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
                accessorKey: "title",
                header: t("news.title", "Title"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => {
                    const article = row.original;
                    return (
                        <div className="font-medium text-sm flex items-center gap-2">
                            {article.cover_image_url ? (
                                <Avatar className="h-6 w-6 rounded">
                                    <AvatarImage src={article.cover_image_url} alt={article.title} className="object-cover" />
                                    <AvatarFallback
                                        className="text-sm font-medium h-6 w-6 rounded text-white"
                                        style={{ backgroundColor: getColorFromString(article.title) }}
                                    >
                                        {article.title.slice(0, 1).toUpperCase() || "-"}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                                    <Newspaper className="h-3 w-3 text-muted-foreground" />
                                </div>
                            )}
                            <span className="block truncate">
                                {row.getValue("title") || <span className="text-muted-foreground">-</span>}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("news.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={row.getValue("status") as NewsArticle["status"]} className="capitalize" />
                ),
            },
            {
                id: "author",
                header: t("news.author", "Author"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <EmployeeLabel data={row.original.author as Employee} link />
                ),
            },
            {
                id: "published_at",
                header: t("news.publishedAt", "Published At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const article = row.original;
                    if (!article.published_at) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <div className="text-sm">
                            {formatDate(article.published_at, { showTime: true })}
                        </div>
                    );
                },
            },
            {
                id: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.original.created_at} />,
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
                        {renderActions(row.original, news)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, news]);

    const defaultEmptyTitle = searchQuery
        ? t("news.noResultsFound", "No news found")
        : t("news.noNewsTitle", "No news yet");
    const defaultEmptyDescription = searchQuery
        ? t("news.noResultsDescription", "No news match your search for '{{searchQuery}}'", { searchQuery })
        : t("news.noNewsDescription", "Start by adding your first news article");

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={news}
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
                                        <Newspaper className="h-10 w-10 text-muted-foreground" />
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
                                                <Plus className="h-4 w-4" />
                                                {emptyStateActionLabel || t("news.addNews", "Add News")}
                                            </Button>
                                        )}
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                            const article = row.original as NewsArticle;
                            const rowContent = (
                                <TableRowRaw
                                    key={row.id}
                                    className={
                                        clickableRows || onRowClick
                                            ? "hover:bg-muted/50 cursor-pointer"
                                            : "hover:bg-muted/50"
                                    }
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick?.(article)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} cell={cell} />
                                    ))}
                                </TableRowRaw>
                            );
                            return wrapRowWithContextMenu(article, rowContent);
                        }}
                    </TableBody>
                </TableProvider>
            </div>

            {nextPageToken && onLoadMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore}
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

export const NewsTable = memo(NewsTableComponent);
export default NewsTable;
