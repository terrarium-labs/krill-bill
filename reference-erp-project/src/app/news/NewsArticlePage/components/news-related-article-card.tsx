import { Card } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { Calendar } from "lucide-react";
import { formatDate } from "@/utils/miscelanea";
import { NewsArticle } from "@/types/news/news";
import { useParams, useNavigate } from "react-router";

const RelatedArticleCard = ({ article }: { article: NewsArticle }) => {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    const handleClick = () => {
        if (orgId) {
            navigate(`/${orgId}/news/${article.slug || article.id}`);
        }
    };

    return (
        <Card
            className="overflow-hidden py-0 min-h-26 shadow-none transition-all cursor-pointer group border-border"
            onClick={handleClick}
        >
            <div className="flex gap-3 p-3">
                {/* Cover Image */}
                <div className="w-20 h-20 shrink-0 overflow-hidden bg-muted rounded-md flex items-center justify-center">
                    {article.cover_image_url ? (
                        <img
                            src={article.cover_image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <Newspaper className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {article.title}
                        </h4>
                        {article.published_at && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span className="truncate">{formatDate(article.published_at, { showTime: false })}</span>
                            </div>
                        )}
                        {article.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {article.summary}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default RelatedArticleCard;