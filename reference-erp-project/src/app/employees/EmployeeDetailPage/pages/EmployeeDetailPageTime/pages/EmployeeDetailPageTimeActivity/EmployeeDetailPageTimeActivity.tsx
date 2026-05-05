import { Button } from "@/components/ui/button";
import { Plus, Loader2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import {
    getEmployeeTimeRecords,
    postEmployeeTimeRecord,
} from "@/api/employees/time-records/time-records";
import { patchTimeRecord, deleteTimeRecord, postTimeRecordsVerify } from "@/api/orgs/time-records/time-records";
import { toast } from "sonner";
import { useEmployee } from "@/app/employees/contexts/EmployeeContext";
import { useParams } from "react-router";
import { TimeRecord } from "@/types/employees/time-records";
import { formatDateForAPI, formatDate, getFirstDayOfMonth, getLastDayOfMonth, isCurrentMonth } from "@/utils/miscelanea";
import TimeRecordsDaysView from "./components/time-records-days-view";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import TimeRecordsTable from "@/app/time-records/components/time-records-table";
import TimeRecordEditModal from "@/app/time-records/components/modals/time-record-edit-modal";
import TimeRecordEditAdminModal from "@/app/time-records/components/modals/time-record-edit-admin-modal";
import TimeRecordDeleteModal from "@/app/time-records/components/modals/time-record-delete-modal";
import TimeRecordVerificationModal from "@/app/time-records/components/modals/time-record-verification-modal";
import TimeRecordViewModal from "@/app/time-records/components/modals/time-record-view-modal";
import TimeRecordsViewModal from "@/app/time-records/components/modals/time-records-view-modal";
import TimeRecordBulkActionModal from "@/app/time-records/components/modals/time-record-bulk-action-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import AbsenceVerificationModal from "@/app/absences/components/modals/absence-verification-modal";
import AbsenceDeleteModal from "@/app/absences/components/modals/absence-delete-modal";
import AbsenceEditAdminModal from "@/app/absences/components/modals/absence-edit-admin-modal";
import { Absence } from "@/types/employees/absences";
import { SickLeave } from "@/types/employees/sick-leaves";
import { postAbsenceStatus, deleteAbsence, patchAbsence } from "@/api/orgs/absences/absences";
import { patchSickLeave, deleteSickLeave } from "@/api/orgs/sick-leaves/sick-leaves";
import SickLeaveViewModal from "@/app/sick-leaves/components/sick-leave-view-modal";
import SickLeaveEditModal from "@/app/sick-leaves/components/sick-leave-edit-modal";
import SickLeaveDeleteModal from "@/app/sick-leaves/components/sick-leave-delete-modal";

const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};
const getSunday = (monday: Date): Date => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
};
const getNextMonday = (monday: Date): Date => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    return next;
};

