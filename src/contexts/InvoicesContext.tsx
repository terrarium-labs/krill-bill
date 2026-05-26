import { useEffect, useRef, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchInvoices } from '@/api/invoices';

interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  issuer_id?: string;
  recipient_id?: string;
  client_id?: string;
  provider_id?: string;
  issuer_name?: string;
  recipient_name?: string;
  items?: unknown[];
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  refreshInvoices: () => Promise<void>;
}

export const useInvoices = (): UseInvoicesReturn => {
  const { org } = useOrg();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchInvoicesList = async () => {
    if (!org?.id || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching invoices for org:', org.id);

      const { data, error: fetchError } = await fetchInvoices(org.id);
      if (fetchError) {
        console.error('Error fetching invoices:', fetchError);
        setError(fetchError);
        setInvoices([]);
        return;
      }

      if (data) {
        setInvoices(data);
        console.log('Successfully loaded', data.length, 'invoices');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invoices';
      console.error('Error:', message);
      setError(message);
      setInvoices([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchInvoicesList();
    }
  }, [org?.id]);

  const refreshInvoices = async () => {
    if (!org?.id) return;
    const { data, error: fetchError } = await fetchInvoices(org.id);
    if (!fetchError && data) {
      setInvoices(data);
    }
  };

  return {
    invoices,
    isLoading,
    error,
    refreshInvoices,
  };
};
