import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Separator } from "@/components/ui/separator";
import Tag from "@/app/components/tag/tag";
import { formatDate } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types/news/news";
import { IconInfoItem } from "@/app/components/custom-labels";

const statusStyles: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
    published: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
    archived: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800",
};

interface NewsInfoCardProps {
    newsArticle: NewsArticle;
}

export const NewsInfoCard = ({ newsArticle }: NewsInfoCardProps) => {
    const { t } = useTranslation();

    const statusBadgeClass = cn(
        "capitalize border",
        statusStyles[newsArticle.status] ??
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    );

    const renderDate = (date?: string | null) =>
        date ? formatDate(date, { showTime: true }) : t("newsDetail.notAvailable", "Not available");

    return (
        <Card className="shadow-none border-border">
            <CardHeader className="pb-0">
                <CardTitle>{t("newsDetail.articleOverview", "Article Overview")}</CardTitle>
                <CardDescription>
                    {t("newsDetail.articleOverviewDescription", "Key information about this news article")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <IconInfoItem
                    icon={"file-text"}
                    label={t("newsDetail.articleId", "Article ID")}
                >
                    <span className="font-mono text-sm">{newsArticle.id}</span>
                </IconInfoItem>

                <IconInfoItem
                    icon={"layers"}
                    label={t("newsDetail.status", "Status")}
                >
                    <Badge variant="outline" className={statusBadgeClass}>
                        {t(`newsDetail.status.${newsArticle.status}`, newsArticle.status)}
                    </Badge>
                </IconInfoItem>

                <IconInfoItem
                    icon={"link-icon"}
                    label={t("newsDetail.slug", "Slug")}
                >
                    <span className="font-medium">{newsArticle.slug}</span>
                </IconInfoItem>

                <IconInfoItem
                    icon={"calendar"}
                    label={t("newsDetail.publishedAt", "Published At")}
                    value={
                        newsArticle.published_at
                            ? formatDate(newsArticle.published_at, { showTime: true })
                            : t("newsDetail.notPublished", "Not published yet")
                    }
                />

                <IconInfoItem
                    icon={"calendar"}
                    label={t("newsDetail.archivedAt", "Archived At")}
                    value={
                        newsArticle.archived_at
                            ? formatDate(newsArticle.archived_at, { showTime: true })
                            : t("newsDetail.notArchived", "Not archived")
                    }
                />

                <Separator />

                <IconInfoItem
                    icon={"clock"}
                    label={t("newsDetail.createdAt", "Created At")}
                    value={renderDate(newsArticle.created_at)}
                />

                <IconInfoItem
                    icon={"clock"}
                    label={t("newsDetail.updatedAt", "Last Updated")}
                    value={renderDate(newsArticle.updated_at)}
                />

                <Separator />

                <div className="flex items-start justify-between gap-3">
                    <EmployeeAvatar employee={newsArticle.author} />
                    {newsArticle.author.job_title?.name && (
                        <Tag text={newsArticle.author.job_title.name} className="capitalize" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default NewsInfoCard;

