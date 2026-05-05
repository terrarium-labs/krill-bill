import { memo } from "react";
import {
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ScatterChart, Scatter,
    ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";

interface TooltipEntry {
    name?: string;
    value?: number | string;
    color?: string;
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string | number }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
            {label != null && (
                <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
            )}
            <div className="flex flex-col gap-0.5">
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-[11px] text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-foreground tabular-nums">
                            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

type ChartType = "line" | "bar" | "area" | "pie" | "radar" | "scatter" | "composed";

interface SeriesConfig {
    key: string;
    label?: string;
    color?: string;
    /** For composed charts: "line" | "bar" | "area" */
    type?: "line" | "bar" | "area";
    /** Whether area/line is filled (area only) */
    fill?: boolean;
    stackId?: string;
}

export interface ChartWidgetData {
    chartType: ChartType;
    data: Record<string, any>[];
    series: SeriesConfig[];
    xKey?: string;
    /** Show grid lines */
    grid?: boolean;
    /** Show legend */
    legend?: boolean;
}

// Default palette — cycles through when no color given
const PALETTE = [
    "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b",
    "#ef4444", "#ec4899", "#3b82f6", "#a3e635",
];

const color = (s: SeriesConfig, i: number) => s.color ?? PALETTE[i % PALETTE.length];

const ChartWidget = memo(({ data }: { data: ChartWidgetData }) => {
    const { chartType, data: chartData, series, xKey = "name", grid = true, legend = false } = data;

    const commonAxis = (
        <>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<ChartTooltip />} />
            {legend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </>
    );

    const renderChart = () => {
        switch (chartType) {
            case "line":
                return (
                    <LineChart data={chartData}>
                        {commonAxis}
                        {series.map((s, i) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label ?? s.key}
                                stroke={color(s, i)}
                                dot={false}
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                );

            case "area":
                return (
                    <AreaChart data={chartData}>
                        {commonAxis}
                        {series.map((s, i) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label ?? s.key}
                                stroke={color(s, i)}
                                fill={color(s, i)}
                                fillOpacity={0.15}
                                strokeWidth={2}
                                stackId={s.stackId}
                                isAnimationActive={false}
                            />
                        ))}
                    </AreaChart>
                );

            case "bar":
                return (
                    <BarChart data={chartData}>
                        {commonAxis}
                        {series.map((s, i) => (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.label ?? s.key}
                                fill={color(s, i)}
                                radius={[3, 3, 0, 0]}
                                stackId={s.stackId}
                                isAnimationActive={false}
                            />
                        ))}
                    </BarChart>
                );

            case "pie": {
                const pieKey = series[0]?.key ?? "value";
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={pieKey}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            innerRadius="40%"
                            outerRadius="70%"
                            paddingAngle={2}
                            label={({ name, percent }) =>
                                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                            isAnimationActive={false}
                        >
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        {legend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    </PieChart>
                );
            }

            case "radar":
                return (
                    <RadarChart data={chartData}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10 }} />
                        <Tooltip content={<ChartTooltip />} />
                        {legend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                        {series.map((s, i) => (
                            <Radar
                                key={s.key}
                                dataKey={s.key}
                                name={s.label ?? s.key}
                                stroke={color(s, i)}
                                fill={color(s, i)}
                                fillOpacity={0.2}
                                isAnimationActive={false}
                            />
                        ))}
                    </RadarChart>
                );

            case "scatter":
                return (
                    <ScatterChart>
                        {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
                        <XAxis type="number" dataKey={xKey} name={xKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis type="number" dataKey={series[0]?.key} name={series[0]?.label ?? series[0]?.key} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                        {legend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                        {series.map((s, i) => (
                            <Scatter
                                key={s.key}
                                name={s.label ?? s.key}
                                data={chartData}
                                fill={color(s, i)}
                                isAnimationActive={false}
                            />
                        ))}
                    </ScatterChart>
                );

            case "composed":
                return (
                    <ComposedChart data={chartData}>
                        {commonAxis}
                        {series.map((s, i) => {
                            const c = color(s, i);
                            if (s.type === "bar")
                                return <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={c} radius={[3, 3, 0, 0]} stackId={s.stackId} isAnimationActive={false} />;
                            if (s.type === "area")
                                return <Area key={s.key} type="monotone" dataKey={s.key} name={s.label ?? s.key} stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} stackId={s.stackId} isAnimationActive={false} />;
                            return <Line key={s.key} type="monotone" dataKey={s.key} name={s.label ?? s.key} stroke={c} dot={false} strokeWidth={2} isAnimationActive={false} />;
                        })}
                    </ComposedChart>
                );

            default:
                return null;
        }
    };

    return (
        <div className="px-2 pt-1">
            <ResponsiveContainer width="100%" height={200}>
                {renderChart() ?? <div />}
            </ResponsiveContainer>
        </div>
    );
});

ChartWidget.displayName = "ChartWidget";

export default ChartWidget;
