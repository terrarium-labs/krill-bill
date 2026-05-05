import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { addDays, format, startOfWeek } from "date-fns";
import {
    CheckCircle2,
    Timer,
    AlertTriangle,
    Users,
    Truck,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/miscelanea";
import { MissionControlLiveClock } from "@/app/mission-control/components/mission-control-live-clock";
import PageHeader from "@/app/components/page-header";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import TimelinePanel from "./components/TimelinePanel";
import MapPanel from "./components/MapPanel";

const TODAY = new Date();
function weekStart(d: Date) { return startOfWeek(d, { weekStartsOn: 1 }); }

// ─── KPI strip ────────────────────────────────────────────────────────────────

function KpiStrip() {
    const { t } = useTranslation();
    const kpis = [
        {
            label: t("missionControl.main.realTime.ordersComplete", "Orders Complete"),
            value: "10 / 150",
            icon: CheckCircle2,
            accent: "text-emerald-500",
        },
        {
            label: t("missionControl.main.realTime.avgDelay", "Avg. Time Delay"),
            value: "+12 min",
            icon: Timer,
            accent: "text-amber-500",
        },
        {
            label: t("missionControl.main.realTime.highPriority", "High Priority"),
            value: "7",
            icon: AlertTriangle,
            accent: "text-red-500",
        },
        {
            label: t("missionControl.timeline.activeWorkers", "Workers"),
            value: "35",
            icon: Users,
            accent: "text-blue-500",
        },
        {
            label: t("missionControl.timeline.vehicles", "Vehicles"),
            value: "23",
            icon: Truck,
            accent: "text-violet-500",
        },
    ];

    return (
        <div className="flex items-center divide-x divide-border py-2.5 border-b">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                    <div
                        key={kpi.label}
                        className="flex items-center gap-2 px-4 first:pl-3 last:pr-3 w-full justify-center"
                    >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", kpi.accent)} />
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
                                {kpi.value}
                            </span>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {kpi.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MissionControlTimelinePage() {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(TODAY);
    const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const [calendarOpen, setCalendarOpen] = useState(false);
    const ws = useMemo(() => weekStart(selectedDate), [selectedDate]);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
            <PageHeader
                title={t("missionControl.timeline.title", "Timeline")}
                description={
                    <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-0.5" />
                        <span>
                            {t("missionControl.main.lastUpdated", "Last updated {{date}}", {
                                date: formatDate(new Date(), {
                                    showTime: true,
                                    showDay: true,
                                    showMonth: true,
                                    showYear: true,
                                }),
                            })}
                        </span>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant="ghost" size="icon" className="h-4! w-4!" onClick={() => { }}>
                                    <RefreshCcw className="max-h-3 max-w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("missionControl.main.refresh", "Refresh now")}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                }
                onBack={() => navigate(`/${orgId}/mission-control`)}
                action={
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Week navigation with calendar popover */}
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate((d) => addDays(d, -7))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer">
                                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                                            {format(ws, "MMM d")} - {format(addDays(ws, 6), "MMM d, yyyy")}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setSelectedDate(date);
                                                setCalendarOpen(false);
                                            }
                                        }}
                                        weekStartsOn={1}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate((d) => addDays(d, 7))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedDate(new Date())}>
                            {t("common.today", "Today")}
                        </Button>

                        <div className="h-8 w-px bg-border" />

                        <MissionControlLiveClock size="xl" />

                        <div className="h-8 w-px bg-border" />

                        {/* Urgent Plan */}
                        <Button
                            variant="default"
                            className="bg-red-600 hover:bg-red-900 text-white shrink-0"
                        >
                            <AlertTriangle className="h-5 w-5" />
                            {t("missionControl.main.emergency", "Urgent Plan")}
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 min-h-0 pt-4">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
                    <ResizablePanel defaultSize={70} minSize={12}>
                        <div className="flex flex-col h-full">
                            <KpiStrip />
                            <TimelinePanel
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                hoveredTechId={hoveredTechId}
                                selectedTechId={selectedTechId}
                                onHoverTech={setHoveredTechId}
                                onSelectTech={setSelectedTechId}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={30} minSize={15}>
                        <MapPanel
                            hoveredTechId={hoveredTechId}
                            selectedTechId={selectedTechId}
                            onHoverTech={setHoveredTechId}
                            onSelectTech={setSelectedTechId}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
