import { ChevronRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { formatDate, getColorClasses } from "@/utils/miscelanea";
import ClientLabel from "@/app/components/labels/client-label";
import { cn } from "@/lib/utils";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";
import { getInsightsLevelColor } from "@/app/tickets/components/ticket-insights-card";

interface TicketInboxCardProps {
    ticket: Ticket;
    onClick: (ticket: Ticket) => void;
    isSelected?: boolean;
}

export const TicketInboxCard = ({ ticket, onClick, isSelected }: TicketInboxCardProps) => {
    const isLocked = !!ticket.locked_by;

    return (
        <Card
            className={cn(
                "overflow-hidden py-0 min-h-20 shadow-none transition-all cursor-pointer group rounded-lg hover:bg-accent/50 relative",
                isSelected && "bg-accent",
                (isSelected || isLocked) ? "border-primary" : "border-border"
            )}
            onClick={() => onClick(ticket)}
        >
            {/* AI insight level - inner left border of the card (only when level is set) */}
            {ticket?.ai_insights_level != null && (
                <div
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg z-10 border-2",
                        getColorClasses(getInsightsLevelColor(ticket.ai_insights_level))
                    )}
                    title={ticket.ai_insights_level}
                />
            )}
            <div className="flex gap-3 p-3">
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1.5">
                        {/* Title - Use contact name or ticket ID */}
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors duration-200 flex justify-between items-center">
                            <ClientLabel data={ticket.client} />
                            <div className="flex items-center gap-2">
                                {/* Lock Icon */}
                                {isLocked && (
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                {/* Type Badge - Top right */}
                                {ticket.type && (
                                    <Tag text={ticket.type.name} color={ticket.type.color || ""} className="capitalize" />
                                )}
                                {/* Priority Badge - Top Right */}
                                {ticket.priority && (
                                    <PriorityLabel data={ticket.priority} variant="steps" />
                                )}
                            </div>
                        </h4>

                        {/* Date */}
                        <div className="text-xs text-muted-foreground">
                            {formatDate(ticket.created_at, { showTime: false })}
                        </div>

                        {/* Description */}
                        {ticket.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {ticket.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Arrow - centered vertically */}
                <div className="flex items-center justify-center shrink-0">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all duration-200" />
                </div>
            </div>
        </Card>
    );
};

export default TicketInboxCard;
