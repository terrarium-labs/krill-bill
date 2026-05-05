import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, PackagePlus, PencilLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { cn } from "@/lib/utils";
import { getTimeAgo } from "@/utils/miscelanea";

type OrderEventType = "new_order" | "order_update";

type OrderFeedEvent = {
    id: string;
    type: OrderEventType;
    orderRef: string;
    detailKey: string;
    detailDefault: string;
    at: Date;
};

const EVENT_POOL: Omit<OrderFeedEvent, "id" | "at" | "orderRef">[] = [
    {
        type: "new_order",
        detailKey: "missionControl.main.events.mock.standardFulfillment",
        detailDefault: "Standard fulfillment",
    },
    {
        type: "order_update",
        detailKey: "missionControl.main.events.mock.statusInProgress",
        detailDefault: "Status set to In progress",
    },
    {
        type: "order_update",
        detailKey: "missionControl.main.events.mock.crewAssignment",
        detailDefault: "Crew assignment changed",
    },
    {
        type: "new_order",
        detailKey: "missionControl.main.events.mock.queuedDispatch",
        detailDefault: "Queued for dispatch",
    },
    {
        type: "order_update",
        detailKey: "missionControl.main.events.mock.priorityHigh",
        detailDefault: "Priority raised to high",
    },
];

const ADD_INTERVAL_MS = 3200;

function makeSimulatedEvent(orderSeq: number): OrderFeedEvent {
    const template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    return {
        ...template,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        orderRef: `ORD-${orderSeq}`,
        at: new Date(),
    };
}

const EventsCardsMainPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const orderSeqRef = useRef(2842);
    const [events, setEvents] = useState<OrderFeedEvent[]>(() => [
        makeSimulatedEvent(orderSeqRef.current++),
        makeSimulatedEvent(orderSeqRef.current++),
    ]);

    const pushEvent = useCallback(() => {
        setEvents((prev) => [
            makeSimulatedEvent(orderSeqRef.current++),
            ...prev,
        ]);
    }, []);

    useEffect(() => {
        const id = window.setInterval(pushEvent, ADD_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [pushEvent]);

    return (
        <div className="flex flex-col h-full w-full rounded-lg border bg-card text-card-foreground overflow-hidden">
            <div className="px-4 py-3 border-b shrink-0 flex justify-between items-center">
                <h2 className="text-sm font-semibold leading-none">
                    {t("missionControl.main.events.title", "Order activity")}
                </h2>
                <div
                    className="flex group items-center gap-2 cursor-pointer text-sm text-muted-foreground"
                    onClick={() => navigate(`/${orgId}/mission-control/orders`)}
                >
                    18 open orders
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <ul className="divide-y">
                    <AnimatePresence initial={false} mode="popLayout">
                        {events.map((event) => {
                            const isNew = event.type === "new_order";
                            return (
                                <motion.li
                                    key={event.id}
                                    layout
                                    initial={{ opacity: 0, y: -14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, filter: "blur(4px)" }}
                                    transition={{
                                        layout: { type: "spring", stiffness: 420, damping: 32 },
                                        opacity: { duration: 0.18 },
                                        y: { type: "spring", stiffness: 420, damping: 32 },
                                        filter: { duration: 0.18 },
                                    }}
                                    className="overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/80 transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        )}
                                        onClick={() =>
                                            navigate(`/${orgId}/mission-control/orders`)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                                isNew
                                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                    : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                            )}
                                        >
                                            {isNew ? (
                                                <PackagePlus className="h-4 w-4" />
                                            ) : (
                                                <PencilLine className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="text-sm font-medium tabular-nums">
                                                    {event.orderRef}
                                                </span>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {getTimeAgo(event.at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {isNew
                                                    ? t(
                                                        "missionControl.main.events.newOrder",
                                                        "New order"
                                                    )
                                                    : t(
                                                        "missionControl.main.events.orderUpdated",
                                                        "Order updated"
                                                    )}
                                                {" · "}
                                                {t(
                                                    event.detailKey,
                                                    event.detailDefault
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            </div>
        </div>
    );
};

export default EventsCardsMainPage;
