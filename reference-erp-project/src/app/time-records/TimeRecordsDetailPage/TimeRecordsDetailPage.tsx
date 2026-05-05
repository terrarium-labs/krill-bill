import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { TimeRecord } from "@/types/employees/time-records";
import {
    getTimeRecords,
    postTimeRecordsVerify,
    patchTimeRecord,
    deleteTimeRecord,
    postTimeRecordsVerifyAll,
} from "@/api/orgs/time-records/time-records";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import TimeRecordsTable from "../components/time-records-table";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TimeRecordVerificationModal from "../components/modals/time-record-verification-modal";
import TimeRecordEditAdminModal from "../components/modals/time-record-edit-admin-modal";
import TimeRecordDeleteModal from "../components/modals/time-record-delete-modal";
import TimeRecordViewModal from "../components/modals/time-record-view-modal";
import TimeRecordBulkActionModal from "../components/modals/time-record-bulk-action-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";

const TimeRecordsDetailPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Modal states
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

    // Bulk action state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkActionNotes, setBulkActionNotes] = useState("");

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
        if (!orgId || !actionType) return;

        setIsProcessing(true);
        try {
            const response = await postTimeRecordsVerifyAll(
                orgId,
                {
                    verification_status: actionType === "approve" ? "approved" : "rejected",
                    verification_notes: bulkActionNotes || (actionType === "approve" ? "Bulk approval" : "Bulk rejection")
                }
            );

            if (response.success) {
                toast.success(t(
                    actionType === "approve" ? "timeRecords.allApproved" : "timeRecords.allRejected",
                    actionType === "approve" ? "All time records approved successfully" : "All time records rejected successfully"
                ));
                fetchTimeRecords(searchQuery);
                handleCloseBulkActionModal();
            } else {
                toast.error(t("timeRecords.errorProcessing", "Error processing time records"));
            }
        } catch (error) {
            toast.error(t("timeRecords.errorProcessing", "Error processing time records"));
            console.error("Error processing bulk action:", error);
        } finally {
            setIsProcessing(false);
        }
    };
    // Fetch time records function
    const fetchTimeRecords = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getTimeRecords(
                orgId,
                query || undefined,
                undefined,
                tableFilters || undefined,
            );
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            console.error("Error fetching time records:", error);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchTimeRecords();
        }
    }, [orgId]);

    // Load more time records
    const loadMoreTimeRecords = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getTimeRecords(
                orgId,
                searchQuery || undefined,
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
                await fetchTimeRecords(searchQuery);
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
                await fetchTimeRecords(searchQuery);
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

    // Custom render function for table actions (Admin view - full control)
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

    // Render function for modal header actions (three-dots menu only, no approve/reject buttons or View option)
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

    return (
        <>

            <PageHeader
                title={t("timeRecords.title", "All Time Records")}
                description={t("timeRecords.description", "Manage your organization's individual time records.")}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("timeRecords.approveAll", "Approve All"),
                                    icon: "check",
                                    onClick: () => handleBulkAction("approve"),
                                },
                                {
                                    variant: "destructive",
                                    label: t("timeRecords.rejectAll", "Reject All"),
                                    icon: "x",
                                    onClick: () => handleBulkAction("reject"),
                                },
                            ]}
                            triggerIcon="chevron-down"
                            triggerVariant="default"
                            triggerLabel={t("timeRecords.bulkActions", "Bulk Actions")}
                            className="h-9 px-3"
                        />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("timeRecords.viewAll", "View Summary"),
                                    icon: "layout-panel-top",
                                    onClick: () => navigate(`/${orgId}/time-records`),
                                },
                            ]}
                            className="h-9 px-3"
                        />
                    </div>
                }
            />
            <div className="space-y-6">

                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchTimeRecords}
                    placeholder={t("timeRecords.searchPlaceholder", "Search time records...")}
                />

                {/* Filters */}
                {tableFilters && (
                    <TableFiltersRow
                        value={tableFilters}
                        onChange={(filters) => setTableFilters(filters)}
                        onFilter={() => fetchTimeRecords(searchQuery)}
                    />
                )}

                {/* Time Records Table */}
                <TimeRecordsTable
                    timeRecords={timeRecords}
                    isLoading={isLoading}
                    hiddenColumns={["notes", "last_modified_by", "start_time", "end_time"]}
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

                {/* Verification Modal */}
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

                {/* View Time Record Modal */}
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
                    isDeleting={isDeleteSubmitting}
                />

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
            </div>
        </>
    );
};

export default TimeRecordsDetailPage;