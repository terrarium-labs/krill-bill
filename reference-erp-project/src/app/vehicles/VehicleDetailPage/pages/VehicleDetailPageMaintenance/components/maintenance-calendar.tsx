import { useState, useMemo, ReactNode } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { VehicleMaintenance } from "@/types/general/vehicles";
import MaintenanceDayPopover from "./maintenance-day-popover";
import { eachMonthOfInterval } from "date-fns";

interface MaintenanceCalendarProps {
    selectedYear: number;
    maintenances: VehicleMaintenance[];
    onAddMaintenance: (date: Date | null) => void;
    onViewMaintenance: (maintenance: VehicleMaintenance) => void;
    renderActions?: (
        maintenance: VehicleMaintenance,
        closePopover: () => void
    ) => ReactNode;
}

// Extract a plain YYYY-MM-DD key from an API date string (no timezone conversion).
const dateStringToKey = (dateStr: string): string => dateStr.slice(0, 10);

// Extract a YYYY-MM-DD key from a calendar Date using local getters.
const dateToKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// When to_date is absent fall back to from_date (single-day maintenance).
const resolveEndKey = (m: VehicleMaintenance): string =>
    m.to_date ? dateStringToKey(m.to_date) : dateStringToKey(m.from_date);

const MaintenanceCalendar = ({
    selectedYear,
    maintenances,
    onAddMaintenance,
    onViewMaintenance,
    renderActions,
}: MaintenanceCalendarProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const monthsInYear = useMemo(() =>
        eachMonthOfInterval({
            start: new Date(selectedYear, 0, 1),
            end: new Date(selectedYear, 11, 31),
        }),
        [selectedYear]
    );

    const getMaintenancesForDate = (date: Date): VehicleMaintenance[] => {
        const key = dateToKey(date);
        return maintenances.filter((m) => {
            const startKey = dateStringToKey(m.from_date);
            const endKey = resolveEndKey(m);
            return key >= startKey && key <= endKey;
        });
    };

    const MaintenancePopoverDayButton = (
        props: React.ComponentProps<typeof CalendarDayButton>
    ) => {
        const dayMaintenances = getMaintenancesForDate(props.day.date);
        return (
            <MaintenanceDayPopover
                {...props}
                maintenances={dayMaintenances}
                onAddMaintenance={onAddMaintenance}
                onViewMaintenance={onViewMaintenance}
                renderActions={renderActions}
            />
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthsInYear.map((month) => (
                <div key={month.getTime()} className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        month={month}
                        showOutsideDays={false}
                        weekStartsOn={1}
                        className="p-0"
                        classNames={{
                            nav: "hidden",
                            button_previous: "hidden",
                            button_next: "hidden",
                            caption: "flex justify-center pt-0 relative items-center w-full",
                            caption_label: "text-xs font-medium",
                            weekdays: "flex",
                            weekday:
                                "text-xs font-normal text-muted-foreground w-6 h-6 flex items-center justify-center p-0",
                            week: "flex w-full mt-1",
                            day: "min-h-6 min-w-6 max-h-6 max-w-6 text-xs p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
                            day_button:
                                "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1",
                            month: "space-y-1 p-2",
                        }}
                        components={{
                            DayButton: MaintenancePopoverDayButton,
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default MaintenanceCalendar;
