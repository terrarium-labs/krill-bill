import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { TimeRecord } from "@/types/employees/time-records";
import { Employee } from "@/types/employees/employees";
import { TimeRecordSummary } from "@/types/general/time-records";
import {
    getTimeRecords,
    postTimeRecordsVerify,
    patchTimeRecord,
    deleteTimeRecord,
} from "@/api/orgs/time-records/time-records";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import TimeRecordsTable from "./time-records-table";
import TimeRecordsSummaryDetailRowsTable from "./time-records-summary-detail-rows-table";
import { TableFilters } from "@/types/general/filters";
import { formatDateForAPI } from "@/utils/miscelanea";
import { Skeleton } from "@/components/ui/skeleton";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TimeRecordVerificationModal from "./modals/time-record-verification-modal";
import TimeRecordEditAdminModal from "./modals/time-record-edit-admin-modal";
import TimeRecordDeleteModal from "./modals/time-record-delete-modal";
import TimeRecordViewModal from "./modals/time-record-view-modal";

export interface TimeRecordsSummaryDetailPanelProps {
    /** When true, fetch time records (e.g. row expanded or modal open). */
    active: boolean;
    summary?: TimeRecordSummary | null;
    selectedEmployee?: Employee | null;
    dateRange?: { from: Date; to: Date } | null;
    /** Embedded under summary table row (no dialog chrome). */
    embedded?: boolean;
    /** Show fixed footer with Close (modal). */
    showFooterClose?: boolean;
    onRequestClose?: () => void;
}

