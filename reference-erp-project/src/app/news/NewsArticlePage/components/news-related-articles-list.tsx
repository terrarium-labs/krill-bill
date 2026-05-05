import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewsRelatedArticleCard from "./news-related-article-card";
import { useNews } from "@/app/news/NewsArticlePage/contexts/NewsContext";

const NewsRelatedArticlesList = () => {
    const { t } = useTranslation();

    const { relatedArticles, isLoadingRelated } = useNews();

    return (
        <Card className="shadow-none border-none gap-0">
            <CardHeader className="pb-0 px-0">
                <CardTitle className="text-base">
                    {t("news.relatedArticles", "Related Articles")}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                {isLoadingRelated ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : relatedArticles.length === 0 ? (
                    <div className="text-center py-4">
                        <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-md font-medium text-muted-foreground">
                            {t('news.noRelatedArticles', 'No related articles yet')
                            }
                        </h3>
                        <p className="text-muted-foreground mb-4 text-xs">
                            {t('news.noRelatedArticlesDescription', 'Check back later for updates')
                            }
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {relatedArticles.map((article) => (
                                <NewsRelatedArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>)
}

export default NewsRelatedArticlesList;