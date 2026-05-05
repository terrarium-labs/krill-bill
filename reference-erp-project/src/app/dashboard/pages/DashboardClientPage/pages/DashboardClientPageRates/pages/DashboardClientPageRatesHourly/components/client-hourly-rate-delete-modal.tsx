import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface ClientHourlyRate {
    id: string;
    hourly_rate_id: string;
    client_id: string;
    valid_from?: string;
    valid_to?: string;
    hourly_rate: {
        id: string;
        name: string;
        status: string;
        valid_from?: string;
        due_date?: string;
    };
}

interface ClientHourlyRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hourlyRate: ClientHourlyRate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientHourlyRateDeleteModal = ({
    open,
    onOpenChange,
    hourlyRate,
    onConfirm,
    isDeleting,
}: ClientHourlyRateDeleteModalProps) => {
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
            title={t(
                "clients.hourlyRates.deleteHourlyRate",
                "Remove Hourly Rate"
            )}
            description={
                <>
                    {t(
                        "clients.hourlyRates.deleteHourlyRateDescription",
                        "Are you sure you want to remove '{{name}}' from this client? This action cannot be undone.",
                        { name: hourlyRate?.hourly_rate.name || "-" }
                    )}
                    {hourlyRate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {hourlyRate.hourly_rate.name || "-"}
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

export default ClientHourlyRateDeleteModal;
