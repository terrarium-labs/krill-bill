import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock } from "lucide-react";
import { VehicleMaintenance } from "@/types/general/vehicles";

interface MaintenancesSummaryCardProps {
    maintenances: VehicleMaintenance[];
}

const MaintenancesSummaryCard = ({ maintenances }: MaintenancesSummaryCardProps) => {
    const { t } = useTranslation();

    const totalDays = useMemo(() => {
        return maintenances.reduce((sum, m) => {
            if (!m.to_date) return sum + 1;
            const [fy, fm, fd] = m.from_date.slice(0, 10).split("-").map(Number);
            const [ty, tm, td] = m.to_date.slice(0, 10).split("-").map(Number);
            const from = new Date(fy, fm - 1, fd);
            const to = new Date(ty, tm - 1, td);
            return sum + Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }, 0);
    }, [maintenances]);

    const formatDays = (days: number) =>
        days === 1
            ? `1 ${t("common.day", "day")}`
            : `${days} ${t("common.days", "days")}`;

    return (
        <Card className="shadow-none gap-2">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 justify-between">
                    {t("maintenance.summaryTitle", "Summary")}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 divide-x border rounded-lg bg-muted/20">
                    <div className="flex flex-col items-start justify-center px-3 py-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Wrench className="h-4 w-4 shrink-0" />
                            <span>{t("maintenance.totalMaintenances", "Total")}</span>
                        </div>
                        <div className="text-2xl font-medium tabular-nums">{maintenances.length}</div>
                    </div>
                    <div className="flex flex-col items-start justify-center px-3 py-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{t("maintenance.totalDuration", "Duration")}</span>
                        </div>
                        <div className="text-2xl font-medium tabular-nums">{formatDays(totalDays)}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MaintenancesSummaryCard;
