import { useMemo } from "react";
import { Responsive, useContainerWidth, verticalCompactor } from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { cn } from "@/lib/utils";
import DashboardWidget from "./DashboardWidget";
import { AnalyticsCard, ResourcesCard, SPARKLINES } from "./AnalyticsCardsMainPage";
import EventsCardsMainPage from "./EventsCardsMainPage";
import TechniciansWidget from "./TechniciansWidget";
import WeatherWidget from "./WeatherWidget";
import UrgentOrdersWidget from "./UrgentOrdersWidget";
import ResourceAllocationWidget from "./ResourceAllocationWidget";
import {
    WIDGET_REGISTRY,
    BREAKPOINTS,
    COLS,
    ROW_HEIGHT,
    MARGIN,
    type DefaultBreakpoint,
} from "../widget-registry";

interface DashboardGridProps {
    layouts: ResponsiveLayouts<DefaultBreakpoint>;
    isEditing: boolean;
    onLayoutChange: (layout: Layout, allLayouts: ResponsiveLayouts<DefaultBreakpoint>) => void;
}

function renderWidgetContent(widgetId: string) {
    switch (widgetId) {
        case "new-wo":
            return (
                <AnalyticsCard
                    title="New WO"
                    value="56"
                    sparkline={SPARKLINES[0]}
                    insight={{
                        severity: "warning",
                        title: "Spike detected",
                        description:
                            "New work orders increased 40% compared to the same period last week. Consider allocating more resources.",
                    }}
                />
            );
        case "wo-finished":
            return (
                <AnalyticsCard
                    title="WO Finished"
                    value="43"
                    sparkline={SPARKLINES[1]}
                />
            );
        case "pending-schedule":
            return (
                <AnalyticsCard
                    title="Pending Schedule"
                    value="18"
                    sparkline={SPARKLINES[2]}
                    insight={{
                        severity: "critical",
                        title: "Scheduling bottleneck",
                        description:
                            "18 orders are waiting to be scheduled. Average wait time has increased by 2 hours since yesterday.",
                    }}
                />
            );
        case "resources":
            return (
                <ResourcesCard
                    workers={35}
                    vehicles={23}
                    allocatedHours={450}
                    totalHours={500}
                />
            );
        case "events-feed":
            return <EventsCardsMainPage />;
        case "technicians-map":
            return <TechniciansWidget />;
        case "weather":
            return <WeatherWidget />;
        case "urgent-orders":
            return <UrgentOrdersWidget />;
        case "resource-allocation":
            return <ResourceAllocationWidget />;
        default:
            return null;
    }
}

export default function DashboardGrid({ layouts, isEditing, onLayoutChange }: DashboardGridProps) {
    const { width, containerRef, mounted } = useContainerWidth();

    const widgets = useMemo(
        () =>
            WIDGET_REGISTRY.map((def) => (
                <DashboardWidget
                    key={def.id}
                    title={def.title}
                    icon={def.icon}
                    isEditing={isEditing}
                >
                    {renderWidgetContent(def.id)}
                </DashboardWidget>
            )),
        [isEditing],
    );

    return (
        <div
            ref={containerRef}
            className={cn("flex-1 min-h-0", !isEditing && "mission-control-dashboard--view")}
        >
            {mounted && (
                <Responsive
                    width={width}
                    layouts={layouts}
                    breakpoints={BREAKPOINTS}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    margin={MARGIN}
                    containerPadding={[0, 0]}
                    compactor={verticalCompactor}
                    dragConfig={{
                        enabled: isEditing,
                        handle: ".dashboard-drag-handle",
                        threshold: 3,
                        bounded: false,
                    }}
                    resizeConfig={{
                        enabled: isEditing,
                        handles: ["se"],
                    }}
                    onLayoutChange={onLayoutChange}
                    autoSize
                >
                    {widgets}
                </Responsive>
            )}
        </div>
    );
}
