import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLocation } from '@/api/orgs/locations/locations';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { StockLocation } from '@/types/items/stock';

interface LocationContextType {
    location: StockLocation;
    isLoading: boolean;
    error: string | null;
    refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { orgId, locationId } = useParams<{ orgId: string; locationId: string }>();
    const [location, setLocation] = useState<StockLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocation = async () => {
        if (!orgId || !locationId) {
            setError('Missing organization or location ID');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await getLocation(orgId, locationId);
            if (response.success) {
                setLocation(response.success.location);
            } else {
                setError('Failed to fetch location');
            }
        } catch (err) {
            setError('An error occurred while fetching the location');
            console.error('Error fetching location:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshLocation = async () => {
        await fetchLocation();
    };

    useEffect(() => {
        fetchLocation();
    }, [orgId, locationId]);

    if (!location || isLoading) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
    }

    return (
        <LocationContext.Provider
            value={{
                location: location!,
                isLoading,
                error,
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
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

