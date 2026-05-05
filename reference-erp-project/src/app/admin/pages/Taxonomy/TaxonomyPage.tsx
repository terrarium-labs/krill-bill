import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Plus, Expand, Minimize, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { ItemHierarchy } from "@/types/general/taxonomy";
import {
  getOrgsItemsHierarchies,
  deleteOrgsItemsHierarchy
} from "@/api/orgs/hierachy/hierachy";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import PageHeader from "@/app/components/page-header";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import TaxonomyEditModal from "./components/modals/taxonomy-edit-modal";
import TaxonomyViewModal, { TaxonomyViewModalRef } from "./components/modals/taxonomy-view-modal";
import TaxonomyItemsAddModal from "./components/modals/taxonomy-items-add-modal";
import TaxonomyDeleteModal from "./components/modals/taxonomy-delete-modal";
import TaxonomyTable, { FlattenedItemHierarchy } from "./components/taxonomy-table";
import { useTaxonomyTablePreferences } from "@/hooks/use-taxonomy-table-preferences";
import { TaxonomyColumnSelector } from "./components/taxonomy-column-selector";

// Hierarchical item hierarchy with children
interface HierarchicalItemHierarchy extends ItemHierarchy {
  children?: HierarchicalItemHierarchy[];
}

const TaxonomyPage = () => {
  const { t } = useTranslation();
  const { orgId } = useParams();
  const [itemHierarchies, setItemHierarchies] = useState<ItemHierarchy[]>([]);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useTaxonomyTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );
  const [hierarchicalItemHierarchies, setHierarchicalItemHierarchies] = useState<HierarchicalItemHierarchy[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemHierarchyToDelete, setItemHierarchyToDelete] = useState<FlattenedItemHierarchy | null>(null);
  const [deletingItemHierarchy, setDeletingItemHierarchy] = useState(false);
  const [expandAllToggled, setExpandAllToggled] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [taxonomyToEdit, setTaxonomyToEdit] = useState<ItemHierarchy | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<ItemHierarchy | null>(null);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState(false);
  const [taxonomyModalMode, setTaxonomyModalMode] = useState<'create' | 'edit'>('create');
  const taxonomyViewModalRef = useRef<TaxonomyViewModalRef>(null);

  // Type filter options
  const typeOptions = [
    { value: "family", label: t("taxonomy.type.family", "Family") },
    { value: "sub_family", label: t("taxonomy.type.sub_family", "Sub Family") },
    { value: "category", label: t("taxonomy.type.category", "Category") },
  ];

  // Convert flat item hierarchies array to hierarchical structure
  const buildHierarchy = useCallback((items: ItemHierarchy[]): HierarchicalItemHierarchy[] => {
    const itemsMap = new Map<string, HierarchicalItemHierarchy>();
    const rootItems: HierarchicalItemHierarchy[] = [];

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
  const flattenedData: FlattenedItemHierarchy[] = (() => {
    const result: FlattenedItemHierarchy[] = [];

    const addItemsRecursively = (
      items: HierarchicalItemHierarchy[],
      level: number,
      parentId?: string
    ) => {
      items.forEach((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const flatItem: FlattenedItemHierarchy = {
          id: item.id,
          name: item.name,
          type: item.type,
          icon: item.icon ?? undefined,
          color: item.color ?? undefined,
          margin: item.margin,
          num_items_hierarchy: item.num_items_hierarchy,
          num_items_total: item.num_items_total,
          description: item.description ?? undefined,
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

    addItemsRecursively(hierarchicalItemHierarchies, 0);
    return result;
  })();

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

    const addParentIds = (items: HierarchicalItemHierarchy[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          allParentIds.add(item.id);
          addParentIds(item.children);
        }
      });
    };

    addParentIds(hierarchicalItemHierarchies);
    setExpandedItems(allParentIds);
  }, [hierarchicalItemHierarchies]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes([]);
  };

  // Handle row click
  const handleRowClick = useCallback((item: FlattenedItemHierarchy) => {
    setSelectedTaxonomy(item as any);
    setViewModalOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((item: ItemHierarchy) => {
    setTaxonomyToEdit(item);
    setTaxonomyModalMode('edit');
    setTaxonomyModalOpen(true);
  }, []);

  // Handle add item to taxonomy
  const handleAddItemToTaxonomy = useCallback(() => {
    setAddItemModalOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((item: FlattenedItemHierarchy) => {
    setItemHierarchyToDelete(item);
    setDeleteModalOpen(true);
  }, []);

  // Custom render function for table actions
  const renderTableActions = (item: FlattenedItemHierarchy) => {
    return (
      <CustomActionsDropdown
        items={[
{
            label: t("common.view", "View"),
            icon: "eye",
            onClick: () => handleRowClick(item),
          },
          {
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => handleEdit(item as any),
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
  };

  const fetchItemHierarchies = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getOrgsItemsHierarchies(
        orgId,
        query || undefined,
        undefined
      );

      if (response.success) {
        let fetchedItemHierarchies = response.success.items_hierarchies || [];

        // Filter by type if selected
        if (selectedTypes.length > 0) {
          fetchedItemHierarchies = fetchedItemHierarchies.filter((itemHierarchy: ItemHierarchy) =>
            selectedTypes.includes(itemHierarchy.type)
          );
        }

        setItemHierarchies(fetchedItemHierarchies);
        setHierarchicalItemHierarchies(buildHierarchy(fetchedItemHierarchies));
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(
          t(
            "taxonomy.error",
            "Error fetching item hierarchies"
          )
        );
      }
    } catch (error) {
      console.error("Error fetching item hierarchies:", error);
      toast.error(
        t(
          "taxonomy.error",
          "Error fetching item hierarchies"
        )
      );
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const loadMoreItemHierarchies = async () => {
    if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const response = await getOrgsItemsHierarchies(
        orgId,
        searchQuery || undefined,
        nextPageToken
      );
      if (response.success && response.success.items_hierarchies) {
        let fetchedItemHierarchies = response.success.items_hierarchies;

        // Filter by type if selected
        if (selectedTypes.length > 0) {
          fetchedItemHierarchies = fetchedItemHierarchies.filter((itemHierarchy: ItemHierarchy) =>
            selectedTypes.includes(itemHierarchy.type)
          );
        }

        const updatedItemHierarchies = [...itemHierarchies, ...fetchedItemHierarchies];
        setItemHierarchies(updatedItemHierarchies);
        setHierarchicalItemHierarchies(buildHierarchy(updatedItemHierarchies));
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("taxonomy.error", "Error fetching item hierarchies"));
      }
    } catch (error) {
      toast.error(t("taxonomy.error", "Error fetching item hierarchies"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchItemHierarchies();
    }
  }, [orgId]);

  // Refetch when filters change
  useEffect(() => {
    if (orgId && !isLoading) {
      fetchItemHierarchies(searchQuery);
    }
  }, [selectedTypes]);

  // Handle delete execution
  const handleDeleteItemHierarchy = async () => {
    if (!itemHierarchyToDelete || !orgId) return;

    setDeletingItemHierarchy(true);
    try {
      const response = await deleteOrgsItemsHierarchy(orgId, itemHierarchyToDelete.id);
      if (response?.success) {
        toast.success(t("taxonomy.deletedSuccess", "Item hierarchy deleted successfully"));
        // Remove from local state
        const updatedItemHierarchies = itemHierarchies.filter(hierarchy => hierarchy.id !== itemHierarchyToDelete.id);
        setItemHierarchies(updatedItemHierarchies);
        setHierarchicalItemHierarchies(buildHierarchy(updatedItemHierarchies));
        setDeleteModalOpen(false);
        setItemHierarchyToDelete(null);
      } else {
        toast.error(t("taxonomy.errorDeleting", "Error deleting item hierarchy"));
      }
    } catch (error) {
      toast.error(t("taxonomy.errorDeleting", "Error deleting item hierarchy"));
    } finally {
      setDeletingItemHierarchy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("taxonomy.title", "Item Taxonomy")}
        description={t("taxonomy.description", "Manage your item hierarchies and categories.")}
        showBackButton={true}
        docs={{ slug: "pd_admin_taxonomy" }}
        action={
          <Button
            onClick={() => {
              setTaxonomyToEdit(null);
              setTaxonomyModalMode('create');
              setTaxonomyModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("taxonomy.addHierarchy", "Add Hierarchy")}
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          isLoading={isSearching}
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchItemHierarchies}
          placeholder={t(
            "taxonomy.searchPlaceholder",
            "Search item hierarchies..."
          )}
        />

          {/* Filters and Controls */}
          <div className="flex gap-2 items-center justify-between">
          {/* Filters on the left */}
          <div className="flex gap-2 items-center">
            <MultiSelect
              options={typeOptions}
              selected={selectedTypes}
              size="default"
              onSelectedChange={setSelectedTypes}
              placeholder={t("taxonomy.filterByType", "Type")}
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

          {/* Expand/Collapse Controls and Column Selector on the right */}
          <div className="flex gap-2 items-center">
            <TaxonomyColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
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
        </div>

        {/* Item Hierarchies Table */}
        <TaxonomyTable
          data={flattenedData}
          isLoading={isLoading}
          renderActions={renderTableActions}
          onRowClick={handleRowClick}
          clickableRows={true}
          onEmptyStateAction={() => {
            setTaxonomyToEdit(null);
            setTaxonomyModalMode('create');
            setTaxonomyModalOpen(true);
          }}
          searchQuery={searchQuery}
          toggleExpanded={toggleExpanded}
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
              onClick={loadMoreItemHierarchies}
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

      {/* Delete Confirmation Modal */}
      <TaxonomyDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) {
            setItemHierarchyToDelete(null);
          }
        }}
        taxonomy={itemHierarchyToDelete}
        onConfirm={handleDeleteItemHierarchy}
        isDeleting={deletingItemHierarchy}
      />

      {/* Create/Edit Taxonomy Modal */}
      <TaxonomyEditModal
        open={taxonomyModalOpen}
        onOpenChange={(open) => {
          setTaxonomyModalOpen(open);
          if (!open) {
            setTaxonomyToEdit(null);
            setDeleteModalOpen(false);
          }
        }}
        onTaxonomyCreatedOrUpdated={fetchItemHierarchies}
        taxonomyToEdit={taxonomyModalMode === 'edit' ? taxonomyToEdit : null}
        mode={taxonomyModalMode}
        renderActions={taxonomyModalMode === 'edit' && taxonomyToEdit ? () => (
          <CustomActionsDropdown
            items={[
              {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => {
                  setTaxonomyModalOpen(false);
                  handleDeleteConfirm(taxonomyToEdit as any);
                },
                variant: "destructive",
              },
            ]}
          />
        ) : undefined}
      />

      {/* Taxonomy View Modal */}
      <TaxonomyViewModal
        ref={taxonomyViewModalRef}
        open={viewModalOpen}
        onOpenChange={(open) => {
          setViewModalOpen(open);
          if (!open) {
            setSelectedTaxonomy(null);
          }
        }}
        taxonomy={selectedTaxonomy}
        onEditTaxonomy={(taxonomy) => {
          setTaxonomyToEdit(taxonomy);
          setTaxonomyModalMode('edit');
          setTaxonomyModalOpen(true);
        }}
        onTaxonomyDeleted={() => {
          fetchItemHierarchies();
        }}
        onAddItemClick={handleAddItemToTaxonomy}
      />

      {/* Add Item to Taxonomy Modal */}
      <TaxonomyItemsAddModal
        open={addItemModalOpen}
        onOpenChange={setAddItemModalOpen}
        orgId={orgId}
        taxonomyId={selectedTaxonomy?.id}
        onSuccess={() => {
          // Refresh the taxonomy view modal items list
          taxonomyViewModalRef.current?.refreshItems();
        }}
      />
    </div>
  );
};

export default TaxonomyPage;
