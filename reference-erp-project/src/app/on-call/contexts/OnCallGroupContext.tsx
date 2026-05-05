import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { OnCallGroup } from "@/types/field-service/on-call/groups";
import { getOrgOnCallGroup } from "@/api/field-service/on-call/groups/groups";

interface OnCallGroupContextType {
  group: OnCallGroup;
  setGroup: (group: OnCallGroup) => void;
  refreshGroup: () => void;
}

const OnCallGroupContext = createContext<OnCallGroupContextType | undefined>(undefined);

export const OnCallGroupProvider = ({ children }: { children: React.ReactNode }) => {
  const [group, setGroup] = useState<OnCallGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { groupId, orgId } = useParams<{ groupId: string; orgId: string }>();

  const fetchGroup = async (id: string) => {
    if (!orgId) return;
    try {
      const response = await getOrgOnCallGroup(orgId, id);
      if (response.success) {
        const data = response.success as { on_call_group?: OnCallGroup;[key: string]: unknown };
        setGroup(data.on_call_group ?? (data as unknown as OnCallGroup));
      }
    } catch (error) {
      console.error("Error fetching on-call group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && groupId) {
      fetchGroup(groupId);
    }
  }, [orgId, groupId]);

  if (isLoading || !group) {
    return (
      <PageSkeleton showBackButton={true} showIcon={false} tabCount={0} variant="split" />
    );
  }

  const refreshGroup = () => {
    if (orgId && groupId) {
      fetchGroup(groupId);
    }
  };

  return (
    <OnCallGroupContext.Provider value={{ group, setGroup, refreshGroup }}>
      {children}
    </OnCallGroupContext.Provider>
  );
};

export const useOnCallGroup = () => {
  const context = useContext(OnCallGroupContext);
  if (context === undefined) {
    throw new Error("useOnCallGroup must be used within an OnCallGroupProvider");
  }
  return context;
};
