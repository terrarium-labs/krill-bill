import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { fetchOrganization } from '@/api/organizations';
import { getOrgMember } from '@/api/org-members';
import { Organization, OrgMember } from '@/types/organization';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface OrgContextType {
  org: Organization;
  preferences: OrgMember;
  refreshOrg: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);

interface OrgProviderProps {
  children: React.ReactNode;
  orgId: string;
}

export const OrgProvider = ({ children, orgId }: OrgProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [preferences, setPreferences] = useState<OrgMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgData = async () => {
    if (!user?.id || !orgId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('OrgProvider: Fetching org data for:', orgId);

      // Fetch org details
      const { data: orgData, error: orgError } = await fetchOrganization(orgId);
      if (orgError) {
        console.error('OrgProvider: Error fetching org:', orgError);
        setError(orgError);
        setOrg(null);
        return;
      }

      if (!orgData) {
        console.error('OrgProvider: No org data returned');
        setError('Organization not found');
        setOrg(null);
        return;
      }

      setOrg(orgData);

      // Fetch user's member record (includes preferences)
      const { data: memberData, error: memberError } = await getOrgMember(orgId, user.id);
      if (memberError) {
        console.error('OrgProvider: Error fetching member data:', memberError);
        setError(memberError);
        setPreferences(null);
        return;
      }

      if (memberData) {
        setPreferences(memberData);
      }

      console.log('OrgProvider: Successfully loaded org and preferences');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load organization';
      console.error('OrgProvider: Error:', message);
      setError(message);
      setOrg(null);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch from API when orgId changes
  useEffect(() => {
    if (!authLoading && user?.id && orgId) {
      fetchOrgData();
    }
  }, [orgId, authLoading, user?.id]);

  const refreshOrg = useCallback(async () => {
    if (!orgId) return;
    try {
      const { data, error } = await fetchOrganization(orgId);
      if (!error && data) {
        setOrg(data);
      }
    } catch (err) {
      console.error('OrgProvider: Error refreshing org:', err);
    }
  }, [orgId]);

  const refreshPreferences = useCallback(async () => {
    if (!orgId || !user?.id) return;
    try {
      const { data, error } = await getOrgMember(orgId, user.id);
      if (!error && data) {
        setPreferences(data);
      }
    } catch (err) {
      console.error('OrgProvider: Error refreshing preferences:', err);
    }
  }, [orgId, user?.id]);

  // Memoize context value BEFORE early returns to maintain hook call order
  const value = useMemo(() => ({
    org: org!,
    preferences: preferences!,
    refreshOrg,
    refreshPreferences,
  }), [org, preferences, refreshOrg, refreshPreferences]);

  // Show loading skeleton while data is loading
  if (isLoading || authLoading || !org || !preferences) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Organization</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
