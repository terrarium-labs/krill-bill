import { createContext, useContext, useEffect, useState } from "react";
import { getClient } from "@/api/clients/clients";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Client } from "@/types/clients/client";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import { getMyPendingSignatures } from "@/api/orgs/signing-requests/signing-requests";
import { SigningRequest } from "@/types/general/signing-requests";

interface DashboardClientContextType {
  client: Client;
  refreshClient: () => void;
  pendingSignatures: SigningRequest[];
  refreshPendingSignatures: () => void;
}

const DashboardClientContext = createContext<DashboardClientContextType | undefined>(undefined);

export const DashboardClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { orgId } = useParams<{ orgId: string }>();
  const { me } = useOrgMe();
  const [pendingSignatures, setPendingSignatures] = useState<SigningRequest[]>([]);

  const fetchClient = async () => {
    if (!orgId || !me?.client?.id) return;
    try {
      setIsLoading(true);
      const response = await getClient(orgId, me?.client?.id);
      if (response.success) {
        setClient(response.success.client);
      } else {
        setClient(null);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingSignatures = async () => {
    if (!orgId) return;
    try {
      const response = await getMyPendingSignatures(orgId);
      if (response.success) {
        setPendingSignatures(response.success.signing_requests ?? []);
      }
    } catch (error) {
      console.error("Error fetching pending signatures:", error);
    }
  };

  const refreshPendingSignatures = () => {
    fetchPendingSignatures();
  };

  useEffect(() => {
    if (orgId) {
      fetchClient();
      fetchPendingSignatures();
    }
  }, [orgId]);

  if (isLoading || !client) {
    return (
      <PageSkeleton
        showBackButton={false}
        showIcon={true}
        tabCount={4}
        variant="split"
      />
    );
  }

  const refreshClient = () => {
    if (orgId) {
      fetchClient();
    }
  };

  return (
    <DashboardClientContext.Provider value={{ client, refreshClient, pendingSignatures, refreshPendingSignatures }}>
      {children}
    </DashboardClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(DashboardClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a DashboardClientProvider");
  }
  return context;
};
