import { createContext, useContext, useEffect, useState } from "react";
import { getClientLocation } from "@/api/clients/locations/locations";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { Location } from "@/types/general/location";

interface LocationContextType {
    location: Location;
    refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [location, setLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { locationId, orgId, clientId } = useParams<{ locationId: string, orgId: string, clientId: string }>();

    const fetchLocation = async (locationId: string) => {
        if (!orgId || !clientId) return;
        try {
            setIsLoading(true);
            const response = await getClientLocation(orgId, clientId, locationId);
            if (response.success) {
                setLocation(response.success.location);
            }
        } catch (error) {
            console.error("Error fetching location:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && clientId && locationId) {
            fetchLocation(locationId);
        }
    }, [orgId, clientId, locationId]);

    if (isLoading || !location) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    const refreshLocation = async () => {
        if (orgId && clientId && locationId) {
            await fetchLocation(locationId);
        }
    };

    return (
        <LocationContext.Provider
            value={{
                location,
                refreshLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
