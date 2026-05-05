import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { getAbsencePolicy } from "@/api/orgs/absences/absences";
import { useParams } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AbsencePolicy } from "@/types/general/absences";

type AbsencePolicyContextType = {
    setAbsencePolicy: (absencePolicy: AbsencePolicy | null) => void;
    absencePolicy: AbsencePolicy | null;
    refetchAbsencePolicy: () => Promise<void>;
}

const AbsencePolicyContext = createContext<AbsencePolicyContextType>({
    setAbsencePolicy: () => { },
    absencePolicy: null,
    refetchAbsencePolicy: async () => { },
});

interface AbsencePolicyProviderProps {
    children: ReactNode;
}

export const AbsencePolicyProvider: React.FC<AbsencePolicyProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [absencePolicy, setAbsencePolicy] = useState<AbsencePolicy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { orgId, policyId } = useParams();

    const fetchAbsencePolicy = async (policyId: string) => {
        if (!orgId) {
            toast.error(t("absences.policies.noOrganizationSelected", "No organization selected"));
            return;
        }

        setIsLoading(true);

        try {
            const response = await getAbsencePolicy(orgId, policyId);
            if (response.success) {
                setAbsencePolicy(response.success.absence_policy);
            } else {
                toast.error(t("absences.policies.fetchError", "Failed to fetch absence policy"));
            }
        } catch (err) {
            toast.error(t("absences.policies.fetchError", "Failed to fetch absence policy"));
            console.error(t("absences.policies.fetchError", "Error fetching absence policy:"), err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (policyId) {
            fetchAbsencePolicy(policyId);
        }
    }, [policyId]);

    const refetchAbsencePolicy = async () => {
        if (policyId) {
            await fetchAbsencePolicy(policyId);
        }
    };

    const contextValue: AbsencePolicyContextType = {
        absencePolicy,
        setAbsencePolicy,
        refetchAbsencePolicy,
    };

    return (
        <AbsencePolicyContext.Provider value={contextValue}>
            {children}
        </AbsencePolicyContext.Provider>
    );
};

export const useAbsencePolicy = (): AbsencePolicyContextType => {
    const context = useContext(AbsencePolicyContext);
    if (!context) {
        throw new Error("useAbsencePolicy must be used within a AbsencePolicyProvider");
    }
    return context;
};

export default AbsencePolicyContext; 