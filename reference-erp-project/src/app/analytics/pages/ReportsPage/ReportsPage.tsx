import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, BarChart3, FileBarChart2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import {
    VerticalMenu,
    VerticalMenuItem,
} from "@/components/ui/vertical-menu";
import { ReportCategory } from "@/types/general/reports";
import { getReports } from "@/api/orgs/reports/reports";
import ReportCard from "./components/report-card";

const ReportsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [categories, setCategories] = useState<ReportCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("");

    const fetchReports = useCallback(async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const response = await getReports(orgId);
            if (response.success) {
                const cats: ReportCategory[] = response.success.categories ?? [];
                setCategories(cats);
                if (cats.length > 0 && !activeCategory) {
                    setActiveCategory(cats[0].id);
                }
            } else {
                toast.error(t("reports.errorFetching", "Error loading reports"));
            }
        } catch {
            toast.error(t("reports.errorFetching", "Error loading reports"));
        } finally {
            setIsLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const activeReports = useMemo(() => {
        return categories.find((c) => c.id === activeCategory)?.reports ?? [];
    }, [categories, activeCategory]);

    const activeSection = useMemo(() => {
        return categories.find((c) => c.id === activeCategory);
    }, [categories, activeCategory]);

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("reports.title", "Reports")}
                description={t("reports.description", "Generate and download reports for your organization")}
                showBackButton={false}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">
                            {t("reports.empty.title", "No reports available")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("reports.empty.description", "Reports will appear here once they are configured.")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex gap-8 items-start">
                    {/* Sticky sidebar navigation */}
                    <aside className="hidden lg:block shrink-0 sticky top-4 self-start">
                        <VerticalMenu
                            value={activeCategory}
                            onValueChange={setActiveCategory}
                            variant="default"
                            bordered={false}
                            minWidth={180}
                        >
                            {categories.map((category) => (
                                <VerticalMenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </VerticalMenuItem>
                            ))}
                        </VerticalMenu>
                    </aside>

                    {/* Report cards area */}
                    <div className="flex-1 min-w-0">
                        {activeSection && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-base font-semibold">{activeSection.name}</h2>
                                    {activeSection.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {activeSection.description}
                                        </p>
                                    )}
                                </div>

                                {activeReports.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                                        <FileBarChart2 className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {t("reports.category.empty.title", "No reports in this category")}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t("reports.category.empty.description", "Reports for this section will appear here.")}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                        {activeReports.map((report) => (
                                            <ReportCard key={report.id} report={report} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
