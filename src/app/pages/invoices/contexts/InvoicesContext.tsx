import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchInvoices } from '@/api/invoices';
import { PageSkeleton } from '@/components/ui/page-skeleton';

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

interface InvoicesContextType {
  invoices: Invoice[];
  isLoading: boolean;
  refreshInvoices: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export const InvoicesProvider = ({ children }: { children: React.ReactNode }) => {
  const { org } = useOrg();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoicesList = async () => {
    if (!org?.id) return;
    try {
      setIsLoading(true);
      console.log('Fetching invoices for org:', org.id);

      const { data, error: fetchError } = await fetchInvoices(org.id);
      if (fetchError) {
        console.error('Error fetching invoices:', fetchError);
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
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchInvoicesList();
    }
  }, [org?.id]);

  const refreshInvoices = useCallback(async () => {
    await fetchInvoicesList();
  }, []);

  const contextValue = useMemo(() => ({
    invoices,
    isLoading,
    refreshInvoices,
  }), [invoices, isLoading, refreshInvoices]);

  if (isLoading && invoices.length === 0) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
  }

  return (
    <InvoicesContext.Provider value={contextValue}>
      {children}
    </InvoicesContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
};
