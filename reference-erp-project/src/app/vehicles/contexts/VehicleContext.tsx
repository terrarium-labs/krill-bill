import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Vehicle } from "@/types/general/vehicles";
import { getOrgVehicle } from "@/api/orgs/vehicles/vehicles";

interface VehicleContextType {
    vehicle: Vehicle;
    refreshVehicle: () => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: React.ReactNode }) => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { vehicleId, orgId } = useParams<{ vehicleId: string, orgId: string }>();

    const fetchVehicle = async (vehicleId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgVehicle(orgId, vehicleId);
            if (response.success) {
                setVehicle(response.success.vehicle);
            }
        } catch (error) {
            console.error("Error fetching vehicle:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && vehicleId) {
            fetchVehicle(vehicleId);
        }
    }, [orgId, vehicleId]);

    if (isLoading || !vehicle) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={4} variant="split" />;
    }

    const refreshVehicle = () => {
        if (orgId && vehicleId) {
            fetchVehicle(vehicleId);
        }
    };

    return (
        <VehicleContext.Provider
            value={{
                vehicle,
                refreshVehicle,
            }}
        >
            {children}
        </VehicleContext.Provider>
    );
};

export const useVehicle = () => {
    const context = useContext(VehicleContext);
    if (context === undefined) {
        throw new Error("useVehicle must be used within an VehicleContext");
    }
    return context;
};

