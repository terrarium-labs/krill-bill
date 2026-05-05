import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { getTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { useParams } from "react-router";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { TimePolicy } from "@/types/general/time-policies";

type TimePolicyContextType = {
    setTimePolicy: (timePolicy: TimePolicy | null) => void;
    timePolicy: TimePolicy | null;
    refetchTimePolicy: () => Promise<void>;
}

const TimePolicyContext = createContext<TimePolicyContextType>({
    setTimePolicy: () => { },
    timePolicy: null,
    refetchTimePolicy: async () => { },
});

interface TimePolicyProviderProps {
    children: ReactNode;
}

export const TimePolicyProvider: React.FC<TimePolicyProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [timePolicy, setTimePolicy] = useState<TimePolicy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { orgId, policyId } = useParams();

    const fetchTimePolicy = async (policyId: string) => {
        if (!orgId) {
            toast.error(t("timePolicies.noOrganizationSelected", "No organization selected"));
            return;
        }

        setIsLoading(true);

        try {
            const response = await getTimePolicy(orgId, policyId);
            if (response.success) {
                setTimePolicy(response.success.time_policy);
            } else {
                toast.error(t("timePolicies.fetchError", "Failed to fetch time policy"));
            }
        } catch (err) {
            toast.error(t("timePolicies.fetchError", "Failed to fetch time policy"));
            console.error(t("timePolicies.fetchError", "Error fetching time policy:"), err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (policyId) {
            fetchTimePolicy(policyId);
        }
    }, [policyId]);

    const refetchTimePolicy = async () => {
        if (policyId) {
            await fetchTimePolicy(policyId);
        }
    };

    const contextValue: TimePolicyContextType = {
        timePolicy,
        setTimePolicy,
        refetchTimePolicy,
    };

    if (isLoading) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                variant="split"
                tabCount={3}
            />
        );
    }

    return (
        <TimePolicyContext.Provider value={contextValue}>
            {children}
        </TimePolicyContext.Provider>
    );
};

export const useTimePolicy = (): TimePolicyContextType => {
    const context = useContext(TimePolicyContext);
    if (!context) {
        throw new Error("useTimePolicy must be used within a TimePolicyProvider");
    }
    return context;
};

export default TimePolicyContext;

