import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import Tag from "@/app/components/tag/tag";
import { CalendarClock, Clock } from "lucide-react";

interface TimeRecordsSummaryCardProps {
    scheduledMinutes: number;
    workedMinutes: number;
}

const TimeRecordsSummaryCard = ({ scheduledMinutes, workedMinutes }: TimeRecordsSummaryCardProps) => {
    const { t } = useTranslation();

    // Format time to show in "XXh XXmin" format
    const formatTimeHoursMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}min`;
    };

    const balanceMinutes = workedMinutes - scheduledMinutes;

    return (
        <Card className="w-full shadow-none">
            <div className="grid grid-cols-2 divide-x">
                {/* Scheduled Hours Column */}
                <div className="flex flex-col items-start justify-center pl-4 py-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock className="h-4 w-4" />
                        <span>{t("timeRecords.scheduledHours", "Scheduled Hours")}</span>
                    </div>
                    <div className="text-2xl font-medium">
                        {formatTimeHoursMinutes(scheduledMinutes)}
                    </div>
                </div>

                {/* Worked Hours Column */}
                <div className="flex flex-col items-start justify-center pl-4 py-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{t("timeRecords.workedHours", "Worked Hours")}</span>
                        {balanceMinutes !== 0 && (
                            <Tag
                                icon={balanceMinutes >= 0 ? "arrow-up" : "arrow-down"}
                                text={formatTimeHoursMinutes(Math.abs(balanceMinutes))}
                                color={balanceMinutes >= 0 ? "green" : "red"}
                            />
                        )}
                    </div>
                    <div className="text-2xl font-medium">
                        {formatTimeHoursMinutes(workedMinutes)}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TimeRecordsSummaryCard;