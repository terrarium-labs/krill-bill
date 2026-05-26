import { useEffect, useRef, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchOrgProviders } from '@/api/providers';
import { Provider } from '@/types/providers';

interface UseProvidersReturn {
  providers: Provider[];
  isLoading: boolean;
  error: string | null;
  refreshProviders: () => Promise<void>;
}

export const useProviders = (): UseProvidersReturn => {
  const { org } = useOrg();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchProviders = async () => {
    if (!org?.id || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching providers for org:', org.id);

      const { data, error: fetchError } = await fetchOrgProviders(org.id);
      if (fetchError) {
        console.error('Error fetching providers:', fetchError);
        setError(fetchError);
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
      setError(message);
      setProviders([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchProviders();
    }
  }, [org?.id]);

  const refreshProviders = async () => {
    if (!org?.id) return;
    const { data, error: fetchError } = await fetchOrgProviders(org.id);
    if (!fetchError && data) {
      setProviders(data);
    }
  };

  return {
    providers,
    isLoading,
    error,
    refreshProviders,
  };
};
