import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getWorkplace } from "@/api/orgs/workplaces/workplaces";
import { Workplace } from "@/types/general/workplaces";

type WorkPlaceContextType = {
    setWorkplace: (workplace: Workplace | null) => void;
    workplace: Workplace | null;
    refetchWorkplace: () => Promise<void>;
}

const WorkPlaceContext = createContext<WorkPlaceContextType>({
    setWorkplace: () => { },
    workplace: null,
    refetchWorkplace: async () => { },
});

interface WorkPlaceProviderProps {
    children: ReactNode;
}

export const WorkPlaceProvider: React.FC<WorkPlaceProviderProps> = ({ children }) => {
    const [workplace, setWorkplace] = useState<Workplace | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { orgId, workplaceId } = useParams();

    const fetchWorkplace = async (workplaceId: string) => {
        if (!orgId) {
            toast.error("No organization selected");
            return;
        }

        try {
            const response = await getWorkplace(orgId, workplaceId);
            if (response.success) {
                setWorkplace(response.success.workplace);
            } else {
                toast.error("Failed to fetch workplace");
            }
        } catch (err) {
            toast.error("Failed to fetch workplace");
            console.error("Error fetching workplace:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (workplaceId) {
            fetchWorkplace(workplaceId);
        }
    }, [workplaceId]);

    const refetchWorkplace = async () => {
        if (workplaceId && orgId) {
            await fetchWorkplace(workplaceId);
        }
    };

    const contextValue: WorkPlaceContextType = {
        workplace,
        setWorkplace,
        refetchWorkplace,
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin" />
        </div>;
    }

    return (
        <WorkPlaceContext.Provider value={contextValue}>
            {children}
        </WorkPlaceContext.Provider>
    );
};

export const useWorkPlace = (): WorkPlaceContextType => {
    const context = useContext(WorkPlaceContext);
    if (!context) {
        throw new Error("useWorkPlace must be used within a WorkPlaceProvider");
    }
    return context;
};

export default WorkPlaceContext;    