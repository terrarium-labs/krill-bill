import { useState, useMemo, ReactNode } from "react";
import { CalendarDayButton } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/miscelanea";
import { VehicleMaintenance } from "@/types/general/vehicles";

interface MaintenanceDayPopoverProps
    extends React.ComponentProps<typeof CalendarDayButton> {
    maintenances: VehicleMaintenance[];
    onAddMaintenance: (date: Date) => void;
    onViewMaintenance: (maintenance: VehicleMaintenance) => void;
    renderActions?: (
        maintenance: VehicleMaintenance,
        closePopover: () => void
    ) => ReactNode;
}

const MAINTENANCE_BG = "bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-100";

// Format a calendar Date as YYYY-MM-DD using local getters (no timezone conversion).
const dateToKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Resolve end key, falling back to from_date when to_date is absent.
const resolveEndKey = (m: VehicleMaintenance): string =>
    m.to_date ? m.to_date.slice(0, 10) : m.from_date.slice(0, 10);

const MaintenanceDayPopover = ({
    className,
    day,
    maintenances,
    onAddMaintenance,
    onViewMaintenance,
    renderActions,
}: MaintenanceDayPopoverProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const hasMaintenances = maintenances.length > 0;

    // Compute background + rounding directly on the button so it is independent
    // of the <td> modifier classes (which can conflict with the Calendar's `today`
    // modifier adding its own `rounded-md`).
    const maintenanceClass = useMemo(() => {
        if (maintenances.length === 0) return "";
        const thisKey = dateToKey(day.date);
        if (maintenances.length > 1) return cn(MAINTENANCE_BG, "rounded-none");
        const m = maintenances[0];
        const startKey = m.from_date.slice(0, 10);
        const endKey = resolveEndKey(m);
        const isStart = thisKey === startKey;
        const isEnd = thisKey === endKey;
        if (isStart && isEnd) return cn(MAINTENANCE_BG, "rounded-md");
        if (isStart) return cn(MAINTENANCE_BG, "rounded-l-md");
        if (isEnd) return cn(MAINTENANCE_BG, "rounded-r-md");
        return cn(MAINTENANCE_BG, "rounded-none");
    }, [maintenances, day.date]);

    const handleAddForDay = () => {
        const utcDate = new Date(
            Date.UTC(
                day.date.getFullYear(),
                day.date.getMonth(),
                day.date.getDate(),
                0, 0, 0, 0
            )
        );
        onAddMaintenance(utcDate);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1",
                        className,
                        maintenanceClass
                    )}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {day.date.getDate()}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                            {formatDate(day.date, {
                                showTime: false,
                                showYear: true,
                                useUTC: false,
                                showDayName: true,
                            })}
                        </h4>
                    </div>

                    {hasMaintenances ? (
                        <div className="flex flex-col gap-1">
                            {maintenances.map((maintenance, index) => {
                                const fromDate = new Date(maintenance.from_date);
                                const isMultiDay = maintenance.from_date.slice(0, 10) !== resolveEndKey(maintenance);

                                return (
                                    <div
                                        key={maintenance.id || index}
                                        className="py-1.5 px-2 rounded-md transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                            onViewMaintenance(maintenance);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Wrench className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                <span className="text-xs font-medium">
                                                    {t("maintenance.maintenance", "Maintenance")}
                                                </span>
                                            </div>
                                            {renderActions && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {renderActions(maintenance, () => setIsOpen(false))}
                                                </div>
                                            )}
                                        </div>
                                        {isMultiDay && maintenance.to_date && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDate(fromDate, { showTime: false, showYear: false, useUTC: true })}
                                                {" – "}
                                                {formatDate(new Date(maintenance.to_date), { showTime: false, showYear: false, useUTC: true })}
                                            </p>
                                        )}
                                        {maintenance.notes && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {maintenance.notes}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {t("maintenance.noMaintenanceThisDay", "No maintenance on this day")}
                            </p>
                            <Button size="sm" onClick={handleAddForDay} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {t("maintenance.addMaintenance", "Add Maintenance")}
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default MaintenanceDayPopover;
