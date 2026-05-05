import { createContext, useContext, useEffect, useState } from "react";
import { getOrgRate } from "@/api/orgs/rates/rates";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Rate } from "@/types/general/rates";

interface RateContextType {
    rate: Rate;
    setRate: (rate: Rate) => void;
    refreshRate: () => void;
}

const RateContext = createContext<RateContextType | undefined>(undefined);

export const RateProvider = ({ children }: { children: React.ReactNode }) => {
    const [rate, setRate] = useState<Rate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { rateId, orgId } = useParams<{ rateId: string, orgId: string }>();

    const fetchRate = async (rateId: string) => {
        if (!orgId) return;
        try {
            const response = await getOrgRate(orgId || "", rateId);
            if (response.success) {
                setRate(response.success.rate);
            }
        } catch (error) {
            console.error("Error fetching rate:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && rateId) {
            fetchRate(rateId);
        }
    }, []);

    if (isLoading || !rate) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={2}
                variant="table"
            />
        );
    }

    const refreshRate = () => {
        if (orgId && rateId) {
            fetchRate(rateId);
        }
    };

    return (
        <RateContext.Provider
            value={{
                rate,
                setRate,
                refreshRate,
            }}
        >
            {children}
        </RateContext.Provider>
    );
};

export const useRate = () => {
    const context = useContext(RateContext);
    if (context === undefined) {
        throw new Error("useRate must be used within a RateContext");
    }
    return context;
};

