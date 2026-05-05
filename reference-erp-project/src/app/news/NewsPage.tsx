import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";

// Future page for viewing news articles
const NewsPage = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <PageHeader
                title={t("news.title", "News")}
                description={t("news.description", "View your organization's news articles")}
                showBackButton={false}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-1">
                    <h2 className="text-lg font-semibold">{t("news.latestNews", "Latest News")}</h2>
                </div>
            </div>
        </div>
    );
};

export default NewsPage;