import { createContext, useContext, useEffect, useState } from "react";
import { getEmployee } from "@/api/employees/employees";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Employee } from "@/types/employees/employees";

interface ManagerContextType {
    manager: Employee;
    refreshManager: () => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider = ({ children }: { children: React.ReactNode }) => {
    const [manager, setManager] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { managerId, orgId } = useParams<{ managerId: string, orgId: string }>();

    const fetchManager = async (managerId: string) => {
        if (!orgId) return;

        try {
            setIsLoading(true);
            const response = await getEmployee(orgId, managerId);
            if (response.success) {
                setManager(response.success.employee);
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && managerId) {
            fetchManager(managerId);
        }
    }, [orgId, managerId]);

    if (isLoading || !manager) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={true}
                tabCount={2}
                variant="table"
            />
        );
    }

    const refreshManager = () => {
        if (orgId && managerId) {
            fetchManager(managerId);
        }
    };

    return (
        <ManagerContext.Provider
            value={{
                manager,
                refreshManager,
            }}
        >
            {children}
        </ManagerContext.Provider>
    );
};

export const useManager = () => {
    const context = useContext(ManagerContext);
    if (context === undefined) {
        throw new Error("useManager must be used within a ManagerContext");
    }
    return context;
};

