import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import CalendarDayLabel from "@/app/components/labels/calendar-day-label";
import { VehicleMaintenance } from "@/types/general/vehicles";
import { cn } from "@/lib/utils";

interface MaintenancesCardProps {
    maintenances: VehicleMaintenance[];
    isLoading: boolean;
    onAdd: () => void;
    onView: (maintenance: VehicleMaintenance) => void;
}

const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
    const normalize = (d: Date) =>
        new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    return normalize(date1).getTime() === normalize(date2).getTime();
};

/** Inclusive day count from date strings — uses YYYY-MM-DD only (same as summary card) so wall-clock endpoints don’t skew the span. */
function maintenanceInclusiveDays(fromDateStr: string, toDateStr: string | null | undefined): number {
    if (!toDateStr?.trim()) return 1;
    const [fy, fm, fd] = fromDateStr.slice(0, 10).split("-").map(Number);
    const [ty, tm, td] = toDateStr.slice(0, 10).split("-").map(Number);
    const from = new Date(fy, fm - 1, fd);
    const to = new Date(ty, tm - 1, td);
    return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const MaintenancesCard = ({ maintenances, isLoading, onAdd, onView }: MaintenancesCardProps) => {
    const { t } = useTranslation();

    const sorted = useMemo(
        () =>
            [...maintenances].sort(
                (a, b) => new Date(b.from_date).getTime() - new Date(a.from_date).getTime()
            ),
        [maintenances]
    );

    const renderDuration = (maintenance: VehicleMaintenance) => {
        const days = maintenanceInclusiveDays(maintenance.from_date, maintenance.to_date);
        return days === 1
            ? t("maintenance.oneDay", "1 day")
            : t("maintenance.nDays", "{{count}} days", { count: days });
    };

    return (
        <Card className="shadow-none gap-2">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 justify-between">
                    {t("maintenance.pageTitle", "Maintenances")}
                    <div className="flex items-center gap-2">
                        <Button onClick={onAdd} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t("common.add", "Add")}
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t("common.loading", "Loading...")}
                    </p>
                ) : sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t("maintenance.noMaintenanceTitle", "No maintenance records yet")}
                    </p>
                ) : (
                    <div className="overflow-y-auto max-h-64">
                        <div className="space-y-2 pr-4">
                            {sorted.map((maintenance) => {
                                const from = new Date(maintenance.from_date);
                                const to = new Date(maintenance.to_date);
                                const isMultiDay = !isSameCalendarDay(from, to);
                                const title =
                                    maintenance.notes?.trim() ||
                                    t("maintenance.maintenanceRecord", "Maintenance");

                                return (
                                    <div
                                        key={maintenance.id}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer min-w-0",
                                            "hover:bg-accent/50"
                                        )}
                                        onClick={() => onView(maintenance)}
                                    >
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <CalendarDayLabel data={from} color="orange" useUTC />
                                            {isMultiDay && (
                                                <>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <CalendarDayLabel data={to} color="orange" useUTC />
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm line-clamp-2">{title}</h4>
                                            <span className="text-xs text-muted-foreground">
                                                {renderDuration(maintenance)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MaintenancesCard;