const EmployeeDetailPageTimeActivity = () => {
    const { t } = useTranslation();
    const { employee, selectedYear, setSelectedYear, holidays, sickLeaves, absences, refreshHolidaysAndSickLeaves, timePolicy } = useEmployee();
    const { orgId } = useParams<{ orgId: string }>();
    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [weekViewRefreshTrigger, setWeekViewRefreshTrigger] = useState(0);
    const [timeRecordsActiveTab, setTimeRecordsActiveTab] = useState<"days" | "all">("days");
    const { tableFilters, setTableFilters } = useTableFilters();

    // Shared period state for both "days" and "all" tabs (same values when alternating)
    const [showMonthView, setShowMonthView] = useState(false);
    const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
    const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() => getFirstDayOfMonth(new Date()));
    const [use24HourView, setUse24HourView] = useState(false);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTimeRecord, setEditingTimeRecord] = useState<TimeRecord | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTimeRecord, setViewingTimeRecord] = useState<TimeRecord | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTimeRecord, setDeletingTimeRecord] = useState<TimeRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Verification modal states
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedTimeRecord, setSelectedTimeRecord] = useState<TimeRecord | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<"approved" | "rejected">("approved");
    const [verificationNotes, setVerificationNotes] = useState("");
    const [isVerificationSubmitting, setIsVerificationSubmitting] = useState(false);

    // Time records view modal state
    const [isTimeRecordsViewModalOpen, setIsTimeRecordsViewModalOpen] = useState(false);
    const [viewingTimeRecords, setViewingTimeRecords] = useState<TimeRecord[]>([]);
    const [viewingDate, setViewingDate] = useState<Date | undefined>(undefined);

    // Absence view modal state
    const [isViewAbsenceModalOpen, setIsViewAbsenceModalOpen] = useState(false);
    const [viewingAbsence, setViewingAbsence] = useState<Absence | null>(null);

    // Absence delete modal state
    const [isAbsenceDeleteModalOpen, setIsAbsenceDeleteModalOpen] = useState(false);
    const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
    const [isAbsenceDeleting, setIsAbsenceDeleting] = useState(false);

    // Absence verification modal state
    const [isAbsenceVerificationModalOpen, setIsAbsenceVerificationModalOpen] = useState(false);
    const [absenceVerificationAbsence, setAbsenceVerificationAbsence] = useState<Absence | null>(null);
    const [absenceVerificationStatus, setAbsenceVerificationStatus] = useState<"approved" | "rejected">("approved");
    const [absenceVerificationReason, setAbsenceVerificationReason] = useState("");
    const [isAbsenceVerificationSubmitting, setIsAbsenceVerificationSubmitting] = useState(false);

    // Absence edit modal state
    const [isAbsenceEditModalOpen, setIsAbsenceEditModalOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

    // Sick leave view modal state
    const [isViewSickLeaveModalOpen, setIsViewSickLeaveModalOpen] = useState(false);
    const [viewingSickLeave, setViewingSickLeave] = useState<SickLeave | null>(null);

    // Sick leave edit modal state
    const [isSickLeaveEditModalOpen, setIsSickLeaveEditModalOpen] = useState(false);
    const [editingSickLeave, setEditingSickLeave] = useState<SickLeave | null>(null);

    // Sick leave delete modal state
    const [isSickLeaveDeleteModalOpen, setIsSickLeaveDeleteModalOpen] = useState(false);
    const [deletingSickLeave, setDeletingSickLeave] = useState<SickLeave | null>(null);
    const [isSickLeaveDeleting, setIsSickLeaveDeleting] = useState(false);

    // Bulk action state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkActionNotes, setBulkActionNotes] = useState("");
    const [bulkActionTimeRecordIds, setBulkActionTimeRecordIds] = useState<string[]>([]);

    // Fetch time records function. When on "all" tab, pass startDate/endDate for the current period (same as days view).
    const fetchTimeRecords = async (query: string = "", startDate?: string, endDate?: string) => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !employee) return;

        const fromDay = startDate ?? undefined;
        const toDay = endDate ?? undefined;

        try {
            const response = await getEmployeeTimeRecords(orgId, employee.id, fromDay ?? null, toDay ?? null, query, undefined, undefined);
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Sync selectedYear when period changes (for smooth navigation between Time Records and Absences tabs).
    // Prioritise year from end date (e.g. week Dec 23–Jan 5 → 2025, not 2024)
    useEffect(() => {
        const periodYear = showMonthView
            ? getLastDayOfMonth(currentMonthStart).getFullYear()
            : (() => {
                const lastDayOfWeek = new Date(currentWeekMonday);
                lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                return lastDayOfWeek.getFullYear();
            })();
        if (periodYear !== selectedYear) {
            setSelectedYear(periodYear);
        }
    }, [showMonthView, currentWeekMonday, currentMonthStart, selectedYear, setSelectedYear]);

    // Period range for API (shared by both tabs)
    const periodStartEnd = useMemo(() => {
        if (showMonthView) {
            const first = getFirstDayOfMonth(currentMonthStart);
            const last = getLastDayOfMonth(currentMonthStart);
            return { fromDay: formatDateForAPI(first), toDay: formatDateForAPI(last) };
        }
        return {
            fromDay: formatDateForAPI(currentWeekMonday),
            toDay: formatDateForAPI(getNextMonday(currentWeekMonday)),
        };
    }, [showMonthView, currentWeekMonday, currentMonthStart]);

    // When on "all" tab, fetch with period range (same as days view). Refetch when tab, period or search changes.
    useEffect(() => {
        if (timeRecordsActiveTab !== "all" || !orgId || !employee) return;
        fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
    }, [timeRecordsActiveTab, periodStartEnd.fromDay, periodStartEnd.toDay, searchQuery]);

    // Load more time records (when on "all" tab, use same period range)
    const loadMoreTimeRecords = async () => {
        if (!orgId || !employee || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        const fromDay = timeRecordsActiveTab === "all" ? periodStartEnd.fromDay : null;
        const toDay = timeRecordsActiveTab === "all" ? periodStartEnd.toDay : null;
        try {
            const response = await getEmployeeTimeRecords(orgId, employee.id, fromDay, toDay, searchQuery, nextPageToken, undefined);
            if (response.success && response.success.time_records) {
                setTimeRecords(prev => [...prev, ...response.success.time_records]);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handlers for create/edit modal
    const handleOpenCreateModal = () => {
        setEditingTimeRecord(null);
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (timeRecord: TimeRecord) => {
        setEditingTimeRecord(timeRecord);
        setIsEditModalOpen(true);
    };

    const handleCreateModalClose = (open: boolean) => {
        setIsCreateModalOpen(open);
    };

    const handleEditModalClose = (open: boolean) => {
        setIsEditModalOpen(open);
        if (!open) {
            setEditingTimeRecord(null);
        }
    };

    // Handlers for view modal
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

    // Absence view handlers
    const handleViewAbsence = (absence: Absence | null) => {
        setViewingAbsence(absence);
        setIsViewAbsenceModalOpen(true);
    };

    const handleViewAbsenceModalClose = (open: boolean) => {
        setIsViewAbsenceModalOpen(open);
        if (!open) setViewingAbsence(null);
    };

    const handleOpenAbsenceVerificationModal = (absence: Absence, status: "approved" | "rejected") => {
        setAbsenceVerificationAbsence(absence);
        setAbsenceVerificationStatus(status);
        setAbsenceVerificationReason("");
        setIsAbsenceVerificationModalOpen(true);
    };

    const handleCloseAbsenceVerificationModal = () => {
        setIsAbsenceVerificationModalOpen(false);
        setAbsenceVerificationAbsence(null);
        setAbsenceVerificationReason("");
        setIsAbsenceVerificationSubmitting(false);
    };

    const handleSubmitAbsenceVerification = async () => {
        if (!absenceVerificationAbsence || !orgId) return;
        setIsAbsenceVerificationSubmitting(true);
        try {
            const response = await postAbsenceStatus(orgId, {
                absence_ids: [absenceVerificationAbsence.id],
                status: absenceVerificationStatus,
                reason: absenceVerificationReason || null,
            });
            if (response.success) {
                toast.success(t("absences.verificationSuccess", "Absence status updated successfully"));
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleCloseAbsenceVerificationModal();
                handleViewAbsenceModalClose(false);
            } else {
                toast.error(t("absences.verificationError", "Error updating absence status"));
            }
        } catch (error) {
            console.error("Error updating absence status:", error);
            toast.error(t("absences.verificationError", "Error updating absence status"));
        } finally {
            setIsAbsenceVerificationSubmitting(false);
        }
    };

    const handleOpenAbsenceDeleteModal = (absence: Absence) => {
        setDeletingAbsence(absence);
        setIsAbsenceDeleteModalOpen(true);
    };

    const handleCloseAbsenceDeleteModal = () => {
        setIsAbsenceDeleteModalOpen(false);
        setDeletingAbsence(null);
        setIsAbsenceDeleting(false);
    };

    const handleConfirmAbsenceDelete = async () => {
        if (!orgId || !deletingAbsence) return;
        setIsAbsenceDeleting(true);
        try {
            const response = await deleteAbsence(orgId, deletingAbsence.id);
            if (response.success) {
                toast.success(t("absences.deleteSuccess", "Absence deleted successfully"));
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleCloseAbsenceDeleteModal();
                handleViewAbsenceModalClose(false);
            } else {
                toast.error(response.error?.message || t("absences.deleteError", "Error deleting absence"));
            }
        } catch (error) {
            toast.error(t("absences.deleteError", "Error deleting absence"));
            console.error("Error deleting absence:", error);
        } finally {
            setIsAbsenceDeleting(false);
        }
    };

    const handleEditAbsence = (absence: Absence) => {
        setEditingAbsence(absence);
        setIsAbsenceEditModalOpen(true);
    };

    const handleAbsenceEditModalClose = (open: boolean) => {
        setIsAbsenceEditModalOpen(open);
        if (!open) setEditingAbsence(null);
    };

    const handleAbsenceUpdated = () => {
        setWeekViewRefreshTrigger(prev => prev + 1);
        handleAbsenceEditModalClose(false);
    };

    // Sick leave view handlers
    const handleViewSickLeave = (sickLeave: SickLeave | null) => {
        setViewingSickLeave(sickLeave);
        setIsViewSickLeaveModalOpen(true);
    };

    const handleViewSickLeaveModalClose = (open: boolean) => {
        setIsViewSickLeaveModalOpen(open);
        if (!open) setViewingSickLeave(null);
    };

    const handleEditSickLeave = (sickLeave: SickLeave) => {
        setViewingSickLeave(null);
        setIsViewSickLeaveModalOpen(false);
        setEditingSickLeave(sickLeave);
        setIsSickLeaveEditModalOpen(true);
    };

    const handleSickLeaveEditModalClose = (open: boolean) => {
        setIsSickLeaveEditModalOpen(open);
        if (!open) setEditingSickLeave(null);
    };

    const handleSickLeaveUpdated = () => {
        refreshHolidaysAndSickLeaves();
        setWeekViewRefreshTrigger(prev => prev + 1);
        handleSickLeaveEditModalClose(false);
    };

    const handleOpenSickLeaveDeleteModal = (sickLeave: SickLeave) => {
        setViewingSickLeave(null);
        setIsViewSickLeaveModalOpen(false);
        setDeletingSickLeave(sickLeave);
        setIsSickLeaveDeleteModalOpen(true);
    };

    const handleCloseSickLeaveDeleteModal = () => {
        setIsSickLeaveDeleteModalOpen(false);
        setDeletingSickLeave(null);
        setIsSickLeaveDeleting(false);
    };

    const handleConfirmSickLeaveDelete = async () => {
        if (!orgId || !deletingSickLeave) return;
        setIsSickLeaveDeleting(true);
        try {
            const response = await deleteSickLeave(orgId, deletingSickLeave.id);
            if (response.success || response === undefined) {
                toast.success(t("employees.sickLeaves.deleteSuccess", "Sick leave deleted successfully"));
                refreshHolidaysAndSickLeaves();
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleCloseSickLeaveDeleteModal();
            } else {
                toast.error(response.error?.message || t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
            }
        } catch (error) {
            toast.error(t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
            console.error("Error deleting sick leave:", error);
        } finally {
            setIsSickLeaveDeleting(false);
        }
    };

    const handleTimeRecordCreatedOrUpdated = () => {
        if (timeRecordsActiveTab === "all") {
            fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
        } else {
            fetchTimeRecords(searchQuery);
        }
        setWeekViewRefreshTrigger(prev => prev + 1);
    };

    // API callbacks for edit modal
    const handleCreateTimeRecord = async (data: { start_time: string; end_time: string; notes: string | null }) => {
        if (!orgId || !employee) return { error: "Missing orgId or employee" };
        return postEmployeeTimeRecord(orgId, employee.id, data);
    };

    // Admin update handler (includes verification status)
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
        if (!orgId || !employee) return { error: "Missing orgId or employee" };
        // Use org-level API for admin editing (can edit any status)
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
        setIsDeleting(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTimeRecord || !orgId || !employee) return;

        setIsDeleting(true);
        try {
            const response = await deleteTimeRecord(orgId, deletingTimeRecord.id);
            if (response.success) {
                toast.success(t("employees.timeRecords.timeRecordDeleted", "Time record deleted successfully"));
                setTimeRecords(prev => prev.filter(tr => tr.id !== deletingTimeRecord.id));
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleCloseDeleteModal();
            } else {
                toast.error(t("employees.timeRecords.errorDeletingTimeRecord", "Error deleting time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorDeletingTimeRecord", "Error deleting time record"));
        } finally {
            setIsDeleting(false);
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
        setIsVerificationSubmitting(false);
    };

    const handleSubmitVerification = async () => {
        if (!selectedTimeRecord || !orgId) return;

        setIsVerificationSubmitting(true);
        try {
            const response = await postTimeRecordsVerify(orgId, {
                time_record_ids: [selectedTimeRecord.id],
                verification_status: verificationStatus,
                verification_notes: verificationNotes || null,
            });
            if (response.success) {
                toast.success(
                    verificationStatus === "approved"
                        ? t("employees.timeRecords.approved", "Time record approved successfully")
                        : t("employees.timeRecords.rejected", "Time record rejected successfully")
                );
                if (timeRecordsActiveTab === "all") {
                    fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
                } else {
                    fetchTimeRecords(searchQuery);
                }
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleCloseVerificationModal();
            } else {
                toast.error(
                    verificationStatus === "approved"
                        ? t("employees.timeRecords.errorApproving", "Error approving time record")
                        : t("employees.timeRecords.errorRejecting", "Error rejecting time record")
                );
            }
        } catch (error) {
            toast.error(
                verificationStatus === "approved"
                    ? t("employees.timeRecords.errorApproving", "Error approving time record")
                    : t("employees.timeRecords.errorRejecting", "Error rejecting time record")
            );
        } finally {
            setIsVerificationSubmitting(false);
        }
    };

    // Common action items for both table and popover - Admin view (can edit/delete all records)
    const getTimeRecordActionItems = (timeRecord: TimeRecord, closePopover?: () => void) => {
        const status = timeRecord.verification_status;
        return [
            // View option - always available
            {
                label: t("common.view", "View"),
                icon: "eye",
                onClick: () => {
                    handleOpenViewModal(timeRecord);
                    closePopover?.();
                },
            },
            // Show approve option if not already approved
            ...(status !== "approved"
                ? [
                    {
                        label: t("common.approve", "Approve"),
                        icon: "check",
                        onClick: () => {
                            handleOpenVerificationModal(timeRecord, "approved");
                            closePopover?.();
                        },
                    },
                ]
                : []),
            // Show reject option if not already rejected
            ...(status !== "rejected"
                ? [
                    {
                        label: t("common.reject", "Reject"),
                        icon: "x",
                        onClick: () => {
                            handleOpenVerificationModal(timeRecord, "rejected");
                            closePopover?.();
                        },
                    },
                ]
                : []),
            {
                label: t("common.edit", "Edit"),
                icon: "edit",
                onClick: () => {
                    handleOpenEditModal(timeRecord);
                    closePopover?.();
                },
            },
            {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => {
                    handleOpenDeleteModal(timeRecord);
                    closePopover?.();
                },
                variant: "destructive" as const,
            },
        ];
    };

    // Render approve/reject buttons for pending time records
    const renderApproveRejectButtons = (timeRecord: TimeRecord, onComplete?: () => void) => {
        // Only show buttons for pending status
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

    // Custom render function for table actions - Admin view
    const renderTableActions = (timeRecord: TimeRecord) => {
        return (
            <div className="flex items-center gap-2 justify-end">
                {/* Show approve/reject buttons for pending status */}
                {renderApproveRejectButtons(timeRecord)}
                <CustomActionsDropdown items={getTimeRecordActionItems(timeRecord)} />
            </div>
        );
    };

    const renderWeekViewDetailActions = (timeRecord: TimeRecord, closePopover: () => void) => {
        return (
            <CustomActionsDropdown
                items={getTimeRecordActionItems(timeRecord, closePopover)}
                onActionClick={closePopover}
            />
        );
    };

    // Render actions for week view popover - Admin view
    const renderWeekViewActions = (timeRecord: TimeRecord, closePopover: () => void) => {
        return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {renderApproveRejectButtons(timeRecord, closePopover)}
                {renderWeekViewDetailActions(timeRecord, closePopover)}
            </div>
        );
    };

    // Render function for modal header actions (excludes View option)
    const renderModalActions = (timeRecord: TimeRecord) => {
        const status = timeRecord.verification_status;
        const items = [

            {
                showOption: status === "approved",
                label: t("timeRecords.reject", "Reject"),
                icon: "x",
                onClick: () => {
                    setIsViewModalOpen(false);
                    handleOpenVerificationModal(timeRecord, "rejected");
                },
            },
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
                variant: "destructive" as const,
            },
        ];

        return <CustomActionsDropdown items={items} />;
    };



    // Handler to open time records view modal
    const handleOpenTimeRecordsViewModal = (dayData: { day: string; date: Date; timeRecords: any[] }) => {
        setViewingTimeRecords(dayData.timeRecords as TimeRecord[]);
        setViewingDate(dayData.date);
        setIsTimeRecordsViewModalOpen(true);
    };

    const handleCloseTimeRecordsViewModal = () => {
        setIsTimeRecordsViewModalOpen(false);
        setViewingTimeRecords([]);
        setViewingDate(undefined);
    };

    // Bulk action handlers
    const handleBulkAction = (dayData: { day: string; date: Date; timeRecords: any[] }, action: "approve" | "reject") => {
        // Get all time record IDs from the day
        const timeRecordIds = dayData.timeRecords.map(record => record.id);

        if (timeRecordIds.length === 0) {
            toast.error(t("timeRecords.noTimeRecordsToProcess", "No time records to process"));
            return;
        }

        setActionType(action);
        setBulkActionNotes("");
        setBulkActionTimeRecordIds(timeRecordIds);
        setConfirmDialogOpen(true);
    };

    const handleCloseBulkActionModal = () => {
        setConfirmDialogOpen(false);
        setActionType(null);
        setBulkActionNotes("");
        setBulkActionTimeRecordIds([]);
    };

    const executeBulkAction = async () => {
        if (!orgId || !actionType || bulkActionTimeRecordIds.length === 0) return;

        setIsProcessing(true);
        try {
            const response = await postTimeRecordsVerify(orgId, {
                time_record_ids: bulkActionTimeRecordIds,
                verification_status: actionType === "approve" ? "approved" : "rejected",
                verification_notes: bulkActionNotes || (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
            });

            if (response.success) {
                toast.success(t(
                    actionType === "approve" ? "timeRecords.allApproved" : "timeRecords.allRejected",
                    actionType === "approve" ? "All time records approved successfully" : "All time records rejected successfully"
                ));
                handleCloseBulkActionModal();
                setWeekViewRefreshTrigger(prev => prev + 1);
                if (timeRecordsActiveTab === "all") {
                    fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
                } else {
                    fetchTimeRecords(searchQuery);
                }
            } else {
                toast.error(response.error?.message || t("timeRecords.errorProcessing", "Error processing time records"));
            }
        } catch (error) {
            toast.error(t("timeRecords.errorProcessing", "Error processing time records"));
            console.error("Error processing bulk action:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Period navigation (shared by both tabs)
    const handlePrevPeriod = () => {
        if (showMonthView) {
            const prev = new Date(currentMonthStart);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonthStart(prev);
        } else {
            const next = new Date(currentWeekMonday);
            next.setDate(next.getDate() - 7);
            setCurrentWeekMonday(next);
        }
    };
    const handleNextPeriod = () => {
        if (showMonthView) {
            const next = new Date(currentMonthStart);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonthStart(next);
        } else {
            const next = new Date(currentWeekMonday);
            next.setDate(next.getDate() + 7);
            setCurrentWeekMonday(next);
        }
    };
    const handleCurrentPeriod = () => {
        if (showMonthView) {
            setCurrentMonthStart(getFirstDayOfMonth(new Date()));
        } else {
            setCurrentWeekMonday(getMonday(new Date()));
        }
    };
    const isCurrentPeriod = () => {
        if (showMonthView) return isCurrentMonth(currentMonthStart);
        const todayMonday = getMonday(new Date());
        return formatDateForAPI(todayMonday) === formatDateForAPI(currentWeekMonday);
    };
    const isNextPeriodInFuture = () => {
        if (showMonthView) {
            const nextMonth = new Date(currentMonthStart);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth > new Date();
        }
        const todayMonday = getMonday(new Date());
        const nextWeekMonday = new Date(currentWeekMonday);
        nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
        return nextWeekMonday > todayMonday;
    };
    const getPeriodRangeText = () => {
        if (showMonthView) {
            return formatDate(currentMonthStart, { showTime: false, showDay: false, showMonthName: true, showYear: true });
        }
        const sunday = getSunday(currentWeekMonday);
        return `${formatDate(currentWeekMonday.toISOString(), { showTime: false })} - ${formatDate(sunday.toISOString(), { showTime: false })}`;
    };

    // Single header action element for both tabs (same period, optional 24h, tab-specific right-side buttons)
    const timeRecordsHeaderAction = (
        <div className="flex items-center gap-4">
            {!isCurrentPeriod() && (
                <Button variant="outline" size="sm" onClick={handleCurrentPeriod}>
                    {showMonthView
                        ? t("timeRecords.currentMonth", "Current Month")
                        : t("employees.timeRecords.currentWeek", "Current Week")}
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[200px] text-center">
                {getPeriodRangeText()}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={isNextPeriodInFuture()}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
            {timeRecordsActiveTab === "days" && (
                <div className="flex items-center gap-2">
                    <Switch
                        id="use24hour"
                        checked={use24HourView}
                        onCheckedChange={setUse24HourView}
                    />
                    <Label htmlFor="use24hour" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                        24 h
                    </Label>
                </div>
            )}
            <Tabs value={showMonthView ? "month" : "week"} onValueChange={(v) => setShowMonthView(v === "month")}>
                <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName="border-none rounded-md">
                    <TabsTrigger className="py-0" value="week">
                        {t("employees.timeRecords.week", "Week")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="month">
                        {t("employees.timeRecords.month", "Month")}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
                <Button onClick={handleOpenCreateModal}>
                    <Plus className="h-4 w-4" />
                    {t("employees.timeRecords.addTimeRecord", "Add Time Record")}
                </Button>
                <CustomActionsDropdown
                    items={
                        timeRecordsActiveTab === "days"
                            ? [
                                  {
                                      label: t("timeRecords.viewAll", "View all"),
                                      icon: "table-of-contents",
                                      onClick: () => setTimeRecordsActiveTab("all"),
                                  },
                              ]
                            : [
                                  {
                                      label: t("timeRecords.viewSummary", "View summary"),
                                      icon: "layout-panel-top",
                                      onClick: () => setTimeRecordsActiveTab("days"),
                                  },
                              ]
                    }
                    className="h-9 px-3"
                />
            </div>
        </div>
    );

    const renderWeekDayActions = (
        dayData: { day: string; date: Date; timeRecords: any[] },
        expandProps?: { isExpanded: boolean; onToggleExpand: () => void }
    ) => {
        const expandItem = expandProps
            ? {
                  label: expandProps.isExpanded ? t("timeRecords.fold", "Fold") : t("timeRecords.unfold", "Unfold"),
                  icon: expandProps.isExpanded ? "chevron-right" : "chevron-down",
                  onClick: expandProps.onToggleExpand,
              }
            : null;
        return (
            <CustomActionsDropdown
                items={[
                    ...(expandItem ? [expandItem] : []),
                    {
                        label: t("timeRecords.viewAllRecords", "View all"),
                        icon: "eye",
                        onClick: () => {
                            handleOpenTimeRecordsViewModal(dayData);
                        },
                    },
                    {
                        label: t("timeRecords.approveAll", "Approve All"),
                        icon: "check",
                        onClick: () => {
                            handleBulkAction(dayData, "approve");
                        },
                        showOption: employee.id !== "me",
                    },
                    {
                        label: t("timeRecords.rejectAll", "Reject All"),
                        icon: "x",
                        onClick: () => {
                            handleBulkAction(dayData, "reject");
                        },
                        variant: "destructive" as const,
                        showOption: employee.id !== "me",
                    },
                ]}
            />
        );
    };

    const getAbsenceActionItems = (absence: Absence, closePopover?: () => void) => {
        const status = absence.status;
        return [
            {
                label: t("common.view", "View"),
                icon: "eye",
                onClick: () => {
                    handleViewAbsence(absence);
                    closePopover?.();
                },
            },
            ...(status !== "approved" && status !== "pending"
                ? [
                      {
                          label: t("common.approve", "Approve"),
                          icon: "check",
                          onClick: () => {
                              handleOpenAbsenceVerificationModal(absence, "approved");
                              closePopover?.();
                          },
                      },
                  ]
                : []),
            ...(status !== "rejected" && status !== "pending"
                ? [
                      {
                          label: t("common.reject", "Reject"),
                          icon: "x",
                          onClick: () => {
                              handleOpenAbsenceVerificationModal(absence, "rejected");
                              closePopover?.();
                          },
                      },
                  ]
                : []),
            ...(status === "cancelled"
                ? [
                      {
                          label: t("common.edit", "Edit"),
                          icon: "edit",
                          onClick: () => {
                              handleEditAbsence(absence);
                              closePopover?.();
                          },
                      },
                  ]
                : []),
            {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => {
                    handleOpenAbsenceDeleteModal(absence);
                    closePopover?.();
                },
                variant: "destructive" as const,
            },
        ];
    };

    const renderAbsencePopoverActions = (absence: Absence, closePopover: () => void) => (
        <CustomActionsDropdown items={getAbsenceActionItems(absence, closePopover)} />
    );

    const renderAbsenceDetailActions = (absence: Absence, closePopover: () => void) => (
        <CustomActionsDropdown items={getAbsenceActionItems(absence, closePopover)} />
    );

    const renderAbsenceModalActions = (absence: Absence) => {
        const status = absence.status;
        const items = [
            { showOption: status === "approved", label: t("absences.reject", "Reject"), icon: "x", onClick: () => { handleViewAbsenceModalClose(false); handleOpenAbsenceVerificationModal(absence, "rejected"); } },
            { showOption: status === "rejected", label: t("absences.approve", "Approve"), icon: "check", onClick: () => { handleViewAbsenceModalClose(false); handleOpenAbsenceVerificationModal(absence, "approved"); } },
            { showOption: status !== "cancelled", label: t("common.edit", "Edit"), icon: "edit", onClick: () => { handleViewAbsenceModalClose(false); handleEditAbsence(absence); } },
            { label: t("common.delete", "Delete"), icon: "trash-2", onClick: () => handleOpenAbsenceDeleteModal(absence), variant: "destructive" as const },
        ];
        return <CustomActionsDropdown items={items} />;
    };

    const getSickLeaveActionItems = (sickLeave: SickLeave, closePopover?: () => void) => [
        {
            label: t("common.view", "View"),
            icon: "eye",
            onClick: () => {
                handleViewSickLeave(sickLeave);
                closePopover?.();
            },
        },
        {
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => {
                handleEditSickLeave(sickLeave);
                closePopover?.();
            },
        },
        {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => {
                handleOpenSickLeaveDeleteModal(sickLeave);
                closePopover?.();
            },
            variant: "destructive" as const,
        },
    ];

    const renderSickLeavePopoverActions = (sickLeave: SickLeave, closePopover: () => void) => (
        <CustomActionsDropdown items={getSickLeaveActionItems(sickLeave, closePopover)} />
    );

    const renderSickLeaveDetailActions = (sickLeave: SickLeave, closePopover: () => void) => (
        <CustomActionsDropdown items={getSickLeaveActionItems(sickLeave, closePopover)} />
    );

    const renderSickLeaveModalActions = (sickLeave: SickLeave) => (
        <CustomActionsDropdown
            items={[
                { label: t("common.edit", "Edit"), icon: "edit", onClick: () => handleEditSickLeave(sickLeave) },
                { label: t("common.delete", "Delete"), icon: "trash-2", onClick: () => handleOpenSickLeaveDeleteModal(sickLeave), variant: "destructive" as const },
            ]}
        />
    );

    return (
        <div className="space-y-6">

            {timeRecordsActiveTab === "days" ? (
                <>
                    <TimeRecordsDaysView
                        employeeId={employee.id}
                        timePolicy={timePolicy}
                        holidays={holidays}
                        sickLeaves={sickLeaves}
                        absences={absences}
                        onViewTimeRecord={handleOpenViewModal}
                        onViewAbsence={handleViewAbsence}
                        onViewSickLeave={handleViewSickLeave}
                        renderAbsencePopoverActions={renderAbsencePopoverActions}
                        renderAbsenceDetailActions={renderAbsenceDetailActions}
                        renderSickLeavePopoverActions={renderSickLeavePopoverActions}
                        renderSickLeaveDetailActions={renderSickLeaveDetailActions}
                        renderActions={renderWeekDayActions}
                        renderPopoverActions={renderWeekViewActions}
                        renderDetailActions={renderWeekViewDetailActions}
                        refreshTrigger={weekViewRefreshTrigger}
                        headerAction={timeRecordsHeaderAction}
                        currentWeekMonday={currentWeekMonday}
                        currentMonthStart={currentMonthStart}
                        showMonthView={showMonthView}
                        use24HourView={use24HourView}
                    />
                </>
            ) : (
                <>
                    <PageHeader
                        title={
                            <span className="text-[16px] font-semibold">
                                {t("employees.timeRecords.title", "Time Records Summary")}
                            </span>
                        }
                        showBackButton={false}
                        action={timeRecordsHeaderAction}
                    />
                    <div className="space-y-6">
                        <SearchBar
                            value={searchQuery}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={() => fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay)}
                            placeholder={t("employees.timeRecords.searchPlaceholder", "Search time records...")}
                        />

                        {/* Filters */}
                        {tableFilters && (
                            <TableFiltersRow
                                value={tableFilters}
                                onChange={(filters) => setTableFilters(filters)}
                                onFilter={() => fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay)}
                            />
                        )}

                        <TimeRecordsTable
                            timeRecords={timeRecords}
                            isLoading={isLoading}
                            hiddenColumns={["employee", "start_time", "end_time"]}
                            renderActions={renderTableActions}
                            onRowClick={handleOpenViewModal}
                        />

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
                    </div>
                </>
            )}

            {/* Create Time Record Modal */}
            <TimeRecordEditModal
                open={isCreateModalOpen}
                onOpenChange={handleCreateModalClose}
                onTimeRecordCreatedOrUpdated={handleTimeRecordCreatedOrUpdated}
                timeRecord={null}
                mode="create"
                onCreateTimeRecord={handleCreateTimeRecord}
                showEmployeeInfo={false}
            />

            {/* View Time Record Modal */}
            <TimeRecordViewModal
                open={isViewModalOpen}
                onOpenChange={handleViewModalClose}
                timeRecord={viewingTimeRecord}
                renderActions={renderModalActions}
                showEmployeeInfo={false}
                renderFooterActions={
                    viewingTimeRecord?.verification_status === "pending" || viewingTimeRecord?.verification_status === null
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

            {/* Edit Time Record Modal (Admin) */}
            {editingTimeRecord && (
                <TimeRecordEditAdminModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTimeRecordUpdated={handleTimeRecordCreatedOrUpdated}
                    timeRecord={editingTimeRecord}
                    onUpdateTimeRecord={handleUpdateTimeRecord}
                />
            )}

            {/* Delete Confirmation Modal */}
            <TimeRecordDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                timeRecord={deletingTimeRecord}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
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

            {/* Time Records View Modal */}
            <TimeRecordsViewModal
                open={isTimeRecordsViewModalOpen}
                onOpenChange={(open) => {
                    if (!open) handleCloseTimeRecordsViewModal();
                }}
                timeRecords={viewingTimeRecords}
                date={viewingDate}
                employee={employee}
                renderActions={renderWeekViewActions}
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

            {/* Absence View Modal */}
            {orgId && employee && (
                <AbsenceViewModal
                    open={isViewAbsenceModalOpen}
                    onOpenChange={handleViewAbsenceModalClose}
                    orgId={orgId}
                    employeeId={viewingAbsence?.employee?.id ?? employee.id}
                    absenceId={viewingAbsence?.id ?? null}
                    renderActions={viewingAbsence ? renderAbsenceModalActions : undefined}
                    renderFooterActions={
                        viewingAbsence?.status === "pending"
                            ? () => (
                                  <div className="flex gap-2">
                                      <Button
                                          variant="outline"
                                          onClick={() => {
                                              handleViewAbsenceModalClose(false);
                                              handleOpenAbsenceVerificationModal(viewingAbsence!, "rejected");
                                          }}
                                          disabled={isAbsenceVerificationSubmitting}
                                      >
                                          <X className="h-4 w-4" />
                                          {t("absences.reject", "Reject")}
                                      </Button>
                                      <Button
                                          onClick={() => {
                                              handleViewAbsenceModalClose(false);
                                              handleOpenAbsenceVerificationModal(viewingAbsence!, "approved");
                                          }}
                                          disabled={isAbsenceVerificationSubmitting}
                                      >
                                          <Check className="h-4 w-4" />
                                          {t("common.accept", "Accept")}
                                      </Button>
                                  </div>
                              )
                            : undefined
                    }
                />
            )}

            {/* Absence Delete Modal */}
            <AbsenceDeleteModal
                isOpen={isAbsenceDeleteModalOpen}
                onClose={handleCloseAbsenceDeleteModal}
                absence={deletingAbsence}
                onConfirm={handleConfirmAbsenceDelete}
                isDeleting={isAbsenceDeleting}
            />

            {/* Sick Leave View Modal */}
            <SickLeaveViewModal
                open={isViewSickLeaveModalOpen}
                onOpenChange={handleViewSickLeaveModalClose}
                sickLeave={viewingSickLeave}
                employeeId={employee?.id}
                renderActions={viewingSickLeave ? renderSickLeaveModalActions : undefined}
            />

            {/* Sick Leave Delete Modal */}
            <SickLeaveDeleteModal
                isOpen={isSickLeaveDeleteModalOpen}
                onClose={handleCloseSickLeaveDeleteModal}
                sickLeave={deletingSickLeave}
                onConfirm={handleConfirmSickLeaveDelete}
                isDeleting={isSickLeaveDeleting}
            />

            {/* Absence Verification Modal */}
            <AbsenceVerificationModal
                isOpen={isAbsenceVerificationModalOpen}
                onClose={handleCloseAbsenceVerificationModal}
                absence={absenceVerificationAbsence}
                verificationStatus={absenceVerificationStatus}
                verificationReason={absenceVerificationReason}
                onReasonChange={setAbsenceVerificationReason}
                onSubmit={handleSubmitAbsenceVerification}
                isSubmitting={isAbsenceVerificationSubmitting}
            />

            {/* Sick Leave Edit Modal */}
            {orgId && employee && editingSickLeave && (
                <SickLeaveEditModal
                    open={isSickLeaveEditModalOpen}
                    onOpenChange={handleSickLeaveEditModalClose}
                    onSickLeaveCreatedOrUpdated={handleSickLeaveUpdated}
                    orgId={orgId}
                    employeeId={employee.id}
                    sickLeave={editingSickLeave}
                    mode="edit"
                    onUpdateSickLeave={async (sickLeaveId, data) => {
                        if (!orgId) return { error: "Missing orgId" };
                        return patchSickLeave(orgId, sickLeaveId, data);
                    }}
                    renderActions={(sickLeave, closeModal) => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        closeModal();
                                        handleOpenSickLeaveDeleteModal(sickLeave);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}

            {/* Absence Edit Modal */}
            {orgId && editingAbsence && (
                <AbsenceEditAdminModal
                    open={isAbsenceEditModalOpen}
                    onOpenChange={handleAbsenceEditModalClose}
                    onAbsenceUpdated={handleAbsenceUpdated}
                    orgId={orgId}
                    employeeId={editingAbsence.employee.id}
                    absence={editingAbsence}
                    onUpdateAbsence={async (absenceId, data) => {
                        if (!orgId) return { error: "Missing orgId" };
                        return patchAbsence(orgId, absenceId, data);
                    }}
                    renderActions={(absence, closeModal) => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        closeModal();
                                        handleOpenAbsenceDeleteModal(absence);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}
        </div>
    );
};

export default EmployeeDetailPageTimeActivity;
