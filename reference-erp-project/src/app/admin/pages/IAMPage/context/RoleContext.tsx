import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { getOrgRole } from "@/api/orgs/roles/roles";
import { useParams } from "react-router";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { Role } from "@/types/general/roles";

type RoleContextType = {
    setRole: (role: Role | null) => void;
    role: Role | null;
    refetchRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
    setRole: () => { },
    role: null,
    refetchRole: async () => { },
});

interface RoleProviderProps {
    children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { orgId, roleId } = useParams();

    const fetchRole = async (roleId: string) => {
        if (!orgId) {
            toast.error(t("admin.iam.noOrganizationSelected", "No organization selected"));
            return;
        }

        setIsLoading(true);

        try {
            const response = await getOrgRole(orgId, roleId);
            if (response.success) {
                setRole(response.success.role);
            } else {
                toast.error(t("admin.iam.fetchError", "Failed to fetch role"));
            }
        } catch (err) {
            toast.error(t("admin.iam.fetchError", "Failed to fetch role"));
            console.error(t("admin.iam.fetchError", "Error fetching role:"), err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (roleId) {
            fetchRole(roleId);
        }
    }, [roleId]);

    const refetchRole = async () => {
        if (roleId) {
            await fetchRole(roleId);
        }
    };

    const contextValue: RoleContextType = {
        role,
        setRole,
        refetchRole,
    };

    if (isLoading) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={2}
                variant="split"
            />
        );
    }

    return (
        <RoleContext.Provider value={contextValue}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = (): RoleContextType => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
};

export default RoleContext;

