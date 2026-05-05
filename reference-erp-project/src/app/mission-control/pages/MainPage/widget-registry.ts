import type { LucideIcon } from "lucide-react";
import { ClipboardList, CheckCircle2, Clock, Users, Activity, MapPin, CloudSun, AlertTriangle, CalendarRange } from "lucide-react";

/** Column counts: higher = finer horizontal placement (24 base units on large screens). */
export type WidgetDefinition = {
    id: string;
    title: string;
    icon: LucideIcon;
    defaultLayout: {
        w: number;
        h: number;
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
    };
};

export const WIDGET_REGISTRY: WidgetDefinition[] = [
    {
        id: "new-wo",
        title: "New WO",
        icon: ClipboardList,
        defaultLayout: { w: 12, h: 16, minW: 1, minH: 1 },
    },
    {
        id: "wo-finished",
        title: "WO Finished",
        icon: CheckCircle2,
        defaultLayout: { w: 12, h: 16, minW: 1, minH: 1 },
    },
    {
        id: "pending-schedule",
        title: "Pending Schedule",
        icon: Clock,
        defaultLayout: { w: 12, h: 16, minW: 1, minH: 1 },
    },
    {
        id: "resources",
        title: "Resources",
        icon: Users,
        defaultLayout: { w: 12, h: 16, minW: 1, minH: 1 },
    },
    {
        id: "events-feed",
        title: "Order Activity",
        icon: Activity,
        defaultLayout: { w: 16, h: 80, minW: 1, minH: 1 },
    },
    {
        id: "technicians-map",
        title: "Real Time Status",
        icon: MapPin,
        defaultLayout: { w: 36, h: 60, minW: 12, minH: 30 },
    },
    {
        id: "weather",
        title: "Weather",
        icon: CloudSun,
        defaultLayout: { w: 24, h: 24, minW: 12, minH: 8 },
    },
    {
        id: "urgent-orders",
        title: "Urgent Orders",
        icon: AlertTriangle,
        defaultLayout: { w: 16, h: 60, minW: 10, minH: 10 },
    },
    {
        id: "resource-allocation",
        title: "Resource Allocation",
        icon: CalendarRange,
        defaultLayout: { w: 24, h: 40, minW: 16, minH: 24 },
    },
];

export const WIDGET_IDS = WIDGET_REGISTRY.map((w) => w.id);

export function getWidget(id: string): WidgetDefinition | undefined {
    return WIDGET_REGISTRY.find((w) => w.id === id);
}

export type DefaultBreakpoint = "lg" | "md" | "sm" | "xs" | "xxs";

export const BREAKPOINTS: Record<DefaultBreakpoint, number> = {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
};

/** Fine horizontal grid: 48 base columns on large screens for precise placement. */
export const COLS: Record<DefaultBreakpoint, number> = {
    lg: 48,
    md: 48,
    sm: 48,
    xs: 48,
    xxs: 48,
};

/** Ultra-fine vertical grid: 5px per row for sub-10px vertical snapping. */
export const ROW_HEIGHT = 5;
export const MARGIN: [number, number] = [8, 8];

