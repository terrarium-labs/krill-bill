import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Plus, Expand, Minimize, FilterX, Workflow, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Group } from "@/types/general/groups";
import { getOrgGroups, deleteOrgGroup } from "@/api/orgs/groups/groups";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import PageHeader from "@/app/components/page-header";
import GroupEditModal from "./components/group-edit-modal";
import GroupViewModal, { GroupViewModalRef } from "./components/group-view-modal";
import GroupEmployeeAddModal from "./components/group-employee-add-modal";
import OrgReactFlowDiagram from "./components/groups-diagram";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import GroupsTable, { FlattenedGroup } from "./components/groups-table";
import GroupDeleteModal from "./components/group-delete-modal";
import { useGroupsTablePreferences } from "@/hooks/use-groups-table-preferences";
import { GroupColumnSelector } from "./components/group-column-selector";
// Hierarchical group with children
interface HierarchicalGroup extends Group {
    children?: HierarchicalGroup[];
}

const OrgChartPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useGroupsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [hierarchicalGroups, setHierarchicalGroups] = useState<HierarchicalGroup[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<FlattenedGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState(false);
    const [expandAllToggled, setExpandAllToggled] = useState<boolean>(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
    const groupViewModalRef = useRef<GroupViewModalRef>(null);
    const [showDiagram, setShowDiagram] = useState(false);
    // Type filter options
    const typeOptions = [
        { value: "area", label: t("groups.type.area", "Area") },
        { value: "department", label: t("groups.type.department", "Department") },
        { value: "section", label: t("groups.type.section", "Section") },
    ];

    // Convert flat groups array to hierarchical structure
    const buildHierarchy = useCallback((items: Group[]): HierarchicalGroup[] => {
        const itemsMap = new Map<string, HierarchicalGroup>();
        const rootItems: HierarchicalGroup[] = [];

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
        const result: FlattenedGroup[] = [];

        const addItemsRecursively = (
            items: HierarchicalGroup[],
            level: number,
            parentId?: string
        ) => {
            items.forEach((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const flatItem: FlattenedGroup = {
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

        addItemsRecursively(hierarchicalGroups, 0);
        return result;
    }, [hierarchicalGroups, expandedItems]);

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

        const addParentIds = (items: HierarchicalGroup[]) => {
            items.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    allParentIds.add(item.id);
                    addParentIds(item.children);
                }
            });
        };

        addParentIds(hierarchicalGroups);
        setExpandedItems(allParentIds);
    }, [hierarchicalGroups]);


    const fetchGroups = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgGroups(
                orgId,
                query || undefined,
                undefined
            );

            if (response.success) {
                let fetchedGroups = response.success.groups || [];

                // Filter by type if selected
                if (selectedTypes.length > 0) {
                    fetchedGroups = fetchedGroups.filter((group: Group) =>
                        selectedTypes.includes(group.type)
                    );
                }

                setGroups(fetchedGroups);
                setHierarchicalGroups(buildHierarchy(fetchedGroups));
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "groups.error",
                        "Error fetching groups"
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast.error(
                t(
                    "groups.error",
                    "Error fetching groups"
                )
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMoreGroups = async () => {
        if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgGroups(
                orgId,
                searchQuery || undefined,
                nextPageToken
            );
            if (response.success && response.success.groups) {
                let fetchedGroups = response.success.groups;

                // Filter by type if selected
                if (selectedTypes.length > 0) {
                    fetchedGroups = fetchedGroups.filter((group: Group) =>
                        selectedTypes.includes(group.type)
                    );
                }

                const updatedGroups = [...groups, ...fetchedGroups];
                setGroups(updatedGroups);
                setHierarchicalGroups(buildHierarchy(updatedGroups));
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("groups.error", "Error fetching groups"));
            }
        } catch (error) {
            toast.error(t("groups.error", "Error fetching groups"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchGroups();
        }
    }, [orgId]);

    // Refetch when filters change
    useEffect(() => {
        if (orgId && !isLoading) {
            fetchGroups(searchQuery);
        }
    }, [selectedTypes]);

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedTypes([]);
    };

    // Handle diagram toggle
    const handleToggleDiagram = () => {
        setShowDiagram(!showDiagram);
    };

    // Handle row click to view group
    const handleRowClick = useCallback((item: FlattenedGroup) => {
        setSelectedGroup(item);
        setViewModalOpen(true);
    }, []);

    // Handle edit group
    const handleEditGroup = useCallback((item: Group) => {
        setGroupToEdit(item);
        setEditModalOpen(true);
    }, []);

    // Handle add employee to group
    const handleAddEmployeeToGroup = useCallback(() => {
        setAddEmployeeModalOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((item: FlattenedGroup) => {
        setGroupToDelete(item);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((item: FlattenedGroup) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditGroup(item),
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
    }, [t, handleEditGroup, handleDeleteConfirm]);

    // Handle delete execution
    const handleDeleteGroup = async () => {
        if (!groupToDelete || !orgId) return;

        setDeletingGroup(true);
        try {
            const response = await deleteOrgGroup(orgId, groupToDelete.id);
            if (response?.success) {
                toast.success(t("groups.deletedSuccess", "Group deleted successfully"));
                // Remove from local state
                const updatedGroups = groups.filter(group => group.id !== groupToDelete.id);
                setGroups(updatedGroups);
                setHierarchicalGroups(buildHierarchy(updatedGroups));
            } else {
                toast.error(t("groups.errorDeleting", "Error deleting group"));
            }
        } catch (error) {
            toast.error(t("groups.errorDeleting", "Error deleting group"));
        } finally {
            setDeletingGroup(false);
            setDeleteModalOpen(false);
            setGroupToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("groups.title", "Organization Chart")}
                description={t("groups.description", "Manage your organization's structure and groups.")}
                showBackButton={true}
                docs={{ slug: "pd_admin_org_chart" }}
                action={
                    <div className="flex gap-2 items-center">
                        <Tabs value={showDiagram ? 'diagram' : 'table'} onValueChange={handleToggleDiagram}>
                            <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName='border-none rounded-md'>
                                <TabsTrigger className="py" value="table"><Table2 className="h-4 w-4" /></TabsTrigger>
                                <TabsTrigger className="py-0" value="diagram"><Workflow className="h-4 w-4" /></TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            {t("groups.addGroup", "Add Group")}
                        </Button>
                    </div>
                }
            />

            {!showDiagram && <div className="flex flex-col gap-6">
                {/* Search Bar */}
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchGroups}
                    placeholder={t(
                        "groups.searchPlaceholder",
                        "Search groups..."
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
                            placeholder={t("groups.filterByType", "Type")}
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

                    {/* Expand/Collapse Controls and column selector on the right */}
                    <div className="flex gap-2 items-center">
                        {flattenedData.length > 0 && flattenedData.some((item: FlattenedGroup) => item.hasChildren) && (
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
                        <GroupColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    </div>
                </div>

                {/* Groups Table */}
                <GroupsTable
                    groups={flattenedData}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    onRowClick={handleRowClick}
                    onToggleExpanded={toggleExpanded}
                    onAddGroup={() => setCreateModalOpen(true)}
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
                            onClick={loadMoreGroups}
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
            </div>}

            {/* Org React Flow Diagram Component */}
            {showDiagram && <OrgReactFlowDiagram groups={groups} />}

            {/* Delete Confirmation Dialog */}
            <GroupDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setGroupToDelete(null);
                    }
                }}
                group={groupToDelete}
                onConfirm={handleDeleteGroup}
                isDeleting={deletingGroup}
            />

            {/* Create Group Modal */}
            <GroupEditModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onGroupCreated={fetchGroups}
                mode="create"
            />

            {/* Edit Group Modal */}
            <GroupEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setGroupToEdit(null);
                    }
                }}
                onGroupCreated={fetchGroups}
                groupToEdit={groupToEdit}
                mode="edit"
            />

            {/* Group View Modal */}
            <GroupViewModal
                ref={groupViewModalRef}
                open={viewModalOpen}
                onOpenChange={(open) => {
                    setViewModalOpen(open);
                    if (!open) {
                        setSelectedGroup(null);
                    }
                }}
                group={selectedGroup}
                onEditGroup={(group) => {
                    setGroupToEdit(group);
                    setEditModalOpen(true);
                }}
                onGroupDeleted={() => {
                    fetchGroups();
                }}
                onAddEmployeeClick={handleAddEmployeeToGroup}
            />

            {/* Add Employee to Group Modal */}
            <GroupEmployeeAddModal
                open={addEmployeeModalOpen}
                onOpenChange={setAddEmployeeModalOpen}
                orgId={orgId}
                groupId={selectedGroup?.id}
                onSuccess={() => {
                    // Refresh the group view modal employees list
                    groupViewModalRef.current?.refreshEmployees();
                }}
            />
        </div>
    );
};

export default OrgChartPage;
