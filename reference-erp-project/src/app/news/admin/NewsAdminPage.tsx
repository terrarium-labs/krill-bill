import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { NewsArticle } from "@/types/news/news";
import SearchBar from "../../components/search-bar";
import { getNewsList, deleteNews } from "@/api/orgs/news/admin/news";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import NewsTable from "./NewsAdminDetailPage/components/news-table";
import { NewsDeleteModal } from "./NewsAdminDetailPage/components/news-delete-modal";
import { useNewsTablePreferences } from "@/hooks/use-news-table-preferences";
import { NewsColumnSelector } from "./NewsAdminDetailPage/components/news-column-selector";

const NewsAdminPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newsToDelete, setNewsToDelete] = useState<NewsArticle | null>(null);
    const [deletingNews, setDeletingNews] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useNewsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch news function
    const fetchNews = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getNewsList(orgId, query, null);
            if (response.success && response.success.news) {
                setNews(response.success.news);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("news.errorFetchingNews") || "Error fetching news");
            }
        } catch (error) {
            toast.error(t("news.errorFetchingNews") || "Error fetching news");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchNews();
    }, []);

    // Load more news
    const loadMoreNews = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getNewsList(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.news) {
                setNews(prev => [...prev, ...response.success.news]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("news.errorFetchingNews") || "Error fetching news");
            }
        } catch (error) {
            toast.error(t("news.errorFetchingNews") || "Error fetching news");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (newsArticle: NewsArticle) => {
        setNewsToDelete(newsArticle);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteNews = async () => {
        if (!newsToDelete || !orgId) return;

        setDeletingNews(true);
        try {
            const response = await deleteNews(orgId, newsToDelete.id);
            if (response.success) {
                toast.success(t("news.newsDeleted", "News article deleted successfully"));
                // Remove from local state
                setNews(prev => prev.filter(n => n.id !== newsToDelete.id));
            } else {
                toast.error(t("news.errorDeletingNews", "Error deleting news article"));
            }
        } catch (error) {
            toast.error(t("news.errorDeletingNews", "Error deleting news article"));
        } finally {
            setDeletingNews(false);
            setDeleteModalOpen(false);
            setNewsToDelete(null);
        }
    };

    // Navigate to news detail
    const handleViewNews = (newsId: string) => {
        navigate(`/${orgId}/news-admin/${newsId}`);
    };

    // Navigate to create news
    const handleCreateNews = () => {
        navigate(`/${orgId}/news-admin/create`);
    };

    // Navigate to edit news
    const handleEditNews = (newsId: string) => {
        navigate(`/${orgId}/news-admin/${newsId}`);
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("news.title", "News")}
                description={t("news.description", "Manage your organization's news articles.")}
                docs={{ slug: "pd_mod_news" }}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreateNews}>
                            <Plus className="h-4 w-4" />
                            {t("news.addNews", "Add News")}
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    className="w-full"
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchNews}
                    placeholder={t("news.searchPlaceholder", "Search news...")}
                />
                <NewsColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            <NewsTable
                news={news}
                isLoading={isLoading}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                nextPageToken={nextPageToken}
                loadingMore={loadingMore}
                onLoadMore={loadMoreNews}
                onRowClick={(article) => handleViewNews(article.id)}
                onEmptyStateAction={handleCreateNews}
                emptyStateActionLabel={t("news.addNews", "Add News")}
                renderActions={(article) => (
                    <div className="flex justify-center items-center">
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => handleEditNews(article.id),
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteConfirm(article),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                )}
            />

            <NewsDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setNewsToDelete(null);
                }}
                newsArticle={newsToDelete}
                onConfirm={handleDeleteNews}
                isDeleting={deletingNews}
            />
        </>
    );
};

export default NewsAdminPage;