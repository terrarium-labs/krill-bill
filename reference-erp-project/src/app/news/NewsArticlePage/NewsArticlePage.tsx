import { useMemo, useRef } from "react";
import { useNews } from "./contexts/NewsContext";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Calendar } from "lucide-react";
import Tag from "@/app/components/tag/tag";
import { formatDate } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import PageHeader from "@/app/components/page-header";
import NewsRelatedArticlesList from "./components/news-related-articles-list";
import NewsReactionsContainer from "./components/news-reactions-container";
import {
    extractHeadingsFromHtml,
    injectHeadingIdsIntoHtml,
} from "@/utils/heading-navigation";
import { useHeadingNavigation } from "@/hooks/use-heading-navigation";

const NewsArticlePage = () => {
    const { newsArticle } = useNews();
    const { t } = useTranslation();
    const contentRef = useRef<HTMLDivElement>(null);

    const headings = useMemo(() => {
        if (!newsArticle?.content) return [];
        return extractHeadingsFromHtml(newsArticle.content);
    }, [newsArticle?.content]);

    const { activeHeading, scrollToHeading } = useHeadingNavigation({
        contentRef,
        headings,
        scrollOffset: 100,
    });

    if (!newsArticle) return null;

    const shouldRenderCover = Boolean(newsArticle.cover_image_url);

    // Add IDs to HTML headings for navigation
    const enhancedHtml = useMemo(() => {
        if (!newsArticle.content) return "";
        return injectHeadingIdsIntoHtml(newsArticle.content, headings);
    }, [newsArticle.content, headings]);

    return (
        <>
            <PageHeader
                description={t("news.goBack", "Go back")}
                showBackButton={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Content */}
                <div ref={contentRef} className="lg:col-span-3">
                    <Card className="shadow-none border-none py-0">
                        <CardHeader className="space-y-3 px-0 pt-0">
                            {/* Title */}
                            <h1 className="text-3xl font-bold tracking-tight">
                                {newsArticle.title}
                            </h1>

                            {/* Summary */}
                            {newsArticle.summary && (
                                <p className="text-lg text-muted-foreground">
                                    {newsArticle.summary}
                                </p>
                            )}

                            {/* Tags */}
                            {newsArticle.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {newsArticle.tags.map((tag) => (
                                        <Tag key={tag} text={tag} className="capitalize" />
                                    ))}
                                </div>
                            )}

                            {/* Author & Date Info */}
                            <div className="flex items-center gap-4 pb-4 border-b">
                                <EmployeeAvatar employee={newsArticle.author} />

                                {newsArticle.published_at && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(newsArticle.published_at, { showTime: false })}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        {/* Cover Image */}
                        {shouldRenderCover && (
                            <div className="pb-6">
                                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-border bg-muted">
                                    <img
                                        src={newsArticle.cover_image_url as string}
                                        alt={newsArticle.title}
                                        className="h-full w-full object-cover"
                                    />
                                </AspectRatio>
                            </div>
                        )}

                        {/* Content */}
                        <CardContent className="px-0">
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: enhancedHtml }}
                            />
                        </CardContent>

                        {/* Reactions */}
                        <div className="border-t pt-6 pb-0">
                            <NewsReactionsContainer />
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6 sticky top-20 self-start">
                    {/* Table of Contents */}
                    {headings.length > 0 && (
                        <Card className="shadow-none border-none gap-0">
                            <CardHeader className="pb-0 px-0">
                                <CardTitle className="text-base">
                                    {t("news.tableOfContents", "Table of Contents")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0">
                                <ScrollArea className="max-h-[300px]">
                                    <nav className="space-y-1">
                                        {headings.map((heading) => (
                                            <button
                                                key={heading.id}
                                                onClick={() => scrollToHeading(heading.id)}
                                                className={cn(
                                                    "w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                                                    heading.level === 2 && "pl-4",
                                                    heading.level === 3 && "pl-6",
                                                    activeHeading === heading.id
                                                        ? "text-primary font-medium"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {heading.text}
                                            </button>
                                        ))}
                                    </nav>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                    <NewsRelatedArticlesList />
                </div>
            </div>
        </>
    );
};

export default NewsArticlePage;
