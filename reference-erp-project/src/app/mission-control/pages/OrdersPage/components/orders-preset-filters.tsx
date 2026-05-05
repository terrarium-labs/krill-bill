import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
    AlertTriangle,
    Clock,
    CalendarDays,
    UserX,
    Receipt,
    Play,
    CheckCircle2,
    BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PresetFilterKey =
    | "urgent"
    | "overdue"
    | "this_week"
    | "unassigned"
    | "not_billed"
    | "in_progress"
    | "completed";

interface PresetFilterChip {
    key: PresetFilterKey;
    label: string;
    icon: React.ReactNode;
    variant?: "destructive" | "default";
}

interface OrdersPresetFiltersProps {
    activeFilters: Set<PresetFilterKey>;
    onToggle: (key: PresetFilterKey) => void;
    /** Compact pill chips for the bottom glass bar (h-14 shell is provided by the parent). */
    floating?: boolean;
    onInsightsClick?: () => void;
    insightsCount?: number;
}

const OrdersPresetFilters = ({ activeFilters, onToggle, floating = false, onInsightsClick, insightsCount }: OrdersPresetFiltersProps) => {
    const { t } = useTranslation();

    const chips: PresetFilterChip[] = [
        {
            key: "urgent",
            label: t("missionControl.orders.presets.urgent", "Urgent"),
            icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
            variant: "destructive",
        },
        {
            key: "overdue",
            label: t("missionControl.orders.presets.overdue", "Overdue"),
            icon: <Clock className="h-4 w-4 shrink-0" />,
        },
        {
            key: "this_week",
            label: t("missionControl.orders.presets.thisWeek", "This Week"),
            icon: <CalendarDays className="h-4 w-4 shrink-0" />,
        },
        {
            key: "unassigned",
            label: t("missionControl.orders.presets.unassigned", "Unassigned"),
            icon: <UserX className="h-4 w-4 shrink-0" />,
        },
        {
            key: "not_billed",
            label: t("missionControl.orders.presets.notBilled", "Not Billed"),
            icon: <Receipt className="h-4 w-4 shrink-0" />,
        },
        {
            key: "in_progress",
            label: t("missionControl.orders.presets.inProgress", "In Progress"),
            icon: <Play className="h-4 w-4 shrink-0" />,
        },
        {
            key: "completed",
            label: t("missionControl.orders.presets.completed", "Completed"),
            icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
        },
    ];

    if (floating) {
        return (
            <div className="flex flex-wrap h-full w-fit max-w-full min-w-0 items-center gap-1.5 overflow-x-auto px-2 sm:gap-2 sm:px-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {chips.map((chip) => {
                    const isActive = activeFilters.has(chip.key);
                    return (
                        <Button
                            key={chip.key}
                            variant={
                                isActive && chip.variant !== "destructive"
                                    ? "default"
                                    : "outline"
                            }
                            size="sm"
                            className={cn(
                                "h-9 shrink-0 rounded-full px-3 text-xs font-medium gap-1.5 shadow-none backdrop-blur-sm [&_svg]:size-3.5 transition-colors",
                                !isActive &&
                                    "border border-border/50 bg-background/30 hover:bg-background/50 dark:bg-background/20 dark:hover:bg-background/35",
                                isActive &&
                                    chip.variant !== "destructive" &&
                                    "border-transparent !bg-primary !text-primary-foreground hover:!bg-primary/90",
                                isActive &&
                                    chip.variant === "destructive" &&
                                    "border-transparent !bg-red-600 !text-white hover:!bg-red-700 focus-visible:ring-red-500/35 dark:!bg-red-600 dark:hover:!bg-red-700",
                                !isActive &&
                                    chip.variant === "destructive" &&
                                    "text-red-600 border-red-200/60 hover:bg-red-500/10 dark:text-red-400 dark:border-red-800/60",
                            )}
                            onClick={() => onToggle(chip.key)}
                        >
                            {chip.icon}
                            <span className="whitespace-nowrap">{chip.label}</span>
                        </Button>
                    );
                })}

                {onInsightsClick && (
                    <>
                        <div className="h-6 w-px shrink-0 bg-border/40" />
                        <div className="relative shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-full px-3 text-xs font-medium gap-1.5 shadow-none backdrop-blur-sm [&_svg]:size-3.5 transition-colors border-border/50 bg-background/30 hover:bg-background/50 dark:bg-background/20 dark:hover:bg-background/35 text-foreground/70 hover:text-foreground"
                                onClick={onInsightsClick}
                            >
                                <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Insights</span>
                            </Button>
                            {insightsCount != null && insightsCount > 0 && (
                                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold leading-none text-background tabular-nums">
                                    {insightsCount > 99 ? "99+" : insightsCount}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex w-full min-w-0 items-stretch gap-2">
            {chips.map((chip) => {
                const isActive = activeFilters.has(chip.key);
                return (
                    <Button
                        key={chip.key}
                        variant={isActive ? (chip.variant === "destructive" ? "destructive" : "default") : "outline"}
                        size="default"
                        className={cn(
                            "h-10 min-h-10 min-w-0 flex-1 basis-0 justify-center gap-2 px-2 text-sm font-medium transition-all sm:h-11 sm:min-h-11 sm:px-3",
                            isActive && chip.variant !== "destructive" && "bg-primary text-primary-foreground",
                            !isActive && chip.variant === "destructive" && "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950",
                        )}
                        onClick={() => onToggle(chip.key)}
                    >
                        {chip.icon}
                        <span className="min-w-0 truncate">{chip.label}</span>
                    </Button>
                );
            })}
        </div>
    );
};

export default OrdersPresetFilters;
