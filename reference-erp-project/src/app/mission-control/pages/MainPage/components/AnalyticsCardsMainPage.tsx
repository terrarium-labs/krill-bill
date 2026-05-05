import { AlertTriangle, ChevronRight, Info, OctagonAlert, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useId, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type ThemeHexPair = { light: string; dark: string };

type InsightSeverity = "critical" | "warning" | "info";

type AiInsight = {
    severity: InsightSeverity;
    title: string;
    description: string;
};

const SEVERITY_CONFIG: Record<InsightSeverity, { badge: string; icon: string; Icon: LucideIcon; pulse: boolean; chart: ThemeHexPair }> = {
    critical: {
        badge: "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25",
        icon: "text-red-500",
        Icon: OctagonAlert,
        pulse: true,
        chart: { light: "#ef4444", dark: "#f87171" },
    },
    warning: {
        badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25",
        icon: "text-amber-500",
        Icon: AlertTriangle,
        pulse: false,
        chart: { light: "#f59e0b", dark: "#fbbf24" },
    },
    info: {
        badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25",
        icon: "text-blue-500",
        Icon: Info,
        pulse: false,
        chart: { light: "#3b82f6", dark: "#60a5fa" },
    },
};

const NEUTRAL_CHART_COLOR: ThemeHexPair = { light: "#10b981", dark: "#34d399" };

export const AnalyticsCard = ({
    title,
    value,
    sparkline,
    insight,
}: {
    title: string;
    value: string;
    sparkline: number[];
    insight?: AiInsight;
}) => {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const gradientId = useId().replace(/:/g, "");
    const isDark = resolvedTheme === "dark";
    const chartColors = insight ? SEVERITY_CONFIG[insight.severity].chart : NEUTRAL_CHART_COLOR;
    const strokeHex = isDark ? chartColors.dark : chartColors.light;

    const chartData = useMemo(
        () => sparkline.map((v, i) => ({ i, v })),
        [sparkline],
    );

    return (
        <div
            className="group h-full relative flex flex-col gap-2 overflow-hidden rounded-lg border p-4 hover:bg-muted transition-all cursor-pointer"
            onClick={() => {
                navigate(`/${orgId}/mission-control/analytics`);
            }}
        >
            <div className="relative z-10 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 text-muted-foreground" />
            </div>
            <div className="relative z-10 min-h-13 flex items-end">
                <span className="text-3xl tabular-nums tracking-tight mb-2">{value}</span>
            </div>
            {insight && (() => {
                const cfg = SEVERITY_CONFIG[insight.severity];
                const SevIcon = cfg.Icon;
                return (
                    <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                            <button
                                type="button"
                                className={`absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${cfg.badge} ${cfg.pulse ? "animate-pulse" : ""}`}
                                onClick={(e) => e.stopPropagation()}
                            >   
                                <SevIcon className="h-3.5 w-3.5" />
                            </button>
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="end" className="w-72">
                            <div className="flex items-start gap-2">
                                <SevIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.icon}`} />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                );
            })()}
            <div
                className="pointer-events-none absolute inset-0 top-11 z-0"
                aria-hidden
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={strokeHex} stopOpacity={0.28} />
                                <stop offset="100%" stopColor={strokeHex} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="i" hide />
                        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke={strokeHex}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            isAnimationActive={false}
                            activeDot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export const ResourcesCard = ({
    workers,
    vehicles,
    allocatedHours,
    totalHours,
}: {
    workers: number;
    vehicles: number;
    allocatedHours: number;
    totalHours: number;
}) => {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const pct = Math.round((allocatedHours / totalHours) * 100);
    const barColor =
        pct < 50 ? "bg-red-500" : pct < 80 ? "bg-amber-500" : "bg-emerald-500";

    return (
        <div
            className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border p-4 hover:bg-muted transition-all cursor-pointer h-full"
            onClick={() => navigate(`/${orgId}/mission-control/analytics`)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Resources</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs tabular-nums">{workers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        <span className="text-xs tabular-nums">{vehicles}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl tabular-nums tracking-tight">{allocatedHours}</span>
                <span className="text-lg text-muted-foreground tabular-nums">/ {totalHours} h</span>
                <span className="text-xs text-muted-foreground tabular-nums ml-auto">{pct}% allocated</span>
            </div>

            <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${pct}%` }}
                    />
                </div>
               
            </div>
        </div>
    );
};

export const SPARKLINES: number[][] = [
    [12, 14, 13, 18, 16, 22, 20, 28, 25, 32],
    [48, 44, 46, 40, 45, 42, 50, 47, 54, 58],
    [20, 22, 19, 24, 23, 27, 26, 31, 29, 35],
    [35, 32, 36, 33, 38, 37, 41, 40, 44, 46],
];

const AnalyticsCardsMainPage = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible">
            <AnalyticsCard
                title="New WO"
                value="56"
                sparkline={SPARKLINES[0]}
                insight={{
                    severity: "warning",
                    title: "Spike detected",
                    description: "New work orders increased 40% compared to the same period last week. Consider allocating more resources.",
                }}
            />
            <AnalyticsCard
                title="WO Finished"
                value="43"
                sparkline={SPARKLINES[1]}
            />
            <AnalyticsCard
                title="Pending Schedule"
                value="18"
                sparkline={SPARKLINES[2]}
                insight={{
                    severity: "critical",
                    title: "Scheduling bottleneck",
                    description: "18 orders are waiting to be scheduled. Average wait time has increased by 2 hours since yesterday.",
                }}
            />
            <ResourcesCard
                workers={35}
                vehicles={23}
                allocatedHours={450}
                totalHours={500}
            />
        </div>
    );
};

export default AnalyticsCardsMainPage;