import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { getOrgMe } from "@/api/orgs/me/me";
import { OrgUser } from "@/types/general/user";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

interface OrgMeContextType {
    me: OrgUser | null;
    refreshMe: () => void;
}

const OrgMeContext = createContext<OrgMeContextType | undefined>(undefined);

export const OrgMeProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [me, setMe] = useState<OrgUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMe = async () => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgMe(orgId);
            if (response.success) {
                setMe(response.success.user);
            }
        } catch (error) {
            console.error("Error fetching me:", error);
        } finally {
            setIsLoading(false);
        };
    };

    const refreshMe = () => {
        if (orgId) {
            fetchMe();
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchMe();
        }
    }, [orgId]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin w-8 h-8" />
        </div>;
    }

    if (!me?.employee && !me?.client && !me?.supplier) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-sm text-muted-foreground">{t("orgMe.waitAdminAssignment", "Wait until an admin assigns you to a valid organization role")}</p>
            </div>
        );
    }

    return (
        <OrgMeContext.Provider value={{ me, refreshMe }}>
            {children}
        </OrgMeContext.Provider>
    );
};

export const useOrgMe = () => {
    const context = useContext(OrgMeContext);
    if (context === undefined) {
        throw new Error("useOrgMe must be used within an OrgMeContext");
    }
    return context;
};
