import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Checklist } from "@/types/general/checklists";
import { getChecklist } from "@/api/orgs/checklists/checklists";

interface ChecklistContextType {
    checklist: Checklist | null;
    isLoading: boolean;
    refreshChecklist: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: React.ReactNode }) => {
    const [checklist, setChecklist] = useState<Checklist | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { checklistId, orgId } = useParams<{ checklistId: string, orgId: string }>();

    const fetchChecklist = async (checklistId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getChecklist(orgId, checklistId);
            if (response.success) {
                setChecklist(response.success.checklist);
            }
        } catch (error) {
            console.error("Error fetching checklist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && checklistId) {
            fetchChecklist(checklistId);
        }
    }, [orgId, checklistId]);

    if (isLoading || !checklist) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={0}
                variant="three-panel"
            />
        );
    }

    const refreshChecklist = () => {
        if (orgId && checklistId) {
            fetchChecklist(checklistId);
        }
    };

    return (
        <ChecklistContext.Provider
            value={{
                checklist,
                isLoading,
                refreshChecklist,
            }}
        >
            {children}
        </ChecklistContext.Provider>
    );
};

export const useChecklist = () => {
    const context = useContext(ChecklistContext);
    if (context === undefined) {
        throw new Error("useChecklist must be used within an ChecklistContext");
    }
    return context;
};

