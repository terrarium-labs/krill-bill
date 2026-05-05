import { useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
    Settings2,
    Truck,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

const VIEW_STORAGE_KEY = "mc-resource-allocation-view";
const SHOW_SUMMARY_KEY = "mc-resource-allocation-summary";

type ViewMode = "week" | "month";

function loadViewMode(): ViewMode {
    try {
        const v = localStorage.getItem(VIEW_STORAGE_KEY);
        if (v === "month" || v === "week") return v;
    } catch {
        /* ignore */
    }
    return "week";
}

function loadShowSummary(): boolean {
    try {
        const v = localStorage.getItem(SHOW_SUMMARY_KEY);
        if (v === "false") return false;
    } catch {
        /* ignore */
    }
    return true;
}

type DayAllocation = {
    orders: number;
    resourcesAllocated: number;
    totalResources: number;
    vehiclesAllocated: number;
    totalVehicles: number;
    hoursAllocated: number;
    totalHours: number;
};

function seededRandom(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

function dateToKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateWeekMockData(weekStart: Date): Map<string, DayAllocation> {
    const map = new Map<string, DayAllocation>();
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const seed = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
        const r = seededRandom(seed);

        const totalResources = 12;
        const allocated = Math.max(2, Math.round(r * totalResources));
        const totalVehicles = 8;
        const vehiclesAllocated = Math.max(1, Math.round(seededRandom(seed + 3) * totalVehicles));
        const totalHours = totalResources * 8;
        const hoursAllocated = Math.round(allocated * (6 + seededRandom(seed + 1) * 3));
        const orders = Math.max(1, Math.round(seededRandom(seed + 2) * 10));

        map.set(dateToKey(date), {
            orders,
            resourcesAllocated: allocated,
            totalResources,
            vehiclesAllocated,
            totalVehicles,
            hoursAllocated: Math.min(hoursAllocated, totalHours),
            totalHours,
        });
    }
    return map;
}

function generateMonthMockData(year: number, month: number): Map<string, DayAllocation> {
    const map = new Map<string, DayAllocation>();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const seed = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
        const r = seededRandom(seed);

        const totalResources = 12;
        const allocated = Math.max(2, Math.round(r * totalResources));
        const totalVehicles = 8;
        const vehiclesAllocated = Math.max(1, Math.round(seededRandom(seed + 3) * totalVehicles));
        const totalHours = totalResources * 8;
        const hoursAllocated = Math.round(allocated * (6 + seededRandom(seed + 1) * 3));
        const orders = Math.max(1, Math.round(seededRandom(seed + 2) * 10));

        map.set(dateToKey(date), {
            orders,
            resourcesAllocated: allocated,
            totalResources,
            vehiclesAllocated,
            totalVehicles,
            hoursAllocated: Math.min(hoursAllocated, totalHours),
            totalHours,
        });
    }
    return map;
}

function getMonthWeeks(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const dow = firstDay.getDay();
    const startOffset = dow === 0 ? -6 : 1 - dow;
    const calendarStart = new Date(year, month, 1 + startOffset);

    const weeks: { date: Date; key: string; isCurrentMonth: boolean }[][] = [];
    let current = new Date(calendarStart);

    for (let w = 0; w < 6; w++) {
        const week: { date: Date; key: string; isCurrentMonth: boolean }[] = [];
        for (let d = 0; d < 7; d++) {
            const key = dateToKey(current);
            week.push({
                date: new Date(current),
                key,
                isCurrentMonth: current.getMonth() === month,
            });
            current.setDate(current.getDate() + 1);
        }
        if (week.some((day) => day.isCurrentMonth)) {
            weeks.push(week);
        }
    }
    return weeks;
}

function getAllocationPercent(day: DayAllocation): number {
    if (day.totalResources === 0) return 0;
    return Math.round((day.resourcesAllocated / day.totalResources) * 100);
}

