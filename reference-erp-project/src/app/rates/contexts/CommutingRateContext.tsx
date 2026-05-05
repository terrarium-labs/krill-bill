import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { CommutingRate } from "@/types/general/commuting-rates";
import { getOrgCommutingRate } from "@/api/orgs/commuting-rates/commuting-rates";

interface CommutingRateContextType {
    commutingRate: CommutingRate;
    setCommutingRate: (commutingRate: CommutingRate) => void;
    refreshCommutingRate: () => void;
}

const CommutingRateContext = createContext<CommutingRateContextType | undefined>(undefined);

export const CommutingRateProvider = ({ children }: { children: React.ReactNode }) => {
    const [commutingRate, setCommutingRate] = useState<CommutingRate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { commutingRateId, orgId } = useParams<{ commutingRateId: string, orgId: string }>();

    const fetchCommutingRate = async (id: string) => {
        if (!orgId) return;
        try {
            const response = await getOrgCommutingRate(orgId, id);
            if (response.success) {
                setCommutingRate(response.success.commuting_rate ?? response.success);
            }
        } catch (error) {
            console.error("Error fetching commuting rate:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && commutingRateId) {
            fetchCommutingRate(commutingRateId);
        }
    }, []);

    if (isLoading || !commutingRate) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={0}
                variant="split"
            />
        );
    }

    const refreshCommutingRate = () => {
        if (orgId && commutingRateId) {
            fetchCommutingRate(commutingRateId);
        }
    };

    return (
        <CommutingRateContext.Provider
            value={{
                commutingRate,
                setCommutingRate,
                refreshCommutingRate,
            }}
        >
            {children}
        </CommutingRateContext.Provider>
    );
};

export const useCommutingRate = () => {
    const context = useContext(CommutingRateContext);
    if (context === undefined) {
        throw new Error("useCommutingRate must be used within a CommutingRateContext");
    }
    return context;
};
