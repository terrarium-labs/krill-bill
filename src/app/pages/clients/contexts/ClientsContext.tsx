import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchOrgClients } from '@/api/clients';
import { Client } from '@/types/clients';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface ClientsContextType {
  clients: Client[];
  isLoading: boolean;
  refreshClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider = ({ children }: { children: React.ReactNode }) => {
  const { org } = useOrg();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = async () => {
    if (!org?.id) return;
    try {
      setIsLoading(true);
      console.log('Fetching clients for org:', org.id);

      const { data, error: fetchError } = await fetchOrgClients(org.id);
      if (fetchError) {
        console.error('Error fetching clients:', fetchError);
        setClients([]);
        return;
      }

      if (data) {
        setClients(data);
        console.log('Successfully loaded', data.length, 'clients');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      console.error('Error:', message);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchClients();
    }
  }, [org?.id]);

  const refreshClients = useCallback(async () => {
    await fetchClients();
  }, []);

  const contextValue = useMemo(() => ({
    clients,
    isLoading,
    refreshClients,
  }), [clients, isLoading, refreshClients]);

  if (isLoading && clients.length === 0) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
  }

  return (
    <ClientsContext.Provider value={contextValue}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};
