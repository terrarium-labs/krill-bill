import { Ticket as TicketIcon, Eye, ExternalLink } from "lucide-react";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import PriorityLabel from "@/app/components/labels/priority-label";
import { useNavigate, useParams } from "react-router-dom";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import { cn } from "@/lib/utils";

interface TicketCardProps {
    ticket: Ticket;
    isSelected?: boolean;
    className?: string;
    /** When provided, uses Eye icon and calls this instead of navigating (e.g. for origin tree modal) */
    onViewClick?: () => void;
}

function TicketCard({ ticket, isSelected, className, onViewClick }: TicketCardProps) {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = () => {
        if (onViewClick) {
            onViewClick();
        } else if (orgId) {
            navigate(`/${orgId}/tickets/${ticket.id}`);
        }
    };

    const ActionIcon = onViewClick ? Eye : ExternalLink;
    const actionTitle = onViewClick ? "View details" : "Navigate";

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
                    <TicketIcon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1 truncate">
                        <ClientAvatar client={ticket.client} showName={true} />
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <IdBadge id={ticket.id} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                        title={actionTitle}
                    >
                        <ActionIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {ticket.description && (
                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {ticket.description}
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <PriorityLabel data={ticket.priority} variant="icon" showTooltip={false} />
                {ticket.type && <Tag text={ticket.type.name} color={ticket.type.color || ""} />}
                <Tag text={ticket.status} className="capitalize" />
            </div>
        </div>
    );
}

export default TicketCard;
