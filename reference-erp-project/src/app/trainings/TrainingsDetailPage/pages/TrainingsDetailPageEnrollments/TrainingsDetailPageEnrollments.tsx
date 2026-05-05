import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import {
    getTrainingEnrollments,
    getTrainingEnrollment,
    deleteTrainingEnrollment,
    postEnrollmentAttendance,
} from "@/api/trainings/trainings";
import type { TrainingEnrollment } from "@/types/trainings/trainings";
import { useTraining } from "@/app/trainings/contexts/TrainingContext";

import SearchBar from "@/app/components/search-bar";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { Button } from "@/components/ui/button";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TrainingEnrollmentsTable from "./components/training-enrollments-table";
import { EnrollmentColumnSelector } from "./components/enrollment-column-selector";
import { EnrollmentSessionProgressPanel } from "./components/enrollment-session-progress-panel";
import TrainingEnrollModal from "./components/training-enroll-modal";
import { useEnrollmentsTablePreferences } from "@/hooks/use-enrollments-table-preferences";
import { useTableFilters } from "@/hooks/use-table-filters";
import { applyEnrollmentsTableFilters } from "./utils/apply-enrollments-table-filters";

function enrollmentMatchesQuery(enrollment: TrainingEnrollment, rawQuery: string): boolean {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const emp = enrollment.employee;
    const name = [emp?.first_name, emp?.last_name].filter(Boolean).join(" ").toLowerCase();
    if (name.includes(q)) return true;
    if (enrollment.status.toLowerCase().replace(/_/g, " ").includes(q)) return true;
    if (enrollment.notes?.toLowerCase().includes(q)) return true;
    if (enrollment.training?.title?.toLowerCase().includes(q)) return true;
    if (enrollment.employee_id.toLowerCase().includes(q)) return true;
    if (enrollment.id.toLowerCase().includes(q)) return true;
    return false;
}

