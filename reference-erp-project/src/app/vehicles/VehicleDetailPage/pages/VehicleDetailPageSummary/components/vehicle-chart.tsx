import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatDate, formatDateForAPI, formatDecimal } from "@/utils/miscelanea";
import { VehicleKilometersOverview } from "@/types/general/vehicles";
import { Employee } from "@/types/employees/employees";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

// ─── Colors ───────────────────────────────────────────────────────────────────
// Color names drive both the SVG bar fills (hex) and the tooltip swatches
// (Tailwind bg/border via the miscelanea utility functions).

// SVG bar fill colors (solid)
const PLANNED_SVG_COLOR = "#6b7280"; // gray-500
const ACTUAL_SVG_COLORS = {
    green: "#22c55e", // green-500
    red:   "#ef4444", // red-500
} as const;

// Tooltip swatches: solid border + same color at 25 % opacity for the fill
// Appending "40" to a 6-digit hex gives ~25 % alpha.
type ActualColorName = "green" | "red";

const getActualColorName = (actual: number, predicted: number): ActualColorName =>
    actual > 0 && actual > predicted ? "red" : "green";

const ACTUAL_SVG_COLOR: Record<ActualColorName, string> = ACTUAL_SVG_COLORS;

const swatchStyle = (hex: string): React.CSSProperties => ({
    borderColor: hex,
    backgroundColor: hex + "40",
});

// ─── Custom bar shapes ────────────────────────────────────────────────────────

/**
 * Both bars are overlaid at the group column centre.
 * Recharts assigns:
 *   Bar 1 (planned): x = group_left,      width = w  → group centre = x + w
 *   Bar 2 (actual):  x = group_left + w,  width = w  → group centre = x  (same point)
 *
 * OutlineBar: barX = x + w - innerWidth/2   (centres at group_left + w)
 * FilledBar:  barX = x   - innerWidth/2     (centres at group_left + w, same)
 *
 * Planned renders first (behind), actual renders on top.
 */
const CHART_HEIGHT = 95; // must match ResponsiveContainer height (bar area + label area)
const BAR_INNER_RATIO    = 0.75; // fraction of the slot width used by each bar

const OutlineBar = (props: any) => {
    const { x, y, width, height, payload, selectedDate } = props;
    const isSelected  = selectedDate && payload?.date === selectedDate;
    const groupWidth  = width * 2;
    const innerWidth  = width * BAR_INNER_RATIO;
    const barX        = x + width - innerWidth / 2; // centred at group column centre
    const rx          = Math.min(innerWidth / 2, 6);

    // When actual > planned, FilledBar handles both rects in the correct order.
    // OutlineBar only draws the planned bar when planned is taller (or equal),
    // i.e. planned is behind the actual bar — avoids double opacity otherwise.
    const actual    = payload?.actual    ?? 0;
    const predicted = payload?.predicted ?? 0;
    const drawPlanned = height > 0 && predicted >= actual;

    return (
        <g>
            {/* Invisible full-column rect for hit area — matches selection highlight bounds */}
            <rect
                x={x - 2}
                y={0}
                width={groupWidth + 4}
                height={CHART_HEIGHT}
                fill="transparent"
                style={{ pointerEvents: "all" }}
            />
            {/* Persistent column highlight (bar + label area) */}
            {isSelected && (
                <rect
                    x={x - 2}
                    y={0}
                    width={groupWidth + 4}
                    height={CHART_HEIGHT}
                    fill="var(--primary)"
                    opacity={0.1}
                    rx={2}
                />
            )}
            {drawPlanned && (
                <rect
                    x={barX}
                    y={y}
                    width={innerWidth}
                    height={height}
                    fill={PLANNED_SVG_COLOR}
                    fillOpacity={0.25}
                    stroke={PLANNED_SVG_COLOR}
                    strokeWidth={1}
                    rx={rx}
                />
            )}
        </g>
    );
};

const FilledBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    const groupWidth = width * 2;
    if (!height || height <= 0) return null;

    const innerWidth  = width * BAR_INNER_RATIO;
    const barX        = x - innerWidth / 2; // centred at group column centre
    const actual      = payload?.actual    ?? 0;
    const predicted   = payload?.predicted ?? 0;
    const colorName   = getActualColorName(actual, predicted);
    const actualColor = ACTUAL_SVG_COLOR[colorName];
    const rx          = Math.min(innerWidth / 2, 6);

    // When actual > predicted: actual is taller → render actual behind, planned in front.
    // The planned bar height is derived proportionally from the shared axis scale.
    if (actual > predicted) {
        return (
            <g>
                <rect x={x - width - 2} y={0} width={groupWidth + 4} height={CHART_HEIGHT} fill="transparent" style={{ pointerEvents: "all" }} />
                <rect x={barX} y={y} width={innerWidth} height={height}
                    fill={actualColor} fillOpacity={0.25} stroke={actualColor} strokeWidth={1} rx={rx} />
            </g>
        );
    }

    // actual <= predicted: actual is shorter or equal → render on top of planned.
    // Background punch-out hides the planned bar behind the actual bar area.
    return (
        <g>
            <rect x={x - width - 2} y={0} width={groupWidth + 4} height={CHART_HEIGHT} fill="transparent" style={{ pointerEvents: "all" }} />
            <rect x={barX} y={y} width={innerWidth} height={height}
                fill="var(--background)" fillOpacity={1} rx={rx} />
            <rect x={barX} y={y} width={innerWidth} height={height}
                fill={actualColor} fillOpacity={0.25} stroke={actualColor} strokeWidth={1} rx={rx} />
        </g>
    );
};

// ─── Custom tooltip (shown on column hover) ───────────────────────────────────

const TOOLTIP_OFFSET = 12;

