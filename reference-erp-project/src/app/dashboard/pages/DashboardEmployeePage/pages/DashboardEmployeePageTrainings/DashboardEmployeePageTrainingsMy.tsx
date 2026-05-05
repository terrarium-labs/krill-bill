import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Loader2 } from "lucide-react";

import { getEmployeeTrainings } from "@/api/employees/trainings/trainings";
import type { TrainingEnrollment } from "@/types/trainings/trainings";

import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import ProgressLabel from "@/app/components/labels/progress-label";
import { cn } from "@/lib/utils";

function enrollmentMatchesQuery(enrollment: TrainingEnrollment, raw: string): boolean {
    const q = raw.trim().toLowerCase();
    if (!q) return true;
    if (enrollment.training?.title?.toLowerCase().includes(q)) return true;
    if (enrollment.status.toLowerCase().replace(/_/g, " ").includes(q)) return true;
    if (enrollment.training_id.toLowerCase().includes(q)) return true;
    return false;
}

const COMPLETED: TrainingEnrollment["status"][] = ["completed"];
const IN_PROGRESS: TrainingEnrollment["status"][] = [
    "enrolled",
    "in_progress",
    "failed",
];

const DashboardEmployeePageTrainingsMy = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { employee } = useEmployee();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchEnrollments = useCallback(
        async (pageToken?: string | null) => {
            if (!orgId || !employee.id) return;
            pageToken ? setLoadingMore(true) : setIsLoading(true);
            try {
                const response = await getEmployeeTrainings(
                    orgId,
                    employee.id,
                    pageToken ?? null,
                );
                if (response.success) {
                    setEnrollments((prev) =>
                        pageToken
                            ? [...prev, ...response.success.enrollments]
                            : response.success.enrollments,
                    );
                    setNextPageToken(response.success.next_page_token ?? null);
                } else {
                    toast.error(
                        t("trainings.errorFetching", "Error fetching trainings"),
                    );
                }
            } catch {
                toast.error(t("trainings.errorFetching", "Error fetching trainings"));
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
            }
        },
        [orgId, employee.id, t],
    );

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    const filtered = useMemo(
        () => enrollments.filter((e) => enrollmentMatchesQuery(e, searchQuery)),
        [enrollments, searchQuery],
    );

    const activeList = useMemo(
        () => filtered.filter((e) => IN_PROGRESS.includes(e.status)),
        [filtered],
    );

    const completedList = useMemo(
        () => filtered.filter((e) => COMPLETED.includes(e.status)),
        [filtered],
    );

    const renderEnrollmentRow = (enrollment: TrainingEnrollment) => {
        const title = enrollment.training?.title?.trim() || enrollment.training_id;
        const total = enrollment.total_sessions ?? null;
        const done = enrollment.completed_sessions ?? null;

        return (
            <button
                key={enrollment.id}
                type="button"
                onClick={() =>
                    navigate(`/${orgId}/trainings/${enrollment.training_id}`)
                }
                className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors",
                    "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
            >
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium text-foreground">{title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Tag text={enrollment.status.replace(/_/g, " ")} />
                        {enrollment.enrolled_at && (
                            <span className="text-xs text-muted-foreground">
                                {t("trainings.enrolledOn", "Enrolled")}{" "}
                                <DateLabel data={enrollment.enrolled_at} />
                            </span>
                        )}
                    </div>
                    {total != null && total > 0 && (
                        <div className="pt-0.5">
                            <ProgressLabel
                                data={[done ?? 0, total]}
                                size="w-full max-w-[14rem]"
                            />
                        </div>
                    )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
        );
    };

    const renderSection = (
        title: string,
        list: TrainingEnrollment[],
        emptyTitle: string,
        emptyDescription: string,
    ) => (
        <Card className="border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {list.length === 0 ? (
                    <div className="rounded-md bg-muted/25 px-3 py-6 text-center">
                        <p className="text-sm font-medium text-foreground">
                            {emptyTitle}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {emptyDescription}
                        </p>
                    </div>
                ) : (
                    list.map((e) => renderEnrollmentRow(e))
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={() => fetchEnrollments()}
                placeholder={t(
                    "trainings.enrollments.employeeSearchPlaceholder",
                    "Search trainings…",
                )}
            />

            {isLoading ? (
                <div className="flex justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {renderSection(
                        t("dashboard.trainings.myInProgress", "In progress"),
                        activeList,
                        t(
                            "dashboard.trainings.emptyActiveTitle",
                            "No active trainings",
                        ),
                        t(
                            "dashboard.trainings.emptyActiveDescription",
                            "When you are enrolled in a course, it will appear here.",
                        ),
                    )}
                    {renderSection(
                        t("dashboard.trainings.myCompleted", "Completed"),
                        completedList,
                        t(
                            "dashboard.trainings.emptyCompletedTitle",
                            "No completed trainings yet",
                        ),
                        t(
                            "dashboard.trainings.emptyCompletedDescription",
                            "Finished courses will be listed in this section.",
                        ),
                    )}
                </div>
            )}

            {nextPageToken && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchEnrollments(nextPageToken)}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default DashboardEmployeePageTrainingsMy;
