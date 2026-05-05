import { useNavigate, useParams } from "react-router";
import { Calendar, ChevronRight, Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewsArticle } from "@/types/news/news";
import { formatDate } from "@/utils/miscelanea";

interface NewsFeedCardProps {
    article: NewsArticle;
}

export const NewsFeedCard = ({ article }: NewsFeedCardProps) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleCardClick = () => {
        navigate(`/${orgId}/news/${article.slug || article.id}`);
    };

    return (
        <Card
            className="overflow-hidden py-0 min-h-26 shadow-none transition-all cursor-pointer group border-border rounded-lg hover:bg-accent/50"
            onClick={handleCardClick}
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

                {/* Arrow Icon */}
                <div className="flex items-center justify-center shrink-0">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all duration-200" />
                </div>
            </div>
        </Card>
    );

};

export default NewsFeedCard;

