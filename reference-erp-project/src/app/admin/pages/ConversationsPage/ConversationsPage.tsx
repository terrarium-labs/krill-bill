import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import ConversationsTable from "./components/conversations-table";
import ConversationDetailSheet from "./components/conversation-detail-sheet";
import { getCharlesConversations } from "@/api/chat/conversations";
import type { CharlesConversation } from "@/types/chat/conversations";
import { useConversationsTablePreferences } from "@/hooks/use-conversations-table-preferences";
import { ConversationColumnSelector } from "./components/conversation-column-selector";

const ConversationsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { tableFilters, setTableFilters } = useTableFilters();

    const [conversations, setConversations] = useState<CharlesConversation[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
        null,
    );
    const [totalCostUsd, setTotalCostUsd] = useState<number>(0);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useConversationsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const fetchConversations = async (query: string = "") => {
        if (!orgId) return;
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getCharlesConversations(
                orgId,
                query || undefined,
                null,
                tableFilters || undefined,
            );
            if (response.success && response.success.conversations) {
                setConversations(response.success.conversations);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters && response.success.params) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(
                    t(
                        "conversations.errorFetching",
                        "Error fetching conversations",
                    ),
                );
            }
        } catch {
            toast.error(
                t(
                    "conversations.errorFetching",
                    "Error fetching conversations",
                ),
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) fetchConversations();
    }, [orgId]);

    const loadMore = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;
        setLoadingMore(true);

        try {
            const response = await getCharlesConversations(
                orgId,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined,
            );
            if (response.success && response.success.conversations) {
                setConversations((prev) => [
                    ...prev,
                    ...response.success.conversations,
                ]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "conversations.errorFetching",
                        "Error fetching conversations",
                    ),
                );
            }
        } catch {
            toast.error(
                t(
                    "conversations.errorFetching",
                    "Error fetching conversations",
                ),
            );
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRowClick = (conversation: CharlesConversation) => {
        setSelectedGroupId(conversation.group_id);
        setDetailOpen(true);
        setTotalCostUsd(conversation.conversation_cost);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("conversations.title", "Conversations")}
                description={t(
                    "conversations.description",
                    "View AI assistant conversation history.",
                )}
                docs={{ slug: "pd_admin_conversations" }}
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchConversations}
                placeholder={t(
                    "conversations.searchPlaceholder",
                    "Search conversations...",
                )}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={() => fetchConversations(searchQuery)}
                    endSlot={
                        <ConversationColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <ConversationsTable
                conversations={conversations}
                isLoading={isLoading}
                loadingMore={loadingMore}
                hasMore={!!nextPageToken}
                searchQuery={searchQuery}
                onLoadMore={loadMore}
                onRowClick={handleRowClick}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            <ConversationDetailSheet
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open) setSelectedGroupId(null);
                }}
                orgId={orgId}
                groupId={selectedGroupId}
                totalCostUsd={totalCostUsd}
            />
        </div>
    );
};

export default ConversationsPage;
