import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { getEmployeeTrainings } from "@/api/employees/trainings/trainings";
import type { TrainingEnrollment } from "@/types/trainings/trainings";

import SearchBar from "@/app/components/search-bar";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { Button } from "@/components/ui/button";
import TrainingEnrollmentsTable from "@/app/trainings/TrainingsDetailPage/pages/TrainingsDetailPageEnrollments/components/training-enrollments-table";
import { EnrollmentColumnSelector } from "@/app/trainings/TrainingsDetailPage/pages/TrainingsDetailPageEnrollments/components/enrollment-column-selector";
import { useEnrollmentsTablePreferences } from "@/hooks/use-enrollments-table-preferences";
import { useTableFilters } from "@/hooks/use-table-filters";
import { applyEnrollmentsTableFilters } from "@/app/trainings/TrainingsDetailPage/pages/TrainingsDetailPageEnrollments/utils/apply-enrollments-table-filters";

function employeeEnrollmentMatchesQuery(
    enrollment: TrainingEnrollment,
    rawQuery: string,
): boolean {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    if (enrollment.training?.title?.toLowerCase().includes(q)) return true;
    if (enrollment.status.toLowerCase().replace(/_/g, " ").includes(q))
        return true;
    if (enrollment.notes?.toLowerCase().includes(q)) return true;
    if (enrollment.training_id.toLowerCase().includes(q)) return true;
    if (enrollment.id.toLowerCase().includes(q)) return true;
    return false;
}

const EmployeeDetailPageTrainings = () => {
    const { t } = useTranslation();
    const { orgId, employeeId } = useParams<{
        orgId: string;
        employeeId: string;
    }>();
    const navigate = useNavigate();

    const filtersStorageRoute = useMemo(
        () =>
            orgId && employeeId
                ? `employee-trainings-filters:${orgId}:${employeeId}`
                : "employee-trainings-filters",
        [orgId, employeeId],
    );
    const { tableFilters, setTableFilters } = useTableFilters({
        route: filtersStorageRoute,
        defaultFilters: "training_enrollments",
    });

    const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
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
                employeeEnrollmentMatchesQuery(e, searchQuery),
            ),
        [filteredByTable, searchQuery],
    );

    const fetchEnrollments = useCallback(
        async (pageToken?: string | null) => {
            if (!orgId || !employeeId) return;
            pageToken ? setLoadingMore(true) : setIsLoading(true);
            try {
                const response = await getEmployeeTrainings(
                    orgId,
                    employeeId,
                    pageToken || null,
                );
                if (response.success) {
                    setEnrollments((prev) =>
                        pageToken
                            ? [...prev, ...response.success.enrollments]
                            : response.success.enrollments,
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(
                        t(
                            "trainings.errorFetching",
                            "Error fetching trainings",
                        ),
                    );
                }
            } catch {
                toast.error(
                    t("trainings.errorFetching", "Error fetching trainings"),
                );
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
            }
        },
        [orgId, employeeId, t],
    );

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

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

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={setTableFilters}
                    endSlot={
                        <EnrollmentColumnSelector
                            hiddenColumns={["employee", "notes"]}
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={
                                handleEnrollmentColumnVisibility
                            }
                            onColumnOrderChange={handleEnrollmentColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <TrainingEnrollmentsTable
                enrollments={filteredEnrollments}
                isLoading={isLoading}
                hiddenColumns={["employee", "notes"]}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                emptyTitle={t(
                    "trainings.enrollments.empty.noTrainings",
                    "No trainings assigned",
                )}
                emptyDescription={t(
                    "trainings.enrollments.empty.employeeDescription",
                    "Enroll this employee in a training from the Trainings section.",
                )}
                onRowClick={(enrollment) =>
                    enrollment.training_id &&
                    navigate(`/${orgId}/trainings/${enrollment.training_id}`)
                }
                clickableRows
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
        </div>
    );
};

export default EmployeeDetailPageTrainings;
