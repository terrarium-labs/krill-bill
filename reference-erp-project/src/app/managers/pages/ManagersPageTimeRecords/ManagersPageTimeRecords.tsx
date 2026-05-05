import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { TimeRecord } from "@/types/employees/time-records";
import {
    getManagerTimeRecords,
    postManagerTimeRecordVerifyAll,
    postManagerTimeRecordVerify,
    patchManagerTimeRecord,
} from "@/api/managers/time-records/time-records";
import {
    deleteTimeRecord,
    postTimeRecordsVerify,
    postTimeRecordsVerifyAll,
    patchTimeRecord,
} from "@/api/orgs/time-records/time-records";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { useManager } from "@/app/managers/contexts/ManagerContext";
import TimeRecordsTable from "@/app/time-records/components/time-records-table";
import TimeRecordEditAdminModal from "@/app/time-records/components/modals/time-record-edit-admin-modal";
import TimeRecordDeleteModal from "@/app/time-records/components/modals/time-record-delete-modal";
import TimeRecordVerificationModal from "@/app/time-records/components/modals/time-record-verification-modal";
import TimeRecordBulkActionModal from "@/app/time-records/components/modals/time-record-bulk-action-modal";
import TimeRecordViewModal from "@/app/time-records/components/modals/time-record-view-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { mergeEmployeeFilterIntoTableFilters } from "@/utils/filter-templates";

