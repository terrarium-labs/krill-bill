import { useClient } from "../../../../contexts/DashboardClientContext";
import { ClientInfoCard } from "./components/client-info-card";
import ClientContactsCard from "./components/client-contacts-card";
import ClientStakeholdersCard from "./components/client-stakeholders-card";
import ClientPaymentMethodsCard from "./components/client-payment-methods-card";

const DashboardClientPageMyInfo = () => {
  const { client } = useClient();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
        <ClientStakeholdersCard />
        {client?.id && (
          <>
            <ClientContactsCard />
            <ClientPaymentMethodsCard />
          </>
        )}
      </div>
      <div className="lg:col-span-2">
        <ClientInfoCard />
      </div>
    </div>
  );
};

export default DashboardClientPageMyInfo;
