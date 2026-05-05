import { createContext, useContext, useEffect, useState } from "react";
import { getOrgHourlyRate } from "@/api/orgs/hourly-rates/hourly-rates";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { HourlyRate } from "@/types/general/hourly-rates";

interface HourlyRateContextType {
    hourlyRate: HourlyRate;
    refreshHourlyRate: () => void;
}

const HourlyRateContext = createContext<HourlyRateContextType | undefined>(undefined);

export const HourlyRateProvider = ({ children }: { children: React.ReactNode }) => {
    const [hourlyRate, setHourlyRate] = useState<HourlyRate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { hourlyRateId, orgId } = useParams<{ hourlyRateId: string, orgId: string }>();

    const fetchHourlyRate = async (hourlyRateId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgHourlyRate(orgId || "", hourlyRateId);
            if (response.success) {
                setHourlyRate(response.success.hourly_rate);
            }
        } catch (error) {
            console.error("Error fetching hourly rate:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && hourlyRateId) {
            fetchHourlyRate(hourlyRateId);
        }
    }, []);

    if (isLoading || !hourlyRate) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={2}
            />
        );
    }

    const refreshHourlyRate = () => {
        if (orgId && hourlyRateId) {
            fetchHourlyRate(hourlyRateId);
        }
    };

    return (
        <HourlyRateContext.Provider
            value={{
                hourlyRate,
                refreshHourlyRate,
            }}
        >
            {children}
        </HourlyRateContext.Provider>
    );
};

export const useHourlyRate = () => {
    const context = useContext(HourlyRateContext);
    if (context === undefined) {
        throw new Error("useHourlyRate must be used within a HourlyRateContext");
    }
    return context;
};

