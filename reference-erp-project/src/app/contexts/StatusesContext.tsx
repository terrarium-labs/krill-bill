import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { Status, StatusTemplate } from "@/types/general/status-templates";
import { sortStatusesByCategoryAndPosition } from "@/utils/sorting";
import { getOrgStatusTemplateStatuses, getOrgStatusTemplate } from "@/api/orgs/status-templates/status-templates";

interface StatusesContextType {
    statuses: Status[];
    statusTemplate: StatusTemplate | null;
    isLoading: boolean;
}

const StatusesContext = createContext<StatusesContextType | undefined>(undefined);

export const StatusesProvider = ({ children }: { children: React.ReactNode }) => {
    // Work Order
    const { orgId } = useParams<{ orgId: string }>();
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [statusTemplate, setStatusTemplate] = useState<StatusTemplate>({} as StatusTemplate);
    const [isStatusTemplateLoading, setIsStatusTemplateLoading] = useState(false);
    const [isStatusesLoading, setIsStatusesLoading] = useState(false);

    // Fetch work-orders statuses
    const fetchStatuses = async () => {
        if (!orgId) return;

        try {
            setIsStatusesLoading(true);
            const response = await getOrgStatusTemplateStatuses(orgId, 'work-orders');
            if (response.success && response.success.statuses) {
                const sortedStatuses = sortStatusesByCategoryAndPosition<Status>(response.success.statuses || []);
                setStatuses(sortedStatuses);
            }
        } catch (error) {
            console.error('Error fetching work order statuses:', error);
        } finally {
            setIsStatusesLoading(false);
        }
    };

    const fetchStatusTemplate = async () => {
        if (!orgId) return;
        try {
            setIsStatusTemplateLoading(true);
            const response = await getOrgStatusTemplate(orgId, 'work-orders');
            if (response.success && response.success.status_template) {
                setStatusTemplate(response.success.status_template);
            }
        } catch (error) {
            console.error('Error fetching work order status template:', error);
        } finally {
            setIsStatusTemplateLoading(false);
        }
    };

    // useEffect to fetch data on mount
    useEffect(() => {
        if (orgId) {
            fetchStatuses();
            fetchStatusTemplate();
        }
    }, [orgId]);

    return (
        <StatusesContext.Provider
            value={{
                statuses,
                statusTemplate,
                isLoading: isStatusesLoading || isStatusTemplateLoading,
            }}
        >
            {children}
        </StatusesContext.Provider>
    );
};

export const useStatuses = () => {
    const context = useContext(StatusesContext);
    if (context === undefined) {
        throw new Error("useStatuses must be used within an StatusesContext");
    }
    return context;
};

