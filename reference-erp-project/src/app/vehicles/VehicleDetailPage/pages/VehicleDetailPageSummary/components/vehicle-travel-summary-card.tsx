import { useTranslation } from "react-i18next";
import Tag from "@/app/components/tag/tag";
import { Route, Navigation, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDecimal, getTimeAgo } from "@/utils/miscelanea";

interface VehicleTravelSummaryCardProps {
    estimatedKm: number;
    actualKm: number;
    locationName?: string;
    lastUpdatedAt?: string | null;
}

const VehicleTravelSummaryCard = ({ estimatedKm, actualKm, locationName, lastUpdatedAt }: VehicleTravelSummaryCardProps) => {
    const { t } = useTranslation();

    const formatKm = (km: number) =>
        `${formatDecimal(km, { minFractionDigits: 0, maxFractionDigits: 2 })} km`;

    const balanceKm = actualKm - estimatedKm;
    const showBalance = actualKm > 0 && estimatedKm > 0;

    const isLive = (() => {
        if (!lastUpdatedAt) return false;
        const diffMs = Date.now() - new Date(lastUpdatedAt).getTime();
        return diffMs < 30 * 60 * 1000; // within last 30 minutes
    })();

    return (
        <div className="flex items-center gap-3">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-default">
                        <Route className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-sm text-foreground">{formatKm(estimatedKm)}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{t("vehicles.estimatedKm", "Estimated kilometers")}</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-default">
                        <Navigation className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-sm text-foreground">{formatKm(actualKm)}</span>
                        {showBalance && balanceKm !== 0 && (
                            <Tag
                                icon={balanceKm >= 0 ? "arrow-up" : "arrow-down"}
                                text={formatKm(Math.abs(balanceKm))}
                                color={balanceKm >= 0 ? "red" : "green"}
                            />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>{t("vehicles.actualKm", "Actual kilometers")}</TooltipContent>
            </Tooltip>

            {(locationName || lastUpdatedAt) && (
                <>
                    <div className="h-4 w-px bg-border" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-default">
                                <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    {isLive ? (
                                        <>
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                                        </>
                                    ) : (
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                                    )}
                                </span>
                                {locationName && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="max-w-[160px] truncate">{locationName}</span>
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex flex-col gap-0.5">
                                {locationName && <span>{locationName}</span>}
                                {lastUpdatedAt && (
                                    <span className="text-muted-foreground">
                                        {t("vehicles.lastUpdated", "Last updated")}: {getTimeAgo(new Date(lastUpdatedAt))}
                                    </span>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </>
            )}
        </div>
    );
};

export default VehicleTravelSummaryCard;
