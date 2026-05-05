import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import {
    getEmployeeTimeRecords,
    deleteEmployeeTimeRecord,
    patchEmployeeTimeRecord,
    postEmployeeTimeRecord,
} from "@/api/employees/time-records/time-records";
import { toast } from "sonner";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { useParams } from "react-router";
import { TimeRecord } from "@/types/employees/time-records";
import { formatDateForAPI, formatDate, getFirstDayOfMonth, getLastDayOfMonth, isCurrentMonth } from "@/utils/miscelanea";
import TimeRecordsDaysView from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeActivity/components/time-records-days-view";
import SearchBar from "@/app/components/search-bar";
import TimeRecordsTable from "@/app/time-records/components/time-records-table";
import TimeRecordEditModal from "@/app/time-records/components/modals/time-record-edit-modal";
import TimeRecordDeleteModal from "@/app/time-records/components/modals/time-record-delete-modal";
import TimeRecordViewModal from "@/app/time-records/components/modals/time-record-view-modal";
import TimeRecordsViewModal from "@/app/time-records/components/modals/time-records-view-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useTableFilters } from "@/hooks/use-table-filters";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import { Absence } from "@/types/employees/absences";
import { postMeAbsenceCancel } from "@/api/employees/absences/absences";
import SickLeaveViewModal from "@/app/sick-leaves/components/sick-leave-view-modal";
import { SickLeave } from "@/types/employees/sick-leaves";

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

