import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { CommutingRateClient } from "@/types/general/commuting-rates";

interface CommutingRateClientDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: CommutingRateClient | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const CommutingRateClientDeleteModal = ({
    open,
    onOpenChange,
    client,
    onConfirm,
    isDeleting,
}: CommutingRateClientDeleteModalProps) => {
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
            title={t("commutingRates.clients.deleteClient", "Remove Client")}
            description={
                <>
                    {t(
                        "commutingRates.clients.deleteClientDescription",
                        "Are you sure you want to remove '{{name}}' from this commuting rate? This action cannot be undone.",
                        {
                            name:
                                client?.client.trade_name ||
                                client?.client.client_name ||
                                "-",
                        }
                    )}
                    {client && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {client.client.trade_name ||
                                    client.client.client_name ||
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

export default CommutingRateClientDeleteModal;
