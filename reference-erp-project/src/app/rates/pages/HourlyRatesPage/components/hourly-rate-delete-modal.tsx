import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { HourlyRate } from "@/types/general/hourly-rates";

interface HourlyRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hourlyRate: HourlyRate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const HourlyRateDeleteModal = ({
    open,
    onOpenChange,
    hourlyRate,
    onConfirm,
    isDeleting,
}: HourlyRateDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "hourlyRates.deleteHourlyRate",
                "Delete Hourly Rate"
            )}
            description={
                <>
                    {t(
                        "hourlyRates.deleteHourlyRateConfirmation",
                        "Are you sure you want to delete this hourly rate? This action cannot be undone."
                    )}
                    {hourlyRate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{hourlyRate.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default HourlyRateDeleteModal;
