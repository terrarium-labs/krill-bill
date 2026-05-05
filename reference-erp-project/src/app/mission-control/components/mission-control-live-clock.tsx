import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    RelativeTime,
    RelativeTimeZone,
    RelativeTimeZoneDate,
    RelativeTimeZoneDisplay,
    RelativeTimeZoneLabel,
} from "@/components/ui/shadcn-io/relative-time";
import { formatTime } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";

type MissionControlLiveClockProps = {
    /** Time display: Orders header uses lg; Timeline uses xl (sm:text-3xl). */
    size?: "lg" | "xl";
    className?: string;
};

export function MissionControlLiveClock({ size = "lg", className }: MissionControlLiveClockProps) {
    const { t } = useTranslation();
    const [clockNow, setClockNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setClockNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex flex-col items-start justify-start shrink-0 cursor-default",
                            className,
                        )}
                    >
                        <span
                            className={cn(
                                "text-lg tabular-nums tracking-tight leading-none",
                                size === "lg" && "sm:text-2xl",
                                size === "xl" && "sm:text-3xl",
                            )}
                        >
                            {formatTime(clockNow, { showSeconds: true })}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    align="end"
                    className="bg-popover text-popover-foreground border shadow-md p-3"
                >
                    <RelativeTime time={clockNow}>
                        <RelativeTimeZone zone="UTC">
                            <RelativeTimeZoneLabel>UTC</RelativeTimeZoneLabel>
                            <div className="flex items-center gap-2">
                                <RelativeTimeZoneDate />
                                <RelativeTimeZoneDisplay />
                            </div>
                        </RelativeTimeZone>
                        <RelativeTimeZone zone={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                            <RelativeTimeZoneLabel>{t("common.local", "Local")}</RelativeTimeZoneLabel>
                            <div className="flex items-center gap-2">
                                <RelativeTimeZoneDate />
                                <RelativeTimeZoneDisplay />
                            </div>
                        </RelativeTimeZone>
                    </RelativeTime>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
