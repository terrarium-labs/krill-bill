import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Newspaper } from "lucide-react";
import { NewsArticle } from "@/types/news/news";
import { getOrgNews } from "@/api/orgs/news/news";
import { toast } from "sonner";
import { NewsFeedCard } from "./news-feed-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const NewsFeedList = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch latest news
    const fetchNews = async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const response = await getOrgNews(orgId, null, null);
            if (response.success && response.success.news) {
                setNews(response.success.news);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("dashboard.errorFetchingNews", "Error fetching news"));
            }
        } catch (error) {
            toast.error(t("dashboard.errorFetchingNews", "Error fetching news"));
        } finally {
            setIsLoading(false);
        }
    };

    // Load more news
    const loadMoreNews = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgNews(orgId, null, nextPageToken);
            if (response.success && response.success.news) {
                setNews(prev => [...prev, ...response.success.news]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("dashboard.errorFetchingNews", "Error fetching news"));
            }
        } catch (error) {
            toast.error(t("dashboard.errorFetchingNews", "Error fetching news"));
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [orgId]);

    return (
        <div className="shadow-none border-none">
            <div className="flex flex-col gap-4">
                <div className="text-md font-semibold">
                    {t("dashboard.latestNews", "Latest News")}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            {t("dashboard.loadingNews", "Loading news...")}
                        </p>
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center py-4">
                        <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-md font-medium text-muted-foreground">
                            {t('dashboard.noNewsYet', 'No news yet')}
                        </h3>
                        <p className="text-muted-foreground mb-4 text-xs">
                            {t('dashboard.noNewsDescription', 'Check back later for updates')}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[600px]">
                        <div className="space-y-3">
                            {news.map((article) => (
                                <NewsFeedCard key={article.id} article={article} />
                            ))}
                            {nextPageToken && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadMoreNews}
                                        disabled={loadingMore}
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
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
};

export default NewsFeedList;