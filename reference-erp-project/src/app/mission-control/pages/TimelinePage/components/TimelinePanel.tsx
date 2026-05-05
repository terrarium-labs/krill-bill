import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { ScheduleBlock, OrderStatus } from "./timeline-data";
import { ORDER_STATUS_STYLES, MOCK_TECHNICIANS } from "./timeline-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYEE_COL_W = 220;
const HOUR_PX = 100;
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_W = HOURS.length * HOUR_PX;
const ROW_H = 44;
const HEADER_H = 28;

const TODAY = new Date();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateKey(date: Date): string { return format(date, "yyyy-MM-dd"); }
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function toPx(min: number) { return ((min - START_HOUR * 60) / 60) * HOUR_PX; }

function fmtDur(a: string, b: string) {
    const d = toMin(b) - toMin(a);
    const h = Math.floor(d / 60), m = d % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
}

function fmtHour(h: number) {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
}

function getNowPx(): number {
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    return toPx(min);
}

// ─── Block component ──────────────────────────────────────────────────────────

function Block({ block, onClickOrder }: { block: ScheduleBlock; onClickOrder?: (orderRef: string) => void }) {
    const { t } = useTranslation();
    const left = toPx(toMin(block.startTime));
    const width = toPx(toMin(block.endTime)) - left;
    const dur = fmtDur(block.startTime, block.endTime);

    if (block.type === "commuting") {
        return (
            <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                    <div
                        className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden cursor-pointer"
                        style={{ left, width }}
                    >
                        <span className="text-[10px] text-muted-foreground tabular-nums">{dur}</span>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-48" side="top">
                    <p className="font-semibold text-sm">{t("missionControl.main.timeline.commuting", "Commuting")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {block.startTime} — {block.endTime}
                        <span className="ml-2 font-medium text-foreground">{dur}</span>
                    </p>
                </HoverCardContent>
            </HoverCard>
        );
    }

    const st = ORDER_STATUS_STYLES[block.status ?? "todo"];

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div
                    className={cn(
                        "absolute top-[4px] bottom-[4px] rounded border cursor-pointer hover:brightness-95 transition-all flex flex-col items-center justify-center overflow-hidden px-1",
                        st.bg, st.border,
                    )}
                    style={{ left, width }}
                    onClick={() => block.orderRef && onClickOrder?.(block.orderRef)}
                >
                    <span className={cn("text-[11px] font-medium truncate w-full text-center leading-none", st.text)}>
                        {block.orderRef}
                    </span>
                    <span className="text-[9px] text-muted-foreground tabular-nums leading-none">{dur}</span>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-56" side="top">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{block.orderRef}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">{block.orderType}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {block.startTime} — {block.endTime}
                    <span className="ml-2 font-medium text-foreground">{dur}</span>
                </p>
                {block.address && <p className="text-xs text-muted-foreground mt-0.5 truncate">{block.address}</p>}
                <div className="mt-1.5 flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", st.bg, st.border, "border")} />
                    <span className={cn("text-xs font-medium", st.text)}>{st.label}</span>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

// ─── Now line ─────────────────────────────────────────────────────────────────

