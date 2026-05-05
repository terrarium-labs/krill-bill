import { createContext, useContext, useEffect, useState } from "react";
import { getNews, getRelatedNews } from "@/api/orgs/news/admin/news";
import { useParams } from "react-router";
import { NewsEditorPageSkeleton } from "../NewsAdminDetailPage/components/news-editor-page-skeleton";
import { NewsArticle } from "@/types/news/news";

interface NewsContextType {
    newsArticle: NewsArticle | null;
    relatedArticles: NewsArticle[];
    isLoadingRelated: boolean;
    refreshNews: () => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: React.ReactNode }) => {
    const [newsArticle, setNewsArticle] = useState<NewsArticle | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRelated, setIsLoadingRelated] = useState(true);
    const { newsId, orgId } = useParams<{ newsId: string, orgId: string }>();

    const isCreateMode = newsId === "create";

    const fetchNews = async (newsId: string) => {
        if (!orgId || isCreateMode || !newsId) {
            setIsLoading(false);
            return;
        };
        try {
            const response = await getNews(orgId, newsId);
            if (response.success) {
                setNewsArticle(response.success.news_article);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRelatedNews = async (newsId: string) => {
        if (!orgId || isCreateMode || !newsId) {
            setIsLoadingRelated(false);
            return;
        };
        try {
            const response = await getRelatedNews(orgId, newsId, null);
            if (response.success) {
                setRelatedArticles(response.success.news || []);
            }
        } catch (error) {
            console.error("Error fetching related news:", error);
        } finally {
            setIsLoadingRelated(false);
        }
    };

    useEffect(() => {
        // Skip fetching if we're in create mode
        if (isCreateMode) {
            setIsLoading(false);
            setIsLoadingRelated(false);
            return;
        }

        if (orgId && newsId) {
            fetchNews(newsId);
            fetchRelatedNews(newsId);
        }
    }, [orgId, newsId, isCreateMode]);

    const refreshNews = () => {
        if (orgId && newsId) {
            fetchNews(newsId);
            fetchRelatedNews(newsId);
        }
    };

    if (isLoading) {
        return <NewsEditorPageSkeleton />;
    }

    return (
        <NewsContext.Provider
            value={{
                newsArticle,
                relatedArticles,
                isLoadingRelated,
                refreshNews,
            }}
        >
            {children}
        </NewsContext.Provider>
    );
};

export const useNews = () => {
    const context = useContext(NewsContext);
    if (context === undefined) {
        throw new Error("useNews must be used within a NewsContext");
    }
    return context;
};