const TrainingsDetailPageEnrollments = () => {
    const { t } = useTranslation();
    const { orgId, trainingId } = useParams<{
        orgId: string;
        trainingId: string;
    }>();
    const { refreshTraining } = useTraining();

    const filtersStorageRoute = useMemo(
        () =>
            orgId && trainingId
                ? `training-enrollments-filters:${orgId}:${trainingId}`
                : "training-enrollments-filters",
        [orgId, trainingId],
    );
    const { tableFilters, setTableFilters } = useTableFilters({
        route: filtersStorageRoute,
        defaultFilters: "training_enrollments",
    });

    const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [enrollOpen, setEnrollOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [enrollmentToEdit, setEnrollmentToEdit] =
        useState<TrainingEnrollment | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useEnrollmentsTablePreferences();
    const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
        string | null
    >(null);
    const [enrollmentDetailById, setEnrollmentDetailById] = useState<
        Record<string, TrainingEnrollment>
    >({});
    const [loadingEnrollmentDetailId, setLoadingEnrollmentDetailId] = useState<
        string | null
    >(null);
    const expandRequestIdRef = useRef(0);

    const handleEnrollmentColumnVisibility = useCallback(
        (id: string, visible: boolean) => {
            setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
        },
        [setColumnVisibility],
    );

    const handleEnrollmentColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const filteredByTable = useMemo(
        () => applyEnrollmentsTableFilters(enrollments, tableFilters),
        [enrollments, tableFilters],
    );

    const filteredEnrollments = useMemo(
        () =>
            filteredByTable.filter((e) =>
                enrollmentMatchesQuery(e, searchQuery),
            ),
        [filteredByTable, searchQuery],
    );

    const fetchEnrollments = useCallback(
        async (pageToken?: string | null) => {
            if (!orgId || !trainingId) return;
            pageToken ? setLoadingMore(true) : setIsLoading(true);
            try {
                const response = await getTrainingEnrollments(
                    orgId,
                    trainingId,
                    pageToken || null
                );
                if (response.success) {
                    setEnrollments((prev) =>
                        pageToken
                            ? [...prev, ...response.success.enrollments]
                            : response.success.enrollments
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(
                        t(
                            "trainings.enrollments.errorFetching",
                            "Error fetching enrollments"
                        )
                    );
                }
            } catch {
                toast.error(
                    t(
                        "trainings.enrollments.errorFetching",
                        "Error fetching enrollments"
                    )
                );
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
            }
        },
        [orgId, trainingId, t]
    );

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    const handleToggleExpandEnrollment = useCallback(
        async (enrollment: TrainingEnrollment) => {
            if (!orgId || !trainingId) return;

            if (expandedEnrollmentId === enrollment.id) {
                expandRequestIdRef.current += 1;
                setExpandedEnrollmentId(null);
                setLoadingEnrollmentDetailId(null);
                return;
            }

            expandRequestIdRef.current += 1;
            const requestId = expandRequestIdRef.current;
            setExpandedEnrollmentId(enrollment.id);

            if (enrollmentDetailById[enrollment.id]) {
                return;
            }

            setLoadingEnrollmentDetailId(enrollment.id);
            try {
                const response = await getTrainingEnrollment(
                    orgId,
                    trainingId,
                    enrollment.id,
                );
                if (expandRequestIdRef.current !== requestId) return;
                if (response.success) {
                    setEnrollmentDetailById((prev) => ({
                        ...prev,
                        [enrollment.id]: response.success.enrollment,
                    }));
                } else {
                    toast.error(
                        t(
                            "trainings.enrollments.expand.errorFetch",
                            "Could not load enrollment details",
                        ),
                    );
                    setExpandedEnrollmentId(null);
                }
            } catch {
                if (expandRequestIdRef.current !== requestId) return;
                toast.error(t("common.error", "An error occurred"));
                setExpandedEnrollmentId(null);
            } finally {
                if (expandRequestIdRef.current === requestId) {
                    setLoadingEnrollmentDetailId(null);
                }
            }
        },
        [
            orgId,
            trainingId,
            expandedEnrollmentId,
            enrollmentDetailById,
            t,
        ],
    );

    const handleDeleteEnrollment = async (enrollment: TrainingEnrollment) => {
        if (!orgId || !trainingId) return;
        try {
            const response = await deleteTrainingEnrollment(
                orgId,
                trainingId,
                enrollment.id
            );
            if (response.success) {
                toast.success(
                    t(
                        "trainings.enrollments.removedSuccess",
                        "Employee removed from training"
                    )
                );
                setEnrollments((prev) =>
                    prev.filter((e) => e.id !== enrollment.id)
                );
                setEnrollmentDetailById((prev) => {
                    const next = { ...prev };
                    delete next[enrollment.id];
                    return next;
                });
                setExpandedEnrollmentId((id) =>
                    id === enrollment.id ? null : id,
                );
                refreshTraining();
            } else {
                toast.error(
                    t(
                        "trainings.enrollments.errorRemoving",
                        "Error removing enrollment"
                    )
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        }
    };

    const handleConfirmAttendance = async (enrollment: TrainingEnrollment) => {
        if (!orgId || !trainingId) return;
        try {
            const response = await postEnrollmentAttendance(
                orgId,
                trainingId,
                enrollment.id,
                true
            );
            if (response.success) {
                toast.success(
                    t(
                        "trainings.enrollments.attendanceConfirmed",
                        "Attendance confirmed"
                    )
                );
                setEnrollments((prev) =>
                    prev.map((e) =>
                        e.id === enrollment.id
                            ? {
                                  ...e,
                                  attendance_confirmed: true,
                                  attendance_confirmed_at:
                                      new Date().toISOString(),
                              }
                            : e
                    )
                );
            } else {
                toast.error(
                    t(
                        "trainings.enrollments.errorAttendance",
                        "Error confirming attendance"
                    )
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        }
    };

    return (
        <div className="space-y-4">
        <div className="flex items-center gap-2 w-full">
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={() => fetchEnrollments()}
                placeholder={t(
                    "trainings.enrollments.searchPlaceholder",
                    "Search by name, status, notes…",
                )}
                className="w-full"
                inputClassName="w-full"

            />
             <Button
                     
                                onClick={() => setEnrollOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                                {t(
                                    "trainings.enrollments.enroll",
                                    "Enroll Employee",
                                )}
                            </Button>
            </div>

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={setTableFilters}
                    endSlot={
                        <div className="flex items-center gap-2">
                            <EnrollmentColumnSelector
                                hiddenColumns={["training_title"]}
                                columnVisibility={columnVisibility}
                                columnOrder={columnOrder}
                                onColumnVisibilityChange={
                                    handleEnrollmentColumnVisibility
                                }
                                onColumnOrderChange={
                                    handleEnrollmentColumnOrderChange
                                }
                                onReset={resetPreferences}
                            />
                        </div>
                    }
                />
            )}

            <TrainingEnrollmentsTable
                enrollments={filteredEnrollments}
                isLoading={isLoading}
                hiddenColumns={["training_title"]}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                expandableRows
                expandedEnrollmentId={expandedEnrollmentId}
                onToggleExpandEnrollment={handleToggleExpandEnrollment}
                renderExpandedPanel={(enrollment) => {
                    const detail = enrollmentDetailById[enrollment.id];
                    const loading =
                        loadingEnrollmentDetailId === enrollment.id && !detail;
                    return (
                        <EnrollmentSessionProgressPanel
                            isLoading={loading}
                            completions={detail?.session_completions ?? undefined}
                        />
                    );
                }}
                emptyDescription={t(
                    "trainings.enrollments.empty.description",
                    "Enroll employees to start tracking their progress."
                )}
                renderActions={(enrollment) => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.edit", "Edit"),
                                icon: "edit",
                                onClick: () => {
                                    setEnrollmentToEdit(enrollment);
                                    setEditOpen(true);
                                },
                            },
                            ...(!enrollment.attendance_confirmed
                                ? [
                                      {
                                          label: t(
                                              "trainings.enrollments.confirmAttendance",
                                              "Confirm Attendance"
                                          ),
                                          icon: "check-circle" as const,
                                          onClick: () =>
                                              handleConfirmAttendance(
                                                  enrollment
                                              ),
                                      },
                                  ]
                                : []),
                            {
                                label: t(
                                    "trainings.enrollments.remove",
                                    "Remove"
                                ),
                                icon: "trash-2",
                                onClick: () =>
                                    handleDeleteEnrollment(enrollment),
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
            />

            {nextPageToken && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchEnrollments(nextPageToken)}
                        disabled={loadingMore}
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

            <TrainingEnrollModal
                open={enrollOpen}
                onOpenChange={setEnrollOpen}
                trainingId={trainingId ?? ""}
                mode="enroll"
                onSaved={() => {
                    fetchEnrollments();
                    refreshTraining();
                }}
            />

            <TrainingEnrollModal
                open={editOpen}
                onOpenChange={setEditOpen}
                trainingId={trainingId ?? ""}
                enrollment={enrollmentToEdit}
                mode="edit"
                onSaved={fetchEnrollments}
            />
        </div>
    );
};

export default TrainingsDetailPageEnrollments;
