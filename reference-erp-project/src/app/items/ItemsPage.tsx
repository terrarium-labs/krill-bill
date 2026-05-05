import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Item } from "@/types/items/items";
import SearchBar from "../components/search-bar";
import { getOrgItems, deleteOrgItem } from "@/api/items/items";
import { toast } from "sonner";
import NewItemModal from "./components/new-item-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import ItemsTable from "./components/items-table";
import ItemDeleteModal from "./components/item-delete-modal";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useItemsTablePreferences } from "@/hooks/use-items-table-preferences";
import { ItemColumnSelector } from "./components/item-column-selector";

const ItemsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { orgId } = useParams<{ orgId: string }>();
    const [items, setItems] = useState<Item[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newItemModalOpen, setNewItemModalOpen] = useState(false);
    
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
    } = useItemsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Check if we should open the new item modal from navigation state
    useEffect(() => {
        if (location.state?.openNewItemModal) {
            setNewItemModalOpen(true);
            // Clear the state to prevent reopening on subsequent renders
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);
    // Fetch items function
    const fetchItems = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgItems(orgId, undefined, undefined, query || undefined, undefined, tableFilters || undefined);
            if (response.success && response.success.items) {
                setItems(response.success.items);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("items.errorFetchingItems") || "Error fetching items");
            }
        } catch (error) {
            toast.error(t("items.errorFetchingItems") || "Error fetching items");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchItems();
        }
    }, [orgId]);

    // Load more items
    const loadMoreItems = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgItems(orgId, undefined, undefined, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.errorFetchingItems") || "Error fetching items");
            }
        } catch (error) {
            toast.error(t("items.errorFetchingItems") || "Error fetching items");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };
    // Handle delete confirmation
    const handleDeleteConfirm = (item: Item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteItem = async () => {
        if (!itemToDelete || !orgId) return;

        setDeletingItem(true);
        try {
            const response = await deleteOrgItem(orgId, itemToDelete.id);
            if (response.success) {
                toast.success(t("items.itemDeleted", "Item deleted successfully"));
                // Remove from local state
                setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            } else {
                toast.error(t("items.errorDeletingItem", "Error deleting item"));
            }
        } catch (error) {
            toast.error(t("items.errorDeletingItem", "Error deleting item"));
        } finally {
            setDeletingItem(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    // Navigate to item detail
    const handleViewItem = (item: Item) => {
        navigate(`/${orgId}/items/${item.id}`);
    };

    // Render actions for table
    const renderTableActions = (item: Item) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(item),
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
                title={t("items.title", "Items")}
                description={t("items.description", "Manage your organization's items")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setNewItemModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("items.addItem", "Add Item")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchItems}
                placeholder={t("items.searchPlaceholder", "Search items...")}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchItems(searchQuery)}
                    endSlot={
                        <ItemColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Items Table */}
            <ItemsTable
                items={items}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleViewItem}
                clickableRows={true}
                onEmptyStateAction={() => setNewItemModalOpen(true)}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreItems}
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

            {/* New Item Modal */}
            <NewItemModal
                open={newItemModalOpen}
                onOpenChange={setNewItemModalOpen}
                onItemCreated={fetchItems}
                mode="create"
            />

            {/* Delete Confirmation Modal */}
            <ItemDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                item={itemToDelete}
                onConfirm={handleDeleteItem}
                isDeleting={deletingItem}
            />
        </>
    );
};

export default ItemsPage;

