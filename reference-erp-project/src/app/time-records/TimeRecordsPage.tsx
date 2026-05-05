import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { postTimeRecordsSummaryVerify } from "@/api/orgs/time-records/time-records";
import { TimeRecordSummary } from "@/types/general/time-records";
import type { Employee } from "@/types/employees/employees";
import { formatDateForAPI, isFutureDay, parseLocalDateString } from "@/utils/miscelanea";
import { ChevronLeft, ChevronRight, User, Calendar, Check, X, Loader2, Expand, Minimize } from "lucide-react";
import { formatDate } from "@/utils/miscelanea";
import TimeRecordsSummaryCard from "@/app/time-records/components/time-records-summary-card";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import TimeRecordsSummaryTable from "@/app/time-records/components/time-records-summary-table";
import TimeRecordsSummaryCalendar from "@/app/time-records/components/time-records-summary-calendar";
import TimeRecordSummaryVerificationModal from "@/app/time-records/components/modals/time-record-summary-verification-modal";
import TimeRecordsSummaryViewModal from "@/app/time-records/components/modals/time-records-summary-view-modal";
import TimeRecordsSummaryDetailPanel from "@/app/time-records/components/time-records-summary-detail-panel";
import { getSummaryRowKey } from "@/app/time-records/utils/summary-row-key";
import TimeRecordBulkActionModal from "./components/modals/time-record-bulk-action-modal";
import { useTimeRecordsSummaryContext } from "@/app/time-records/contexts/TimeRecordsSummaryContext";
import { getFirstDayOfMonth, getLastDayOfMonth, isCurrentMonth } from "@/utils/miscelanea";
import { isSummaryPendingVerification, summaryRowCanExpand } from "@/app/time-records/utils/summary-status";
import TableFiltersRow from "../components/table-filters/table-filters";
import { useTimeRecordsTablePreferences } from "@/hooks/use-time-records-table-preferences";
import { TimeRecordsColumnSelector } from "./components/time-records-column-selector";

/**
 * Prefer context `selectedDate` after calendar/day drill-down; else parse API `day`.
 * Rejects Unix-epoch sentinels (`"0"`, numeric epoch) unless the string clearly denotes 1970-01-01.
 */
function getVerificationDayDate(selectedDate: Date | null, summaryDay: string): Date | null {
    if (selectedDate) {
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    }
    const s = String(summaryDay ?? "").trim();
    if (!s) return null;

    const ymd = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (ymd) {
        return parseLocalDateString(ymd[1]);
    }

    if (/^\d{10,13}$/.test(s)) {
        const n = Number(s);
        const ms = s.length <= 10 ? n * 1000 : n;
        const d = new Date(ms);
        if (!Number.isNaN(d.getTime())) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
    }

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (
        out.getFullYear() === 1970 &&
        out.getMonth() === 0 &&
        out.getDate() === 1 &&
        !s.includes("1970")
    ) {
        return null;
    }
    return out;
}

function getSummaryEmployeeId(summary: TimeRecordSummary, selectedEmployee: Employee | null): string | undefined {
    return (
        selectedEmployee?.id ??
        summary.employee?.id ??
        (typeof summary.employee_id === "string" && summary.employee_id ? summary.employee_id : undefined)
    );
}

/**
 * Date range for summary verify POST:
 * - `selectedDate` → single day
 * - `selectedEmployee` without `selectedDate` → full visible month (nav `month`)
 * - otherwise → single day from `summary.day` when parseable
 * - else if row has an employee (Employees tab month aggregate — often no valid `day`) → full visible month
 */
function getVerificationRange(
    selectedDate: Date | null,
    selectedEmployee: Employee | null,
    month: Date,
    summary: TimeRecordSummary,
): { from: Date; to: Date } | null {
    if (selectedDate) {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return { from: d, to: d };
    }
    if (selectedEmployee) {
        return {
            from: getFirstDayOfMonth(month),
            to: getLastDayOfMonth(month),
        };
    }
    const day = getVerificationDayDate(null, summary.day);
    if (day) {
        return { from: day, to: day };
    }
    if (getSummaryEmployeeId(summary, null)) {
        return {
            from: getFirstDayOfMonth(month),
            to: getLastDayOfMonth(month),
        };
    }
    return null;
}

const TimeRecordsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [showSummaryView, setShowSummaryView] = useState(false);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useTimeRecordsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const {
        month,
        setMonth,
        selectedDate,
        setSelectedDate,
        selectedEmployee,
        setSelectedEmployee,
        searchQuery,
        setSearchQuery,
        timeRecordsSummaryDays,
        timeRecordsSummaryEmployees,
        nextPageToken,
        loadingMore,
        loadMoreTimeRecordsSummaryEmployees,
        isLoadingDays,
        isLoadingEmployees,
        isLoading,
        refreshTimeRecordsSummary,
        tableFilters,
        setTableFilters
    } = useTimeRecordsSummaryContext();

    // Verification modal state
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<TimeRecordSummary | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<"approved" | "rejected">("approved");
    const [verificationNotes, setVerificationNotes] = useState("");
    /** Resolved at modal open so POST matches the parent row (API may omit nested `employee` or send bad `day`). */
    const [verificationSnapshot, setVerificationSnapshot] = useState<{
        employeeId: string;
        from: Date;
        to: Date;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View modal state (when not using inline row expansion)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingSummary, setViewingSummary] = useState<TimeRecordSummary | null>(null);
    const [expandedSummaryKeys, setExpandedSummaryKeys] = useState<Set<string>>(() => new Set());

    /** Last drill-down stage: days+employee or employees+day — expand row instead of opening view modal. */
    const expandableDetail =
        (selectedEmployee != null && showSummaryView) ||
        (selectedDate != null && !showSummaryView);

    useEffect(() => {
        setExpandedSummaryKeys(new Set());
    }, [selectedEmployee, selectedDate, showSummaryView]);

    const toggleExpandedSummaryRow = useCallback((rowKey: string) => {
        setExpandedSummaryKeys((prev) => {
            const next = new Set(prev);
            if (next.has(rowKey)) next.delete(rowKey);
            else next.add(rowKey);
            return next;
        });
    }, []);

    /** Summaries for the visible tab when filters enable inline row expansion (matches which table is shown). */
    const summariesForExpandControls = useMemo(() => {
        if (!(selectedDate || selectedEmployee) || !expandableDetail) return [];
        return showSummaryView ? timeRecordsSummaryDays : timeRecordsSummaryEmployees;
    }, [
        selectedDate,
        selectedEmployee,
        expandableDetail,
        showSummaryView,
        timeRecordsSummaryDays,
        timeRecordsSummaryEmployees,
    ]);

    const unfoldableRowKeys = useMemo(
        () =>
            summariesForExpandControls
                .filter((s) => summaryRowCanExpand(s))
                .map((s) => getSummaryRowKey(s)),
        [summariesForExpandControls],
    );

    const showExpandCollapseHeader =
        (selectedDate != null || selectedEmployee != null) && expandableDetail && unfoldableRowKeys.length > 0;

    const allUnfoldableRowsExpanded =
        unfoldableRowKeys.length > 0 && unfoldableRowKeys.every((k) => expandedSummaryKeys.has(k));


    // Bulk action state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkActionNotes, setBulkActionNotes] = useState("");

    // Helper to get employee full name
    const getEmployeeFullName = (employee: any) => {
        return `${employee.first_name} ${employee.last_name}`;
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
        if (!orgId || !actionType) return;

        setIsProcessing(true);
        try {
            const response = await postTimeRecordsSummaryVerify(
                orgId,
                {
                    from_date: selectedDate ? formatDateForAPI(selectedDate, "start") : formatDateForAPI(getFirstDayOfMonth(month), "start"),
                    to_date: selectedDate ? formatDateForAPI(selectedDate, "end") : formatDateForAPI(getLastDayOfMonth(month), "end"),
                    status: actionType === "approve" ? "approved" : "rejected",
                    notes: bulkActionNotes || (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
                    employee_ids: selectedEmployee ? [selectedEmployee.id] : [],
                }
            );

            if (response.success) {
                toast.success(t(
                    actionType === "approve" ? "timeRecords.allApproved" : "timeRecords.allRejected",
                    actionType === "approve" ? "All time records approved successfully" : "All time records rejected successfully"
                ));
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

    const handleToggleView = () => {
        setShowSummaryView(!showSummaryView);
    };

    // Navigate to previous month
    const handlePrevMonth = () => {
        const newMonth = new Date(month);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setMonth(newMonth);
    };

    // Navigate to next month
    const handleNextMonth = () => {
        const newMonth = new Date(month);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setMonth(newMonth);
    };

    // Navigate to current month
    const handleCurrentMonth = () => {
        setMonth(new Date());
    };

    // Handle row click in days view (table)
    const handleDayRowClick = (summary: TimeRecordSummary) => {
        if (selectedEmployee) {
            handleOpenViewModal(summary);
        } else {
            const parsed = getVerificationDayDate(null, summary.day);
            if (parsed) {
                setSelectedDate(parsed);
                setShowSummaryView(false);
            } else {
                toast.error(t("timeRecords.errorProcessing", "Error processing time records"));
            }
        }
    };

    /** Calendar picks the day; main table for that day is the employees-by-day view. */
    const handleCalendarDaySelect = (date: Date) => {
        setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        setShowSummaryView(false);
    };

    // Handle row click in employees view
    const handleEmployeeRowClick = (summary: TimeRecordSummary) => {
        if (selectedDate) {
            handleOpenViewModal(summary);
        } else {
            handleToggleView();
            if (summary.employee) {
                setSelectedEmployee(summary.employee);
            }
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedDate(null);
        setSelectedEmployee(null);
        setShowSummaryView(true);
        setExpandedSummaryKeys(new Set());
    };

    // Handle back button - clear filters and search params
    const handleBackButton = () => {
        handleClearFilters();
    };

    // View modal handlers
    const handleOpenViewModal = (summary?: TimeRecordSummary) => {
        setViewingSummary(summary || null);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingSummary(null);
    };

    // Verification modal handlers
    const handleOpenVerificationModal = (summary: TimeRecordSummary, status: "approved" | "rejected") => {
        const range = getVerificationRange(selectedDate, selectedEmployee, month, summary);
        const employeeId = getSummaryEmployeeId(summary, selectedEmployee);
        if (!range || !employeeId) {
            toast.error(t("employees.timeRecords.verificationError", "Error verifying time records"));
            return;
        }
        setSelectedSummary(summary);
        setVerificationSnapshot({ employeeId, from: range.from, to: range.to });
        setVerificationStatus(status);
        setVerificationNotes("");
        setIsVerificationModalOpen(true);
    };

    const handleCloseVerificationModal = () => {
        setIsVerificationModalOpen(false);
        setSelectedSummary(null);
        setVerificationSnapshot(null);
        setVerificationNotes("");
        setIsSubmitting(false);
    };

    const handleSubmitVerification = async () => {
        if (!selectedSummary || !orgId || !verificationSnapshot) return;

        setIsSubmitting(true);
        try {
            const { employeeId, from, to } = verificationSnapshot;

            const fromDate = formatDateForAPI(from, "start");
            const toDate = formatDateForAPI(to, "end");

            const response = await postTimeRecordsSummaryVerify(orgId, {
                from_date: fromDate,
                to_date: toDate,
                status: verificationStatus,
                notes: verificationNotes || undefined,
                employee_ids: [employeeId],
            });

            if (response.success) {
                toast.success(t("employees.timeRecords.verificationSuccess", "Time records verified successfully"));
                refreshTimeRecordsSummary();
                handleCloseVerificationModal();
            } else {
                const err = response.error;
                const errMsg =
                    typeof err === "string"
                        ? err
                        : err && typeof err === "object" && "message" in err
                          ? String((err as { message: string }).message)
                          : t("employees.timeRecords.verificationError", "Error verifying time records");
                toast.error(errMsg);
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.verificationError", "Error verifying time records"));
            console.error("Error verifying time records:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const detailDateRange = useMemo(
        () =>
            selectedDate
                ? { from: selectedDate, to: selectedDate }
                : { from: getFirstDayOfMonth(month), to: getLastDayOfMonth(month) },
        [selectedDate, month],
    );

    const renderSummaryExpandedContent = (summary: TimeRecordSummary) => (
        <TimeRecordsSummaryDetailPanel
            active={expandedSummaryKeys.has(getSummaryRowKey(summary))}
            summary={summary}
            selectedEmployee={selectedEmployee}
            dateRange={detailDateRange}
            embedded
        />
    );

    const renderActions = (summary: TimeRecordSummary, allSummaries: TimeRecordSummary[]) => {
        const hasPending = allSummaries.some((s) => isSummaryPendingVerification(s));
        const isFuture = isFutureDay(summary.day);

        // Don't render actions for future days
        if (isFuture) {
            return null;
        }

        const openViewOrExpand = () => {
            if (expandableDetail && summaryRowCanExpand(summary)) {
                toggleExpandedSummaryRow(getSummaryRowKey(summary));
            } else {
                handleOpenViewModal(summary);
            }
        };

        return (
            <div className={`flex items-center gap-2 ${hasPending ? "justify-end" : "justify-center"}`}>
                {/* Show approve/reject buttons for pending status */}
                {isSummaryPendingVerification(summary) && (
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVerificationModal(summary, "rejected");
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
                                handleOpenVerificationModal(summary, "approved");
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {/* Three dots menu */}
                <CustomActionsDropdown
                    items={[
                        // View option - always available
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: openViewOrExpand,
                        },
                    ]}
                />
            </div>
        );
    };

    // Determine if we should show back button and what title to display
    const hasActiveFilters = !!(selectedDate || selectedEmployee);
    const pageTitle = useMemo(() => {
        if (selectedEmployee) {
            return `${getEmployeeFullName(selectedEmployee)} ${t("timeRecords.title", "Time Records")}`;
        }
        if (selectedDate) {
            return `${formatDate(selectedDate, { showTime: false, showDayName: true, showMonthName: true, showYear: false })} ${t("timeRecords.title", "Time Records")}`;
        }
        return t("timeRecords.title", "Time Records");
    }, [selectedEmployee, selectedDate, t]);

    return (
        <>
            <PageHeader
                beforeTextChildren={selectedEmployee ? <EmployeeAvatar employee={selectedEmployee} showName={false} size="2xl" /> : undefined}
                title={pageTitle}
                description={t("timeRecords.description", "Manage your organization's time records.")}
                docs={{ slug: "pd_mod_time_records" }}
                showBackButton={hasActiveFilters}
                onBack={handleBackButton}
                action={
                    <div className="flex items-center gap-2">

                        {/* Month Navigation */}
                        {!isCurrentMonth(month) && !selectedDate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCurrentMonth}
                                disabled={isLoading}
                            >
                                {t("timeRecords.currentMonth", "Current Month")}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevMonth}
                            disabled={isLoading || selectedDate !== null}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[200px] text-center">
                            {formatDate(month, { showTime: false, showDay: false, showMonthName: true, showYear: true })}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextMonth}
                            disabled={isLoading || isCurrentMonth(month) || selectedDate !== null}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Day/Employee toggle - shown when no filters are active, otherwise show the selected date or employee */}
                        {!selectedDate && !selectedEmployee
                            ? (<Tabs value={showSummaryView ? 'days' : 'employees'} onValueChange={handleToggleView}>
                                <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName='border-none rounded-md'>
                                    <TabsTrigger className="py-0" value="employees"><User className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger className="py-0" value="days"><Calendar className="h-4 w-4" /></TabsTrigger>
                                </TabsList>
                            </Tabs>)
                            : undefined}
                        {showExpandCollapseHeader && (
                            <>
                                {allUnfoldableRowsExpanded ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setExpandedSummaryKeys(new Set());
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Minimize className="h-4 w-4" />
                                        {t("common.collapse_all", "Collapse all")}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setExpandedSummaryKeys(new Set(unfoldableRowKeys));
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Expand className="h-4 w-4" />
                                        {t("common.expand_all", "Expand all")}
                                    </Button>
                                )}
                            </>
                        )}
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
                        />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("timeRecords.viewAll", "View all"),
                                    icon: "table-of-contents",
                                    onClick: () => navigate(`/${orgId}/time-records/all`),
                                },
                            ]}
                            className="h-9 px-3"
                        />
                    </div>
                }
            />

            <div className="space-y-4">

                {/* Summary Card */}
                <TimeRecordsSummaryCard
                    scheduledMinutes={timeRecordsSummaryDays.reduce((sum, record) => sum + (record.theoretical_time_worked * 60), 0)}
                    workedMinutes={timeRecordsSummaryDays.reduce((sum, record) => sum + (record.total_time_worked * 60), 0)}
                />


                {!selectedEmployee && !showSummaryView && !selectedDate && <div className="flex flex-col gap-4">
                    {tableFilters &&
                        <TableFiltersRow
                            value={tableFilters}
                            onChange={(filters) => setTableFilters(filters)}
                            onFilter={() => refreshTimeRecordsSummary()}
                        />
                    }
                    <div className="flex items-center gap-2">
                        <SearchBar
                            className="w-full"
                            value={searchQuery}
                            isLoading={false}
                            onChange={(query) => {
                                setSearchQuery(query);
                            }}
                            onSearch={() => {
                                refreshTimeRecordsSummary();
                            }}
                            placeholder={t("timeRecords.searchPlaceholder", "Search by employee name...")}
                        />
                        <TimeRecordsColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    </div>
                </div>}

                {/* Summary Table */}
                <Tabs value={showSummaryView ? 'days' : 'employees'} >
                    <TabsContents transition={{ duration: 0 }}>

                        {/* Days: month calendar → day click opens summary table */}
                        <TabsContent value="days" transition={{ duration: 0 }}>
                            {selectedDate || selectedEmployee ? (
                                <TimeRecordsSummaryTable
                                    timeRecordsSummary={timeRecordsSummaryDays}
                                    isLoading={isLoadingDays}
                                    onRowClick={expandableDetail ? undefined : handleDayRowClick}
                                    hiddenColumns={
                                        selectedEmployee && selectedDate
                                            ? []
                                            : selectedEmployee
                                              ? ["employee"]
                                              : selectedDate
                                                ? ["day"]
                                                : ["employee"]
                                    }
                                    renderActions={renderActions}
                                    expandableDetail={expandableDetail}
                                    expandedRowKeys={expandedSummaryKeys}
                                    onToggleExpandedRow={toggleExpandedSummaryRow}
                                    renderExpandedContent={
                                        expandableDetail ? renderSummaryExpandedContent : undefined
                                    }
                                />
                            ) : (
                                <TimeRecordsSummaryCalendar
                                    month={month}
                                    timeRecordsSummary={timeRecordsSummaryDays}
                                    isLoading={isLoadingDays}
                                    onDaySelect={handleCalendarDaySelect}
                                />
                            )}
                        </TabsContent>

                        {/* Employees Table */}
                        <TabsContent value="employees" transition={{ duration: 0 }}>
                            <TimeRecordsSummaryTable
                                timeRecordsSummary={timeRecordsSummaryEmployees}
                                isLoading={isLoadingEmployees}
                                onRowClick={expandableDetail ? undefined : handleEmployeeRowClick}
                                hiddenColumns={selectedEmployee ? ["employee"] : ["day"]}
                                renderActions={renderActions}
                                expandableDetail={expandableDetail}
                                expandedRowKeys={expandedSummaryKeys}
                                onToggleExpandedRow={toggleExpandedSummaryRow}
                                renderExpandedContent={
                                    expandableDetail ? renderSummaryExpandedContent : undefined
                                }
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                columnOrder={columnOrder}
                                onColumnOrderChange={setColumnOrder}
                                columnSizing={columnSizing}
                                onColumnSizingChange={setColumnSizing}
                            />
                            {nextPageToken && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadMoreTimeRecordsSummaryEmployees()}
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

                        </TabsContent>
                    </TabsContents>
                </ Tabs>
            </div>

            {/* Verification Modal */}
            <TimeRecordSummaryVerificationModal
                isOpen={isVerificationModalOpen}
                onClose={handleCloseVerificationModal}
                summary={selectedSummary}
                verificationRange={
                    verificationSnapshot
                        ? { from: verificationSnapshot.from, to: verificationSnapshot.to }
                        : undefined
                }
                verificationStatus={verificationStatus}
                verificationNotes={verificationNotes}
                onNotesChange={setVerificationNotes}
                onSubmit={handleSubmitVerification}
                isSubmitting={isSubmitting}
            />

            {/* View Modal */}
            <TimeRecordsSummaryViewModal
                open={isViewModalOpen}
                onOpenChange={(open) => {
                    if (!open) handleCloseViewModal();
                }}
                summary={viewingSummary}
                selectedEmployee={selectedEmployee}
                dateRange={
                    selectedDate
                        ? { from: selectedDate, to: selectedDate }
                        : { from: getFirstDayOfMonth(month), to: getLastDayOfMonth(month) }
                }
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
        </>
    );
};

export default TimeRecordsPage;

