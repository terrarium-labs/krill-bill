import { ShoppingCart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import Tag from "@/app/components/tag/tag";
import { Order } from "@/types/orders/orders";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrderCardProps {
    order: Order;
    isSelected?: boolean;
    className?: string;
}

function OrderCard({ order, isSelected, className }: OrderCardProps) {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = () => {
        if (orgId) navigate(`/${orgId}/purchases/orders/${order.id}`);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            className={cn(
                "px-4 py-3 rounded-lg border bg-background shadow-md min-w-[280px] w-[420px] max-w-full transition-all hover:shadow-lg hover:border-primary cursor-pointer text-left",
                isSelected ? "shadow-lg border-primary" : "border-border",
                className
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    <ShoppingCart className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1 truncate">
                        <SupplierAvatar supplier={order.supplier} showName={true} />
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <IdBadge id={order.id} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                        title="Navigate"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {order.notes && (
                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {order.notes}
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                {order.order_type && <Tag text={order.order_type.name} />}
                <Tag text={order.status} className="capitalize" />
            </div>
        </div>
    );
}

export default OrderCard;
