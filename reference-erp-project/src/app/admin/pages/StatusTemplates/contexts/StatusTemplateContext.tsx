import { createContext, useContext, useEffect, useState } from "react";
import { getOrgStatusTemplate } from "@/api/orgs/status-templates/status-templates";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { StatusTemplate } from "@/types/general/status-templates";

interface StatusTemplateContextType {
    statusTemplate: StatusTemplate;
    refreshStatusTemplate: () => void;
}

const StatusTemplateContext = createContext<StatusTemplateContextType | undefined>(undefined);

export const StatusTemplateProvider = ({ children }: { children: React.ReactNode }) => {
    const [statusTemplate, setStatusTemplate] = useState<StatusTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { statusTemplateId, orgId } = useParams<{ statusTemplateId: string, orgId: string }>();

    const fetchStatusTemplate = async (statusTemplateId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgStatusTemplate(orgId, statusTemplateId);
            if (response.success) {
                setStatusTemplate(response.success.status_template);
            }
        } catch (error) {
            console.error("Error fetching status template:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && statusTemplateId) {
            fetchStatusTemplate(statusTemplateId);
        }
    }, [orgId, statusTemplateId]);

    if (isLoading || !statusTemplate) {
        return <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin w-8 h-8" />
        </div>;
    }

    const refreshStatusTemplate = () => {
        if (orgId && statusTemplateId) {
            fetchStatusTemplate(statusTemplateId);
        }
    };

    return (
        <StatusTemplateContext.Provider
            value={{
                statusTemplate,
                refreshStatusTemplate,
            }}
        >
            {children}
        </StatusTemplateContext.Provider>
    );
};

export const useStatusTemplate = () => {
    const context = useContext(StatusTemplateContext);
    if (context === undefined) {
        throw new Error("useStatusTemplate must be used within an StatusTemplateContext");
    }
    return context;
};