const TimeRecordsSummaryDetailPanel = ({
    active,
    summary,
    selectedEmployee,
    dateRange,
    embedded = false,
    showFooterClose = false,
    onRequestClose,
}: TimeRecordsSummaryDetailPanelProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Dynamically generate tableFilters, prioritizing summary over selectedEmployee/dateRange
    const tableFilters: TableFilters = useMemo(() => {
        const filters: any[] = [];

        // Prioritize summary.employee.id over selectedEmployee
        const employeeId = summary?.employee?.id || selectedEmployee?.id;
        if (employeeId) {
            filters.push({
                "key": "employee",
                "type": "array",
                "options": [],
                "endpoint": { "path": "/orgs/{{org_id}}/employees", "key": "employees" },
                "is_sortable": false,
                "operator": "inArray",
                "value": [employeeId]
            });
        }

        // Prioritize summary.day over dateRange
        let effectiveDateRange = dateRange;
        if (summary?.day) {
            const dayDate = new Date(summary.day);
            effectiveDateRange = { from: dayDate, to: dayDate };
        }

        // Add start_time filter if effectiveDateRange has a from date
        if (effectiveDateRange?.from) {
            const fromDate = formatDateForAPI(effectiveDateRange.from);
            if (fromDate) {
                filters.push({
                    "key": "start_time",
                    "type": "datetime",
                    "options": [],
                    "endpoint": null,
                    "is_sortable": true,
                    "operator": "gte",
                    "value": [fromDate]
                });
            }
        }

        // Add end_time filter if effectiveDateRange has a to date
        if (effectiveDateRange?.to) {
            const toDatePlusOne = new Date(effectiveDateRange.to);
            toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);
            const toDate = formatDateForAPI(toDatePlusOne);
            if (toDate) {
                filters.push({
                    "key": "end_time",
                    "type": "datetime",
                    "options": [],
                    "endpoint": null,
                    "is_sortable": true,
                    "operator": "lte",
                    "value": [toDate]
                });
            }
        }

        return {
            "global_operator": "AND",
            "filters": filters.length > 0 ? filters : null,
            "order_by": null,
            "keys": []
        } as TableFilters;
    }, [summary?.employee?.id, summary?.day, selectedEmployee?.id, dateRange?.from, dateRange?.to]);

    // Verification modal state
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedTimeRecord, setSelectedTimeRecord] = useState<TimeRecord | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<"approved" | "rejected">("approved");
    const [verificationNotes, setVerificationNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTimeRecord, setEditingTimeRecord] = useState<TimeRecord | null>(null);

    // View modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTimeRecord, setViewingTimeRecord] = useState<TimeRecord | null>(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTimeRecord, setDeletingTimeRecord] = useState<TimeRecord | null>(null);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // Fetch time records function
    const fetchTimeRecords = async () => {
        setIsLoading(true);
        if (!orgId) return;

        try {
            const response = await getTimeRecords(
                orgId,
                undefined,
                undefined,
                tableFilters,
            );
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            console.error("Error fetching time records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load more time records
    const loadMoreTimeRecords = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getTimeRecords(
                orgId,
                undefined,
                nextPageToken,
                tableFilters || undefined,
            );
            if (response.success && response.success.time_records) {
                setTimeRecords(prev => [...prev, ...response.success.time_records]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            console.error("Error fetching time records:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Fetch when active or filters change
    useEffect(() => {
        if (active && orgId) {
            fetchTimeRecords();
        }
    }, [active, orgId, tableFilters]);

    // Reset when inactive
    useEffect(() => {
        if (!active) {
            setTimeRecords([]);
            setNextPageToken(null);
            setIsVerificationModalOpen(false);
            setIsEditModalOpen(false);
            setIsViewModalOpen(false);
            setIsDeleteModalOpen(false);
        }
    }, [active]);

    // Verification modal handlers
    const handleOpenVerificationModal = (timeRecord: TimeRecord, status: "approved" | "rejected") => {
        setSelectedTimeRecord(timeRecord);
        setVerificationStatus(status);
        setVerificationNotes("");
        setIsVerificationModalOpen(true);
    };

    const handleCloseVerificationModal = () => {
        setIsVerificationModalOpen(false);
        setSelectedTimeRecord(null);
        setVerificationNotes("");
        setIsSubmitting(false);
    };

    const handleSubmitVerification = async () => {
        if (!selectedTimeRecord || !orgId) return;

        setIsSubmitting(true);
        try {
            const response = await postTimeRecordsVerify(orgId, {
                time_record_ids: [selectedTimeRecord.id],
                verification_status: verificationStatus,
                verification_notes: verificationNotes,
            });
            if (response.success) {
                toast.success(t("employees.timeRecords.verificationSuccess", "Time record verified successfully"));
                await fetchTimeRecords();
                handleCloseVerificationModal();
            } else {
                toast.error(response.error?.message || t("employees.timeRecords.verificationError", "Error verifying time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.verificationError", "Error verifying time record"));
            console.error("Error verifying time record:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit handlers
    const handleOpenEditModal = (timeRecord: TimeRecord) => {
        setEditingTimeRecord(timeRecord);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = (open: boolean) => {
        setIsEditModalOpen(open);
        if (!open) {
            setEditingTimeRecord(null);
        }
    };

    // View modal handlers
    const handleOpenViewModal = (timeRecord: TimeRecord) => {
        setViewingTimeRecord(timeRecord);
        setIsViewModalOpen(true);
    };

    const handleViewModalClose = (open: boolean) => {
        setIsViewModalOpen(open);
        if (!open) {
            setViewingTimeRecord(null);
        }
    };

    const handleUpdateTimeRecord = async (
        timeRecordId: string,
        data: {
            start_time: string;
            end_time: string;
            notes: string | null;
            verification_status: "approved" | "rejected";
            verification_notes: string | null;
        }
    ) => {
        if (!orgId) return { error: "Missing orgId" };
        return patchTimeRecord(orgId, timeRecordId, data);
    };

    // Delete handlers
    const handleOpenDeleteModal = (timeRecord: TimeRecord) => {
        setDeletingTimeRecord(timeRecord);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingTimeRecord(null);
        setIsDeleteSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTimeRecord || !orgId) return;

        setIsDeleteSubmitting(true);
        try {
            const response = await deleteTimeRecord(orgId, deletingTimeRecord.id);
            if (response.success || response === undefined) {
                toast.success(t("employees.timeRecords.deleteSuccess", "Time record deleted successfully"));
                await fetchTimeRecords();
                handleCloseDeleteModal();
            } else {
                toast.error(response.error?.message || t("employees.timeRecords.deleteError", "Error deleting time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.deleteError", "Error deleting time record"));
            console.error("Error deleting time record:", error);
        } finally {
            setIsDeleteSubmitting(false);
        }
    };

    // Render approve/reject buttons for pending time records
    const renderApproveRejectButtons = (timeRecord: TimeRecord) => {
        if (timeRecord.verification_status === "approved" || timeRecord.verification_status === "rejected") return null;

        return (
            <>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenVerificationModal(timeRecord, "rejected");
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenVerificationModal(timeRecord, "approved");
                    }}
                >
                    <Check className="h-4 w-4" />
                </Button>
            </>
        );
    };

    // Custom render function for table actions
    const renderTableActions = (timeRecord: TimeRecord, allTimeRecords: TimeRecord[]) => {
        const status = timeRecord.verification_status;
        const hasPending = allTimeRecords.some((r) => r.verification_status === "pending" || r.verification_status === null);

        return (
            <div className={`flex items-center gap-2 ${hasPending ? "justify-end" : "justify-center"}`}>
                {/* Show approve/reject buttons for pending status */}
                {renderApproveRejectButtons(timeRecord)}

                {/* Three dots menu */}
                <CustomActionsDropdown
                    items={[
                        // View option - always available
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: () => handleOpenViewModal(timeRecord),
                        },
                        // For approved/rejected, show approve/reject toggle
                        {
                            label: t("timeRecords.reject", "Reject"),
                            icon: "x",
                            onClick: () => handleOpenVerificationModal(timeRecord, "rejected"),
                            showOption: status === "approved",
                        },
                        {
                            label: t("timeRecords.approve", "Approve"),
                            icon: "check",
                            onClick: () => handleOpenVerificationModal(timeRecord, "approved"),
                            showOption: status === "rejected",
                        },
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleOpenEditModal(timeRecord),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleOpenDeleteModal(timeRecord),
                            variant: "destructive",
                        },
                    ]}
                />
            </div>
        );
    };

    // Render function for modal header actions (inside view modal)
    const renderModalActions = (timeRecord: TimeRecord) => {
        const status = timeRecord.verification_status;

        return (
            <CustomActionsDropdown
                items={[
                    // For approved, show reject option
                    {
                        showOption: status === "approved",
                        label: t("timeRecords.reject", "Reject"),
                        icon: "x",
                        onClick: () => {
                            setIsViewModalOpen(false);
                            handleOpenVerificationModal(timeRecord, "rejected");
                        },
                    },
                    // For rejected, show approve option
                    {
                        showOption: status === "rejected",
                        label: t("timeRecords.approve", "Approve"),
                        icon: "check",
                        onClick: () => {
                            setIsViewModalOpen(false);
                            handleOpenVerificationModal(timeRecord, "approved");
                        },
                    },
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => {
                            setIsViewModalOpen(false);
                            handleOpenEditModal(timeRecord);
                        },
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleOpenDeleteModal(timeRecord),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    const showEmbeddedSkeleton = embedded && isLoading && timeRecords.length === 0;
    const showModalSpinner = !embedded && isLoading && timeRecords.length === 0;

    const tableSection = (
        <>
            {embedded ? (
                <TimeRecordsSummaryDetailRowsTable
                    timeRecords={timeRecords}
                    isLoading={isLoading}
                    renderActions={renderTableActions}
                />
            ) : (
                <TimeRecordsTable
                    timeRecords={timeRecords}
                    isLoading={isLoading}
                    hiddenColumns={
                        summary?.employee || selectedEmployee
                            ? ["employee", "notes", "last_modified_by", "start_time", "end_time"]
                            : ["notes", "last_modified_by", "start_time", "end_time"]
                    }
                    renderActions={renderTableActions}
                    onRowClick={handleOpenViewModal}
                />
            )}

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreTimeRecords}
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

            {showFooterClose && (
                <div className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 flex justify-end">
                    <Button type="button" variant="outline" onClick={() => onRequestClose?.()}>
                        {t("common.close", "Close")}
                    </Button>
                </div>
            )}

            <TimeRecordVerificationModal
                isOpen={isVerificationModalOpen}
                onClose={handleCloseVerificationModal}
                timeRecord={selectedTimeRecord}
                verificationStatus={verificationStatus}
                verificationNotes={verificationNotes}
                onNotesChange={setVerificationNotes}
                onSubmit={handleSubmitVerification}
                isSubmitting={isSubmitting}
            />

            <TimeRecordViewModal
                open={isViewModalOpen}
                onOpenChange={handleViewModalClose}
                timeRecord={viewingTimeRecord}
                renderActions={renderModalActions}
                showEmployeeInfo={true}
                renderFooterActions={
                    viewingTimeRecord?.verification_status === null
                        ? () => (
                              <div className="flex items-center gap-2">
                                  <Button
                                      variant="outline"
                                      onClick={() => {
                                          handleViewModalClose(false);
                                          handleOpenVerificationModal(viewingTimeRecord, "rejected");
                                      }}
                                      disabled={isLoading}
                                  >
                                      <X className="h-4 w-4" />
                                      {t("employees.timeRecords.reject", "Reject")}
                                  </Button>
                                  <Button
                                      onClick={() => {
                                          handleViewModalClose(false);
                                          handleOpenVerificationModal(viewingTimeRecord, "approved");
                                      }}
                                      disabled={isLoading}
                                  >
                                      <Check className="h-4 w-4" />
                                      {t("common.accept", "Accept")}
                                  </Button>
                              </div>
                          )
                        : undefined
                }
            />

            {editingTimeRecord && (
                <TimeRecordEditAdminModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTimeRecordUpdated={() => fetchTimeRecords()}
                    timeRecord={editingTimeRecord}
                    onUpdateTimeRecord={handleUpdateTimeRecord}
                />
            )}

            <TimeRecordDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                timeRecord={deletingTimeRecord}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleteSubmitting}
            />
        </>
    );

    if (showEmbeddedSkeleton) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full animate-pulse rounded-md" />
            </div>
        );
    }

    if (showModalSpinner) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div
            className={
                embedded
                    ? "space-y-4 overflow-x-auto "
                    : "mb-16 space-y-4 overflow-y-auto px-2 scrollbar-hide"
            }
        >
            {tableSection}
        </div>
    );
};

export default TimeRecordsSummaryDetailPanel;