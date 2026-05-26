import { useEffect, useRef, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchOrgClients } from '@/api/clients';
import { Client } from '@/types/clients';

interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  refreshClients: () => Promise<void>;
}

export const useClients = (): UseClientsReturn => {
  const { org } = useOrg();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchClients = async () => {
    if (!org?.id || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching clients for org:', org.id);

      const { data, error: fetchError } = await fetchOrgClients(org.id);
      if (fetchError) {
        console.error('Error fetching clients:', fetchError);
        setError(fetchError);
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
      setError(message);
      setClients([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchClients();
    }
  }, [org?.id]);

  const refreshClients = async () => {
    if (!org?.id) return;
    const { data, error: fetchError } = await fetchOrgClients(org.id);
    if (!fetchError && data) {
      setClients(data);
    }
  };

  return {
    clients,
    isLoading,
    error,
    refreshClients,
  };
};