function getAllocationColor(percent: number) {
    if (percent < 50) {
        return {
            text: "text-red-700 dark:text-red-400",
            gradient: "from-red-500/30 to-transparent",
            border: "border-red-500",
            dot: "bg-red-500",
        };
    }
    if (percent < 80) {
        return {
            text: "text-amber-700 dark:text-amber-400",
            gradient: "from-amber-500/30 to-transparent",
            border: "border-amber-500",
            dot: "bg-amber-500",
        };
    }
    return {
        text: "text-emerald-700 dark:text-emerald-400",
        gradient: "from-emerald-500/30 to-transparent",
        border: "border-emerald-500",
        dot: "bg-emerald-500",
    };
}

function getWeekStart(d: Date) {
    const date = new Date(d);
    const dow = date.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getWeekDays(weekStart: Date) {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
}

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DayCell({
    date,
    allocation,
    isToday,
    density = "comfortable",
    isCurrentMonth = true,
    showSummary = true,
}: {
    date: Date;
    allocation?: DayAllocation;
    isToday: boolean;
    density?: "comfortable" | "compact";
    isCurrentMonth?: boolean;
    showSummary?: boolean;
}) {
    const dayLabel = SHORT_DAYS[(date.getDay() + 6) % 7];
    const dayNum = date.getDate();
    const compact = density === "compact";

    if (!allocation) {
        return (
            <div
                className={cn(
                    "relative flex flex-col items-center border-r border-border last:border-r-0 h-full",
                    !isCurrentMonth ? "bg-muted/30" : "bg-muted/10",
                )}
            >
                <div
                    className={cn(
                        "flex flex-col items-center gap-0.5",
                        compact ? "pt-1" : "pt-2",
                    )}
                >
                    {!compact && (
                        <span className="text-xs font-medium text-muted-foreground/50">
                            {dayLabel}
                        </span>
                    )}
                    <span
                        className={cn(
                            "tabular-nums text-muted-foreground/40",
                            compact ? "text-[10px]" : "text-sm",
                        )}
                    >
                        {dayNum}
                    </span>
                </div>
            </div>
        );
    }

    const percent = getAllocationPercent(allocation);
    const colors = getAllocationColor(percent);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "relative flex flex-col border-r border-border last:border-r-0 h-full overflow-hidden cursor-default transition-colors hover:ring-1 hover:ring-ring/30 hover:z-10",
                        isToday && "ring-1 ring-primary/40",
                    )}
                >
                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 bg-linear-to-b border-t-2 transition-all",
                            colors.gradient,
                            colors.border,
                        )}
                        style={{ height: `${percent}%` }}
                    />

                    <div
                        className={cn(
                            "relative z-1 flex flex-col h-full gap-1",
                            compact ? "p-1" : "p-2",
                        )}
                    >
                        <div
                            className={cn(
                                "flex flex-col items-center gap-0.5",
                                compact && "self-stretch shrink-0 pt-1",
                            )}
                        >
                            {!compact && (
                                <span className="text-xs font-medium text-muted-foreground">
                                    {dayLabel}
                                </span>
                            )}
                            <span
                                className={cn(
                                    "font-semibold tabular-nums leading-none",
                                    compact
                                        ? cn(
                                              "text-[11px]",
                                              isToday
                                                  ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                                                  : "text-foreground",
                                          )
                                        : cn(
                                              "text-sm",
                                              isToday
                                                  ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                                  : "text-foreground",
                                          ),
                                )}
                            >
                                {dayNum}
                            </span>
                        </div>

                        {!compact && showSummary && (
                            <div className="flex-1 flex flex-col justify-end min-w-0">
                                <div className="flex flex-wrap items-center justify-center gap-0 rounded-md border border-border/50 bg-background/40 px-1.5 py-1 backdrop-blur-md overflow-hidden">
                                    <div className="flex items-center gap-0.5 px-1 shrink-0 min-w-0">
                                        <ClipboardList className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="text-[11px] tabular-nums text-foreground font-medium truncate">
                                            {allocation.orders}
                                        </span>
                                    </div>
                                    <div className="h-3 w-px shrink-0 bg-border/70" aria-hidden />
                                    <div className="flex items-center gap-0.5 px-1 shrink-0 min-w-0">
                                        <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="text-[11px] tabular-nums text-foreground font-medium truncate">
                                            {allocation.resourcesAllocated}/{allocation.totalResources}
                                        </span>
                                    </div>
                                    <div className="h-3 w-px shrink-0 bg-border/70" aria-hidden />
                                    <div className="flex items-center gap-0.5 px-1 shrink-0 min-w-0">
                                        <Truck className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="text-[11px] tabular-nums text-foreground font-medium truncate">
                                            {allocation.vehiclesAllocated}/{allocation.totalVehicles}
                                        </span>
                                    </div>
                                    <div className="h-3 w-px shrink-0 bg-border/70" aria-hidden />
                                    <div className="flex items-center gap-0.5 px-1 shrink-0 min-w-0">
                                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="text-[11px] tabular-nums text-foreground font-medium truncate">
                                            {allocation.hoursAllocated}h
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                <div className="flex flex-col gap-1">
                    <p className="font-semibold">
                        {date.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                        })}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className={cn("inline-block h-2 w-2 rounded-full", colors.dot)} />
                        <span>{percent}% allocated</span>
                    </div>
                    <p>Orders: {allocation.orders}</p>
                    <p>
                        Resources: {allocation.resourcesAllocated}/{allocation.totalResources}
                    </p>
                    <p>
                        Vehicles: {allocation.vehiclesAllocated}/{allocation.totalVehicles}
                    </p>
                    <p>
                        Hours: {allocation.hoursAllocated}/{allocation.totalHours}h
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

