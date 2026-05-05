import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Client } from "@/types/clients/client";
import SearchBar from "../components/search-bar";
import { getClients, deleteClient } from "@/api/clients/clients";
import { toast } from "sonner";
import ClientCreateModal from "./components/client-create-modal";
import ClientEditModal from "./components/client-edit-modal";
import TableFiltersRow from "../components/table-filters/table-filters";
import ClientsTable from "./components/clients-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import ClientDeleteModal from "./components/client-delete-modal";
import { useClientsTablePreferences } from "@/hooks/use-clients-table-preferences";
import { ClientColumnSelector } from "./components/client-column-selector";

// Componente interno que tiene acceso al contexto de selección
const ClientsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  
  // Use the table filters hook with session storage (no default filters)
  const { tableFilters, setTableFilters } = useTableFilters();

  // Column preferences persisted in localStorage
  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useClientsTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );

  // Fetch clients function
  const fetchClients = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getClients(orgId, query, null, tableFilters || undefined);
      if (response.success && response.success.clients) {
        setClients(response.success.clients);
        setNextPageToken(response.success.next_page_token || null);
        if (!tableFilters) {
          setTableFilters(response.success.params);
        }
      } else {
        toast.error(t("clients.errorFetchingClients") || "Error fetching clients");
      }
    } catch (error) {
      toast.error(t("clients.errorFetchingClients") || "Error fetching clients");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchClients();
  }, []);

  // Load more clients
  const loadMoreClients = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getClients(orgId, searchQuery, nextPageToken, tableFilters || undefined);
      if (response.success && response.success.clients) {
        setClients(prev => [...prev, ...response.success.clients]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("clients.errorFetchingClients") || "Error fetching clients");
      }
    } catch (error) {
      toast.error(t("clients.errorFetchingClients") || "Error fetching clients");
    } finally {
      setLoadingMore(false);
      setIsLoading(false);
    }
  };

  // Handle edit confirmation
  const handleEditConfirm = (client: Client) => {
    setClientToEdit(client);
    setEditClientModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  // Handle delete execution
  const handleDeleteClient = async () => {
    if (!clientToDelete || !orgId) return;

    setDeletingClient(true);
    try {
      const response = await deleteClient(orgId, clientToDelete.id);
      if (response.success) {
        toast.success(t("clients.clientDeleted", "Client deleted successfully"));
        // Remove from local state
        setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      } else {
        toast.error(t("clients.errorDeletingClient", "Error deleting client"));
      }
    } catch (error) {
      toast.error(t("clients.errorDeletingClient", "Error deleting client"));
    } finally {
      setDeletingClient(false);
      setDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // Navigate to client detail
  const handleViewClient = (client: Client) => {
    navigate(`/${orgId}/clients/${client.id}`);
  };

  // Render actions for table
  const renderTableActions = (client: Client) => {
    return (
      <div className="flex justify-center items-center">
        <CustomActionsDropdown
          items={[
            {
              label: t("common.edit", "Edit"),
              icon: "edit",
              onClick: () => handleEditConfirm(client),
            },
            {
              label: t("common.delete", "Delete"),
              icon: "trash-2",
              onClick: () => handleDeleteConfirm(client),
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
        title={t("clients.title", "Clients")}
        description={t("clients.description", "Manage your organization's clients")}
        showBackButton={false}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setNewClientModalOpen(true)}>
              <Plus className=" h-4 w-4" />
              {t("clients.addClient", "Add Client")}
            </Button>
          </div>
        }
      />

      <SearchBar
        value={searchQuery}
        isLoading={isSearching}
        onChange={(query) => setSearchQuery(query)}
        onSearch={fetchClients}
        placeholder={t("clients.searchPlaceholder", "Search clients...")}
      />

      {tableFilters && (
        <TableFiltersRow
          value={tableFilters}
          onChange={(filters) => setTableFilters(filters)}
          onFilter={(_) => fetchClients(searchQuery)}
          endSlot={
            <ClientColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
          }
        />
      )}

      {/* Clients Table */}
      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        renderActions={renderTableActions}
        onRowClick={handleViewClient}
        clickableRows={true}
        onEmptyStateAction={() => setNewClientModalOpen(true)}
        searchQuery={searchQuery}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
      />

      {/* Load More Button */}
      {
        nextPageToken && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMoreClients}
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
        )
      }

      <ClientCreateModal
        open={newClientModalOpen}
        onOpenChange={setNewClientModalOpen}
        onClientCreated={fetchClients}
      />

      {/* Edit Client Modal */}
      <ClientEditModal
        open={editClientModalOpen}
        onOpenChange={setEditClientModalOpen}
        onClientCreated={fetchClients}
        client={clientToEdit}
        mode="update"
      />

      <ClientDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) {
            setClientToDelete(null);
          }
        }}
        client={clientToDelete}
        onConfirm={handleDeleteClient}
        isDeleting={deletingClient}
      />
    </>
  );
};

export default ClientsPage;
