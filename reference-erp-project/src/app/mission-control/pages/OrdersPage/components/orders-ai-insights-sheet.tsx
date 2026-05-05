import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BrainCircuit, Clock, UserX, Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ChartWidget from "@/app/chat/components/widgets/ChartWidget";
import ActionSuggestionWidget from "@/app/chat/components/widgets/ActionSuggestionWidget";
import SuggestedResponsesWidget from "@/app/chat/components/widgets/SuggestedResponsesWidget";
import ButtonListWidget from "@/app/chat/components/widgets/ButtonListWidget";

interface OrdersAIInsightsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ── Synthetic data ─────────────────────────────────────────────────────────────

const completionTrendData = {
    chartType: "area" as const,
    xKey: "day",
    grid: true,
    legend: true,
    data: [
        { day: "Mon", completed: 8,  open: 14 },
        { day: "Tue", completed: 12, open: 11 },
        { day: "Wed", completed: 6,  open: 17 },
        { day: "Thu", completed: 15, open: 9  },
        { day: "Fri", completed: 10, open: 13 },
        { day: "Sat", completed: 4,  open: 6  },
        { day: "Sun", completed: 2,  open: 4  },
    ],
    series: [
        { key: "completed", label: "Completed", color: "#22c55e" },
        { key: "open",      label: "Open",      color: "#f59e0b" },
    ],
};

const priorityDistributionData = {
    chartType: "pie" as const,
    xKey: "priority",
    data: [
        { priority: "Urgent", value: 7  },
        { priority: "High",   value: 18 },
        { priority: "Medium", value: 34 },
        { priority: "Low",    value: 21 },
    ],
    series: [{ key: "value" }],
    legend: true,
};

const techWorkloadData = {
    chartType: "bar" as const,
    xKey: "name",
    grid: true,
    data: [
        { name: "Alice",   assigned: 9,  completed: 7 },
        { name: "Bob",     assigned: 14, completed: 8 },
        { name: "Carlos",  assigned: 6,  completed: 6 },
        { name: "Diana",   assigned: 11, completed: 5 },
        { name: "Ethan",   assigned: 3,  completed: 3 },
    ],
    series: [
        { key: "assigned",  label: "Assigned",  color: "#8b5cf6" },
        { key: "completed", label: "Completed", color: "#22c55e" },
    ],
    legend: true,
};

const actionsData = {
    actions: [
        {
            label: "5 orders overdue — reassign today",
            description: "WO-112, WO-098, WO-087, WO-076, WO-054 passed their due date",
            message: "Show me the 5 overdue work orders and suggest reassignment options",
            icon: "solar:clock-circle-linear",
            color: "red",
        },
        {
            label: "Bob has 14 open orders — heaviest load",
            description: "Consider redistributing 3–4 orders to Ethan who has capacity",
            message: "Help me redistribute Bob's workload to balance the team",
            icon: "solar:user-linear",
            color: "orange",
        },
        {
            label: "12 completed orders not billed",
            description: "Unbilled orders from last week are ready for invoicing",
            message: "List the completed unbilled orders and prepare invoices",
            icon: "solar:receipt-linear",
            color: "blue",
        },
    ],
};

const suggestedResponsesData = {
    responses: [
        { label: "Show urgent orders" },
        { label: "Who has capacity today?" },
        { label: "Summarise this week" },
        { label: "Generate billing report" },
        { label: "Orders without supervisor" },
    ],
};

const quickActionsData = {
    layout: "row" as const,
    buttons: [
        { label: "Bulk reassign", message: "Help me bulk reassign overdue orders",           icon: "solar:user-bold"     },
        { label: "Export report",  message: "Export a summary report of today's orders",      icon: "solar:export-linear" },
        { label: "Send alerts",    message: "Send alerts to technicians with overdue orders", icon: "solar:bell-linear"   },
    ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    trend?: "up" | "down" | "neutral";
    colorClass: string;
    bgClass: string;
    borderClass: string;
}

const KpiCard = ({ icon, label, value, sub, trend, colorClass, bgClass, borderClass }: KpiCardProps) => {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    return (
        <div className={`flex flex-col gap-1.5 rounded-lg border p-3 ${bgClass} ${borderClass}`}>
            <div className={`flex items-center gap-1.5 ${colorClass}`}>
                {icon}
                <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-end justify-between gap-1">
                <span className={`text-2xl font-semibold tabular-nums leading-none ${colorClass}`}>{value}</span>
                {trend && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground mb-0.5">
                        <TrendIcon className="h-3 w-3" />
                        {sub}
                    </span>
                )}
            </div>
            {!trend && sub && <span className="text-[11px] text-muted-foreground leading-snug">{sub}</span>}
        </div>
    );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{children}</p>
);

// ─────────────────────────────────────────────────────────────────────────────

const OrdersAIInsightsSheet = ({ open, onOpenChange }: OrdersAIInsightsSheetProps) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-104 flex flex-col p-0 gap-0 overflow-hidden">

                {/* Header */}
                <div className="relative shrink-0 border-b border-border/60 bg-card px-5 pb-4 pt-5">
                    {/* subtle gradient accent */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-foreground/20 to-transparent" />

                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
                            <BrainCircuit className="h-4.5 w-4.5 text-foreground/70" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <h2 className="text-sm font-semibold leading-tight">AI Insights</h2>
                            <p className="text-xs text-muted-foreground">
                                Analysed 80 orders &middot; updated just now
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 flex flex-col gap-6">

                    {/* KPI snapshot */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>At a glance</SectionLabel>
                        <div className="grid grid-cols-3 gap-2">
                            <KpiCard
                                icon={<Clock className="h-3.5 w-3.5 shrink-0" />}
                                label="Overdue"
                                value={5}
                                sub="+2 vs yesterday"
                                trend="up"
                                colorClass="text-red-500 dark:text-red-400"
                                bgClass="bg-red-500/5"
                                borderClass="border-red-500/20"
                            />
                            <KpiCard
                                icon={<UserX className="h-3.5 w-3.5 shrink-0" />}
                                label="Unassigned"
                                value={8}
                                sub="same as yesterday"
                                trend="neutral"
                                colorClass="text-amber-500 dark:text-amber-400"
                                bgClass="bg-amber-500/5"
                                borderClass="border-amber-500/20"
                            />
                            <KpiCard
                                icon={<Receipt className="h-3.5 w-3.5 shrink-0" />}
                                label="Unbilled"
                                value={12}
                                sub="ready to invoice"
                                colorClass="text-blue-500 dark:text-blue-400"
                                bgClass="bg-blue-500/5"
                                borderClass="border-blue-500/20"
                            />
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Suggested actions */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Suggested actions</SectionLabel>
                        <ActionSuggestionWidget data={actionsData} />
                    </div>

                    <Separator className="opacity-50" />

                    {/* Charts */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Orders this week</SectionLabel>
                        <ChartWidget data={completionTrendData} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Priority breakdown</SectionLabel>
                        <ChartWidget data={priorityDistributionData} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Technician workload</SectionLabel>
                        <ChartWidget data={techWorkloadData} />
                    </div>

                    <Separator className="opacity-50" />

                    {/* Ask & quick actions */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Ask Charles</SectionLabel>
                        <SuggestedResponsesWidget data={suggestedResponsesData} />
                    </div>

                    <div className="flex flex-col gap-2 pb-2">
                        <SectionLabel>Quick actions</SectionLabel>
                        <ButtonListWidget data={quickActionsData} />
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
};

export default OrdersAIInsightsSheet;
