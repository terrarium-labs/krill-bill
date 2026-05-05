import { Button } from "@/components/ui/button";
import { Plus, Loader2, Inbox } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { getOrgAdminTickets, deleteOrgAdminTicket, patchOrgAdminTicket } from "@/api/field-service/tickets/tickets";
import { toast } from "sonner";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import TicketsTable from "./components/tickets-table";
import TicketViewModal from "./components/ticket-view-modal";
import TicketDeleteModal from "./components/ticket-delete-modal";
import TicketEditModal from "@/app/tickets/components/ticket-edit-modal";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTicketsTablePreferences } from "@/hooks/use-tickets-table-preferences";
import { TicketColumnSelector } from "./components/ticket-column-selector";

const TicketsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters({
        defaultFilters: null
    });

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useTicketsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [ticketRefreshTrigger, setTicketRefreshTrigger] = useState(0);

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
            const response = await getOrgAdminTickets(
                orgId,
                query || undefined,
                undefined,
                tableFilters || undefined
            );
            if (response.success.tickets) {
                setTickets(response.success.tickets);
                setNextPageToken(response.success.next_page_token || null);

                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                if (!isBackgroundFetch) {
                    toast.error(
                        t("tickets.errorFetchingTickets") || "Error fetching tickets"
                    );
                }
            }
        } catch (error) {
            if (!isBackgroundFetch) {
                toast.error(
                    t("tickets.errorFetchingTickets") || "Error fetching tickets"
                );
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
        }, 10000);

        // Cleanup on unmount
        return () => {
            if (backgroundFetchIntervalRef.current) {
                clearInterval(backgroundFetchIntervalRef.current);
            }
        };
    }, [orgId, searchQuery, tableFilters]);

    // Load more employees
    const loadMoreEmployees = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgAdminTickets(
                orgId,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.tickets) {
                setTickets((prev) => [...prev, ...response.success.tickets]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("tickets.errorFetchingTickets") || "Error fetching tickets"
                );
            }
        } catch (error) {
            console.error(error);
            toast.error(
                t("employees.errorFetchingEmployees") || "Error fetching employees"
            );
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Navigate to ticket detail or open modal
    const handleViewTicket = (ticketId: string) => {
        setSelectedTicketId(ticketId);
        setViewModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (ticket: Ticket) => {
        setTicketToDelete(ticket);
        setDeleteModalOpen(true);
        setViewModalOpen(false); // Close view modal if open
    };

    // Handle delete execution
    const handleDeleteTicket = async () => {
        if (!ticketToDelete || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgAdminTicket(orgId, ticketToDelete.id);
            if (response.success) {
                toast.success(
                    t("tickets.ticketDeleted", "Ticket deleted successfully")
                );
                // Remove from local state
                setTickets((prev) =>
                    prev.filter((t) => t.id !== ticketToDelete.id)
                );
                handleCloseDeleteModal();
            } else {
                toast.error(
                    t("tickets.errorDeletingTicket", "Error deleting ticket")
                );
            }
        } catch (error) {
            toast.error(
                t("tickets.errorDeletingTicket", "Error deleting ticket")
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // Close delete modal
    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setTicketToDelete(null);
    };

    // Handle close or re-open ticket
    const handleCloseOrReopenTicket = async (ticket: Ticket) => {
        if (!orgId) return;
        const newStatus = ticket.status === "closed" ? "in_progress" : "closed";
        try {
            const response = await patchOrgAdminTicket(orgId, ticket.id, { status: newStatus });
            if (response.success) {
                setTicketRefreshTrigger((t) => t + 1);
                fetchTickets();
                toast.success(
                    newStatus === "closed"
                        ? t("tickets.ticketClosed", "Ticket closed")
                        : t("tickets.ticketReopened", "Ticket re-opened")
                );
            } else {
                toast.error(t("tickets.errorUpdatingTicket", "Error updating ticket"));
            }
        } catch {
            toast.error(t("tickets.errorUpdatingTicket", "Error updating ticket"));
        }
    };

    // Handle edit ticket
    const handleEditTicket = (ticketId: string) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            setTicketToEdit(ticket);
            setEditModalOpen(true);
            setViewModalOpen(false); // Close view modal
        }
    };

    // Render actions for table
    const renderTableActions = (ticket: Ticket) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: () => handleViewTicket(ticket.id),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(ticket),
                            variant: "destructive",
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("tickets.title", "Tickets")}
                description={t(
                    "tickets.description",
                    "Manage your organization's tickets"
                )}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigate(`/${orgId}/tickets/`)} variant="outline">
                            <Inbox className="h-4 w-4 mr-2" />
                            {t("tickets.inboxPanel", "Inbox panel")}
                        </Button>
                        <Button onClick={() => setNewTicketModalOpen(true)}>
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
                placeholder={t("tickets.searchPlaceholder", "Search tickets...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchTickets(searchQuery)}
                    endSlot={
                        <TicketColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Tickets Table */}
            <TicketsTable
                tickets={tickets}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={(ticket) => handleViewTicket(ticket.id)}
                clickableRows={true}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                emptyStateTitle={
                    searchQuery
                        ? t("tickets.noResultsFound", "No tickets found")
                        : t("tickets.noTicketsTitle", "No tickets yet")
                }
                emptyStateDescription={
                    searchQuery
                        ? t(
                            "tickets.noResultsDescription",
                            "No tickets match your search for '{{searchQuery}}'",
                            { searchQuery }
                        )
                        : t(
                            "tickets.noTicketsDescription",
                            "Start by adding your first ticket"
                        )
                }
                onEmptyStateAction={() => void 0}
                emptyStateActionLabel={t("tickets.addTicket", "Add Ticket")}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreEmployees}
                        disabled={loadingMore}
                        className="min-w-32"
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

            {/* Ticket View Modal */}
            <TicketViewModal
                open={viewModalOpen}
                onOpenChange={setViewModalOpen}
                orgId={orgId || ""}
                ticketId={selectedTicketId}
                refreshTrigger={ticketRefreshTrigger}
                renderActions={(ticketId) => {
                    const ticket = tickets.find(t => t.id === ticketId);
                    if (!ticket) return null;

                    return (
                        <div className="flex items-center gap-2">
                            {/* Delete in Dropdown */}
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("common.generateOrder", "Generate Order"),
                                        icon: "clipboard-paste",
                                        onClick: () => {
                                            // TODO: Implement generate order
                                            console.log("Generate order from ticket:", ticketId);
                                        },
                                    },
                                    {
                                        label: t("common.edit", "Edit"),
                                        icon: "edit",
                                        onClick: () => handleEditTicket(ticketId),
                                    },
                                    {
                                        label: ticket.status === "closed"
                                            ? t("tickets.reopenTicket", "Re-open ticket")
                                            : t("tickets.closeTicket", "Close"),
                                        icon: ticket.status === "closed" ? "refresh-cw" : "x",
                                        onClick: () => handleCloseOrReopenTicket(ticket),
                                    },
                                    {
                                        label: t("common.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: () => handleDeleteConfirm(ticket),
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    );
                }}
            />

            {/* Delete Confirmation Modal */}
            <TicketDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                ticket={ticketToDelete}
                onConfirm={handleDeleteTicket}
                isDeleting={isDeleting}
            />

            {/* Edit Ticket Modal */}
            <TicketEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onTicketCreatedOrUpdated={fetchTickets}
                orgId={orgId || ""}
                ticket={ticketToEdit}
                mode="edit"
            />

            {/* New Ticket Modal */}
            <TicketEditModal
                open={newTicketModalOpen}
                onOpenChange={setNewTicketModalOpen}
                onTicketCreatedOrUpdated={fetchTickets}
                orgId={orgId || ""}
                mode="create"
            />

        </>
    );
};

export default TicketsPage;
