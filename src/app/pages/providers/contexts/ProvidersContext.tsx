import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchOrgProviders } from '@/api/providers';
import { Provider } from '@/types/providers';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface ProvidersContextType {
  providers: Provider[];
  isLoading: boolean;
  refreshProviders: () => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

export const ProvidersProvider = ({ children }: { children: React.ReactNode }) => {
  const { org } = useOrg();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProviders = async () => {
    if (!org?.id) return;
    try {
      setIsLoading(true);
      console.log('Fetching providers for org:', org.id);

      const { data, error: fetchError } = await fetchOrgProviders(org.id);
      if (fetchError) {
        console.error('Error fetching providers:', fetchError);
        setProviders([]);
        return;
      }

      if (data) {
        setProviders(data);
        console.log('Successfully loaded', data.length, 'providers');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load providers';
      console.error('Error:', message);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchProviders();
    }
  }, [org?.id]);

  const refreshProviders = useCallback(async () => {
    await fetchProviders();
  }, []);

  const contextValue = useMemo(() => ({
    providers,
    isLoading,
    refreshProviders,
  }), [providers, isLoading, refreshProviders]);

  if (isLoading && providers.length === 0) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
  }

  return (
    <ProvidersContext.Provider value={contextValue}>
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => {
  const context = useContext(ProvidersContext);
  if (context === undefined) {
    throw new Error('useProviders must be used within a ProvidersProvider');
  }
  return context;
};
