import { AlertTriangle, CalendarClock, ChevronRight, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import IdBadge from "@/app/components/id-badge";
import PriorityLabel from "@/app/components/labels/priority-label";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import DateLabel from "@/app/components/labels/date-label";
import type { TicketWorkOrderPriority } from "@/types/field-service/ticket-work-order-types";
import type { BasicLocation } from "@/types/general/location";
import type { BasicClient } from "@/types/clients/client";

type MockUrgentOrder = {
    id: string;
    name: string;
    priority: TicketWorkOrderPriority;
    client: BasicClient;
    location: BasicLocation;
    due_date: string;
    time_estimate: number | null;
};

const mockClient = (id: string, trade_name: string): BasicClient => ({
    id,
    trade_name,
});

const mockLocation = (id: string, name: string): BasicLocation => ({
    id,
    name,
    city: "",
    country: "",
    icon_url: null,
});

const MOCK_URGENT_ORDERS: MockUrgentOrder[] = [
    {
        id: "ORD-2871",
        name: "Gas leak – residential block A3",
        priority: "urgent",
        client: mockClient("c-1", "Edenor S.A."),
        location: mockLocation("loc-1", "Av. Libertador 4200"),
        due_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        time_estimate: 120,
    },
    {
        id: "ORD-2865",
        name: "Power outage – commercial zone",
        priority: "urgent",
        client: mockClient("c-2", "Metrogas"),
        location: mockLocation("loc-2", "Calle San Martín 890"),
        due_date: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
        time_estimate: 90,
    },
    {
        id: "ORD-2860",
        name: "Water main break – hospital area",
        priority: "urgent",
        client: mockClient("c-3", "AySA"),
        location: mockLocation("loc-3", "Ruta 9 km 42"),
        due_date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        time_estimate: 180,
    },
    {
        id: "ORD-2858",
        name: "Elevator stuck – 12th floor",
        priority: "high",
        client: mockClient("c-4", "Torre Mirador"),
        location: mockLocation("loc-4", "Av. Córdoba 1520"),
        due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        time_estimate: 60,
    },
    {
        id: "ORD-2852",
        name: "Fire alarm – warehouse sector B",
        priority: "high",
        client: mockClient("c-5", "Logística Norte"),
        location: mockLocation("loc-5", "Parque Industrial Lote 7"),
        due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        time_estimate: null,
    },
    {
        id: "ORD-2849",
        name: "Transformer failure – grid 14",
        priority: "high",
        client: mockClient("c-6", "Edesur S.A."),
        location: mockLocation("loc-6", "Av. Rivadavia 7800"),
        due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        time_estimate: 240,
    },
];

function formatMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

const STICKY_CELL = "sticky right-0 bg-background";
const COMPACT_HEAD = "h-8 px-1.5 py-1 text-xs";
const COMPACT_CELL = "px-1.5 py-1";

const UrgentOrdersWidget = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full w-full rounded-lg border bg-card text-card-foreground overflow-hidden">
            <div className="px-4 py-3 border-b shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h2 className="text-sm font-semibold leading-none">
                        {t("missionControl.main.urgentOrders.title", "Urgent Orders")}
                    </h2>
                    <Badge
                        variant="outline"
                        className="ml-1 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 text-xs tabular-nums"
                    >
                        {MOCK_URGENT_ORDERS.length}
                    </Badge>
                </div>
                <div
                    className="flex group items-center gap-1 cursor-pointer text-sm text-muted-foreground"
                    onClick={() => navigate(`/${orgId}/mission-control/orders`)}
                >
                    {t("missionControl.main.urgentOrders.viewAll", "View all")}
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className={COMPACT_HEAD}>{t("common.id", "ID")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.name", "Name")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.timeEstimate", "Time Est.")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.priority", "Priority")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.client", "Client")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.location", "Location")}</TableHead>
                            <TableHead className={COMPACT_HEAD}>{t("workorders.dueDate", "Due Date")}</TableHead>
                            <TableHead className={`${COMPACT_HEAD} ${STICKY_CELL}`} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_URGENT_ORDERS.map((order) => (
                            <TableRow
                                key={order.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    navigate(`/${orgId}/mission-control/orders`)
                                }
                            >
                                <TableCell className={COMPACT_CELL}>
                                    <IdBadge id={order.id} hideIcon />
                                </TableCell>
                                <TableCell className={COMPACT_CELL}>
                                    <div className="font-medium max-w-[180px] truncate text-xs">
                                        {order.name}
                                    </div>
                                </TableCell>
                                <TableCell className={COMPACT_CELL}>
                                    {order.time_estimate != null ? (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {formatMinutes(order.time_estimate)}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className={COMPACT_CELL}>
                                    <PriorityLabel
                                        data={order.priority}
                                        variant="steps"
                                    />
                                </TableCell>
                                <TableCell className={COMPACT_CELL} onClick={(e) => e.stopPropagation()}>
                                    <ClientLabel
                                        data={order.client}
                                        className="font-medium max-w-[120px] truncate text-xs"
                                        link
                                        options={{ textClassName: "max-w-[120px] truncate text-xs" }}
                                    />
                                </TableCell>
                                <TableCell className={COMPACT_CELL} onClick={(e) => e.stopPropagation()}>
                                    <LocationLabel
                                        data={order.location}
                                        textClassName="max-w-[120px] truncate text-xs"
                                    />
                                </TableCell>
                                <TableCell className={COMPACT_CELL}>
                                    <DateLabel
                                        data={order.due_date}
                                        options={{ hide: ["seconds", "year"] }}
                                        className="text-xs"
                                    />
                                </TableCell>
                                <TableCell className={`${COMPACT_CELL} ${STICKY_CELL}`}>
                                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-[11px] font-medium"
                                            onClick={() =>
                                                navigate(
                                                    `/${orgId}/mission-control/orders/${order.id}/plan`
                                                )
                                            }
                                        >
                                            {t("missionControl.main.urgentOrders.plan", "Plan")}
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UrgentOrdersWidget;