export const DEFAULT_LAYOUTS: Record<DefaultBreakpoint, { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number }[]> = {
    lg: [
        { i: "new-wo", x: 0, y: 0, w: 9, h: 10, minW: 1, minH: 1 },
        { i: "wo-finished", x: 9, y: 0, w: 10, h: 10, minW: 1, minH: 1 },
        { i: "pending-schedule", x: 19, y: 0, w: 10, h: 10, minW: 1, minH: 1 },
        { i: "resources", x: 29, y: 0, w: 10, h: 10, minW: 1, minH: 1 },
        { i: "events-feed", x: 39, y: 13, w: 9, h: 45, minW: 1, minH: 1 },
        { i: "technicians-map", x: 0, y: 10, w: 19, h: 49, minW: 1, minH: 1 },
        { i: "weather", x: 39, y: 0, w: 9, h: 13, minW: 1, minH: 1 },
        { i: "urgent-orders", x: 19, y: 10, w: 20, h: 21, minW: 1, minH: 1 },
        { i: "resource-allocation", x: 19, y: 31, w: 20, h: 28, minW: 16, minH: 24 },
    ],
    md: [
        { i: "new-wo", x: 0, y: 0, w: 20, h: 16, minW: 1, minH: 1 },
        { i: "wo-finished", x: 20, y: 0, w: 20, h: 16, minW: 1, minH: 1 },
        { i: "pending-schedule", x: 0, y: 16, w: 20, h: 16, minW: 1, minH: 1 },
        { i: "resources", x: 20, y: 16, w: 20, h: 16, minW: 1, minH: 1 },
        { i: "events-feed", x: 0, y: 32, w: 40, h: 64, minW: 1, minH: 1 },
        { i: "technicians-map", x: 0, y: 96, w: 48, h: 50, minW: 12, minH: 30 },
        { i: "weather", x: 0, y: 146, w: 48, h: 22, minW: 12, minH: 18 },
        { i: "urgent-orders", x: 0, y: 168, w: 48, h: 60, minW: 10, minH: 30 },
        { i: "resource-allocation", x: 0, y: 228, w: 48, h: 40, minW: 16, minH: 24 },
    ],
    sm: [
        { i: "new-wo", x: 0, y: 0, w: 12, h: 16, minW: 1, minH: 1 },
        { i: "wo-finished", x: 12, y: 0, w: 12, h: 16, minW: 1, minH: 1 },
        { i: "pending-schedule", x: 0, y: 16, w: 12, h: 16, minW: 1, minH: 1 },
        { i: "resources", x: 12, y: 16, w: 12, h: 16, minW: 1, minH: 1 },
        { i: "events-feed", x: 0, y: 32, w: 24, h: 64, minW: 1, minH: 1 },
        { i: "technicians-map", x: 0, y: 96, w: 48, h: 50, minW: 12, minH: 30 },
        { i: "weather", x: 0, y: 146, w: 48, h: 22, minW: 12, minH: 18 },
        { i: "urgent-orders", x: 0, y: 168, w: 48, h: 60, minW: 10, minH: 30 },
        { i: "resource-allocation", x: 0, y: 228, w: 48, h: 40, minW: 16, minH: 24 },
    ],
    xs: [
        { i: "new-wo", x: 0, y: 0, w: 16, h: 16, minW: 1, minH: 1 },
        { i: "wo-finished", x: 0, y: 16, w: 16, h: 16, minW: 1, minH: 1 },
        { i: "pending-schedule", x: 0, y: 32, w: 16, h: 16, minW: 1, minH: 1 },
        { i: "resources", x: 0, y: 48, w: 16, h: 16, minW: 1, minH: 1 },
        { i: "events-feed", x: 0, y: 64, w: 16, h: 64, minW: 1, minH: 1 },
        { i: "technicians-map", x: 0, y: 128, w: 48, h: 50, minW: 12, minH: 30 },
        { i: "weather", x: 0, y: 178, w: 48, h: 22, minW: 12, minH: 18 },
        { i: "urgent-orders", x: 0, y: 200, w: 48, h: 60, minW: 10, minH: 30 },
        { i: "resource-allocation", x: 0, y: 260, w: 48, h: 40, minW: 16, minH: 24 },
    ],
    xxs: [
        { i: "new-wo", x: 0, y: 0, w: 8, h: 16, minW: 1, minH: 1 },
        { i: "wo-finished", x: 0, y: 16, w: 8, h: 16, minW: 1, minH: 1 },
        { i: "pending-schedule", x: 0, y: 32, w: 8, h: 16, minW: 1, minH: 1 },
        { i: "resources", x: 0, y: 48, w: 8, h: 16, minW: 1, minH: 1 },
        { i: "events-feed", x: 0, y: 64, w: 8, h: 64, minW: 1, minH: 1 },
        { i: "technicians-map", x: 0, y: 128, w: 48, h: 50, minW: 12, minH: 30 },
        { i: "weather", x: 0, y: 178, w: 48, h: 24, minW: 12, minH: 18 },
        { i: "urgent-orders", x: 0, y: 202, w: 48, h: 60, minW: 10, minH: 30 },
        { i: "resource-allocation", x: 0, y: 262, w: 48, h: 40, minW: 16, minH: 24 },
    ],
};