function NowLine({ isToday }: { isToday: boolean }) {
    const [px, setPx] = useState(getNowPx);

    useEffect(() => {
        if (!isToday) return;
        const id = setInterval(() => setPx(getNowPx()), 60_000);
        return () => clearInterval(id);
    }, [isToday]);

    if (!isToday || px < 0 || px > GRID_W) return null;

    return (
        <div className="absolute top-0 bottom-0 z-5 pointer-events-none w-px bg-red-500" style={{ left: px }} />
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

function weekStart(d: Date) { return startOfWeek(d, { weekStartsOn: 1 }); }

interface TimelinePanelProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    hoveredTechId: string | null;
    selectedTechId: string | null;
    onHoverTech: (id: string | null) => void;
    onSelectTech: (id: string | null) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimelinePanel({
    selectedDate,
    onDateChange,
    hoveredTechId,
    selectedTechId,
    onHoverTech,
    onSelectTech,
}: TimelinePanelProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const selKey = dateKey(selectedDate);
    const isToday = isSameDay(selectedDate, TODAY);
    const ws = useMemo(() => weekStart(selectedDate), [selectedDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws]);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return MOCK_TECHNICIANS;
        const q = searchQuery.toLowerCase();
        return MOCK_TECHNICIANS.filter((tech) => tech.name.toLowerCase().includes(q) || tech.role.toLowerCase().includes(q));
    }, [searchQuery]);

    const updateScrollShadows = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        setCanScrollUp(el.scrollTop > 0);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        updateScrollShadows();
        el.addEventListener("scroll", updateScrollShadows, { passive: true });
        const ro = new ResizeObserver(updateScrollShadows);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollShadows);
            ro.disconnect();
        };
    }, [updateScrollShadows, filtered.length]);

    useEffect(() => {
        if (!scrollContainerRef.current) return;
        if (isToday) {
            const nowPx = getNowPx();
            const visibleWidth = scrollContainerRef.current.clientWidth - EMPLOYEE_COL_W;
            scrollContainerRef.current.scrollLeft = Math.max(0, nowPx - visibleWidth / 3);
        } else {
            scrollContainerRef.current.scrollLeft = toPx(7 * 60);
        }
    }, [isToday, selKey]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Search + day selector */}
            <div className="shrink-0 flex items-center border-b">
                <div className="border-r px-2 py-1.5 shrink-0" style={{ width: EMPLOYEE_COL_W }}>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("common.search", "Search")}
                            className="h-7 pl-7 pr-7 text-xs"
                        />
                        {searchQuery && (
                            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 flex items-center">
                    {weekDays.map((day) => (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateChange(day)}
                            className={cn(
                                "flex-1 py-2 text-center text-xs font-medium transition-colors border-b-2 cursor-pointer",
                                isSameDay(day, selectedDate) ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            )}
                        >
                            <span className="block leading-tight">{format(day, "EEE")}</span>
                            <span className={cn("block tabular-nums leading-tight", isSameDay(day, TODAY) && !isSameDay(day, selectedDate) && "text-primary font-semibold")}>
                                {format(day, "d")}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="relative flex-1 min-h-0">
                <div
                    className={cn(
                        "pointer-events-none absolute top-0 left-0 right-0 z-30 h-6 transition-opacity duration-200",
                        canScrollUp ? "opacity-100" : "opacity-0",
                    )}
                    style={{ background: "linear-gradient(to bottom, var(--color-card), transparent)" }}
                />
                <div
                    className={cn(
                        "pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-6 transition-opacity duration-200",
                        canScrollDown ? "opacity-100" : "opacity-0",
                    )}
                    style={{ background: "linear-gradient(to top, var(--color-card), transparent)" }}
                />

                <div ref={scrollContainerRef} className="h-full overflow-auto">
                    <div style={{ width: EMPLOYEE_COL_W + GRID_W, minHeight: "100%" }}>
                        {/* Sticky hour header */}
                        <div className="sticky top-0 z-20 flex bg-card border-b" style={{ height: HEADER_H }}>
                            <div className="sticky left-0 z-30 shrink-0 bg-card border-r" style={{ width: EMPLOYEE_COL_W }} />
                            <div className="relative" style={{ width: GRID_W }}>
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="absolute top-0 h-full flex items-center border-l border-border/60"
                                        style={{ left: (hour - START_HOUR) * HOUR_PX, width: HOUR_PX }}
                                    >
                                        <span className="text-[11px] text-muted-foreground tabular-nums pl-2">{fmtHour(hour)}</span>
                                    </div>
                                ))}
                                <NowLine isToday={isToday} />
                            </div>
                        </div>

                        {/* Rows */}
                        {filtered.map((tech) => {
                            const blocks = tech.schedule[selKey] ?? [];
                            const pct = Math.round((tech.allocatedHours / tech.totalHours) * 100);
                            const isHovered = hoveredTechId === tech.id;
                            const isSelected = selectedTechId === tech.id;
                            return (
                                <div
                                    key={tech.id}
                                    className={cn(
                                        "flex border-b transition-colors cursor-pointer",
                                        isSelected && "bg-primary/10",
                                        isHovered && !isSelected && "bg-muted/50",
                                    )}
                                    style={{ height: ROW_H }}
                                    onMouseEnter={() => onHoverTech(tech.id)}
                                    onMouseLeave={() => onHoverTech(null)}
                                    onClick={() => onSelectTech(selectedTechId === tech.id ? null : tech.id)}
                                >
                                    <div
                                        className={cn(
                                            "sticky left-0 z-10 shrink-0 border-r flex items-center gap-2 px-2.5 transition-colors",
                                            isSelected ? "bg-muted" : isHovered ? "bg-muted" : "bg-card",
                                        )}
                                        style={{ width: EMPLOYEE_COL_W }}
                                    >
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarFallback className="text-[10px] font-semibold text-white" style={{ backgroundColor: tech.color }}>
                                                {tech.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-foreground truncate leading-tight">{tech.name}</p>
                                                <span className={cn(
                                                    "text-[10px] tabular-nums shrink-0 font-medium",
                                                    pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500",
                                                )}>
                                                    {pct}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <p className="text-[11px] text-muted-foreground leading-tight truncate">{tech.role}</p>
                                                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{tech.allocatedHours}/{tech.totalHours}h</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative" style={{ width: GRID_W }}>
                                        {HOURS.map((hour) => (
                                            <div key={hour} className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: (hour - START_HOUR) * HOUR_PX }} />
                                        ))}
                                        <NowLine isToday={isToday} />
                                        {blocks.map((block, idx) => (
                                            <Block key={idx} block={block} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                {t("common.noResults", "No results")}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-t text-xs text-muted-foreground">
                <span>{t("common.showingOf", "Showing {{count}} of {{total}}", { count: filtered.length, total: MOCK_TECHNICIANS.length })}</span>
                <div className="flex items-center gap-3">
                    {(Object.entries(ORDER_STATUS_STYLES) as [OrderStatus, typeof ORDER_STATUS_STYLES["todo"]][]).map(([key, s]) => (
                        <div key={key} className="flex items-center gap-1">
                            <div className={cn("h-2.5 w-2.5 rounded-sm border", s.bg, s.border)} />
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