const DashboardEmployeePageTimeActivity = () => {
    const { t } = useTranslation();
    const { employee, timeRecordsRefreshTrigger, selectedYear, setSelectedYear, holidays, sickLeaves, absences, timePolicy } = useEmployee();
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTimeRecord, setEditingTimeRecord] = useState<TimeRecord | null>(null);
    const [editMode, setEditMode] = useState<"create" | "edit">("create");

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingTimeRecord, setViewingTimeRecord] = useState<TimeRecord | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTimeRecord, setDeletingTimeRecord] = useState<TimeRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Absence view modal state
    const [isViewAbsenceModalOpen, setIsViewAbsenceModalOpen] = useState(false);
    const [viewingAbsence, setViewingAbsence] = useState<Absence | null>(null);

    // Sick leave view modal state
    const [isViewSickLeaveModalOpen, setIsViewSickLeaveModalOpen] = useState(false);
    const [viewingSickLeave, setViewingSickLeave] = useState<SickLeave | null>(null);

    // Time records view modal state
    const [isTimeRecordsViewModalOpen, setIsTimeRecordsViewModalOpen] = useState(false);
    const [viewingTimeRecords, setViewingTimeRecords] = useState<TimeRecord[]>([]);
    const [viewingDate, setViewingDate] = useState<Date | undefined>(undefined);

    // Fetch time records. When on "all" tab, pass startDate/endDate for the current period (same as days view).
    const fetchTimeRecords = async (query: string = "", startDate?: string, endDate?: string) => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        const fromDay = startDate ?? null;
        const toDay = endDate ?? null;

        try {
            const response = await getEmployeeTimeRecords(orgId, "me", fromDay, toDay, query, undefined, undefined);
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

    // When on "all" tab, fetch with period range. Refetch when tab, period or search changes.
    useEffect(() => {
        if (timeRecordsActiveTab !== "all" || !orgId) return;
        fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
    }, [timeRecordsActiveTab, periodStartEnd.fromDay, periodStartEnd.toDay, searchQuery]);

    // Refresh when timeRecordsRefreshTrigger changes (e.g., from quick actions start/stop)
    useEffect(() => {
        if (timeRecordsRefreshTrigger > 0) {
            if (timeRecordsActiveTab === "all") {
                fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay);
            } else {
                fetchTimeRecords(searchQuery);
            }
            setWeekViewRefreshTrigger(prev => prev + 1);
        }
    }, [timeRecordsRefreshTrigger]);

    // Load more time records (when on "all" tab, use same period range)
    const loadMoreTimeRecords = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        const fromDay = timeRecordsActiveTab === "all" ? periodStartEnd.fromDay : null;
        const toDay = timeRecordsActiveTab === "all" ? periodStartEnd.toDay : null;
        try {
            const response = await getEmployeeTimeRecords(orgId, "me", fromDay, toDay, searchQuery, nextPageToken, undefined);
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
        setEditMode("create");
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (timeRecord: TimeRecord) => {
        setEditingTimeRecord(timeRecord);
        setEditMode("edit");
        setIsEditModalOpen(true);
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
        if (!orgId) return { error: "Missing orgId" };
        return postEmployeeTimeRecord(orgId, "me", data);
    };

    const handleUpdateTimeRecord = async (
        timeRecordId: string,
        data: { start_time: string; end_time: string; notes: string | null }
    ) => {
        if (!orgId) return { error: "Missing orgId" };
        return patchEmployeeTimeRecord(orgId, "me", timeRecordId, data);
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
        if (!deletingTimeRecord || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteEmployeeTimeRecord(orgId, "me", deletingTimeRecord.id);
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

    // Absence view handlers
    const handleViewAbsence = (absence: Absence | null) => {
        setViewingAbsence(absence);
        setIsViewAbsenceModalOpen(true);
    };

    const handleViewAbsenceModalClose = (open: boolean) => {
        setIsViewAbsenceModalOpen(open);
        if (!open) setViewingAbsence(null);
    };

    // Sick leave view handlers (self-view: View only)
    const handleViewSickLeave = (sickLeave: SickLeave | null) => {
        setViewingSickLeave(sickLeave);
        setIsViewSickLeaveModalOpen(true);
    };

    const handleViewSickLeaveModalClose = (open: boolean) => {
        setIsViewSickLeaveModalOpen(open);
        if (!open) setViewingSickLeave(null);
    };

    const handleCancelAbsence = async (absenceId: string) => {
        if (!orgId) return;
        try {
            const response = await postMeAbsenceCancel(orgId, absenceId);
            if (response.success) {
                toast.success(t("absences.canceled", "Absence canceled successfully"));
                setWeekViewRefreshTrigger(prev => prev + 1);
                handleViewAbsenceModalClose(false);
            } else {
                toast.error(t("absences.errorCanceling", "Error canceling absence"));
            }
        } catch (error) {
            console.error("Error canceling absence:", error);
            toast.error(t("absences.errorCanceling", "Error canceling absence"));
        }
    };

    // Common action items for both table and popover - Employee view (can only edit/delete pending)
    const getTimeRecordActionItems = (timeRecord: TimeRecord, closePopover?: () => void) => {
        const isPending = timeRecord.verification_status === "pending" || timeRecord.verification_status === null;

        // View is always available
        const items = [
            {
                label: t("common.view", "View"),
                icon: "eye",
                onClick: () => {
                    handleOpenViewModal(timeRecord);
                    closePopover?.();
                },
            },
        ];

        // Edit and delete only for pending records
        if (isPending) {
            items.push(
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
                } as any
            );
        }

        return items;
    };

    // Custom render function for table actions - Employee view
    const renderTableActions = (timeRecord: TimeRecord) => {
        const items = getTimeRecordActionItems(timeRecord);

        if (items.length === 0) {
            return null;
        }

        return (
            <div className="flex items-center justify-center">
                <CustomActionsDropdown items={items} />
            </div>
        );
    };

    // Render actions for week view popover - Employee view
    const renderWeekViewActions = (timeRecord: TimeRecord, closePopover: () => void) => {
        const items = getTimeRecordActionItems(timeRecord, closePopover);

        if (items.length === 0) {
            return null;
        }

        return (
            <CustomActionsDropdown
                items={items}
                onActionClick={closePopover}
            />
        );
    };

    // Render function for modal header actions (only Edit/Delete for pending records)
    const renderModalActions = (timeRecord: TimeRecord) => {
        // Only show actions for pending status time records
        if (timeRecord.verification_status === "approved" || timeRecord.verification_status === "rejected") return null;

        const items = [
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
                        id="dashboard-use24hour"
                        checked={use24HourView}
                        onCheckedChange={setUse24HourView}
                    />
                    <Label htmlFor="dashboard-use24hour" className="text-sm font-medium cursor-pointer whitespace-nowrap">
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
                        label: t("timeRecords.viewAll", "View all"),
                        icon: "eye",
                        onClick: () => {
                            handleOpenTimeRecordsViewModal(dayData);
                        },
                    },
                ]}
            />
        );
    };

    const getAbsenceActionItems = (absence: Absence, closePopover?: () => void) => [
        {
            label: t("common.view", "View"),
            icon: "eye",
            onClick: () => {
                handleViewAbsence(absence);
                closePopover?.();
            },
        },
        {
            showOption: absence.status === "pending",
            label: t("common.cancel", "Cancel"),
            icon: "ban",
            variant: "destructive" as const,
            onClick: () => {
                handleCancelAbsence(absence.id);
                closePopover?.();
            },
        },
    ];

    const renderAbsencePopoverActions = (absence: Absence, closePopover: () => void) => (
        <CustomActionsDropdown items={getAbsenceActionItems(absence, closePopover)} />
    );

    const renderAbsenceDetailActions = (absence: Absence, closePopover: () => void) => (
        <CustomActionsDropdown items={getAbsenceActionItems(absence, closePopover)} />
    );

    // Sick leave actions (self-view: View only)
    const getSickLeaveActionItems = (sickLeave: SickLeave, closePopover?: () => void) => [
        {
            label: t("common.view", "View"),
            icon: "eye",
            onClick: () => {
                handleViewSickLeave(sickLeave);
                closePopover?.();
            },
        },
    ];

    const renderSickLeavePopoverActions = (sickLeave: SickLeave, closePopover: () => void) => (
        <CustomActionsDropdown items={getSickLeaveActionItems(sickLeave, closePopover)} />
    );

    const renderSickLeaveDetailActions = (sickLeave: SickLeave, closePopover: () => void) => (
        <CustomActionsDropdown items={getSickLeaveActionItems(sickLeave, closePopover)} />
    );

    return (
        <div className="space-y-4">

            {timeRecordsActiveTab === "days" ? (
                <>
                    <TimeRecordsDaysView
                        employeeId="me"
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
                        renderDetailActions={renderWeekViewActions}
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
                    <div className="space-y-4">
                        <SearchBar
                            value={searchQuery}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={() => fetchTimeRecords(searchQuery, periodStartEnd.fromDay, periodStartEnd.toDay)}
                            placeholder={t("employees.timeRecords.searchPlaceholder", "Search time records...")}
                        />
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
                            hiddenColumns={["employee", "notes", "start_time", "end_time"]}
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

            {/* View Time Record Modal */}
            <TimeRecordViewModal
                open={isViewModalOpen}
                onOpenChange={handleViewModalClose}
                timeRecord={viewingTimeRecord}
                renderActions={renderModalActions}
                showEmployeeInfo={false}
            />

            {/* Create/Edit Time Record Modal */}
            <TimeRecordEditModal
                open={isEditModalOpen}
                onOpenChange={handleEditModalClose}
                onTimeRecordCreatedOrUpdated={handleTimeRecordCreatedOrUpdated}
                timeRecord={editingTimeRecord}
                mode={editMode}
                onCreateTimeRecord={handleCreateTimeRecord}
                onUpdateTimeRecord={handleUpdateTimeRecord}
                showEmployeeInfo={false}
            />

            {/* Delete Confirmation Modal */}
            <TimeRecordDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                timeRecord={deletingTimeRecord}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
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

            {/* Sick Leave View Modal (self-view: View only) */}
            <SickLeaveViewModal
                open={isViewSickLeaveModalOpen}
                onOpenChange={handleViewSickLeaveModalClose}
                sickLeave={viewingSickLeave}
                employeeId="me"
            />

            {/* Absence View Modal */}
            {orgId && (
                <AbsenceViewModal
                    open={isViewAbsenceModalOpen}
                    onOpenChange={handleViewAbsenceModalClose}
                    orgId={orgId}
                    employeeId={viewingAbsence?.employee?.id ?? "me"}
                    absenceId={viewingAbsence?.id ?? null}
                    renderActions={
                        viewingAbsence?.status === "pending"
                            ? (absence) => (
                                  <CustomActionsDropdown
                                      items={[
                                          {
                                              label: t("common.cancel", "Cancel"),
                                              icon: "ban",
                                              variant: "destructive",
                                              onClick: () => handleCancelAbsence(absence.id),
                                          },
                                      ]}
                                  />
                              )
                            : undefined
                    }
                />
            )}
        </div>
    );
};

export default DashboardEmployeePageTimeActivity;