const ChartTooltip = ({
    entry,
    chartRef,
    columnCenterX,
    predictedLabel,
    actualLabel,
    balanceLabel,
    totalCostLabel,
    driversLabel,
}: {
    entry: { date: string; predicted: number; actual: number; hasActual: boolean; costPerKm: number; drivers: Employee[] };
    chartRef: React.RefObject<HTMLDivElement | null>;
    columnCenterX: number;
    predictedLabel: string;
    actualLabel: string;
    balanceLabel: string;
    totalCostLabel: string;
    driversLabel: string;
}) => {
    if (!chartRef.current) return null;
    const rect = chartRef.current.getBoundingClientRect();
    const totalCost = entry.costPerKm > 0 ? entry.costPerKm * entry.actual : 0;
    const costPerKm = entry.actual > 0 && totalCost > 0 ? totalCost / entry.actual : 0;
    const actualColorName = getActualColorName(entry.actual, entry.predicted);

    return createPortal(
        <div
            className="fixed rounded-lg border bg-background px-3 py-2 shadow-md text-sm space-y-1 min-w-[160px] w-max max-w-[min(90vw,400px)] pointer-events-none z-50"
            style={{
                left: rect.left + columnCenterX,
                top: rect.bottom + TOOLTIP_OFFSET,
                transform: "translate(-50%, 0)",
                transition: "left 0.2s ease-out",
            }}
        >
            <p className="font-medium text-foreground">
                {formatDate(entry.date, { showTime: false, showDayName: true, showMonth: false, showYear: false })}
            </p>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded-sm border" style={swatchStyle(PLANNED_SVG_COLOR)} />
                    {predictedLabel}
                </span>
                <span className="font-medium">
                    {formatDecimal(entry.predicted, { minFractionDigits: 0, maxFractionDigits: 2 })} km
                </span>
            </div>
            {entry.hasActual && (() => {
                const balance = entry.actual - entry.predicted;
                const isOver = balance >= 0;
                const balanceColor = isOver ? ACTUAL_SVG_COLORS.red : ACTUAL_SVG_COLORS.green;
                const ArrowIcon = isOver ? ArrowUp : ArrowDown;
                return (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="inline-block w-3 h-3 rounded-sm border" style={swatchStyle(ACTUAL_SVG_COLORS[actualColorName])} />
                                {actualLabel}
                            </span>
                            <span className="font-medium">
                                {formatDecimal(entry.actual, { minFractionDigits: 0, maxFractionDigits: 2 })} km
                            </span>
                        </div>
                        {balance !== 0 && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">{balanceLabel}</span>
                                <span className="flex items-center gap-1 font-medium" style={{ color: balanceColor }}>
                                    <ArrowIcon className="h-3 w-3" />
                                    {formatDecimal(Math.abs(balance), { minFractionDigits: 0, maxFractionDigits: 2 })} km
                                </span>
                            </div>
                        )}
                    </>
                );
            })()}
            {totalCost > 0 && (
                <>
                    <div className="border-t border-border my-1" />
                    <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">{totalCostLabel}</span>
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="font-medium">
                                {formatDecimal(totalCost, { minFractionDigits: 2, maxFractionDigits: 2 })} €
                            </span>
                            {costPerKm > 0 && (
                                <span className="text-muted-foreground text-xs">
                                    ({formatDecimal(costPerKm, { minFractionDigits: 2, maxFractionDigits: 2 })} €/km)
                                </span>
                            )}
                        </div>
                    </div>
                </>
            )}
            {entry.drivers && entry.drivers.length > 0 && (
                <>
                    <div className="border-t border-border my-1" />
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{driversLabel}</span>
                        <div className="flex items-center gap-1">
                            <div className="flex -space-x-1.5">
                                {entry.drivers.slice(0, 4).map((driver: Employee) => (
                                    <EmployeeAvatar key={driver.id} employee={driver} showName={false} size="sm" />
                                ))}
                            </div>
                            {entry.drivers.length > 4 && (
                                <span className="text-xs text-muted-foreground ml-1">+{entry.drivers.length - 4}</span>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>,
        document.body
    );
};

// ─── Custom X-axis tick — highlights today with primary color ─────────────────

const CustomXTick = ({ x, y, payload, todayLabel }: any) => {
    const isToday = payload?.value === todayLabel;
    const BOX = 13; // border box size in px
    return (
        <g transform={`translate(${x},${y + 2})`}>
            <text
                x={0}
                y={BOX / 2}
                dy="0.35em"
                textAnchor="middle"
                fontSize={9}
                fill={isToday ? "var(--primary)" : "var(--muted-foreground)"}
                fontWeight={ 400}
            >
                {payload?.value}
            </text>
        </g>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface VehicleChartProps {
    data: VehicleKilometersOverview[];
    fromDate: Date;
    toDate: Date;
    isLoading?: boolean;
    selectedDate?: string;
    onDateSelect?: (date: string) => void;
}

const VehicleChart = ({
    data,
    fromDate,
    toDate,
    isLoading = false,
    selectedDate,
    onDateSelect,
}: VehicleChartProps) => {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Build an aggregated lookup keyed on YYYY-MM-DD.
    // The API may return full ISO timestamps ("2026-02-23T00:00:00Z") and/or
    // multiple entries per calendar day — both are normalised and summed here.
    // Drivers from item.drivers are merged and deduped by id per day.
    const dataByDay = useMemo(() => {
        const map = new Map<string, { predicted: number; actual: number; costPerKm: number; drivers: Employee[] }>();
        const toEmployee = (x: Employee | { employee: Employee }): Employee =>
            "employee" in x ? x.employee : x;
        for (const d of data) {
            const key = d.day.slice(0, 10); // "YYYY-MM-DD"
            const existing = map.get(key);
            const drivers = (d.drivers ?? []).map(toEmployee);
            if (existing) {
                existing.predicted += d.predicted_kilometers;
                existing.actual += d.real_kilometers;
                const seen = new Set(existing.drivers.map((e) => e.id));
                for (const emp of drivers) {
                    if (!seen.has(emp.id)) {
                        seen.add(emp.id);
                        existing.drivers.push(emp);
                    }
                }
            } else {
                map.set(key, {
                    predicted: d.predicted_kilometers,
                    actual: d.real_kilometers,
                    costPerKm: d.cost_per_km ?? 0,
                    drivers: [...drivers],
                });
            }
        }
        return map;
    }, [data]);

    // Generate a slot for every calendar day in the range, filling missing
    // days with zeros so the chart always shows the full month grid.
    const chartData = useMemo(() => {
        const slots = [];
        const cursor = new Date(fromDate);
        cursor.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(0, 0, 0, 0);

        while (cursor <= end) {
            const key = formatDateForAPI(cursor);
            const entry = dataByDay.get(key);
            slots.push({
                date: key,
                label: String(cursor.getDate()),
                predicted: entry?.predicted ?? 0,
                actual: entry?.actual ?? 0,
                hasActual: (entry?.actual ?? 0) > 0,
                costPerKm: entry?.costPerKm ?? 0,
                drivers: entry?.drivers ?? [],
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        return slots;
    }, [fromDate, toDate, dataByDay]);

    const chartRef = useRef<HTMLDivElement>(null);

    const todayLabel = String(new Date().getDate());
    const predictedLabel = t("vehicles.predictedKm", "Predicted");
    const actualLabel = t("vehicles.actualKm", "Actual");
    const balanceLabel = t("vehicles.balance", "Balance");
    const totalCostLabel = t("vehicles.totalCost", "Total cost");
    const driversLabel = t("vehicles.drivers", "Drivers");

    const handleBarHover = (index: number | null) => setHoveredIndex(index);
    const handleBarClick = (_e: unknown, payloadOrIndex: unknown) => {
        if (!onDateSelect) return;
        const date =
            typeof payloadOrIndex === "number"
                ? chartData[payloadOrIndex]?.date
                : (payloadOrIndex as { date?: string })?.date;
        if (date) onDateSelect(date);
    };

    const columnCenterX = hoveredIndex !== null && chartRef.current
        ? ((hoveredIndex + 0.5) / chartData.length) * chartRef.current.getBoundingClientRect().width
        : 0;

    return (
        <div
            ref={chartRef}
            className={cn(
                "w-full relative outline-none [&_*]:outline-none",
                onDateSelect && "cursor-pointer [&_svg]:cursor-pointer"
            )}
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseDown={(e) => e.preventDefault()}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
            {hoveredIndex !== null && chartData[hoveredIndex] && (
                <ChartTooltip
                    entry={chartData[hoveredIndex]}
                    chartRef={chartRef}
                    columnCenterX={columnCenterX}
                    predictedLabel={predictedLabel}
                    actualLabel={actualLabel}
                    balanceLabel={balanceLabel}
                    totalCostLabel={totalCostLabel}
                    driversLabel={driversLabel}
                />
            )}
            <ResponsiveContainer width="100%" height={95}>
                <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 0, left: -32, bottom: 0 }}
                    barCategoryGap="20%"
                    barGap={0}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                    />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={(props: any) => <CustomXTick {...props} todayLabel={todayLabel} />}
                    />
                    {/* Predicted — yellow fill (rendered first = behind); has full-column hit area */}
                    <Bar
                        dataKey="predicted"
                        maxBarSize={12}
                        shape={<OutlineBar selectedDate={selectedDate} />}
                        isAnimationActive={false}
                        activeBar={false}
                        onMouseEnter={(_e, payloadOrIndex) => {
                            const idx =
                                typeof payloadOrIndex === "number"
                                    ? payloadOrIndex
                                    : chartData.findIndex((d) => d.date === (payloadOrIndex as { date?: string })?.date);
                            handleBarHover(idx >= 0 ? idx : null);
                        }}
                        onClick={handleBarClick}
                    />
                    {/* Actual — blue fill (rendered second = in front) */}
                    <Bar
                        dataKey="actual"
                        maxBarSize={12}
                        shape={<FilledBar selectedDate={selectedDate} />}
                        isAnimationActive={false}
                        activeBar={false}
                        onMouseEnter={(_e, payloadOrIndex) => {
                            const idx =
                                typeof payloadOrIndex === "number"
                                    ? payloadOrIndex
                                    : chartData.findIndex((d) => d.date === (payloadOrIndex as { date?: string })?.date);
                            handleBarHover(idx >= 0 ? idx : null);
                        }}
                        onClick={handleBarClick}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VehicleChart;
