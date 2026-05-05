import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface ClientRate {
    id: string;
    rate_id: string;
    client_id: string;
    valid_from?: string;
    valid_to?: string;
    rate: {
        id: string;
        name: string;
        status: string;
        valid_from?: string;
        due_date?: string;
    };
}

interface ClientRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rate: ClientRate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientRateDeleteModal = ({
    open,
    onOpenChange,
    rate,
    onConfirm,
    isDeleting,
}: ClientRateDeleteModalProps) => {
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
            title={t("clients.rates.deleteRate", "Remove Rate")}
            description={
                <>
                    {t(
                        "clients.rates.deleteRateDescription",
                        "Are you sure you want to remove '{{name}}' from this client? This action cannot be undone.",
                        { name: rate?.rate.name || "-" }
                    )}
                    {rate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{rate.rate.name || "-"}</strong>
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

export default ClientRateDeleteModal;
