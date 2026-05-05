import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { MapPin, GanttChart, CheckCircle2, Timer, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContents,
    TabsContent,
} from "@/components/ui/shadcn-io/tabs";
import TechniciansMapWidget from "./TechniciansMapWidget";
import TechniciansTimelineWidget from "./TechniciansTimelineWidget";

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
    ];

    return (
        <div className="flex items-center divide-x divide-border py-2.5 border-b border-t">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                    <div
                        key={kpi.label}
                        className="flex items-center gap-2 px-4 first:pl-3 last:pr-3 w-full justify-center"
                    >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", kpi.accent)} />
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
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

// ─── Main wrapper ─────────────────────────────────────────────────────────────

export default function TechniciansWidget() {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    return (
        
        <Tabs defaultValue="map" className="h-full gap-0 rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5">
                <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => navigate(`/${orgId}/mission-control/timeline`)}
                >
                    <span className="font-semibold text-sm leading-none">Real Time Status Day</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 text-muted-foreground" />
                </div>
                <TabsList
                    className="flex items-center gap-2 border-none rounded-md"
                    activeClassName="border-none rounded-md"
                >
                    <TabsTrigger value="map">
                        <MapPin className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="timeline">
                        <GanttChart className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>
            </div>
         
                <KpiStrip />
               

            {/* Tab content fills remaining space */}
            <TabsContents className="flex-1 min-h-0">
                <TabsContent value="map" className="h-full gap-0">
                    <TechniciansMapWidget />
                </TabsContent>
                <TabsContent value="timeline" className="h-full gap-0">
                    <TechniciansTimelineWidget />
                </TabsContent>
            </TabsContents>
        </Tabs>
    );
}
