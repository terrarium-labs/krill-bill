import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MessagesSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import EmployeeLabel from "@/app/components/labels/employee-label";
import DateLabel from "@/app/components/labels/date-label";
import {
    TableBody,
    TableCell,
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
import {
    TableCell as TableCellRaw,
    TableRow as TableRowRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { CharlesConversation } from "@/types/chat/conversations";
import { cn } from "@/lib/utils";

const formatStatusTagText = (status: string | null | undefined): string => {
    if (!status?.trim()) return "-";
    const s = status.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export type ConversationsTableColumnKey =
    | "group_id"
    | "employee"
    | "number_of_messages"
    | "conversation_cost"
    | "last_message_status"
    | "last_message_sent_at"
    | "created_at";

type ConversationsTableProps = {
    conversations: CharlesConversation[];
    isLoading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    searchQuery: string;
    onLoadMore: () => void;
    onRowClick?: (conversation: CharlesConversation) => void;
    hiddenColumns?: ConversationsTableColumnKey[] | ConversationsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const ConversationsTableComponent = ({
    conversations,
    isLoading,
    loadingMore,
    hasMore,
    searchQuery,
    onLoadMore,
    onRowClick,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: ConversationsTableProps) => {
    const { t } = useTranslation();

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

    const columns = useMemo<ColumnDef<CharlesConversation>[]>(() => [
        {
            accessorKey: "group_id",
            header: t("conversations.table.id", "ID"),
            enableResizing: true,
            size: 80,
            cell: ({ row }) => (
                <IdBadge id={row.original.group_id} hideIcon={true} />
            ),
        },
        {
            accessorKey: "employee",
            header: t("conversations.table.employee", "Employee"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => (
                <EmployeeLabel data={row.original.employee} />
            ),
        },
        {
            accessorKey: "number_of_messages",
            header: t("conversations.table.messages", "Messages"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {row.original.number_of_messages}
                </span>
            ),
        },
        {
            accessorKey: "conversation_cost",
            header: t("conversations.table.cost", "Cost"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <span className="text-xs font-mono tabular-nums">
                    ${row.original.conversation_cost.toFixed(4)}
                </span>
            ),
        },
        {
            accessorKey: "last_message_status",
            header: t("conversations.table.status", "Status"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <Tag text={formatStatusTagText(row.original.last_message_status)} />
            ),
        },
        {
            accessorKey: "last_message_sent_at",
            header: t("conversations.table.lastMessage", "Last Message"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <DateLabel data={row.original.last_message_sent_at} />
            ),
        },
        {
            accessorKey: "created_at",
            header: t("common.createdAt", "Created At"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <DateLabel data={row.original.created_at} />
            ),
        },
    ], [t]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={conversations}
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
                                        <MessagesSquare className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {searchQuery
                                                    ? t("conversations.noResultsFound", "No conversations found")
                                                    : t("conversations.noConversationsTitle", "No conversations yet")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? t("conversations.noResultsDescription", "No conversations match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("conversations.noConversationsDescription", "Conversations will appear here once users start chatting with the AI assistant")}
                                            </p>
                                        </div>
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => (
                            <TableRowRaw
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={cn(
                                    onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50",
                                )}
                                onClick={() => onRowClick?.(row.original as CharlesConversation)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        )}
                    </TableBody>
                </TableProvider>
            </div>

            {hasMore && (
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

export const ConversationsTable = memo(ConversationsTableComponent);
export default ConversationsTable;
