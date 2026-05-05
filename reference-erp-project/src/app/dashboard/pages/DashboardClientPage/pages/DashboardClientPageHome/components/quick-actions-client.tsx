import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const QuickActionsClient = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  return (
    <div className="shadow-none border-none">
      <div className="flex flex-col gap-4">
        <div className="text-md font-semibold">
          {t("dashboard.quickActions", "Quick Actions")}
        </div>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder Button 1 */}
          <div className="h-24 items-center justify-center border border-dashed border-border flex rounded-lg">
            <div className="text-muted-foreground text-sm">
              {t("dashboard.comingSoon", "Coming Soon")}
            </div>
          </div>

          {/* Placeholder Button 2 */}
          <div className="h-24 items-center justify-center border border-dashed border-border flex rounded-lg">
            <div className="text-muted-foreground text-sm">
              {t("dashboard.comingSoon", "Coming Soon")}
            </div>
          </div>

          {/* New Ticket */}
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border border-border rounded-lg"
            onClick={() => navigate(`/${orgId}/tickets`)}
          >
            <TicketPlus className="h-6 w-6" />
            <span className="text-sm font-medium">
              {t("tickets.newTicket", "New Ticket")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsClient;
