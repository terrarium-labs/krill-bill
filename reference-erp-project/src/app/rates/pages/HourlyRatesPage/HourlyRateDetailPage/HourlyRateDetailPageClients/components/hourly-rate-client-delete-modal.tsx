import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { RateClient } from "@/types/general/rates";

interface HourlyRateClientDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: RateClient | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const HourlyRateClientDeleteModal = ({
    open,
    onOpenChange,
    client,
    onConfirm,
    isDeleting,
}: HourlyRateClientDeleteModalProps) => {
    const { t } = useTranslation();

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setTimeout(() => {
                document.body.style.removeProperty("pointer-events");
            }, 100);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={handleOpenChange}
            title={t("hourlyRates.clients.deleteClient", "Remove Client")}
            description={
                <>
                    {t(
                        "hourlyRates.clients.deleteClientDescription",
                        "Are you sure you want to remove '{{name}}' from this hourly rate? This action cannot be undone.",
                        {
                            name:
                                client?.client_name ||
                                client?.trade_name ||
                                "-",
                        }
                    )}
                    {client && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {client.client_name ||
                                    client.trade_name ||
                                    "-"}
                            </strong>
                        </div>
                    )}
                </>
            }
            deleteText={t("common.delete", "Remove")}
            deletingText={t("common.deleting", "Removing...")}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default HourlyRateClientDeleteModal;
