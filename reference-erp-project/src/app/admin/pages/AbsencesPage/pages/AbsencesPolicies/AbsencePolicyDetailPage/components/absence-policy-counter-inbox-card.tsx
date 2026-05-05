import { Calendar, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AbsenceCounter } from "@/types/general/absences";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import IconLabel from "@/app/components/labels/icon-label";
import DateRangeLabel from "@/app/components/labels/date-range-label";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/miscelanea";

interface AbsencePolicyCounterInboxCardProps {
    counter: AbsenceCounter;
    onClick: (counter: AbsenceCounter) => void;
    isSelected?: boolean;
}

export const AbsencePolicyCounterInboxCard = ({
    counter,
    onClick,
    isSelected,
}: AbsencePolicyCounterInboxCardProps) => {
    const { t } = useTranslation();

    const valueLine = counter.is_unlimited
        ? t("absence-policies.counters.unlimited", "Unlimited")
        : `${counter.value} ${counter.unit}`;

    const start = counter.start_date;
    const end = counter.end_date;
    const hasFullDateRange = !!(start && end);
    const hasPartialDateRange =
        (start && !end) || (!start && end);
    const showDatePart = hasFullDateRange || hasPartialDateRange;

    return (
        <Card
            className={cn(
                "overflow-hidden py-0 min-h-[4.5rem] shadow-none transition-all cursor-pointer group rounded-lg hover:bg-accent/50 relative",
                isSelected && "bg-accent",
                isSelected ? "border-primary" : "border-border"
            )}
            onClick={() => onClick(counter)}
        >
            <div className="flex gap-3 p-3">
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1.5">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors duration-200">
                            {counter.name}
                        </h4>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                            {counter.is_unlimited ? (
                                <Tag
                                    text={t("absence-policies.counters.unlimited", "Unlimited")}
                                />
                            ) : (
                                <span>{valueLine}</span>
                            )}
                            {counter.admin_only && (
                                <Tag
                                    text={t("absence-policies.counters.adminOnly", "Admin Only")}
                                    color="amber"
                                />
                            )}
                        </div>
                        {(showDatePart || counter.absence_types?.length) && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground min-w-0">
                                {showDatePart && (
                                    <div className="flex items-center gap-2 min-w-0 shrink">
                                        <Calendar
                                            className="size-3.5 shrink-0 text-muted-foreground/80"
                                            aria-hidden
                                        />
                                        {hasFullDateRange ? (
                                            <DateRangeLabel
                                                startDate={start}
                                                endDate={end}
                                                dateOnly
                                                useUTC={false}
                                                className="text-xs leading-normal break-words text-muted-foreground"
                                            />
                                        ) : (
                                            <span className="leading-normal break-words">
                                                {start && !end
                                                    ? `${formatDate(start, { showTime: false })} – …`
                                                    : `… – ${formatDate(end!, { showTime: false })}`}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {showDatePart && counter.absence_types?.length ? (
                                    <span
                                        className="text-muted-foreground/45 shrink-0 select-none"
                                        aria-hidden
                                    >
                                        |
                                    </span>
                                ) : null}
                                {counter.absence_types?.length ? (
                                    <div className="min-w-0 overflow-hidden">
                                        <IconLabel
                                            data={counter.absence_types.map((type) => ({
                                                icon: type.icon_url,
                                                text: type.name,
                                                color: type.color,
                                            }))}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-center shrink-0">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all duration-200" />
                </div>
            </div>
        </Card>
    );
};

export default AbsencePolicyCounterInboxCard;
