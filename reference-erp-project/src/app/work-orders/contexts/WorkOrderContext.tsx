import { createContext, useContext, useEffect, useState } from "react";
import { getWorkOrder } from "@/api/field-service/work-orders/work-orders";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { Status, StatusTemplate } from "@/types/general/status-templates";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useStatuses } from "@/app/contexts/StatusesContext";
import { getWorkOrderMeActiveTimeTracking, getWorkOrderTimeTrackings } from "@/api/field-service/work-orders/time-trackings/time-trackings";
import { getWorkOrderAssignees } from "@/api/field-service/work-orders/assignees/assignees";
import { getWorkOrderSupervisors } from "@/api/field-service/work-orders/supervisors/supervisors";
import { WorkOrderTimeTracking } from "@/types/field-service/work-orders/work-orders";
import { Assignee } from "@/types/field-service/work-orders/assignees";
import { TimeTracking } from "@/types/field-service/work-orders/time-trackings";
import { Employee } from "@/types/employees/employees";

interface WorkOrderContextType {
    workOrder: WorkOrder;
    statuses: Status[];
    statusTemplate: StatusTemplate | null;
    refreshWorkOrder: () => void;
    activeTimeTracking: WorkOrderTimeTracking | null;
    refreshActiveTimeTracking: () => void;
    assignees: Assignee[];
    refreshAssignees: (query?: string) => Promise<void>;
    isSearchingAssignees: boolean;
    isLoadingAssignees: boolean;
    loadingMoreAssignees: boolean;
    loadMoreAssignees: () => Promise<void>;
    nextPageTokenAssignees: string | null;
    searchQueryAssignees: string;
    setSearchQueryAssignees: (query: string) => void;
    supervisors: Employee[];
    refreshSupervisors: (query?: string) => Promise<void>;
    isSearchingSupervisors: boolean;
    isLoadingSupervisors: boolean;
    loadingMoreSupervisors: boolean;
    loadMoreSupervisors: () => Promise<void>;
    nextPageTokenSupervisors: string | null;
    searchQuerySupervisors: string;
    setSearchQuerySupervisors: (query: string) => void;
    timeTrackings: TimeTracking[];
    refreshTimeTrackings: (query?: string) => Promise<void>;
    isSearchingTimeTrackings: boolean;
    isLoadingTimeTrackings: boolean;
    loadMoreTimeTrackings: () => Promise<void>;
    loadingMoreTimeTrackings: boolean;
    nextPageTokenTimeTrackings: string | null;
    searchQueryTimeTrackings: string;
    setSearchQueryTimeTrackings: (query: string) => void;
}

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const { statuses, statusTemplate } = useStatuses();
    // Work Order
    const { workOrderId, orgId } = useParams<{ workOrderId: string, orgId: string }>();
    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Assignees
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [isSearchingAssignees, setIsSearchingAssignees] = useState(false);
    const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
    const [loadingMoreAssignees, setLoadingMoreAssignees] = useState(false);
    const [nextPageTokenAssignees, setNextPageTokenAssignees] = useState<string | null>(null);
    const [searchQueryAssignees, setSearchQueryAssignees] = useState<string>("");

    // Supervisors
    const [supervisors, setSupervisors] = useState<Employee[]>([]);
    const [isSearchingSupervisors, setIsSearchingSupervisors] = useState(false);
    const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
    const [loadingMoreSupervisors, setLoadingMoreSupervisors] = useState(false);
    const [nextPageTokenSupervisors, setNextPageTokenSupervisors] = useState<string | null>(null);
    const [searchQuerySupervisors, setSearchQuerySupervisors] = useState<string>("");

    // Time Trackings
    const [activeTimeTracking, setActiveTimeTracking] = useState<WorkOrderTimeTracking | null>(null);
    const [timeTrackings, setTimeTrackings] = useState<TimeTracking[]>([]);
    const [isLoadingTimeTrackings, setIsLoadingTimeTrackings] = useState(false);
    const [isSearchingTimeTrackings, setIsSearchingTimeTrackings] = useState(false);
    const [loadingMoreTimeTrackings, setLoadingMoreTimeTrackings] = useState(false);
    const [nextPageTokenTimeTrackings, setNextPageTokenTimeTrackings] = useState<string | null>(null);
    const [searchQueryTimeTrackings, setSearchQueryTimeTrackings] = useState<string>("");

    const fetchWorkOrder = async (workOrderId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getWorkOrder(orgId, workOrderId);
            if (response.success) {
                setWorkOrder(response.success.work_order);
            }
        } catch (error) {
            console.error("Error fetching work order:", error);
        } finally {
            setIsLoading(false);
        }
    };


    // When fetch returns error 404 means its ok, simply there arent any active time records
    const fetchActiveTimeTracking = async () => {
        if (!orgId || !workOrderId) return;
        try {
            const response = await getWorkOrderMeActiveTimeTracking(orgId, workOrderId);
            if (response.success && response.success.time_tracking) {
                setActiveTimeTracking(response.success.time_tracking);
            } else {
                // No active time tracking found (404 or empty response), clear it
                setActiveTimeTracking(null);
            }
            refreshTimeTrackings();
        } catch (error: any) {
            // 404 or other error means no active time tracking exists
            // Always clear on error since 404 is expected when no active tracking
            setActiveTimeTracking(null);
            // Only log non-404 errors
            if (error?.status !== 404 && error?.response?.status !== 404) {
                console.error("Error fetching active time tracking:", error);
            }
        }
    };


    // Fetch assignees
    const fetchAssignees = async (query: string = "") => {
        if (!orgId || !workOrderId) return;
        if (query) {
            setIsSearchingAssignees(true);
        } else {
            setIsLoadingAssignees(true);
        }
        try {
            const response = await getWorkOrderAssignees(orgId, workOrderId, false, query || undefined, undefined);
            if (response.success) {
                setAssignees(response.success.assignees || []);
                setNextPageTokenAssignees(response.success.next_page_token || null);
            } else {
                toast(response.error || "Error fetching assignees");
            }
        } catch (error) {
            toast.error(error as string);
        } finally {
            setIsSearchingAssignees(false);
            setIsLoadingAssignees(false);
        }
    };

    const loadMoreAssignees = async () => {
        if (!orgId || !workOrderId || !nextPageTokenAssignees || loadingMoreAssignees || isLoadingAssignees) return;

        setLoadingMoreAssignees(true);
        try {
            const response = await getWorkOrderAssignees(orgId, workOrderId, false, searchQueryAssignees || undefined, nextPageTokenAssignees);
            if (response.success) {
                setAssignees(prev => [...prev, ...(response.success.assignees || [])]);
                setNextPageTokenAssignees(response.success.next_page_token || null);
            } else {
                toast.error(response.error || "Error loading more assignees");
            }
        } catch (error) {
            toast.error(error as string);
        } finally {
            setLoadingMoreAssignees(false);
            setIsLoadingAssignees(false);
        }
    };

    // Fetch supervisors
    const fetchSupervisors = async (query: string = "") => {
        if (!orgId || !workOrderId) return;
        if (query) {
            setIsSearchingSupervisors(true);
        } else {
            setIsLoadingSupervisors(true);
        }
        try {
            const response = await getWorkOrderSupervisors(orgId, workOrderId, query || undefined, undefined);
            if (response.success) {
                setSupervisors(response.success.supervisors || []);
                setNextPageTokenSupervisors(response.success.next_page_token || null);
            } else {
                toast.error(response.error || "Error fetching supervisors");
            }
        } catch (error) {
            toast.error(error as string);
        } finally {
            setIsSearchingSupervisors(false);
            setIsLoadingSupervisors(false);
        }
    };

    const loadMoreSupervisors = async () => {
        if (!orgId || !workOrderId || !nextPageTokenSupervisors || loadingMoreSupervisors || isLoadingSupervisors) return;

        setLoadingMoreSupervisors(true);
        try {
            const response = await getWorkOrderSupervisors(orgId, workOrderId, searchQuerySupervisors || undefined, nextPageTokenSupervisors);
            if (response.success) {
                setSupervisors(prev => [...prev, ...(response.success.supervisors || [])]);
                setNextPageTokenSupervisors(response.success.next_page_token || null);
            } else {
                toast.error(response.error || "Error loading more supervisors");
            }
        } catch (error) {
            toast.error(error as string);
        } finally {
            setLoadingMoreSupervisors(false);
            setIsLoadingSupervisors(false);
        }
    };

    const fetchTimeTrackings = async (query: string = "") => {
        if (!orgId || !workOrderId) return;

        if (query) {
            setIsSearchingTimeTrackings(true);
        } else {
            setIsLoadingTimeTrackings(true);
        }

        try {
            const response = await getWorkOrderTimeTrackings(orgId || "", workOrderId || "", query || undefined, undefined);
            if (response.success) {
                setTimeTrackings(response.success.time_trackings);
                setNextPageTokenTimeTrackings(response.success.next_page_token || null);
            } else {
                toast.error(t("workOrders.errorFetchingTimeTrackings", "Error fetching time trackings"));
            }
        } catch (error) {
            toast.error("Error fetching time trackings");
        } finally {
            setIsSearchingTimeTrackings(false);
            setIsLoadingTimeTrackings(false);
        }
    };

    const loadMoreTimeTrackings = async () => {
        if (!orgId || !workOrderId || !nextPageTokenTimeTrackings || loadingMoreTimeTrackings || isLoadingTimeTrackings) return;

        setLoadingMoreTimeTrackings(true);
        try {
            const response = await getWorkOrderTimeTrackings(orgId || "", workOrderId || "", searchQueryTimeTrackings || undefined, nextPageTokenTimeTrackings);
            if (response.success) {
                setTimeTrackings(prev => [...prev, ...response.success.time_trackings]);
                setNextPageTokenTimeTrackings(response.success.next_page_token || null);
            } else {
                toast.error(t("workOrders.errorFetchingTimeTrackings", "Error fetching time trackings"));
            }
        } catch (error) {
            toast.error(t("workOrders.errorFetchingTimeTrackings", "Error fetching time trackings"));
        } finally {
            setLoadingMoreTimeTrackings(false);
            setIsLoadingTimeTrackings(false);
        }
    };

    const refreshWorkOrder = () => {
        if (orgId && workOrderId) {
            fetchWorkOrder(workOrderId);
        }
    };

    const refreshActiveTimeTracking = () => {
        if (orgId && workOrderId) {
            fetchActiveTimeTracking();
        }
    };

    const refreshAssignees = async (query?: string) => {
        await fetchAssignees(query);
    };

    const refreshSupervisors = async (query?: string) => {
        await fetchSupervisors(query);
    };

    const refreshTimeTrackings = async (query?: string) => {
        await fetchTimeTrackings(query || "");
    };

    // Single useEffect to fetch all data on mount and when orgId/workOrderId changes
    useEffect(() => {
        if (orgId && workOrderId) {
            fetchWorkOrder(workOrderId);
            fetchActiveTimeTracking();
            fetchAssignees();
            fetchSupervisors();
            fetchTimeTrackings();
        }
    }, [orgId, workOrderId]);

    // Early return after all hooks are defined
    if (isLoading || !workOrder) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={4}
            />
        );
    }

    return (
        <WorkOrderContext.Provider
            value={{
                workOrder,
                statuses,
                statusTemplate,
                refreshWorkOrder,
                activeTimeTracking,
                refreshActiveTimeTracking,
                assignees,
                refreshAssignees,
                isSearchingAssignees,
                isLoadingAssignees,
                loadingMoreAssignees,
                loadMoreAssignees,
                nextPageTokenAssignees,
                searchQueryAssignees,
                setSearchQueryAssignees,
                supervisors,
                refreshSupervisors,
                isSearchingSupervisors,
                isLoadingSupervisors,
                loadingMoreSupervisors,
                loadMoreSupervisors,
                nextPageTokenSupervisors,
                searchQuerySupervisors,
                setSearchQuerySupervisors,
                timeTrackings,
                refreshTimeTrackings,
                isLoadingTimeTrackings,
                isSearchingTimeTrackings,
                loadingMoreTimeTrackings,
                nextPageTokenTimeTrackings,
                searchQueryTimeTrackings,
                setSearchQueryTimeTrackings,
                loadMoreTimeTrackings,
            }}
        >
            {children}
        </WorkOrderContext.Provider>
    );
};

export const useWorkOrder = () => {
    const context = useContext(WorkOrderContext);
    if (context === undefined) {
        throw new Error("useWorkOrder must be used within an WorkOrderContext");
    }
    return context;
};

