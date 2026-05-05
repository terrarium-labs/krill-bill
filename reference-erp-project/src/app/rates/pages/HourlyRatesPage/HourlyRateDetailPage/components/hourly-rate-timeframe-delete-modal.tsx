import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { TimeFrame } from "@/types/general/hourly-rates";

interface HourlyRateTimeframeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    timeframe: TimeFrame | null;
    deleting?: boolean;
}

const DAYS_OF_WEEK = [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const HourlyRateTimeframeDeleteModal: React.FC<
    HourlyRateTimeframeDeleteModalProps
> = ({
    open,
    onOpenChange,
    onConfirm,
    timeframe,
    deleting = false,
}) => {
    const { t } = useTranslation();

    if (!timeframe) return null;

    const dayName = DAYS_OF_WEEK[timeframe.day_of_week];
    const formatTime = (time: string) => time.substring(0, 5);

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "hourlyRates.timeframe.deleteTitle",
                "Delete Timeframe"
            )}
            description={
                <>
                    {t(
                        "hourlyRates.timeframe.deleteDescription",
                        "Are you sure you want to delete this timeframe? This action cannot be undone."
                    )}
                    <div className="mt-4 p-3 bg-muted rounded-md">
                        <div className="font-semibold mb-2">
                            {t(
                                `common.days.${dayName.toLowerCase()}`,
                                dayName
                            )}
                        </div>
                        <div className="text-sm space-y-1">
                            <div>
                                {t("hourlyRates.timeframe.time", "Time")}:{" "}
                                {formatTime(timeframe.start_time)} -{" "}
                                {formatTime(timeframe.end_time)}
                            </div>
                            <div>
                                {t("hourlyRates.timeframe.price", "Price")}:{" "}
                                {timeframe.price.toFixed(2)}€
                            </div>
                        </div>
                    </div>
                </>
            }
            onConfirm={onConfirm}
            isDeleting={deleting}
        />
    );
};

export default HourlyRateTimeframeDeleteModal;
