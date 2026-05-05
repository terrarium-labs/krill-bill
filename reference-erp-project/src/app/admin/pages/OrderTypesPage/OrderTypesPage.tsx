import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Plus, Expand, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { OrderType } from "@/types/general/order-types";
import { getOrgOrderTypes, deleteOrgOrderType } from "@/api/orgs/order-types/order-types";
import PageHeader from "@/app/components/page-header";
import OrderTypeEditModal from "./components/order-type-edit-modal";
import OrderTypeDeleteModal from "./components/order-type-delete-modal";
import OrderTypesTable, { FlattenedOrderType } from "./components/order-types-table";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useOrderTypesTablePreferences } from "@/hooks/use-order-types-table-preferences";
import { OrderTypesColumnSelector } from "./components/order-types-column-selector";

// Hierarchical order type with children
interface HierarchicalOrderType extends OrderType {
    children?: HierarchicalOrderType[];
}

const OrderTypesPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams();
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useOrderTypesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [hierarchicalOrderTypes, setHierarchicalOrderTypes] = useState<HierarchicalOrderType[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<FlattenedOrderType | null>(null);
    const [deletingType, setDeletingType] = useState(false);
    const [expandAllToggled, setExpandAllToggled] = useState<boolean>(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<OrderType | null>(null);

    // Convert flat order types array to hierarchical structure
    const buildHierarchy = useCallback((items: OrderType[]): HierarchicalOrderType[] => {
        const itemsMap = new Map<string, HierarchicalOrderType>();
        const rootItems: HierarchicalOrderType[] = [];

        // First pass: create map of all items
        items.forEach((item) => {
            itemsMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build hierarchy
        items.forEach((item) => {
            const hierarchicalItem = itemsMap.get(item.id)!;

            if (item.parent_type?.id && itemsMap.has(item.parent_type.id)) {
                // Item has a parent - add to parent's children
                const parent = itemsMap.get(item.parent_type.id)!;
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
        const result: FlattenedOrderType[] = [];

        const addItemsRecursively = (
            items: HierarchicalOrderType[],
            level: number,
            parentId?: string
        ) => {
            items.forEach((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const flatItem: FlattenedOrderType = {
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

        addItemsRecursively(hierarchicalOrderTypes, 0);
        return result;
    }, [hierarchicalOrderTypes, expandedItems]);

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

        const addParentIds = (items: HierarchicalOrderType[]) => {
            items.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    allParentIds.add(item.id);
                    addParentIds(item.children);
                }
            });
        };

        addParentIds(hierarchicalOrderTypes);
        setExpandedItems(allParentIds);
    }, [hierarchicalOrderTypes]);

    const fetchOrderTypes = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgOrderTypes(
                orgId,
                query || undefined,
                undefined
            );

            if (response.success) {
                const fetchedOrderTypes = response.success.order_types || [];
                setOrderTypes(fetchedOrderTypes);
                setHierarchicalOrderTypes(buildHierarchy(fetchedOrderTypes));
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "admin.orderTypes.fetchError",
                        "Error fetching order types"
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching order types:", error);
            toast.error(
                t(
                    "admin.orderTypes.fetchError",
                    "Error fetching order types"
                )
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMoreOrderTypes = async () => {
        if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgOrderTypes(
                orgId,
                searchQuery || undefined,
                nextPageToken
            );
            if (response.success && response.success.order_types) {
                const fetchedOrderTypes = response.success.order_types;
                const updatedOrderTypes = [...orderTypes, ...fetchedOrderTypes];
                setOrderTypes(updatedOrderTypes);
                setHierarchicalOrderTypes(buildHierarchy(updatedOrderTypes));
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.orderTypes.fetchError", "Error fetching order types"));
            }
        } catch (error) {
            toast.error(t("admin.orderTypes.fetchError", "Error fetching order types"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchOrderTypes();
        }
    }, [orgId]);

    // Handle edit order type
    const handleEditOrderType = useCallback((item: OrderType) => {
        setTypeToEdit(item);
        setEditModalOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((item: FlattenedOrderType) => {
        setTypeToDelete(item);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((item: FlattenedOrderType) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditOrderType(item),
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
    }, [t, handleEditOrderType, handleDeleteConfirm]);

    // Handle delete execution
    const handleDeleteOrderType = async () => {
        if (!typeToDelete || !orgId) return;

        setDeletingType(true);
        try {
            const response = await deleteOrgOrderType(orgId, typeToDelete.id);
            if (response?.success) {
                toast.success(t("admin.orderTypes.deletedSuccess", "Order type deleted successfully"));
                // Remove from local state
                const updatedOrderTypes = orderTypes.filter(type => type.id !== typeToDelete.id);
                setOrderTypes(updatedOrderTypes);
                setHierarchicalOrderTypes(buildHierarchy(updatedOrderTypes));
            } else {
                toast.error(t("admin.orderTypes.deleteError", "Error deleting order type"));
            }
        } catch (error) {
            toast.error(t("admin.orderTypes.deleteError", "Error deleting order type"));
        } finally {
            setDeletingType(false);
            setDeleteModalOpen(false);
            setTypeToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("admin.orderTypes.title", "Order Types")}
                description={t("admin.orderTypes.description", "Manage order types hierarchy for your organization.")}
                showBackButton={true}
                docs={{ slug: "pd_admin_order_types" }}
                action={
                    <div className="flex gap-2 items-center">
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            {t("admin.orderTypes.addType", "Add Type")}
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-col">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <SearchBar
                        value={searchQuery}
                        className="flex-1"
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchOrderTypes}
                        placeholder={t(
                            "admin.orderTypes.searchPlaceholder",
                            "Search order types..."
                        )}
                    />
                    <OrderTypesColumnSelector
                        columnVisibility={columnVisibility}
                        columnOrder={columnOrder}
                        onColumnVisibilityChange={handleColumnVisibilityChange}
                        onColumnOrderChange={handleColumnOrderChange}
                        onReset={resetPreferences}
                    />
                </div>

                {/* Expand/Collapse Controls */}
                <div className="flex gap-2 items-center justify-end mt-6">
                    {flattenedData.length > 0 && flattenedData.some(item => item.hasChildren) && (
                        <>
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
                        </>
                    )}
                </div>

                {/* Order Types Table */}
                <OrderTypesTable
                    flattenedData={flattenedData}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    onToggleExpanded={toggleExpanded}
                    onAddOrderType={() => setCreateModalOpen(true)}
                    renderActions={renderActions}
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
                            onClick={loadMoreOrderTypes}
                            disabled={isLoadingMore}
                            className="min-w-32"
                        >
                            {isLoadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load more")
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <OrderTypeDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setTypeToDelete(null);
                    }
                }}
                orderType={typeToDelete}
                onConfirm={handleDeleteOrderType}
                isDeleting={deletingType}
            />

            {/* Create Order Type Modal */}
            <OrderTypeEditModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onTypeCreated={fetchOrderTypes}
                mode="create"
                allOrderTypes={orderTypes}
            />

            {/* Edit Order Type Modal */}
            <OrderTypeEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setTypeToEdit(null);
                    }
                }}
                onTypeCreated={fetchOrderTypes}
                orderTypeToEdit={typeToEdit}
                mode="edit"
                allOrderTypes={orderTypes}
            />
        </div>
    );
};

export default OrderTypesPage;
