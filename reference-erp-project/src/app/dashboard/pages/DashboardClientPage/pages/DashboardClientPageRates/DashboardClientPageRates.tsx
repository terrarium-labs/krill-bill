import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { VerticalMenu, VerticalMenuItem } from "@/components/ui/vertical-menu";
import { BoxIcon, CarIcon, ClockIcon } from "lucide-react";
import DashboardClientPageRatesItems, { DashboardClientPageRatesItemsRef } from "./pages/DashboardClientPageRatesItem/DashboardClientPageRatesItems";
import DashboardClientPageRatesHourly, { DashboardClientPageRatesHourlyRef } from "./pages/DashboardClientPageRatesHourly/DashboardClientPageRatesHourly";
import DashboardClientPageRatesCommuting, { DashboardClientPageRatesCommutingRef } from "./pages/DashboardClientPageRatesCommuting/DashboardClientPageRatesCommuting";
import ClientRatesAddModal from "./pages/DashboardClientPageRatesItem/components/client-rates-add-modal";
import ClientHourlyRatesAddModal from "./pages/DashboardClientPageRatesHourly/components/client-hourly-rates-add-modal";
import ClientCommutingRatesAddModal from "./pages/DashboardClientPageRatesCommuting/components/client-commuting-rates-add-modal";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";

const DashboardClientPageRates = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { client } = useClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [addRatesModalOpen, setAddRatesModalOpen] = useState(false);
  const [addHourlyRatesModalOpen, setAddHourlyRatesModalOpen] = useState(false);
  const [addCommutingRatesModalOpen, setAddCommutingRatesModalOpen] = useState(false);
  const ratesRef = useRef<DashboardClientPageRatesItemsRef>(null);
  const hourlyRatesRef = useRef<DashboardClientPageRatesHourlyRef>(null);
  const commutingRatesRef = useRef<DashboardClientPageRatesCommutingRef>(null);

  const currentTab = searchParams.get("tab") || "rates";
  const ratesSubTab =
    currentTab === "hourly-rates" ? "hourly" : currentTab === "commuting-rates" ? "commuting" : "items";

  const handleRatesSubTabChange = (value: "items" | "hourly" | "commuting") => {
    const tabParam =
      value === "hourly" ? "hourly-rates" : value === "commuting" ? "commuting-rates" : "rates";
    setSearchParams({ tab: tabParam });
  };

  const handleRatesAdded = () => ratesRef.current?.refreshRates();
  const handleHourlyRatesAdded = () => hourlyRatesRef.current?.refreshHourlyRates();
  const handleCommutingRatesAdded = () => commutingRatesRef.current?.refreshCommutingRates();

  return (
    <>
      <div className="flex gap-6">
        <VerticalMenu
          value={ratesSubTab}
          onValueChange={(v) => handleRatesSubTabChange(v as "items" | "hourly" | "commuting")}
        >
          <VerticalMenuItem value="items">
            <div className="flex items-center gap-2">
              <BoxIcon className="w-4 h-4" />
              {t("clientsDetail.itemRates", "Items Rates")}
            </div>
          </VerticalMenuItem>
          <VerticalMenuItem value="hourly">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              {t("clientsDetail.hourlyRates", "Hourly Rates")}
            </div>
          </VerticalMenuItem>
          <VerticalMenuItem value="commuting">
            <div className="flex items-center gap-2">
              <CarIcon className="w-4 h-4" />
              {t("clientsDetail.commutingRates", "Commuting Rates")}
            </div>
          </VerticalMenuItem>
        </VerticalMenu>
        <div className="flex-1 min-w-0">
          {ratesSubTab === "items" ? (
            <DashboardClientPageRatesItems ref={ratesRef} onAddRateClick={() => setAddRatesModalOpen(true)} />
          ) : ratesSubTab === "hourly" ? (
            <DashboardClientPageRatesHourly ref={hourlyRatesRef} onAddHourlyRateClick={() => setAddHourlyRatesModalOpen(true)} />
          ) : (
            <DashboardClientPageRatesCommuting ref={commutingRatesRef} onAddCommutingRateClick={() => setAddCommutingRatesModalOpen(true)} />
          )}
        </div>
      </div>

      {orgId && client?.id && (
        <>
          <ClientRatesAddModal
            open={addRatesModalOpen}
            onOpenChange={setAddRatesModalOpen}
            onRatesAdded={handleRatesAdded}
            orgId={orgId}
            clientId={client.id}
          />
          <ClientHourlyRatesAddModal
            open={addHourlyRatesModalOpen}
            onOpenChange={setAddHourlyRatesModalOpen}
            onHourlyRatesAdded={handleHourlyRatesAdded}
            orgId={orgId}
            clientId={client.id}
          />
          <ClientCommutingRatesAddModal
            open={addCommutingRatesModalOpen}
            onOpenChange={setAddCommutingRatesModalOpen}
            onCommutingRatesAdded={handleCommutingRatesAdded}
            orgId={orgId}
            clientId={client.id}
          />
        </>
      )}
    </>
  );
};

export default DashboardClientPageRates;
