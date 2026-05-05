import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, ChevronRight, UserX, User } from "lucide-react";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import WorkOrdersTable from "@/app/work-orders/components/work-orders-table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColorFromString } from "@/utils/miscelanea";
import type { GroupByMode } from "./orders-group-selector";

const COMPACT_TABLE = "[&_[data-slot=table-head]]:h-7 [&_[data-slot=table-head]]:px-1.5 [&_[data-slot=table-head]]:py-0.5 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-cell]]:px-1.5 [&_[data-slot=table-cell]]:py-1 [&_[data-slot=table-cell]]:text-xs";

interface OrdersGroupedListProps {
    workOrders: WorkOrder[];
    groupBy: GroupByMode;
    isLoading: boolean;
    searchQuery?: string;
}

interface GroupSection {
    id: string;
    name: string;
    photoUrl?: string | null;
    orders: WorkOrder[];
}

function groupByClient(orders: WorkOrder[]): GroupSection[] {
    const map = new Map<string, GroupSection>();
    for (const order of orders) {
        const key = order.client?.id ?? "__no_client__";
        const name = order.client?.trade_name ?? "No Client";
        if (!map.has(key)) {
            map.set(key, { id: key, name, photoUrl: order.client?.photo_url, orders: [] });
        }
        map.get(key)!.orders.push(order);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function groupByAssignee(orders: WorkOrder[]): GroupSection[] {
    const map = new Map<string, GroupSection>();
    for (const order of orders) {
        const assignees = order.assignees ?? [];
        if (assignees.length === 0) {
            const key = "__unassigned__";
            if (!map.has(key)) {
                map.set(key, { id: key, name: "Unassigned", orders: [] });
            }
            map.get(key)!.orders.push(order);
        } else {
            for (const assignee of assignees) {
                const key = assignee.employee.id;
                const name = `${assignee.employee.first_name} ${assignee.employee.last_name}`.trim() || assignee.employee.id;
                if (!map.has(key)) {
                    map.set(key, { id: key, name, photoUrl: assignee.employee.photo_url, orders: [] });
                }
                map.get(key)!.orders.push(order);
            }
        }
    }
    return Array.from(map.values()).sort((a, b) => {
        if (a.id === "__unassigned__") return -1;
        if (b.id === "__unassigned__") return 1;
        return a.name.localeCompare(b.name);
    });
}

function groupBySupervisor(orders: WorkOrder[]): GroupSection[] {
    const map = new Map<string, GroupSection>();
    for (const order of orders) {
        const supervisors = order.supervisors ?? [];
        if (supervisors.length === 0) {
            const key = "__no_supervisor__";
            if (!map.has(key)) {
                map.set(key, { id: key, name: "No Supervisor", orders: [] });
            }
            map.get(key)!.orders.push(order);
        } else {
            for (const supervisor of supervisors) {
                const key = supervisor.id;
                const name = `${supervisor.first_name} ${supervisor.last_name}`.trim() || supervisor.id;
                if (!map.has(key)) {
                    map.set(key, { id: key, name, photoUrl: supervisor.photo_url, orders: [] });
                }
                map.get(key)!.orders.push(order);
            }
        }
    }
    return Array.from(map.values()).sort((a, b) => {
        if (a.id === "__no_supervisor__") return -1;
        if (b.id === "__no_supervisor__") return 1;
        return a.name.localeCompare(b.name);
    });
}

const PLACEHOLDER_IDS = new Set(["__no_client__", "__unassigned__", "__no_supervisor__"]);

function GroupAvatar({ group, groupBy }: { group: GroupSection; groupBy: GroupByMode }) {
    if (PLACEHOLDER_IDS.has(group.id)) {
        if (group.id === "__unassigned__") {
            return <UserX className="h-5 w-5 text-amber-500 shrink-0" />;
        }
        return <User className="h-5 w-5 text-muted-foreground shrink-0" />;
    }

    const fallback = group.name.charAt(0).toUpperCase();
    const isClient = groupBy === "client";

    return (
        <Avatar className={`h-6 w-6 shrink-0 ${isClient ? "rounded" : "rounded-full"}`}>
            <AvatarImage src={group.photoUrl || ""} alt={group.name} className="object-cover" />
            <AvatarFallback
                className={`text-xs font-medium text-white ${isClient ? "rounded" : "rounded-full"}`}
                style={{ backgroundColor: getColorFromString(group.name) }}
            >
                {fallback}
            </AvatarFallback>
        </Avatar>
    );
}

const OrdersGroupedList = ({ workOrders, groupBy, isLoading, searchQuery }: OrdersGroupedListProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    const groups = useMemo(() => {
        switch (groupBy) {
            case "client":
                return groupByClient(workOrders);
            case "assignee":
                return groupByAssignee(workOrders);
            case "supervisor":
                return groupBySupervisor(workOrders);
            default:
                return null;
        }
    }, [workOrders, groupBy]);

    const handleRowClick = (workOrder: WorkOrder) => {
        navigate(`/${orgId}/work-orders/${workOrder.id}`);
    };

    const toggleSection = (id: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (groupBy === "none" || !groups) {
        return (
            <div className={COMPACT_TABLE}>
                <WorkOrdersTable
                    workOrders={workOrders}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    searchQuery={searchQuery}
                    emptyTitle={t("missionControl.orders.noOrders", "No work orders found")}
                    emptyDescription={t("missionControl.orders.noOrdersDescription", "Try adjusting your filters or search query")}
                    compact
                />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                const isOpen = !collapsedSections.has(group.id);
                return (
                    <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleSection(group.id)}>
                        <CollapsibleTrigger className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <GroupAvatar group={group} groupBy={groupBy} />
                            <span className="font-medium text-sm">{group.name}</span>
                            <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                                {group.orders.length}
                            </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className={`mt-1 ml-2 border-l-2 border-muted pl-2 ${COMPACT_TABLE}`}>
                                <WorkOrdersTable
                                    workOrders={group.orders}
                                    isLoading={false}
                                    onRowClick={handleRowClick}
                                    searchQuery={searchQuery}
                                    compact
                                    hiddenColumns={
                                        groupBy === "client" ? ["client"]
                                            : groupBy === "assignee" ? ["assignees"]
                                                : groupBy === "supervisor" ? ["supervisors"]
                                                    : []
                                    }
                                />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                );
            })}
        </div>
    );
};

export default OrdersGroupedList;
