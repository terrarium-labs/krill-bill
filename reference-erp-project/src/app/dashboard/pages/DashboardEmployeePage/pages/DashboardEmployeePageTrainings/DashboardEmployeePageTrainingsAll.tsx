import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, GraduationCap, Loader2 } from "lucide-react";

import { getTrainings, postTrainingEnrollment } from "@/api/trainings/trainings";
import { getEmployeeTrainings } from "@/api/employees/trainings/trainings";
import type { Training, TrainingEnrollment } from "@/types/trainings/trainings";

import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { getTrainingCategoriesDisplay } from "@/app/trainings/training-normalize";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import { cn } from "@/lib/utils";
import {
    hasActiveEnrollmentForTraining,
    isTrainingNotFull,
    isTrainingOpenForSelfEnrollment,
} from "./utils/training-employee-availability";

function trainingMatchesQuery(training: Training, raw: string): boolean {
    const q = raw.trim().toLowerCase();
    if (!q) return true;
    if (training.title?.toLowerCase().includes(q)) return true;
    if (training.provider?.toLowerCase().includes(q)) return true;
    const cats = getTrainingCategoriesDisplay(training);
    if (cats.some((c) => c.name.toLowerCase().includes(q))) return true;
    return false;
}

const DashboardEmployeePageTrainingsAll = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { employee } = useEmployee();
    const navigate = useNavigate();

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    const fetchMine = useCallback(async () => {
        if (!orgId || !employee.id) return;
        try {
            const response = await getEmployeeTrainings(orgId, employee.id, null);
            if (response.success) {
                setEnrollments(response.success.enrollments);
            }
        } catch {
            /* enroll filter is best-effort */
        }
    }, [orgId, employee.id]);

    const fetchTrainings = useCallback(
        async (query: string = "", pageToken?: string | null) => {
            if (!orgId) return;
            pageToken ? setLoadingMore(true) : setIsLoading(true);
            try {
                const response = await getTrainings(
                    orgId,
                    query || null,
                    pageToken ?? null,
                );
                if (response.success) {
                    setTrainings((prev) =>
                        pageToken
                            ? [...prev, ...response.success.trainings]
                            : response.success.trainings,
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
        [orgId, t],
    );

    useEffect(() => {
        fetchTrainings("", null);
        fetchMine();
    }, [fetchTrainings, fetchMine]);

    const enrollmentStatusByTrainingId = useMemo(() => {
        const map = new Map<string, TrainingEnrollment["status"]>();
        for (const e of enrollments) {
            map.set(e.training_id, e.status);
        }
        return map;
    }, [enrollments]);

    const enrollableList = useMemo(() => {
        return trainings.filter((tr) => {
            if (!isTrainingOpenForSelfEnrollment(tr)) return false;
            if (!isTrainingNotFull(tr)) return false;
            if (hasActiveEnrollmentForTraining(tr.id, enrollmentStatusByTrainingId)) {
                return false;
            }
            return trainingMatchesQuery(tr, searchQuery);
        });
    }, [trainings, enrollmentStatusByTrainingId, searchQuery]);

    const handleEnroll = async (training: Training) => {
        if (!orgId || !employee.id) return;
        setEnrollingId(training.id);
        try {
            const response = await postTrainingEnrollment(orgId, training.id, {
                employee_id: employee.id,
                status: "enrolled",
            });
            if (response.success) {
                toast.success(
                    t(
                        "dashboard.trainings.enrollSuccess",
                        "You are now enrolled in this training.",
                    ),
                );
                await fetchMine();
            } else {
                toast.error(
                    t("trainings.enrollments.errorEnrolling", "Error enrolling employee"),
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={() => {
                    setTrainings([]);
                    setNextPageToken(null);
                    fetchTrainings(searchQuery, null);
                }}
                placeholder={t(
                    "trainings.enrollments.employeeSearchPlaceholder",
                    "Search trainings…",
                )}
            />

            {isLoading ? (
                <div className="flex justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : enrollableList.length === 0 ? (
                <div className="rounded-md border border-border bg-muted/25 px-4 py-10 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                        {t(
                            "dashboard.trainings.allEmptyTitle",
                            "No open trainings to join",
                        )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t(
                            "dashboard.trainings.allEmptyDescription",
                            "Public trainings that accept enrollments will show here.",
                        )}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {enrollableList.map((training) => {
                        const cats = getTrainingCategoriesDisplay(training);
                        return (
                            <div
                                key={training.id}
                                className={cn(
                                    "flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between",
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(`/${orgId}/trainings/${training.id}`)
                                    }
                                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                                >
                                    <p className="font-medium text-foreground">
                                        {training.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Tag
                                            text={training.status.replace(/_/g, " ")}
                                        />
                                        {cats.map((c) => (
                                            <Tag key={c.id} text={c.name} />
                                        ))}
                                        {training.start_date && (
                                            <span className="text-xs text-muted-foreground">
                                                <DateLabel data={training.start_date} />
                                            </span>
                                        )}
                                    </div>
                                    {training.description && (
                                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                            {training.description}
                                        </p>
                                    )}
                                </button>
                                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
                                    <Button
                                        size="sm"
                                        disabled={enrollingId === training.id}
                                        onClick={() => handleEnroll(training)}
                                    >
                                        {enrollingId === training.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            t("dashboard.trainings.enroll", "Enroll")
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground"
                                        onClick={() =>
                                            navigate(`/${orgId}/trainings/${training.id}`)
                                        }
                                    >
                                        {t("common.view", "View")}
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {nextPageToken && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchTrainings(searchQuery, nextPageToken)}
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

export default DashboardEmployeePageTrainingsAll;
