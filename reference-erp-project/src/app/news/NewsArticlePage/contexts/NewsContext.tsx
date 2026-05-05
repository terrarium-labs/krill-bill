import { createContext, useContext, useEffect, useState } from "react";
import { getOrgNewsBySlugOrId, getOrgNewsRelatedNews, getOrgNewsReactions } from "@/api/orgs/news/news";
import { useParams } from "react-router";
import { NewsArticlePageSkeleton } from "../components/news-article-page-skeleton";
import { NewsArticle } from "@/types/news/news";
import { NewsReaction } from "@/types/news/reactions";

interface NewsContextType {
    newsArticle: NewsArticle | null;
    relatedArticles: NewsArticle[];
    isLoadingRelated: boolean;
    reactions: NewsReaction[];
    isLoadingReactions: boolean;
    refreshNews: () => void;
    refreshReactions: () => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: React.ReactNode }) => {
    const [newsArticle, setNewsArticle] = useState<NewsArticle | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRelated, setIsLoadingRelated] = useState(true);
    const [reactions, setReactions] = useState<NewsReaction[]>([]);
    const [isLoadingReactions, setIsLoadingReactions] = useState(true);
    const { newsId, orgId } = useParams<{ newsId: string, orgId: string }>();

    const fetchNews = async (newsIdOrSlug: string) => {
        if (!orgId || !newsIdOrSlug) {
            setIsLoading(false);
            return null;
        }
        try {
            const response = await getOrgNewsBySlugOrId(orgId, newsIdOrSlug);
            if (response.success) {
                setNewsArticle(response.success.news_article);
                return response.success.news_article.id;
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    const fetchRelatedNews = async (newsIdOrSlug: string) => {
        if (!orgId || !newsIdOrSlug) {
            setIsLoadingRelated(false);
            return;
        }
        try {
            const response = await getOrgNewsRelatedNews(orgId, newsIdOrSlug, null);
            if (response.success) {
                setRelatedArticles(response.success.news || []);
            }
        } catch (error) {
            console.error("Error fetching related news:", error);
        } finally {
            setIsLoadingRelated(false);
        }
    };
    const fetchReactions = async (newsIdOrSlug: string) => {
        if (!orgId || !newsIdOrSlug) {
            setIsLoadingReactions(false);
            return;
        }
        try {
            const response = await getOrgNewsReactions(orgId, newsIdOrSlug);
            if (response.success) {
                setReactions(response.success.reactions || []);
            }
        } catch (error) {
            console.error("Error fetching reactions:", error);
        } finally {
            setIsLoadingReactions(false);
        }
    };

    const refreshNews = () => {
        if (orgId && newsId) {
            fetchNews(newsId);
            fetchRelatedNews(newsId);
            fetchReactions(newsId);
        }
    };

    const refreshReactions = () => {
        if (orgId && newsId) {
            fetchReactions(newsId);
        }
    };

    useEffect(() => {
        if (orgId && newsId) {
            fetchNews(newsId);
            fetchRelatedNews(newsId);
            fetchReactions(newsId);
        }
    }, [orgId, newsId]);


    if (isLoading) {
        return <NewsArticlePageSkeleton />;
    }

    return (
        <NewsContext.Provider
            value={{
                newsArticle,
                relatedArticles,
                isLoadingRelated,
                reactions,
                isLoadingReactions,
                refreshNews,
                refreshReactions,
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
