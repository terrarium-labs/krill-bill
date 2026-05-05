import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { Expand, Minimize, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Inventory } from "@/types/clients/inventory";
import { useLocation } from "../contexts/LocationContext";
import { getClientInventory, deleteClientInventory } from "@/api/clients/inventory/inventory";
import InventoryItemViewModal from "../components/inventory-item-view-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import ClientLocationInventoriesTable, { FlattenedInventory } from "./components/client-location-inventories-table";
import ClientLocationInventoryDeleteModal from "./components/client-location-inventory-delete-modal";

interface ClientLocationInventoryProps {
    onAddInventoryClick?: () => void;
    onEditInventory?: (inventory: Inventory) => void;
}

export interface ClientLocationInventoryRef {
    refreshInventory: () => void;
}

// Hierarchical inventory with children
interface HierarchicalInventory extends Inventory {
    children?: HierarchicalInventory[];
}

const ClientLocationInventory = forwardRef<ClientLocationInventoryRef, ClientLocationInventoryProps>(({ onAddInventoryClick, onEditInventory }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId, clientId } = useParams();
    const { location } = useLocation();
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [hierarchicalInventory, setHierarchicalInventory] = useState<HierarchicalInventory[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [inventoryToDelete, setInventoryToDelete] = useState<FlattenedInventory | null>(null);
    const [deletingInventory, setDeletingInventory] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [inventoryToView, setInventoryToView] = useState<FlattenedInventory | null>(null);
    const [expandAllToggled, setExpandAllToggled] = useState<boolean>(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    // Type filter options
    const typeOptions = [
        { value: "service", label: t("inventory.type.service", "Service") },
        { value: "component", label: t("inventory.type.component", "Component") },
    ];

    // Convert flat inventory array to hierarchical structure
    const buildHierarchy = useCallback((items: Inventory[]): HierarchicalInventory[] => {
        const itemsMap = new Map<string, HierarchicalInventory>();
        const rootItems: HierarchicalInventory[] = [];

        // First pass: create map of all items
        items.forEach((item) => {
            itemsMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build hierarchy
        items.forEach((item) => {
            const hierarchicalItem = itemsMap.get(item.id)!;

            if (item.parent?.id && itemsMap.has(item.parent.id)) {
                // Item has a parent - add to parent's children
                const parent = itemsMap.get(item.parent.id)!;
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(hierarchicalItem);
            } else {
                // No parent or parent not found - add to root
                rootItems.push(hierarchicalItem);
            }
        });

        return rootItems;
    }, []);

    // Flatten hierarchical data for table display
    const flattenedData = useMemo(() => {
        const result: FlattenedInventory[] = [];

        const addItemsRecursively = (
            items: HierarchicalInventory[],
            level: number,
            parentId?: string
        ) => {
            items.forEach((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const flatItem: FlattenedInventory = {
                    ...item,
                    level,
                    parentId,
                    hasChildren,
                    isExpanded: expandedItems.has(item.id),
                    childrenIds: item.children?.map((child) => child.id) || [],
                    childrenCount: item.children?.length || 0,
                };
                result.push(flatItem);

                // Add children if item is expanded
                if (expandedItems.has(item.id) && hasChildren) {
                    addItemsRecursively(item.children!, level + 1, item.id);
                }
            });
        };

        addItemsRecursively(hierarchicalInventory, 0);
        return result;
    }, [hierarchicalInventory, expandedItems]);

    // Toggle expand/collapse
    const toggleExpanded = useCallback(
        (itemId: string, event: React.MouseEvent) => {
            event.stopPropagation();

            setExpandedItems((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                } else {
                    newSet.add(itemId);
                }
                return newSet;
            });
        },
        []
    );

    // Expand all items
    const expandAll = useCallback(() => {
        setExpandedItems(new Set());
    }, []);

    // Collapse all items
    const collapseAll = useCallback(() => {
        const allParentIds = new Set<string>();

        const addParentIds = (items: HierarchicalInventory[]) => {
            items.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    allParentIds.add(item.id);
                    addParentIds(item.children);
                }
            });
        };

        addParentIds(hierarchicalInventory);
        setExpandedItems(allParentIds);
    }, [hierarchicalInventory]);


    const fetchInventory = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !clientId || !location?.id) return;

        // Determine is_service filter value based on selected types
        let isServiceFilter: boolean | undefined = undefined;
        if (selectedTypes.length === 1) {
            isServiceFilter = selectedTypes[0] === "service";
        }

        try {
            const response = await getClientInventory(
                orgId,
                clientId,
                location.id, // location_id
                isServiceFilter, // is_service
                query || undefined, // query
            );

            if (response.success) {
                const fetchedInventory = response.success.inventory || [];
                setInventory(fetchedInventory);
                setHierarchicalInventory(buildHierarchy(fetchedInventory));
            } else {
                toast.error(
                    t(
                        "inventory.error",
                        "Error fetching location inventory"
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching location inventory:", error);
            toast.error(
                t(
                    "inventory.error",
                    "Error fetching location inventory"
                )
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (location?.id) {
            fetchInventory();
        }
    }, [location?.id]);

    // Refetch when filters change
    useEffect(() => {
        if (location?.id && !isLoading) {
            fetchInventory(searchQuery);
        }
    }, [selectedTypes]);

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedTypes([]);
    };

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshInventory: () => fetchInventory()
    }));

    // Handle row click to view inventory
    const handleRowClick = useCallback((item: FlattenedInventory) => {
        setInventoryToView(item);
        setViewModalOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((item: FlattenedInventory) => {
        setInventoryToDelete(item);
        setDeleteModalOpen(true);
    }, []);

    // Handle catalog item click
    const handleViewItem = useCallback((itemId: string) => {
        navigate(`/${orgId}/items/${itemId}`);
    }, [navigate, orgId]);

    // Render actions for each inventory item
    const renderActions = useCallback((item: FlattenedInventory) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => onEditInventory?.(item),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(item),
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [t, onEditInventory, handleDeleteConfirm]);

    // Handle delete execution
    const handleDeleteInventory = async () => {
        if (!inventoryToDelete || !orgId || !clientId) return;

        setDeletingInventory(true);
        try {
            const response = await deleteClientInventory(orgId, clientId, inventoryToDelete.id);
            if (response?.success) {
                toast.success(t("inventory.deletedSuccess", "Inventory item deleted successfully"));
                // Remove from local state
                const updatedInventory = inventory.filter(item => item.id !== inventoryToDelete.id);
                setInventory(updatedInventory);
                setHierarchicalInventory(buildHierarchy(updatedInventory));
            } else {
                toast.error(t("inventory.errorDeleting", "Error deleting inventory item"));
            }
        } catch (error) {
            toast.error(t("inventory.errorDeleting", "Error deleting inventory item"));
        } finally {
            setDeletingInventory(false);
            setDeleteModalOpen(false);
            setInventoryToDelete(null);
        }
    };

    // Render actions for view modal
    const renderModalActions = useCallback((inventoryItem: Inventory) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => {
                            setViewModalOpen(false);
                            setInventoryToView(null);
                            onEditInventory?.(inventoryItem);
                        },
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => {
                            setViewModalOpen(false);
                            setInventoryToView(null);
                            handleDeleteConfirm(inventoryItem as FlattenedInventory);
                        },
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [t, onEditInventory, handleDeleteConfirm]);

    return (
        <div className="flex flex-col gap-6">
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchInventory}
                placeholder={t(
                    "inventory.searchPlaceholder",
                    "Search inventory items..."
                )}
            />

            {/* Filters and Expand Controls */}
            <div className="flex gap-2 items-center justify-between">
                {/* Filters on the left */}
                <div className="flex gap-2 items-center">
                    <MultiSelect
                        options={typeOptions}
                        selected={selectedTypes}
                        size="default"
                        onSelectedChange={setSelectedTypes}
                        placeholder={t("inventory.filterByType", "Type")}
                        searchable={false}
                    />
                    {selectedTypes.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                        >
                            <FilterX className="h-4 w-4" />
                            {t("common.clearAll", "Clear all")}
                        </Button>
                    )}
                </div>

                {/* Expand/Collapse Controls on the right */}
                {flattenedData.length > 0 && flattenedData.some((item: FlattenedInventory) => item.hasChildren) && (
                    <div className="flex gap-2">
                        {expandAllToggled && (
                            <Button
                                variant="outline"

                                onClick={(e) => {
                                    e.preventDefault();
                                    expandAll();
                                    setExpandAllToggled(false);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Minimize className="h-4 w-4" />
                                {t("common.collapse_all", "Collapse all")}
                            </Button>
                        )}
                        {!expandAllToggled && (
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    collapseAll();
                                    setExpandAllToggled(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Expand className="h-4 w-4" />
                                {t("common.expand_all", "Expand all")}
                            </Button>
                        )}
                    </div>
                )}
            </div>



            {/* Inventory Table */}
            <ClientLocationInventoriesTable
                flattenedData={flattenedData}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onRowClick={handleRowClick}
                onToggleExpanded={toggleExpanded}
                onViewItem={handleViewItem}
                onAddInventory={onAddInventoryClick}
                renderActions={renderActions}
            />

            {/* Inventory View Modal */}
            <InventoryItemViewModal
                inventory={inventoryToView}
                open={viewModalOpen}
                onOpenChange={(open) => {
                    setViewModalOpen(open);
                    if (!open) {
                        setInventoryToView(null);
                    }
                }}
                renderActions={renderModalActions}
            />

            {/* Delete Confirmation Dialog */}
            <ClientLocationInventoryDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setInventoryToDelete(null);
                    }
                }}
                inventory={inventoryToDelete}
                onConfirm={handleDeleteInventory}
                isDeleting={deletingInventory}
            />
        </div>
    );
});

export default ClientLocationInventory;
