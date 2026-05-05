import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { Users, Building2, Shield, LayoutList } from "lucide-react";

export type GroupByMode = "none" | "client" | "assignee" | "supervisor";

interface OrdersGroupSelectorProps {
    value: GroupByMode;
    onChange: (value: GroupByMode) => void;
}

const OrdersGroupSelector = ({ value, onChange }: OrdersGroupSelectorProps) => {
    const { t } = useTranslation();

    return (
        <Tabs value={value} onValueChange={(v) => onChange(v as GroupByMode)}>
            <TabsList className="h-7 rounded-md border-none" activeClassName="border-none rounded-md">
                <TabsTrigger value="none" className="flex items-center gap-1.5 text-sm px-2.5 py-0">
                    <LayoutList className="h-3.5 w-3.5" />
                    {t("missionControl.orders.groupBy.none", "All")}
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-1.5 text-sm px-2.5 py-0">
                    <Building2 className="h-3.5 w-3.5" />
                    {t("missionControl.orders.groupBy.client", "Client")}
                </TabsTrigger>
                <TabsTrigger value="assignee" className="flex items-center gap-1.5 text-sm px-2.5 py-0">
                    <Users className="h-3.5 w-3.5" />
                    {t("missionControl.orders.groupBy.assignee", "Assignee")}
                </TabsTrigger>
                <TabsTrigger value="supervisor" className="flex items-center gap-1.5 text-sm px-2.5 py-0">
                    <Shield className="h-3.5 w-3.5" />
                    {t("missionControl.orders.groupBy.supervisor", "Supervisor")}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};

export default OrdersGroupSelector;
