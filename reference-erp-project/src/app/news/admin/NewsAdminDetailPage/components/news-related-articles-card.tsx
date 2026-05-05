import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types/news/news";
import { Calendar } from "lucide-react";
import EmployeeLabel from "@/app/components/labels/employee-label";

const statusStyles: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
    published: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
    archived: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800",
};

interface NewsRelatedArticlesCardProps {
    relatedArticles: NewsArticle[];
    isLoadingRelated: boolean;
}

export const NewsRelatedArticlesCard = ({ relatedArticles, isLoadingRelated }: NewsRelatedArticlesCardProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    const handleArticleClick = (article: NewsArticle) => {
        if (orgId) {
            navigate(`/${orgId}/news/${article.slug || article.id}`);
        }
    };

    if (isLoadingRelated) {
        return (
            <Card className="shadow-none border-border">
                <CardHeader className="pb-4">
                    <CardTitle>{t("newsDetail.relatedArticles", "Related Articles")}</CardTitle>
                    <CardDescription>
                        {t("newsDetail.relatedArticlesDescription", "Similar articles you might find interesting")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
                <CardTitle>{t("newsDetail.relatedArticles", "Related Articles")}</CardTitle>
                <CardDescription>
                    {t("newsDetail.relatedArticlesDescription", "Similar articles you might find interesting")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {relatedArticles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t("newsDetail.noRelatedArticles", "No related articles yet.")}
                    </p>
                ) : (
                    relatedArticles.map((article) => {

                        const statusBadgeClass = cn(
                            "capitalize border text-xs",
                            statusStyles[article.status] ??
                            "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
                        );

                        return (
                            <div
                                key={article.id}
                                className="group cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                                onClick={() => handleArticleClick(article)}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h4>
                                        <Badge variant="outline" className={statusBadgeClass}>
                                            {article.status}
                                        </Badge>
                                    </div>

                                    {article.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {article.summary}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <EmployeeLabel data={article.author} />
                                        {article.published_at && (
                                            <>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{formatDate(article.published_at, { showTime: false })}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};

export default NewsRelatedArticlesCard;

