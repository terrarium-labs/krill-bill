import { useTranslation } from "react-i18next";
import DeleteModal from "@/app/components/modals/delete-modal";
import type { ConnectedIntegration } from "./integrations-table";
import type { IntegrationType } from "@/types/miscelanea";

type IntegrationInfo = Record<IntegrationType, { name: string; icon: React.ReactNode; iconBg: string }>;

interface IntegrationDisconnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    integration: ConnectedIntegration | null;
    integrationInfo: IntegrationInfo;
    onConfirm: () => Promise<void>;
    isDisconnecting: boolean;
}

const IntegrationDisconnectModal = ({
    open,
    onOpenChange,
    integration,
    integrationInfo,
    onConfirm,
    isDisconnecting,
}: IntegrationDisconnectModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("integrations.disconnectTitle", "Disconnect Integration")}
            description={t(
                "integrations.disconnectConfirmation",
                "Are you sure you want to disconnect this integration? You can reconnect it at any time."
            )}
            deleteText={t("integrations.disconnect", "Disconnect")}
            deletingText={t("integrations.disconnecting", "Disconnecting...")}
            onConfirm={onConfirm}
            isDeleting={isDisconnecting}
        >
            {integration && (
                <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${integrationInfo[integration.type].iconBg}`}>
                        {integrationInfo[integration.type].icon}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            {integrationInfo[integration.type].name}
                        </p>
                    </div>
                </div>
            )}
        </DeleteModal>
    );
};

export default IntegrationDisconnectModal;
