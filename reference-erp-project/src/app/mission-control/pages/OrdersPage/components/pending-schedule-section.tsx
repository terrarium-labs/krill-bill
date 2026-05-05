import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, ChevronRight, UserX } from "lucide-react";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import WorkOrdersTable from "@/app/work-orders/components/work-orders-table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const COMPACT_TABLE = "[&_[data-slot=table-head]]:h-7 [&_[data-slot=table-head]]:px-1.5 [&_[data-slot=table-head]]:py-0.5 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-cell]]:px-1.5 [&_[data-slot=table-cell]]:py-1 [&_[data-slot=table-cell]]:text-xs";

interface PendingScheduleSectionProps {
    workOrders: WorkOrder[];
}

const PendingScheduleSection = ({ workOrders }: PendingScheduleSectionProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [isOpen, setIsOpen] = useState(false);

    if (workOrders.length === 0) return null;

    const handleRowClick = (workOrder: WorkOrder) => {
        navigate(`/${orgId}/work-orders/${workOrder.id}`);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                        {t("missionControl.orders.pendingSchedule", "Pending Schedule")}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                        {t("missionControl.orders.pendingScheduleDescription", "Orders without assigned technicians")}
                    </span>
                    <Badge className="ml-auto bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 hover:bg-amber-200 text-xs tabular-nums">
                        {workOrders.length}
                    </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className={`px-2 pb-2 ${COMPACT_TABLE}`}>
                        <WorkOrdersTable
                            workOrders={workOrders}
                            isLoading={false}
                            onRowClick={handleRowClick}
                            compact
                            hiddenColumns={["assignees", "is_billed", "is_paid", "created_at"]}
                        />
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
};

export default PendingScheduleSection;
