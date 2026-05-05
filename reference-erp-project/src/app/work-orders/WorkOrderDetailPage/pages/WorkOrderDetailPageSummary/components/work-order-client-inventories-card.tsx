import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Eye, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getWorkOrderClientsInventories, deleteWorkOrderClientsInventories } from "@/api/field-service/work-orders/clients-inventories/clients-inventories";
import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AddInventoryModal from "./modals/add-inventory-modal";
import { Inventory } from "@/types/clients/inventory";
import InventoryItemViewModal from "@/app/clients/ClientDetailPage/pages/ClientDetailPageLocations/components/inventory-item-view-modal";

interface WorkOrderClientInventoriesCardProps {
    workOrder: any;
    editMode?: boolean;
}

// Hierarchical inventory with children
interface HierarchicalInventory extends Inventory {
    children?: HierarchicalInventory[];
}

// Flattened inventory for display
interface FlattenedInventory extends Inventory {
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    isAssigned: boolean;
}

const WorkOrderClientInventoriesCard = ({ workOrder, editMode = false }: WorkOrderClientInventoriesCardProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const [allInventory, setAllInventory] = useState<Inventory[]>([]);
    const [assignedInventoryIds, setAssignedInventoryIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [inventoryToView, setInventoryToView] = useState<Inventory | null>(null);

    // Fetch inventories (now includes full hierarchy chain)
    const fetchData = async () => {
        if (!orgId || !workOrderId) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch inventories with full hierarchy chain
            const response = await getWorkOrderClientsInventories(orgId, workOrderId, undefined);
            if (response.success) {
                const items = response.success.items || [];
                setAllInventory(items);
                
                // Determine which items are directly assigned (leaf nodes in the hierarchy)
                // An item is assigned if it doesn't have any children
                const itemsMap = new Map<string, Inventory>();
                items.forEach((item: Inventory) => {
                    itemsMap.set(item.id, item);
                });
                
                const assignedIds = new Set<string>();
                items.forEach((item: Inventory) => {
                    // Check if this item has children (i.e., if any other item has it as parent)
                    const hasChildren = items.some((otherItem: Inventory) => 
                        otherItem.parent?.id === item.id
                    );
                    // If it doesn't have children, it's a directly assigned item
                    if (!hasChildren) {
                        assignedIds.add(item.id);
                    }
                });
                setAssignedInventoryIds(assignedIds);
            } else {
                setError(response.error || "Error fetching inventory");
            }
        } catch (error) {
            setError(error as string);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [orgId, workOrderId]);

    // Build hierarchical structure
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
                const parent = itemsMap.get(item.parent.id)!;
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(hierarchicalItem);
            } else {
                rootItems.push(hierarchicalItem);
            }
        });
        
        return rootItems;
    }, []);

    const hierarchicalInventory = useMemo(() => {
        return buildHierarchy(allInventory);
    }, [allInventory, buildHierarchy]);

    // Determine which items have children (for action dropdown logic)
    const itemsWithChildren = useMemo(() => {
        const withChildren = new Set<string>();
        allInventory.forEach((item) => {
            const hasChildren = allInventory.some((otherItem) => 
                otherItem.parent?.id === item.id
            );
            if (hasChildren) {
                withChildren.add(item.id);
            }
        });
        return withChildren;
    }, [allInventory]);

    // Flatten hierarchical data for display
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
                    isAssigned: assignedInventoryIds.has(item.id),
                };
                result.push(flatItem);
                
                if (expandedItems.has(item.id) && hasChildren) {
                    addItemsRecursively(item.children!, level + 1, item.id);
                }
            });
        };
        
        addItemsRecursively(hierarchicalInventory, 0);
        return result;
    }, [hierarchicalInventory, expandedItems, assignedInventoryIds]);

    // Expand all by default
    useEffect(() => {
        if (hierarchicalInventory.length > 0 && expandedItems.size === 0) {
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
        }
    }, [hierarchicalInventory]);

    // Toggle expand/collapse
    const toggleExpanded = useCallback((itemId: string, event: React.MouseEvent) => {
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
    }, []);

    const handleOpenAddModal = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!orgId || !workOrderId) return;
        
        try {
            const response = await deleteWorkOrderClientsInventories(orgId, workOrderId, itemId);
            if (response.success || response === undefined) {
                toast.success(t('workOrders.inventoryItemDeletedSuccessfully', 'Inventory item deleted successfully'));
                fetchData();
            } else {
                toast.error(response.error || t('workOrders.errorDeletingInventoryItem', 'Error deleting inventory item'));
            }
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            toast.error(t('workOrders.errorDeletingInventoryItem', 'Error deleting inventory item'));
        }
    };

    const handleViewItem = (itemId: string) => {
        const inventoryItem = allInventory.find(item => item.id === itemId);
        if (inventoryItem) {
            setInventoryToView(inventoryItem);
            setViewModalOpen(true);
        }
    };

    // Render actions for view modal (only Delete if item has no children)
    const renderModalActions = useCallback((inventoryItem: Inventory) => {
        const hasChildren = itemsWithChildren.has(inventoryItem.id);
        
        const items = [];
        if (!hasChildren && editMode) {
            items.push({
                label: t('common.delete', 'Delete'),
                icon: 'trash-2',
                onClick: () => {
                    setViewModalOpen(false);
                    setInventoryToView(null);
                    handleDeleteItem(inventoryItem.id);
                },
                variant: 'destructive' as const,
            });
        }
        
        if (items.length === 0) {
            return null;
        }
        
        return (
            <CustomActionsDropdown
                items={items}
            />
        );
    }, [t, handleDeleteItem, itemsWithChildren]);

    const assignedCount = assignedInventoryIds.size;

    if (assignedCount === 0 && !loading) {
        return (
            <>
                <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            {t('workOrdersDetail.inventories', 'Inventories')}
                        </h4>
                        {editMode && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleOpenAddModal}
                                disabled={!workOrder?.client?.id}
                                className="h-7"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                {t('workOrdersDetail.addInventory', 'Add')}
                            </Button>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground py-4">
                        {loading ? t('common.loading', 'Loading...') : t('workOrdersDetail.noInventoriesAdded', 'No inventories added yet')}
                    </div>
                </div>
                {orgId && workOrderId && workOrder?.client?.id && (
                    <AddInventoryModal
                        open={isModalOpen}
                        onOpenChange={handleModalClose}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        clientId={workOrder.client.id}
                        locationId={workOrder.location?.id || null}
                        onSuccess={fetchData}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        {t('workOrdersDetail.inventories', 'Inventories')}
                    </h4>
                    {editMode && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleOpenAddModal}
                            disabled={!workOrder?.client?.id}
                            className="h-7"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            {t('workOrdersDetail.addInventory', 'Add')}
                        </Button>
                    )}
                </div>
                {loading ? (
                    <div className="text-sm text-muted-foreground py-4">
                        {t('common.loading', 'Loading...')}
                    </div>
                ) : error ? (
                    <div className="text-sm text-destructive py-4">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10 max-h-[300px] pr-1">
                        {flattenedData.map((item) => {
                            const indent = item.level * 24;
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center justify-between text-sm py-2 px-2 rounded-lg border border-border transition-colors cursor-pointer",
                                        "hover:bg-muted/60",
                                        item.isAssigned && "bg-muted/30"
                                    )}
                                    style={item.level > 0 ? { marginLeft: `${indent}px` } : undefined}
                                    onClick={(e) => {
                                        if (item.hasChildren) {
                                            toggleExpanded(item.id, e);
                                        } else {
                                            handleViewItem(item.id);
                                        }
                                    }}
                                >
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                        {item.hasChildren && (
                                            <ChevronRight
                                                className={cn(
                                                    "h-4 w-4 shrink-0 transition-all duration-300",
                                                    item.isExpanded ? "rotate-90" : "rotate-0"
                                                )}
                                            />
                                        )}
                                        {!item.hasChildren && <div className="w-4 shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-foreground">{item.name || item.serial_number || item.id}</div>
                                            {item.description && (
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {editMode ? (
                                        <div className="flex items-center justify-start gap-2 shrink-0 min-w-[4.5rem]" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewItem(item.id);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {!itemsWithChildren.has(item.id) && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(item.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <CustomActionsDropdown
                                                items={[
                                                    {
                                                        label: t('common.view', 'View'),
                                                        icon: 'eye',
                                                        onClick: () => handleViewItem(item.id),
                                                    },
                                                ]}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {orgId && workOrderId && workOrder?.client?.id && (
                <>
                    <AddInventoryModal
                        open={isModalOpen}
                        onOpenChange={handleModalClose}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        clientId={workOrder.client.id}
                        locationId={workOrder.location?.id || null}
                        onSuccess={fetchData}
                    />
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
                </>
            )}
        </>
    );
};

export default WorkOrderClientInventoriesCard;