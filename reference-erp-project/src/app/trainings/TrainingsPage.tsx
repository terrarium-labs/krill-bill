import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { getTrainings } from "@/api/trainings/trainings";
import type { Training } from "@/types/trainings/trainings";

import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsContents,
} from "@/components/ui/shadcn-io/tabs";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TrainingsTable from "./components/trainings-table";
import TrainingCreateModal from "./components/training-create-modal";
import TrainingDeleteModal from "./components/training-delete-modal";
import TrainingCategoriesTab from "./components/training-categories-tab";
import TrainingInsightsSection from "./components/training-insights-section";
import { useTrainingsTablePreferences } from "@/hooks/use-trainings-table-preferences";
import { TrainingColumnSelector } from "./components/training-column-selector";

const validTabs = ["courses", "categories"] as const;
type PageTab = (typeof validTabs)[number];

const TrainingsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get("tab") ?? "courses";
    const activeTab: PageTab = validTabs.includes(rawTab as PageTab)
        ? (rawTab as PageTab)
        : "courses";

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [trainingToDelete, setTrainingToDelete] = useState<Training | null>(null);
    const [insightsRefreshKey, setInsightsRefreshKey] = useState(0);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useTrainingsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const fetchTrainings = useCallback(
        async (query: string = "", pageToken?: string | null) => {
            if (!orgId) return;
            if (pageToken) {
                setLoadingMore(true);
            } else if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
            try {
                const response = await getTrainings(orgId, query || null, pageToken || null);
                if (response.success) {
                    setTrainings((prev) =>
                        pageToken
                            ? [...prev, ...response.success.trainings]
                            : response.success.trainings
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(t("trainings.errorFetching", "Error fetching trainings"));
                }
            } catch {
                toast.error(t("trainings.errorFetching", "Error fetching trainings"));
            } finally {
                setIsLoading(false);
                setIsSearching(false);
                setLoadingMore(false);
            }
        },
        [orgId, t]
    );

    useEffect(() => {
        fetchTrainings();
    }, [fetchTrainings]);

    const handleDeleteConfirm = (training: Training) => {
        setTrainingToDelete(training);
        setDeleteOpen(true);
    };

    const handleTabChange = (value: string) => {
        if (validTabs.includes(value as PageTab)) {
            setSearchParams({ tab: value });
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("trainings.title", "Trainings")}
                description={t(
                    "trainings.description",
                    "Manage employee training programs and enrollments."
                )}
                docs={{ slug: "pd_mod_trainings" }}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("trainings.addTraining", "Add Training")}
                        </Button>
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName="border-b-2 border-primary -mb-1.5"
                >
                    <TabsTrigger className="py-0" value="courses">
                        {t("trainings.tabs.courses", "Courses")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="categories">
                        {t("trainings.tabs.categories", "Categories")}
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent
                        value="courses"
                        transition={{ duration: 0 }}
                        className="space-y-4"
                    >
                        <TrainingInsightsSection
                            orgId={orgId}
                            refreshKey={insightsRefreshKey}
                        />
                        <div className="flex items-center gap-2">
                            <SearchBar
                                className="w-full"
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={fetchTrainings}
                                placeholder={t(
                                    "trainings.searchPlaceholder",
                                    "Search trainings..."
                                )}
                            />
                            <TrainingColumnSelector
                                columnVisibility={columnVisibility}
                                columnOrder={columnOrder}
                                onColumnVisibilityChange={handleColumnVisibilityChange}
                                onColumnOrderChange={handleColumnOrderChange}
                                onReset={resetPreferences}
                            />
                        </div>

                        <TrainingsTable
                            trainings={trainings}
                            isLoading={isLoading}
                            clickableRows
                            onRowClick={(training) =>
                                navigate(`/${orgId}/trainings/${training.id}`)
                            }
                            searchQuery={searchQuery}
                            emptyDescription={t(
                                "trainings.empty.description",
                                "Create your first training program to get started."
                            )}
                            onEmptyStateAction={() => setCreateOpen(true)}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={setColumnVisibility}
                            columnOrder={columnOrder}
                            onColumnOrderChange={setColumnOrder}
                            columnSizing={columnSizing}
                            onColumnSizingChange={setColumnSizing}
                            renderActions={(training) => (
                                <div className="flex justify-center items-center">
                                    <CustomActionsDropdown
                                        items={[
                                            {
                                                label: t("common.view", "View"),
                                                icon: "eye",
                                                onClick: () =>
                                                    navigate(
                                                        `/${orgId}/trainings/${training.id}`
                                                    ),
                                            },
                                            {
                                                label: t(
                                                    "common.delete",
                                                    "Delete"
                                                ),
                                                icon: "trash-2",
                                                onClick: () =>
                                                    handleDeleteConfirm(
                                                        training
                                                    ),
                                                variant: "destructive",
                                            },
                                        ]}
                                    />
                                </div>
                            )}
                        />

                        {nextPageToken && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        fetchTrainings(
                                            searchQuery,
                                            nextPageToken
                                        )
                                    }
                                    disabled={loadingMore}
                                    className="min-w-32"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t("common.loading", "Loading...")}
                                        </>
                                    ) : (
                                        t("common.loadMore", "Load More")
                                    )}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="categories"
                        transition={{ duration: 0 }}
                    >
                        <TrainingCategoriesTab />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            <TrainingCreateModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSaved={() => {
                    void fetchTrainings(searchQuery);
                    setInsightsRefreshKey((k) => k + 1);
                }}
            />

            <TrainingDeleteModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                training={trainingToDelete}
                onDeleted={() => {
                    if (trainingToDelete) {
                        setTrainings((prev) =>
                            prev.filter((tr) => tr.id !== trainingToDelete.id)
                        );
                        setTrainingToDelete(null);
                        setInsightsRefreshKey((k) => k + 1);
                    }
                }}
            />
        </>
    );
};

export default TrainingsPage;
