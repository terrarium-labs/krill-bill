import { createContext, useContext, useEffect, useState } from "react";
import { getClient } from "@/api/clients/clients";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Client } from "@/types/clients/client";

interface ClientContextType {
  client: Client;
  refreshClient: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { clientId, orgId } = useParams<{ clientId: string, orgId: string }>();

  const fetchClient = async (clientId: string) => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const response = await getClient(orgId || "", clientId);
      if (response.success) {
        setClient(response.success.client);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && clientId) {
      fetchClient(clientId);
    }
  }, [orgId, clientId]);

  if (isLoading || !client) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={4} variant="split" />;
  }

  const refreshClient = () => {
    if (orgId && clientId) {
      fetchClient(clientId);
    }
  };

  return (
    <ClientContext.Provider
      value={{
        client,
        refreshClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientContext");
  }
  return context;
};
