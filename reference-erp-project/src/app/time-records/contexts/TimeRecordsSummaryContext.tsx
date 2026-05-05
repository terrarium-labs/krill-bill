import { createContext, useContext, useEffect, useState } from "react";
import { getTimeRecordsSummaryDays, getTimeRecordsSummaryEmployees } from "@/api/orgs/time-records/time-records";
import { useParams } from "react-router";
import { TimeRecordSummary } from "@/types/general/time-records";
import { normalizeTimeRecordSummary } from "@/app/time-records/utils/summary-status";
import { Employee } from "@/types/employees/employees";
import { formatDateForAPI, getFirstDayOfMonth, getLastDayOfMonth } from "@/utils/miscelanea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { TableFilters } from "@/types/general/filters";
import { useTableFilters } from "@/hooks/use-table-filters";

interface TimeRecordsSummaryContextType {
    timeRecordsSummaryDays: TimeRecordSummary[];
    timeRecordsSummaryEmployees: TimeRecordSummary[];
    nextPageToken: string | null;
    loadingMore: boolean;
    isLoadingDays: boolean;
    isLoadingEmployees: boolean;
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    tableFilters: TableFilters | null;
    setTableFilters: (filters: TableFilters | null) => void;
    month: Date;
    setMonth: (month: Date) => void;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    selectedEmployee: Employee | null;
    setSelectedEmployee: (employee: Employee | null) => void;
    loadMoreTimeRecordsSummaryEmployees: () => void;
    refreshTimeRecordsSummaryDays: () => void;
    refreshTimeRecordsSummaryEmployees: () => void;
    refreshTimeRecordsSummary: () => void;
}

const TimeRecordsSummaryContext = createContext<TimeRecordsSummaryContextType | undefined>(undefined);

export const TimeRecordsSummaryProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [month, setMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Time records summary days
    const [timeRecordsSummaryDays, setTimeRecordsSummaryDays] = useState<TimeRecordSummary[]>([]);
    const [isLoadingDays, setIsLoadingDays] = useState(false);

    // Time records summary employees
    const [timeRecordsSummaryEmployees, setTimeRecordsSummaryEmployees] = useState<TimeRecordSummary[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    const isLoading = isLoadingDays === true && isLoadingEmployees === true;

    // Calculate date range based on selected date or month
    const firstDay = selectedDate ? selectedDate : getFirstDayOfMonth(month);
    const lastDay = selectedDate ? selectedDate : getLastDayOfMonth(month);
    const fromDate = formatDateForAPI(firstDay);
    const toDate = formatDateForAPI(lastDay);

    // Fetch time records summary days function
    const fetchTimeRecordsSummaryDays = async () => {
        setIsLoadingDays(true);
        if (!orgId) return;

        try {
            const response = await getTimeRecordsSummaryDays(
                orgId,
                selectedEmployee?.id || undefined,
                fromDate,
                toDate,
                undefined,
            );
            if (response.success && response.success.summary) {
                // Sort summary in ascending order by day (day 01 first)
                const sortedSummary = [...response.success.summary]
                    .sort((a, b) => {
                        const dateA = new Date(a.day);
                        const dateB = new Date(b.day);
                        return dateA.getTime() - dateB.getTime();
                    })
                    .map(normalizeTimeRecordSummary);
                setTimeRecordsSummaryDays(sortedSummary);
            } else {
                toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            }
        } catch (error) {
            toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            console.error("Error fetching time records summary:", error);
        } finally {
            setIsLoadingDays(false);
        }
    };


    // Fetch time records summary employees function
    const fetchTimeRecordsSummaryEmployees = async () => {
        setIsLoadingEmployees(true);
        if (!orgId) return;

        try {
            const response = await getTimeRecordsSummaryEmployees(
                orgId,
                fromDate,
                toDate,
                searchQuery || undefined,
                undefined,
                tableFilters || undefined,
            );
            if (response.success && response.success.summary) {
                setTimeRecordsSummaryEmployees(
                    response.success.summary.map(normalizeTimeRecordSummary),
                );
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            }
        } catch (error) {
            toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            console.error("Error fetching time records summary:", error);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    // Load more time records summary employees
    const loadMoreTimeRecordsSummaryEmployees = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;
        setLoadingMore(true);
        try {
            const response = await getTimeRecordsSummaryEmployees(
                orgId,
                fromDate,
                toDate,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined,
            );
            if (response.success && response.success.summary) {
                setTimeRecordsSummaryEmployees((prev) => [
                    ...prev,
                    ...response.success.summary.map(normalizeTimeRecordSummary),
                ]);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            }
        } catch (error) {
            toast.error(t("timeRecords.errorFetchingTimeRecordsSummary") || "Error fetching time records summary");
            console.error("Error fetching time records summary:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchTimeRecordsSummaryDays();
            fetchTimeRecordsSummaryEmployees();
        }
    }, [orgId, month, selectedDate, selectedEmployee]);

    const refreshTimeRecordsSummary = () => {
        if (orgId) {
            fetchTimeRecordsSummaryDays();
            fetchTimeRecordsSummaryEmployees();
        }
    };
    const refreshTimeRecordsSummaryDays = () => {
        if (orgId) {
            fetchTimeRecordsSummaryDays();
        }
    };
    const refreshTimeRecordsSummaryEmployees = () => {
        if (orgId) {
            fetchTimeRecordsSummaryEmployees();
        }
    };

    return (
        <TimeRecordsSummaryContext.Provider
            value={{
                timeRecordsSummaryDays,
                timeRecordsSummaryEmployees,
                loadMoreTimeRecordsSummaryEmployees,
                nextPageToken,
                loadingMore,
                refreshTimeRecordsSummary,
                refreshTimeRecordsSummaryDays,
                refreshTimeRecordsSummaryEmployees,
                isLoadingDays,
                isLoadingEmployees,
                isLoading,
                month,
                setMonth,
                selectedDate,
                setSelectedDate,
                selectedEmployee,
                setSelectedEmployee,
                searchQuery,
                setSearchQuery,
                tableFilters,
                setTableFilters,
            }}
        >
            {children}
        </TimeRecordsSummaryContext.Provider>
    );
};

export const useTimeRecordsSummaryContext = () => {
    const context = useContext(TimeRecordsSummaryContext);
    if (context === undefined) {
        throw new Error("useTimeRecordsSummary must be used within a TimeRecordsSummaryContext");
    }
    return context;
};