const ManagersPageTimeRecords = () => {
    const { t } = useTranslation();
    const { orgId, managerId } = useParams<{
        orgId: string;
        managerId: string;
    }>();
    const [searchParams] = useSearchParams();
    const employeeIdFromUrl = searchParams.get("employeeId");
    const { manager } = useManager();

    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(
        null
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkActionNotes, setBulkActionNotes] = useState("");
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();
    const tableFiltersRef = useRef(tableFilters);
    tableFiltersRef.current = tableFilters;

    // Sync employeeId from URL into tableFilters so it appears in the filter UI and can be modified
    useEffect(() => {
        if (employeeIdFromUrl) {
            const merged = mergeEmployeeFilterIntoTableFilters(tableFiltersRef.current, employeeIdFromUrl);
            if (merged) setTableFilters(merged);
        }
    }, [employeeIdFromUrl, setTableFilters]);

    // Modal states
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedTimeRecord, setSelectedTimeRecord] =
        useState<TimeRecord | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<
        "approved" | "rejected"
    >("approved");
    const [verificationNotes, setVerificationNotes] = useState("");
    const [isVerificationSubmitting, setIsVerificationSubmitting] =
        useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTimeRecord, setEditingTimeRecord] = useState<TimeRecord | null>(
        null
    );

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTimeRecord, setViewingTimeRecord] = useState<TimeRecord | null>(
        null
    );

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTimeRecord, setDeletingTimeRecord] =
        useState<TimeRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch time records function
    const fetchTimeRecords = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !managerId) return;

        try {
            const response = await getManagerTimeRecords(
                orgId,
                managerId,
                query || undefined,
                undefined,
                tableFilters || undefined
            );
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters && response.success.params) {
                    setTableFilters(mergeEmployeeFilterIntoTableFilters(response.success.params, employeeIdFromUrl));
                }
            } else {
                toast.error(
                    t("employees.timeRecords.errorFetchingTimeRecords") ||
                    "Error fetching time records"
                );
            }
        } catch (error) {
            toast.error(
                t("employees.timeRecords.errorFetchingTimeRecords") ||
                "Error fetching time records"
            );
            console.error("Error fetching time records:", error);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId && managerId) {
            fetchTimeRecords();
        }
    }, [orgId, managerId, tableFilters]);

    // Load more time records
    const loadMoreTimeRecords = async () => {
        if (!orgId || !managerId || !nextPageToken || loadingMore || isLoading)
            return;

        setLoadingMore(true);
        try {
            const response = await getManagerTimeRecords(
                orgId,
                managerId,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.time_records) {
                setTimeRecords((prev) => [...prev, ...response.success.time_records]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("employees.timeRecords.errorFetchingTimeRecords") ||
                    "Error fetching time records"
                );
            }
        } catch (error) {
            toast.error(
                t("employees.timeRecords.errorFetchingTimeRecords") ||
                "Error fetching time records"
            );
            console.error("Error fetching time records:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle bulk action confirmation
    const handleBulkAction = (action: "approve" | "reject") => {
        setActionType(action);
        setBulkActionNotes("");
        setConfirmDialogOpen(true);
    };

    // Close bulk action modal
    const handleCloseBulkActionModal = () => {
        setConfirmDialogOpen(false);
        setActionType(null);
        setBulkActionNotes("");
    };

    // Execute bulk action
    const executeBulkAction = async () => {
        if (!orgId || !managerId || !actionType) return;

        setIsProcessing(true);
        try {
            let response;

            // If managerId is "me", use postManagerTimeRecordVerifyAll, otherwise use postTimeRecordsVerifyAll
            if (managerId === "me") {
                response = await postManagerTimeRecordVerifyAll(orgId, managerId, {
                    verification_status:
                        actionType === "approve" ? "approved" : "rejected",
                    verification_notes:
                        bulkActionNotes ||
                        (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
                });
            } else {
                response = await postTimeRecordsVerifyAll(orgId, {
                    verification_status:
                        actionType === "approve" ? "approved" : "rejected",
                    verification_notes:
                        bulkActionNotes ||
                        (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
                });
            }

            if (response.success) {
                toast.success(
                    t(
                        actionType === "approve"
                            ? "timeRecords.allApproved"
                            : "timeRecords.allRejected",
                        actionType === "approve"
                            ? "All time records approved successfully"
                            : "All time records rejected successfully"
                    )
                );
                fetchTimeRecords();
                handleCloseBulkActionModal();
            } else {
                toast.error(
                    t("timeRecords.errorProcessing", "Error processing time records")
                );
            }
        } catch (error) {
            toast.error(
                t("timeRecords.errorProcessing", "Error processing time records")
            );
            console.error("Error processing bulk action:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Verification modal handlers
    const handleOpenVerificationModal = (
        timeRecord: TimeRecord,
        status: "approved" | "rejected"
    ) => {
        setSelectedTimeRecord(timeRecord);
        setVerificationStatus(status);
        setVerificationNotes("");
        setIsVerificationModalOpen(true);
    };

    const handleCloseVerificationModal = () => {
        setIsVerificationModalOpen(false);
        setSelectedTimeRecord(null);
        setVerificationNotes("");
        setIsVerificationSubmitting(false);
    };

    const handleSubmitVerification = async () => {
        if (!selectedTimeRecord || !orgId || !managerId) return;

        setIsVerificationSubmitting(true);
        try {
            let response;

            // If managerId is "me", use postManagerTimeRecordVerify, otherwise use postTimeRecordsVerify
            if (managerId === "me") {
                response = await postManagerTimeRecordVerify(orgId, managerId, {
                    time_record_ids: [selectedTimeRecord.id],
                    verification_status: verificationStatus,
                    verification_notes: verificationNotes || null,
                });
            } else {
                response = await postTimeRecordsVerify(orgId, {
                    time_record_ids: [selectedTimeRecord.id],
                    verification_status: verificationStatus,
                    verification_notes: verificationNotes || null,
                });
            }

            if (response.success) {
                toast.success(
                    t(
                        "employees.timeRecords.verificationSuccess",
                        "Time record verified successfully"
                    )
                );
                await fetchTimeRecords(searchQuery);
                handleCloseVerificationModal();
            } else {
                toast.error(
                    response.error?.message ||
                    t(
                        "employees.timeRecords.verificationError",
                        "Error verifying time record"
                    )
                );
            }
        } catch (error) {
            toast.error(
                t(
                    "employees.timeRecords.verificationError",
                    "Error verifying time record"
                )
            );
            console.error("Error verifying time record:", error);
        } finally {
            setIsVerificationSubmitting(false);
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
        if (!orgId || !managerId) return { error: "Missing orgId or managerId" };
        // If managerId is "me", use patchManagerTimeRecord, otherwise use patchTimeRecord
        if (managerId === "me") {
            return patchManagerTimeRecord(orgId, managerId, timeRecordId, data);
        } else {
            return patchTimeRecord(orgId, timeRecordId, data);
        }
    };

    // Delete handlers
    const handleOpenDeleteModal = (timeRecord: TimeRecord) => {
        setDeletingTimeRecord(timeRecord);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingTimeRecord(null);
        setIsDeleting(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTimeRecord || !orgId || !managerId) return;

        setIsDeleting(true);
        try {
            const response = await deleteTimeRecord(orgId, deletingTimeRecord.id);
            if (response.success || response === undefined) {
                toast.success(
                    t(
                        "employees.timeRecords.deleteSuccess",
                        "Time record deleted successfully"
                    )
                );
                await fetchTimeRecords(searchQuery);
                handleCloseDeleteModal();
            } else {
                toast.error(
                    response.error?.message ||
                    t("employees.timeRecords.deleteError", "Error deleting time record")
                );
            }
        } catch (error) {
            toast.error(
                t("employees.timeRecords.deleteError", "Error deleting time record")
            );
            console.error("Error deleting time record:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Render approve/reject buttons for pending time records
    const renderApproveRejectButtons = (timeRecord: TimeRecord) => {
        if (timeRecord.verification_status !== "pending") return null;

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

    // Custom render function for table actions (Manager view)
    const renderTableActions = (
        timeRecord: TimeRecord,
        allTimeRecords: TimeRecord[]
    ) => {
        const status = timeRecord.verification_status;
        const hasPending = allTimeRecords.some(
            (r) => r.verification_status === "pending"
        );

        return (
            <div
                className={`flex items-center gap-2 ${hasPending ? "justify-end" : "justify-center"
                    }`}
            >
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
                        // For approved records, show reject option (only when managerId is not "me")
                        {
                            label: t("timeRecords.reject", "Reject"),
                            icon: "x",
                            onClick: () =>
                                handleOpenVerificationModal(timeRecord, "rejected"),
                            showOption: managerId !== "me" && status === "approved",
                        },
                        // For rejected records, show approve option (only when managerId is not "me")
                        {
                            label: t("timeRecords.approve", "Approve"),
                            icon: "check",
                            onClick: () =>
                                handleOpenVerificationModal(timeRecord, "approved"),
                            showOption: managerId !== "me" && status === "rejected",
                        },
                        // Edit option (only when managerId is not "me")
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleOpenEditModal(timeRecord),
                            showOption: managerId !== "me" || status === "pending",
                        },
                        // Delete option (only when managerId is not "me")
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleOpenDeleteModal(timeRecord),
                            variant: "destructive" as const,
                            showOption: managerId !== "me",
                        },
                    ]}
                />
            </div>
        );
    };

    // Render function for modal header actions (excludes View option)
    const renderModalActions = (timeRecord: TimeRecord) => {
        const status = timeRecord.verification_status;
        const items = [
            // For approved, show reject option (only when managerId is not "me")
            {
                showOption: managerId !== "me" && status === "approved",
                label: t("timeRecords.reject", "Reject"),
                icon: "x",
                onClick: () => {
                    setIsViewModalOpen(false);
                    handleOpenVerificationModal(timeRecord, "rejected");
                },
            },
            // For rejected, show approve option (only when managerId is not "me")
            {
                showOption: managerId !== "me" && status === "rejected",
                label: t("timeRecords.approve", "Approve"),
                icon: "check",
                onClick: () => {
                    setIsViewModalOpen(false);
                    handleOpenVerificationModal(timeRecord, "approved");
                },
            },
            // Edit option (only when managerId is not "me" or record is pending)
            {
                showOption: managerId !== "me" || status === "pending",
                label: t("common.edit", "Edit"),
                icon: "edit",
                onClick: () => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(timeRecord);
                },
            },
            // Delete option (only when managerId is not "me")
            {
                showOption: managerId !== "me",
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => handleOpenDeleteModal(timeRecord),
                variant: "destructive" as const,
            },
        ];

        // Only render dropdown if there are actions available
        if (items.length === 0 || (status !== "pending" && managerId === "me"))
            return null;
        return <CustomActionsDropdown items={items} />;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("managers.timeRecords.title", "Time Records")}
                description={t(
                    "managers.timeRecords.description",
                    `Manage ${managerId == "me"
                        ? "your"
                        : `${manager?.first_name} ${manager?.last_name}`
                    } team time records`
                )}
                action={
                    <div className="flex items-center gap-2">
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("timeRecords.acceptAll", "Accept All"),
                                    icon: "check",
                                    onClick: () => handleBulkAction("approve"),
                                },
                                {
                                    variant: "destructive",
                                    label: t("timeRecords.denyAll", "Deny All"),
                                    icon: "x",
                                    onClick: () => handleBulkAction("reject"),
                                },
                            ]}
                            triggerIcon="chevron-down"
                            triggerVariant="default"
                            triggerLabel={t("timeRecords.bulkActions", "Bulk Actions")}
                        />
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchTimeRecords}
                placeholder={t(
                    "timeRecords.searchPlaceholder",
                    "Search time records..."
                )}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchTimeRecords(searchQuery)}
                />
            )}

            {/* Time Records Table */}
            <TimeRecordsTable
                timeRecords={timeRecords}
                isLoading={isLoading}
                hiddenColumns={["notes", "start_time", "end_time"]}
                renderActions={renderTableActions}
                onRowClick={handleOpenViewModal}
            />

            {/* Load More Button */}
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

            {/* Bulk Action Modal */}
            <TimeRecordBulkActionModal
                isOpen={confirmDialogOpen}
                onClose={handleCloseBulkActionModal}
                actionType={actionType}
                notes={bulkActionNotes}
                onNotesChange={setBulkActionNotes}
                onConfirm={executeBulkAction}
                isProcessing={isProcessing}
            />

            {/* Verification Modal */}
            <TimeRecordVerificationModal
                isOpen={isVerificationModalOpen}
                onClose={handleCloseVerificationModal}
                timeRecord={selectedTimeRecord}
                verificationStatus={verificationStatus}
                verificationNotes={verificationNotes}
                onNotesChange={setVerificationNotes}
                onSubmit={handleSubmitVerification}
                isSubmitting={isVerificationSubmitting}
            />

            {/* View Time Record Modal */}
            <TimeRecordViewModal
                open={isViewModalOpen}
                onOpenChange={handleViewModalClose}
                timeRecord={viewingTimeRecord}
                renderActions={renderModalActions}
                showEmployeeInfo={true}
                renderFooterActions={
                    viewingTimeRecord?.verification_status === "pending"
                        ? () => (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleViewModalClose(false);
                                        handleOpenVerificationModal(
                                            viewingTimeRecord,
                                            "rejected"
                                        );
                                    }}
                                    disabled={isLoading}
                                >
                                    <X className="h-4 w-4" />
                                    {t("employees.timeRecords.reject", "Reject")}
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleViewModalClose(false);
                                        handleOpenVerificationModal(
                                            viewingTimeRecord,
                                            "approved"
                                        );
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

            {/* Edit Modal */}
            {editingTimeRecord && (
                <TimeRecordEditAdminModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTimeRecordUpdated={() => fetchTimeRecords(searchQuery)}
                    timeRecord={editingTimeRecord}
                    onUpdateTimeRecord={handleUpdateTimeRecord}
                />
            )}

            {/* Delete Modal */}
            <TimeRecordDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                timeRecord={deletingTimeRecord}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default ManagersPageTimeRecords;
