import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { HourlyRateJobTitle } from "@/types/general/hourly-rates";

interface HourlyRateJobTitleDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    rateJobTitle: HourlyRateJobTitle | null;
}

const HourlyRateJobTitleDeleteModal: React.FC<HourlyRateJobTitleDeleteModalProps> = ({
    open,
    onOpenChange,
    onConfirm,
    rateJobTitle,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "hourlyRates.deleteJobTitle.title",
                "Delete Job Title from Hourly Rate"
            )}
            description={
                <>
                    {t(
                        "hourlyRates.deleteJobTitle.description",
                        "Are you sure you want to remove this job title from the hourly rate? This action cannot be undone."
                    )}
                    {rateJobTitle && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <div className="font-semibold">
                                {rateJobTitle.job_title.name}
                            </div>
                            <div className="text-sm mt-1">
                                Default PVP:{" "}
                                {rateJobTitle.default_pvp.toFixed(2)}€
                            </div>
                            {rateJobTitle.time_frames.length > 0 && (
                                <div className="text-sm text-destructive">
                                    {t(
                                        "hourlyRates.deleteJobTitle.timeframesWarning",
                                        "This will also delete {{count}} timeframe(s)",
                                        {
                                            count: rateJobTitle.time_frames
                                                .length,
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
        />
    );
};

export default HourlyRateJobTitleDeleteModal;
