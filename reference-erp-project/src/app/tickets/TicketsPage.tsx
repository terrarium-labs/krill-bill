import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import {
    getOrgTickets,
} from "@/api/field-service/tickets/tickets";
import { FolderLock, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import TicketEditModal from "./components/ticket-edit-modal";
import TicketInboxList from "./components/ticket-inbox-list";
import TicketDetailView from "./components/ticket-detail-view";
import { Card } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useTableFilters } from "@/hooks/use-table-filters";


const TicketsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Use the table filters hook with session storage and default filters
    const { 
        tableFilters, 
        setTableFilters, 
        hasInitializedFilters, 
        setHasInitializedFilters 
    } = useTableFilters({
        defaultFilters: "tickets"
    });

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

    const backgroundFetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch tickets function
    const fetchTickets = async (query: string = "", isBackgroundFetch: boolean = false) => {
        if (!isBackgroundFetch) {
            if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
        }
        if (!orgId) return;

        try {
            const response = await getOrgTickets(
                orgId,
                undefined,
                undefined,
                query || undefined,
                undefined,
                tableFilters || undefined,
            );
            if (response.success && response.success.tickets) {
                setTickets(response.success.tickets);
                setNextPageToken(response.success.next_page_token || null);
                // Initialize filters from API response only once, merging with default filters
                if (!hasInitializedFilters && response.success.params) {
                    setTableFilters({
                        ...response.success.params,
                        // Preserve the default filters if they exist
                        filters: tableFilters?.filters || response.success.params.filters,
                    });
                    // Set flag after state update to prevent onFilter from being called during initialization
                    setHasInitializedFilters(true);
                }
                // Update selectedTicket if it exists in the updated tickets list
                if (selectedTicket) {
                    const updatedTicket = response.success.tickets.find((t: Ticket) => t.id === selectedTicket.id);
                    if (updatedTicket) {
                        setSelectedTicket(updatedTicket);
                    }
                }
            } else {
                if (!isBackgroundFetch) {
                    toast.error(t("tickets.errorFetchingTickets") || "Error fetching tickets");
                }
            }
        } catch (error) {
            if (!isBackgroundFetch) {
                toast.error(t("tickets.errorFetchingTickets") || "Error fetching tickets");
                console.error("Error fetching tickets:", error);
            }
        } finally {
            if (!isBackgroundFetch) {
                setIsSearching(false);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchTickets();
        }
    }, [orgId]);

    // Background fetch every 3737ms
    useEffect(() => {
        if (!orgId) return;

        // Start background fetching
        backgroundFetchIntervalRef.current = setInterval(() => {
            fetchTickets(searchQuery, true);
        }, 3737);

        // Cleanup on unmount
        return () => {
            if (backgroundFetchIntervalRef.current) {
                clearInterval(backgroundFetchIntervalRef.current);
            }
        };
    }, [orgId, searchQuery, tableFilters]);

    // Load more tickets
    const loadMoreTickets = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgTickets(
                orgId,
                undefined,
                undefined,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined,
            );
            if (response.success && response.success.tickets) {
                setTickets(prev => [...prev, ...response.success.tickets]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("tickets.errorFetchingTickets") || "Error fetching tickets");
            }
        } catch (error) {
            toast.error(t("tickets.errorFetchingTickets") || "Error fetching tickets");
            console.error("Error fetching tickets:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Edit handlers
    const handleOpenCreateTicketModal = () => {
        setEditingTicket(null);
        setIsEditModalOpen(true);
    };

    const handleOpenEditTicketModal = (ticket: Ticket) => {
        setEditingTicket(ticket);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = (open: boolean) => {
        setIsEditModalOpen(open);
        if (!open) {
            setEditingTicket(null);
        }
    };


    const handleTicketClick = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
    };

    return (
        <>
            <div className="space-y-6">
                <ResizablePanelGroup direction="horizontal" className="max-h-[calc(100vh-6rem)]">
                    {/* Left side: Ticket List */}
                    <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                        <div className="h-full flex flex-col pr-2">
                            <div className="pr-4 flex flex-col gap-4 pb-4">
                                <PageHeader
                                    title={t("tickets.title", "Tickets")}
                                    showBackButton={false}
                                    action={
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => navigate(`/${orgId}/tickets-admin/`)} variant="outline">
                                                <FolderLock className="h-4 w-4 mr-2" />
                                                {t("tickets.newTicket", "Admin panel")}
                                            </Button>
                                            <Button onClick={handleOpenCreateTicketModal}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t("tickets.newTicket", "New Ticket")}
                                            </Button>
                                        </div>
                                    }
                                />
                                <SearchBar
                                    value={searchQuery}
                                    isLoading={isSearching}
                                    onChange={(query) => setSearchQuery(query)}
                                    onSearch={fetchTickets}
                                    placeholder={t(
                                        "tickets.searchPlaceholder",
                                        "Search tickets..."
                                    )}
                                />
                                {/* Filters */}
                                {tableFilters && (
                                    <TableFiltersRow
                                        value={tableFilters}
                                        onChange={(filters) => setTableFilters(filters)}
                                        onFilter={hasInitializedFilters ? () => fetchTickets(searchQuery) : undefined}
                                    />
                                )}
                            </div>
                            <TicketInboxList
                                tickets={tickets}
                                isLoading={isLoading}
                                nextPageToken={nextPageToken}
                                loadingMore={loadingMore}
                                onLoadMore={loadMoreTickets}
                                onTicketClick={handleTicketClick}
                                selectedTicketId={selectedTicket?.id || null}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right side: Ticket Detail */}
                    <ResizablePanel defaultSize={65} minSize={50}>
                        <ScrollArea className="h-full pl-4">
                            {selectedTicket ? (
                                <TicketDetailView
                                    ticketId={selectedTicket.id}
                                    onCountdownEnd={() => setSelectedTicket(null)}
                                    onEditClick={() => handleOpenEditTicketModal(selectedTicket)}
                                />
                            ) : (
                                <Card className="p-6 h-[calc(100vh-6rem)] shadow-none">
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            {t("tickets.selectTicket", "Select a ticket")}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t("tickets.selectTicketDescription", "Choose a ticket from the list to view its details")}
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </ScrollArea>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Edit Modal */}
            {orgId && (
                <TicketEditModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTicketCreatedOrUpdated={() => fetchTickets(searchQuery)}
                    orgId={orgId}
                    ticket={editingTicket}
                    mode={editingTicket ? "edit" : "create"}
                />
            )}
        </>
    );
};

export default TicketsPage;