function formatWeekRange(weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startOpts: Intl.DateTimeFormatOptions =
        weekStart.getMonth() === weekEnd.getMonth()
            ? { day: "numeric" }
            : { day: "numeric", month: "short" };
    const endOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

    return `${weekStart.toLocaleDateString(undefined, startOpts)} – ${weekEnd.toLocaleDateString(undefined, endOpts)}`;
}

function formatMonthLabel(year: number, month: number) {
    return new Date(year, month, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });
}

export default function ResourceAllocationWidget() {
    const now = new Date();
    const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode());
    const [showSummary, setShowSummary] = useState(() => loadShowSummary());
    const [weekStart, setWeekStart] = useState(() => getWeekStart(now));
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [viewYear, setViewYear] = useState(now.getFullYear());

    const todayKey = dateToKey(now);

    const mockData = useMemo(() => {
        if (viewMode === "week") {
            return generateWeekMockData(weekStart);
        }
        return generateMonthMockData(viewYear, viewMonth);
    }, [viewMode, weekStart, viewYear, viewMonth]);

    const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

    const monthWeeks = useMemo(
        () => getMonthWeeks(viewYear, viewMonth),
        [viewYear, viewMonth],
    );

    const goPrevWeek = () => {
        setWeekStart((ws) => {
            const d = new Date(ws);
            d.setDate(d.getDate() - 7);
            return d;
        });
    };

    const goNextWeek = () => {
        setWeekStart((ws) => {
            const d = new Date(ws);
            d.setDate(d.getDate() + 7);
            return d;
        });
    };

    const goTodayWeek = () => setWeekStart(getWeekStart(now));

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const goTodayMonth = () => {
        setViewMonth(now.getMonth());
        setViewYear(now.getFullYear());
    };

    const handleViewModeChange = (value: string) => {
        if (value !== "week" && value !== "month") return;
        if (value === "month") {
            setViewYear(weekStart.getFullYear());
            setViewMonth(weekStart.getMonth());
        } else {
            const mid = Math.min(15, new Date(viewYear, viewMonth + 1, 0).getDate());
            setWeekStart(getWeekStart(new Date(viewYear, viewMonth, mid)));
        }
        setViewMode(value);
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, value);
        } catch {
            /* ignore */
        }
    };

    const allValues = Array.from(mockData.values());
    const avgPercent =
        allValues.length > 0
            ? Math.round(
                  allValues.reduce((s, d) => s + getAllocationPercent(d), 0) /
                      allValues.length,
              )
            : 0;
    const totalOrders = allValues.reduce((s, d) => s + d.orders, 0);
    const totalHours = allValues.reduce((s, d) => s + d.hoursAllocated, 0);
    const avgColors = getAllocationColor(avgPercent);

    return (
        <div className="flex flex-col h-full w-full rounded-lg border bg-card text-card-foreground overflow-hidden">
            <div className="px-3 py-2.5 border-b shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={viewMode === "week" ? goPrevWeek : goPrevMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <button
                        type="button"
                        className="text-sm font-semibold leading-none min-w-0 flex-1 text-center hover:underline truncate px-1"
                        onClick={viewMode === "week" ? goTodayWeek : goTodayMonth}
                    >
                        {viewMode === "week"
                            ? formatWeekRange(weekStart)
                            : formatMonthLabel(viewYear, viewMonth)}
                    </button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={viewMode === "week" ? goNextWeek : goNextMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1">
                            <span className={cn("inline-block h-2 w-2 rounded-full", avgColors.dot)} />
                            <span className={cn("font-bold", avgColors.text)}>{avgPercent}%</span> avg
                        </span>
                        <span>{totalOrders} orders</span>
                        <span>{totalHours}h</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                <span className="sr-only">View settings</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Calendar view</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={viewMode} onValueChange={handleViewModeChange}>
                                <DropdownMenuRadioItem value="week">Weekly</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="month">Monthly</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                            >
                                <div className="flex items-center gap-2 justify-between w-full">
                                    <span>Summary</span>
                                    <Switch
                                        checked={showSummary}
                                        onClick={(e) => e.stopPropagation()}
                                        onCheckedChange={(checked) => {
                                            setShowSummary(checked);
                                            try {
                                                localStorage.setItem(SHOW_SUMMARY_KEY, String(checked));
                                            } catch { /* ignore */ }
                                        }}
                                    />
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {viewMode === "week" ? (
                    <div className="h-full grid grid-cols-7 min-h-0">
                        {days.map((date) => (
                            <DayCell
                                key={dateToKey(date)}
                                date={date}
                                allocation={mockData.get(dateToKey(date))}
                                isToday={dateToKey(date) === todayKey}
                                density="comfortable"
                                showSummary={showSummary}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                        <div className="grid grid-cols-7 border-b border-border bg-muted/50 shrink-0">
                            {SHORT_DAYS.map((day) => (
                                <div
                                    key={day}
                                    className="py-1 text-center text-[10px] font-medium text-muted-foreground"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 divide-y divide-border">
                            {monthWeeks.map((week, wi) => (
                                <div key={wi} className="grid grid-cols-7 flex-1 min-h-[72px]">
                                    {week.map((day) => (
                                        <DayCell
                                            key={day.key}
                                            date={day.date}
                                            allocation={mockData.get(day.key)}
                                            isToday={day.key === todayKey}
                                            density="compact"
                                            isCurrentMonth={day.isCurrentMonth}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 py-2 border-t border-border text-[11px] text-muted-foreground shrink-0">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-red-500/30 to-red-500/5 border-t-2 border-red-500" />
                    {"< 50%"}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-amber-500/30 to-amber-500/5 border-t-2 border-amber-500" />
                    50–79%
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-emerald-500/30 to-emerald-500/5 border-t-2 border-emerald-500" />
                    80–100%
                </span>
            </div>
        </div>
    );
}
