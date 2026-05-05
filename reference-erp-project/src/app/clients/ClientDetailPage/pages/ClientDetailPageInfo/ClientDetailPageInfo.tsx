import { useClient } from "../../../contexts/ClientContext";
import { ClientInfoCard } from "./components/client-info-card";
import ClientContactsCard from "./components/client-contacts-card";
import ClientStakeholdersCard from "./components/client-stakeholders-card";
import ClientPaymentMethodsCard from "./components/client-payment-methods-card";
import { useTranslation } from "react-i18next";

interface ClientDetailPageInfoProps {
  onEdit?: () => void;
}

const ClientDetailPageInfo: React.FC<ClientDetailPageInfoProps> = ({ onEdit }) => {
  const { client } = useClient();
  const { t } = useTranslation();
  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
        <ClientInfoCard onEdit={onEdit} />
        <ClientStakeholdersCard />
        {client?.id && (
          <>
            <ClientContactsCard />
            <ClientPaymentMethodsCard />
          </>
        )}
      </div>
      <div className="lg:col-span-2">
        {/* TODO: Implement summary */}
        <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t('clientsDetail.summaryTodo', 'Summary Tab')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('clientsDetail.summaryTodoDescription', 'This tab is under construction')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPageInfo;