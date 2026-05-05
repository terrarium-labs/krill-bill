import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteWorkOrderTimeTracking } from "@/api/field-service/work-orders/time-trackings/time-trackings";
import WorkOrderTimeTrackingEditModal from "./modals/work-order-time-tracking-edit-modal";
import WorkOrderTimeTrackingTable from "./work-order-time-tracking-table";
import { TimeTracking } from "@/types/field-service/work-orders/time-trackings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import WorkOrderTimeTrackingDeleteModal from "./modals/work-order-time-tracking-delete-modal";
import EmployeeLabel from "@/app/components/labels/employee-label";
import DurationLabel from "@/app/components/labels/duration-label";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";

const WorkOrderTimeTrackingCard = () => {
    const { t } = useTranslation();
    const { workOrderId, orgId } = useParams<{ workOrderId: string; orgId: string }>();
    const { 
        activeTimeTracking,
        timeTrackings,
        refreshTimeTrackings,
        isLoadingTimeTrackings: isLoading,
        isSearchingTimeTrackings: isSearching,
        loadingMoreTimeTrackings: loadingMore,
        nextPageTokenTimeTrackings: nextPageToken,
        searchQueryTimeTrackings: searchQuery,
        setSearchQueryTimeTrackings: setSearchQuery,
        loadMoreTimeTrackings,
    } = useWorkOrder();
    const [isExpanded, setIsExpanded] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    // Unique employees from time trackings (filter duplicates by user.id)
    const uniqueEmployees = useMemo(() => {
        const seen = new Set<string>();
        return timeTrackings
            .map((tt) => tt.user)
            .filter((user) => {
                if (!user?.id) return false;
                if (seen.has(user.id)) return false;
                seen.add(user.id);
                return true;
            });
    }, [timeTrackings]);

    // Total duration in ms (for DurationLabel: use epoch start + totalMs as end)
    const totalDurationMs = useMemo(() => {
        const now = Date.now();
        return timeTrackings.reduce((sum, tt) => {
            const start = tt.start_time ? new Date(tt.start_time).getTime() : 0;
            const end = tt.end_time ? new Date(tt.end_time).getTime() : now;
            if (!Number.isFinite(start)) return sum;
            return sum + Math.max(0, end - start);
        }, 0);
    }, [timeTrackings]);
    const [timeTrackingToEdit, setTimeTrackingToEdit] = useState<TimeTracking | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [timeTrackingToDelete, setTimeTrackingToDelete] = useState<TimeTracking | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle add time tracking
    const handleAddTimeTracking = () => {
        setTimeTrackingToEdit(null);
        setModalOpen(true);
    };

    // Check if time tracking is active (no end_time)
    const isTimeTrackingActive = (timeTracking: TimeTracking): boolean => {
        return !timeTracking.end_time || timeTracking.end_time === "";
    };

    // Handle edit time tracking
    const handleEditTimeTracking = (timeTracking: TimeTracking) => {
        // Don't allow editing active time trackings
        if (isTimeTrackingActive(timeTracking)) {
            return;
        }
        setTimeTrackingToEdit(timeTracking);
        setModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (timeTracking: TimeTracking) => {
        setTimeTrackingToDelete(timeTracking);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteTimeTracking = async () => {
        if (!timeTrackingToDelete || !orgId || !workOrderId) return;

        setIsDeleting(true);
        try {
            const response = await deleteWorkOrderTimeTracking(orgId, workOrderId, timeTrackingToDelete.id);
            if (response.success) {
                toast.success(t("workOrders.timeTrackingDeletedSuccessfully", "Time tracking deleted successfully"));
                // Refresh context
                await refreshTimeTrackings();
                setDeleteModalOpen(false);
                setTimeTrackingToDelete(null);
            } else {
                toast.error(t("workOrders.errorDeletingTimeTracking", "Error deleting time tracking"));
            }
        } catch (error) {
            toast.error(t("workOrders.errorDeletingTimeTracking", "Error deleting time tracking"));
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle modal success (refresh data)
    const handleModalSuccess = async () => {
        await refreshTimeTrackings();
    };

    // Handle delete from modal
    const handleDeleteFromModal = (timeTrackingId: string) => {
        const timeTracking = timeTrackings.find(t => t.id === timeTrackingId);
        if (timeTracking) {
            setModalOpen(false);
            handleDeleteConfirm(timeTracking);
        }
    };

    return (
        <>
            <Card className="shadow-none border-border p-0">
                <CardContent className="p-0">
                    {/* Header Row - Always Visible */}
                    <div
                        className="flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors p-4 m-0"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="font-semibold">
                                {t("workOrdersDetail.timeTracking", "Time Tracking")}
                            </span>
                            {!isExpanded && (
                                <div className="flex items-center gap-3 min-w-0">
                                    {uniqueEmployees.length > 0 || totalDurationMs > 0 ? (
                                        <>
                                            {uniqueEmployees.length > 0 && (
                                                <EmployeeLabel data={uniqueEmployees} />
                                            )}
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                ({t('workorders.totalDuration', 'Total')}:{' '}
                                                <DurationLabel
                                                    startDate="1970-01-01T00:00:00.000Z"
                                                    endDate={new Date(totalDurationMs).toISOString()}
                                                    className="text-muted-foreground font-normal"
                                                    showElapsedTime={false}
                                                />
                                                )
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            {t("workorders.noTimeTrackingsTitle", "No time trackings yet")}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className=""
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddTimeTracking();
                            }}
                            disabled={activeTimeTracking !== null}
                        >
                            <Plus className="h-4 w-4" />
                            {t("workorders.addTimeTracking", "Add")}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <SearchBar
                                    value={searchQuery}
                                    isLoading={isSearching}
                                    className="w-full"
                                    onChange={(query) => setSearchQuery(query)}
                                    onSearch={() => refreshTimeTrackings()}
                                    placeholder={t("workorders.searchPlaceholder", "Search time trackings...")}
                                />
                            </div>

                            <WorkOrderTimeTrackingTable
                                hiddenColumns={["start_time", "end_time"]}
                                timeTrackings={timeTrackings}
                                isLoading={isLoading}
                                searchQuery={searchQuery}
                                emptyStateTitle={
                                    searchQuery
                                        ? undefined
                                        : t("workorders.noTimeTrackingsTitle", "No time trackings yet")
                                }
                                emptyStateDescription={
                                    searchQuery
                                        ? undefined
                                        : t("workorders.noTimeTrackingsDescription", "Time trackings will appear here once recorded")
                                }
                                onRowClick={handleEditTimeTracking}
                                clickableRows={true}
                                renderActions={(timeTracking) => {
                                    const isActive = isTimeTrackingActive(timeTracking);
                                    const items: Array<{
                                        label: string;
                                        icon: string;
                                        onClick: () => void;
                                        variant?: "destructive" | "default";
                                    }> = [];
                                    if (!isActive) {
                                        items.push({
                                            label: t("common.edit", "Edit"),
                                            icon: "edit",
                                            onClick: () => handleEditTimeTracking(timeTracking),
                                        });
                                    }
                                    items.push({
                                        label: t("common.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: () => handleDeleteConfirm(timeTracking),
                                        variant: "destructive" as const,
                                    });
                                    return <CustomActionsDropdown items={items} />;
                                }}
                            />

                            {nextPageToken && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={loadMoreTimeTrackings}
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
                        </div>
                    )}
                </CardContent>
            </Card>

            {orgId && workOrderId && (
                <WorkOrderTimeTrackingEditModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    orgId={orgId}
                    workOrderId={workOrderId}
                    timeTracking={timeTrackingToEdit}
                    onSuccess={handleModalSuccess}
                    onDelete={handleDeleteFromModal}
                />
            )}

            <WorkOrderTimeTrackingDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                timeTracking={timeTrackingToDelete}
                onConfirm={handleDeleteTimeTracking}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default WorkOrderTimeTrackingCard;