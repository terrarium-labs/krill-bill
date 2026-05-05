import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getClientStakeholders } from "@/api/clients/stakeholders/stakeholders";
import { ClientStakeholder } from "@/types/clients/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StakeholderInfoModal from "./stakeholder-info-modal";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

const ClientStakeholdersCard: React.FC = () => {
  const [stakeholders, setStakeholders] = useState<ClientStakeholder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [viewStakeholder, setViewStakeholder] = useState<ClientStakeholder | null>(null);
  const { client } = useClient();
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string; clientId: string }>();

  const loadStakeholders = async (pageToken: string | null = null, append = false) => {
    if (!orgId || !client.id) return;
    setIsLoading(true);
    try {
      const response = await getClientStakeholders(orgId, client.id, pageToken || undefined);
      if (response.success) {
        const newStakeholders = response.success.stakeholders || [];
        setStakeholders(append ? [...stakeholders, ...newStakeholders] : newStakeholders);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("clients.errorLoadingStakeholders", "Failed to load stakeholders"));
      }
    } catch (error) {
      console.error("Error loading stakeholders:", error);
      toast.error(t("clients.errorLoadingStakeholders", "Failed to load stakeholders"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStakeholders();
  }, []);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("clients.stakeholders", "Stakeholders")}</CardTitle>
        </CardHeader>
        <CardContent className="py-0 px-4">
          {stakeholders.length === 0 ? (
            <div className="text-center py-4">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-md font-medium text-muted-foreground">{t("clients.noStakeholders", "No stakeholders yet")}</h3>
              <p className="text-muted-foreground mb-4 text-xs">{t("clients.addFirstStakeholder", "Add your first stakeholder to get started")}</p>
            </div>
          ) : (
            <div>
              {stakeholders.map((stakeholder, index) => (
                <div key={stakeholder.id}>
                  <div
                    className="hover:bg-accent/50 transition-colors cursor-pointer p-2 rounded-lg"
                    onClick={() => setViewStakeholder(stakeholder)}
                  >
                    <EmployeeAvatar employee={stakeholder.employee} showName={true} size="sm" variant="full" />
                  </div>
                  {index < stakeholders.length - 1 && <Separator />}
                </div>
              ))}
              {nextPageToken && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => loadStakeholders(nextPageToken, true)} disabled={isLoading}>
                    {isLoading ? t("common.loading", "Loading...") : t("common.loadMore", "Load More")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StakeholderInfoModal
        stakeholder={viewStakeholder}
        open={!!viewStakeholder}
        onOpenChange={(open) => !open && setViewStakeholder(null)}
        clientId={client.id}
      />
    </>
  );
};

export default ClientStakeholdersCard;
