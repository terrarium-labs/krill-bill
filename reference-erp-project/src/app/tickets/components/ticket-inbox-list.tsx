import { useTranslation } from "react-i18next";
import { Loader2, Ticket as TicketIcon } from "lucide-react";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TicketInboxCard } from "./ticket-inbox-card";
import { TicketInboxListSkeleton } from "./ticket-inbox-list-skeleton";

interface TicketInboxListProps {
    tickets: Ticket[];
    isLoading: boolean;
    nextPageToken: string | null;
    loadingMore: boolean;
    onLoadMore: () => void;
    onTicketClick: (ticket: Ticket) => void;
    selectedTicketId?: string | null;
}

const TicketInboxList = ({ 
    tickets, 
    isLoading, 
    nextPageToken, 
    loadingMore, 
    onLoadMore,
    onTicketClick,
    selectedTicketId
}: TicketInboxListProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <ScrollArea className="max-h-[calc(100vh-18rem)] pr-4">
                <TicketInboxListSkeleton cardCount={6} />
            </ScrollArea>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12">
                <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('tickets.noTicketsYet', 'No tickets yet')}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t('tickets.noTicketsDescription', 'Tickets will appear here once created')}
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="max-h-[calc(100vh-18rem)] pr-4">
            <div className="space-y-2">
                {tickets.map((ticket) => (
                    <TicketInboxCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        onClick={onTicketClick}
                        isSelected={selectedTicketId === ticket.id}
                    />
                ))}
                {nextPageToken && (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load More")
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

export default TicketInboxList;
