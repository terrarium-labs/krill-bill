import { memo, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Eye, Check, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
    getManagerTimeRecords,
    postManagerTimeRecordVerify,
    patchManagerTimeRecord,
} from "@/api/managers/time-records/time-records";
import { postTimeRecordsVerify, deleteTimeRecord, patchTimeRecord } from "@/api/orgs/time-records/time-records";
import { TimeRecord } from "@/types/employees/time-records";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TimeRecordVerificationModal from "@/app/time-records/components/modals/time-record-verification-modal";
import TimeRecordsTable from "@/app/time-records/components/time-records-table";
import TimeRecordDeleteModal from "@/app/time-records/components/modals/time-record-delete-modal";
import TimeRecordEditAdminModal from "@/app/time-records/components/modals/time-record-edit-admin-modal";
import TimeRecordViewModal from "@/app/time-records/components/modals/time-record-view-modal";
import { TableFilters } from "@/types/general/filters";

interface ManagerTimeRecordsSectionProps {
    /** The manager's employee ID */
    managerId: string | undefined;
    /** Maximum number of records to display */
    maxRecords?: number;
    /** Filter by specific employee ID */
    employeeId?: string | null;
}

const ManagerTimeRecordsSectionComponent = ({
    managerId,
    maxRecords = 10,
    employeeId: employeeIdProp,
}: ManagerTimeRecordsSectionProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const employeeIdFromUrl = searchParams.get("employeeId");
    const employeeId = employeeIdProp ?? employeeIdFromUrl;

    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Verification modal state
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedTimeRecord, setSelectedTimeRecord] = useState<TimeRecord | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<"approved" | "rejected">("approved");
    const [verificationNotes, setVerificationNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTimeRecord, setDeletingTimeRecord] = useState<TimeRecord | null>(null);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTimeRecord, setEditingTimeRecord] = useState<TimeRecord | null>(null);

    // View modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTimeRecord, setViewingTimeRecord] = useState<TimeRecord | null>(null);

    // Table filters: include employee filter when employeeId (selectedEmployee) is provided
    const tableFilters: TableFilters = useMemo(() => {
        const filters: TableFilters["filters"] = [
            {
                "key": "verification_status",
                "type": "array",
                "options": [],
                "endpoint": null,
                "is_sortable": false,
                "operator": "inArray",
                "value": ["pending"]
            }
        ];
        if (employeeId) {
            filters.push({
                "key": "employee",
                "type": "array",
                "options": [],
                "endpoint": { path: `/orgs/{{org_id}}/managers/${managerId}/employees/{{employeeId}}/time-records`, key: "time_records", type: "list" },
                "is_sortable": false,
                "operator": "inArray",
                "value": [employeeId]
            });
        }
        return {
            global_operator: "AND",
            filters,
            order_by: null,
            keys: []
        };
    }, [employeeId]);

    const handleSeeAll = () => {
        const params = new URLSearchParams();
        if (employeeId) {
            params.set("employee", employeeId);
        }
        const queryString = params.toString();
        const url = `/${orgId}/managers/${managerId}/time-records${queryString ? `?${queryString}` : ""}`;
        navigate(url);
    };

    const fetchTimeRecords = async () => {
        if (!orgId || !managerId) return;
        setIsLoading(true);
        try {
            const response = await getManagerTimeRecords(
                orgId,
                managerId,
                undefined,
                undefined,
                tableFilters || undefined
            );
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
            }
        } catch (error) {
            toast.error(
                t("employees.timeRecords.errorFetchingTimeRecords", "Error fetching time records")
            );
            console.error("Error fetching time records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Verification modal handlers
    const handleOpenVerificationModal = (
        timeRecord: TimeRecord,
        newStatus: "approved" | "rejected"
    ) => {
        setSelectedTimeRecord(timeRecord);
        setVerificationStatus(newStatus);
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
        if (!selectedTimeRecord || !orgId || !managerId) return;

        setIsSubmitting(true);
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
                await fetchTimeRecords();
                handleCloseVerificationModal();
            } else {
                toast.error(
                    response.error?.message ||
                    t("employees.timeRecords.verificationError", "Error verifying time record")
                );
            }
        } catch (error) {
            toast.error(
                t("employees.timeRecords.verificationError", "Error verifying time record")
            );
            console.error("Error verifying time record:", error);
        } finally {
            setIsSubmitting(false);
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
        setIsDeleteSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (!orgId || !deletingTimeRecord) return;

        setIsDeleteSubmitting(true);
        try {
            const response = await deleteTimeRecord(orgId, deletingTimeRecord.id);

            if (response.success) {
                toast.success(
                    t("employees.timeRecords.deleteSuccess", "Time record deleted successfully")
                );
                await fetchTimeRecords();
                handleCloseDeleteModal();
            } else {
                toast.error(
                    response.error?.message ||
                    t("employees.timeRecords.deleteError", "Error deleting time record")
                );
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.deleteError", "Error deleting time record"));
            console.error("Error deleting time record:", error);
        } finally {
            setIsDeleteSubmitting(false);
        }
    };

    // Edit modal handlers
    const handleOpenEditModal = (timeRecord: TimeRecord) => {
        setEditingTimeRecord(timeRecord);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTimeRecord(null);
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

    const handleEditSuccess = () => {
        fetchTimeRecords();
        handleCloseEditModal();
    };

    // Render approve/reject buttons for pending time records
    const renderApproveRejectButtons = (
        timeRecord: TimeRecord,
        onComplete?: () => void
    ) => {
        if (timeRecord.verification_status !== "pending") {
            return null;
        }

        return (
            <>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenVerificationModal(timeRecord, "rejected");
                        onComplete?.();
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
                        onComplete?.();
                    }}
                >
                    <Check className="h-4 w-4" />
                </Button>
            </>
        );
    };

    // Render actions for each time record row
    const renderActions = (timeRecord: TimeRecord) => {
        return (
            <div className="flex items-center gap-2 justify-end">
                {renderApproveRejectButtons(timeRecord)}
                <CustomActionsDropdown
                    items={[
                        // View option - always available
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: () => handleOpenViewModal(timeRecord),
                        },
                        // Edit option
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleOpenEditModal(timeRecord),
                        },
                        // Only allow deleting when managerId is not "me"
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

    // Render function for modal header actions (excludes View option, includes approve/reject)
    const renderModalActions = (timeRecord: TimeRecord) => {
        const status = timeRecord.verification_status;
        const items = [
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
            // Edit option
            {
                label: t("common.edit", "Edit"),
                icon: "edit",
                onClick: () => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(timeRecord);
                },
            },
            {
                showOption: managerId !== "me",
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => handleOpenDeleteModal(timeRecord),
                variant: "destructive" as const,
            },
        ]
        return <CustomActionsDropdown items={items} />;
    };

    useEffect(() => {
        if (orgId && managerId) {
            fetchTimeRecords();
        }
    }, [orgId, managerId, employeeId]);

    return (
        <div className="space-y-4">
            <PageHeader
                title={
                    <span className="text-[16px] font-semibold">
                        {t("employees.pendingTimeRecords.title", "Pending Time Records")}
                    </span>
                }
                showBackButton={false}
                action={
                    <Button variant="outline" onClick={handleSeeAll}>
                        <Eye className="h-4 w-4" />
                        {t("common.actions.seeAll", "See All")}
                    </Button>
                }
            />

            <TimeRecordsTable
                timeRecords={timeRecords}
                isLoading={isLoading}
                hiddenColumns={["verified_by", "verification_status", "notes", "last_modified_by", "start_time", "end_time"]}
                maxRecords={maxRecords}
                renderActions={renderActions}
                onRowClick={handleOpenViewModal}
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
                isSubmitting={isSubmitting}
            />

            {/* Delete Modal */}
            <TimeRecordDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                timeRecord={deletingTimeRecord}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleteSubmitting}
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

            {/* Edit Admin Modal */}
            {editingTimeRecord && (
                <TimeRecordEditAdminModal
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        if (!open) handleCloseEditModal();
                    }}
                    onTimeRecordUpdated={handleEditSuccess}
                    timeRecord={editingTimeRecord}
                    onUpdateTimeRecord={handleUpdateTimeRecord}
                />
            )}
        </div>
    );
};

export const ManagerTimeRecordsSection = memo(ManagerTimeRecordsSectionComponent);

export default ManagerTimeRecordsSection;