import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { OrgUser } from "@/types/general/user";
import SearchBar from "@/app/components/search-bar";
import { getOrgUsers, deleteOrgUser, postOrgUserAssign } from "@/api/orgs/users/users";
import { toast } from "sonner";
import UserAssignmentAddModal from "../components/modals/user-assignment-add-modal";
import UsersTable from "../components/users-table";
import UserDeleteModal from "../components/modals/user-delete-modal";
import UserAssignmentRemoveModal from "../components/modals/user-assignment-remove-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useUsersTablePreferences } from "@/hooks/use-users-table-preferences";
import { UserColumnSelector } from "../components/user-column-selector";

const UsersTab = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useUsersTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<OrgUser | null>(null);
    const [deletingUser, setDeletingUser] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [userToAssign, setUserToAssign] = useState<OrgUser | null>(null);
    const [removeAssignmentModalOpen, setRemoveAssignmentModalOpen] = useState(false);
    const [userToRemoveAssignment, setUserToRemoveAssignment] = useState<OrgUser | null>(null);
    const [removingAssignment, setRemovingAssignment] = useState(false);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Fetch users function
    const fetchUsers = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgUsers(orgId, undefined, query, undefined, tableFilters || undefined);
            if (response.success && response.success.org_users) {
                setUsers(response.success.org_users);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            }
        } catch (error) {
            toast.error(t("admin.users.users.errorFetching", "Error fetching users"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchUsers();
        }
    }, [orgId]);

    // Load more users
    const loadMoreUsers = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgUsers(orgId, undefined, searchQuery, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.org_users) {
                setUsers(prev => [...prev, ...response.success.org_users]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.users.users.errorFetching", "Error fetching users"));
            }
        } catch (error) {
            toast.error(t("admin.users.users.errorFetching", "Error fetching users"));
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (user: OrgUser) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteUser = async () => {
        if (!userToDelete || !orgId) return;

        setDeletingUser(true);
        try {
            const response = await deleteOrgUser(orgId, userToDelete.id);
            if (response.success) {
                toast.success(t("admin.users.users.deleted", "User deleted successfully"));
                // Remove from local state
                setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            } else {
                toast.error(t("admin.users.users.errorDeleting", "Error deleting user"));
            }
        } catch (error) {
            toast.error(t("admin.users.users.errorDeleting", "Error deleting user"));
        } finally {
            setDeletingUser(false);
            setDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    // Handle assign confirmation
    const handleAssignConfirm = (user: OrgUser) => {
        setUserToAssign(user);
        setAssignModalOpen(true);
    };

    // Handle successful assignment
    const handleAssignSuccess = () => {
        fetchUsers(searchQuery);
    };

    // Handle remove assignment confirmation
    const handleRemoveAssignmentConfirm = (user: OrgUser) => {
        setUserToRemoveAssignment(user);
        setRemoveAssignmentModalOpen(true);
    };

    // Handle remove assignment execution
    const handleRemoveAssignment = async () => {
        if (!userToRemoveAssignment || !orgId) return;

        setRemovingAssignment(true);
        try {
            const unassignPayload = {
                employee_id: null,
                client_id: null,
                supplier_id: null,
            };

            const response = await postOrgUserAssign(orgId, userToRemoveAssignment.id, unassignPayload);

            if (response.success) {
                toast.success(t("admin.users.users.unassignedSuccess", "User unassigned successfully"));
                fetchUsers(searchQuery);
            } else {
                toast.error(t("admin.users.users.unassignError", "Error unassigning user"));
            }
        } catch (error) {
            console.error("Error unassigning user:", error);
            toast.error(t("admin.users.users.unassignError", "Error unassigning user"));
        } finally {
            setRemovingAssignment(false);
            setRemoveAssignmentModalOpen(false);
            setUserToRemoveAssignment(null);
        }
    };

    const renderTableActions = (user: OrgUser) => {
        const items = [
            {
                label: t("admin.users.users.edit", "Edit Assignment"),
                icon: "edit" as const,
                onClick: () => handleAssignConfirm(user),
            },
            {
                showOption: !!(user.employee?.id || user.client?.id || user.supplier?.id),
                label: t("admin.users.users.removeAssignment", "Remove Assignment"),
                icon: "user-round-x" as const,
                onClick: () => handleRemoveAssignmentConfirm(user),
            },
            {
                label: t("admin.users.users.delete", "Delete User"),
                icon: "trash-2" as const,
                onClick: () => handleDeleteConfirm(user),
                variant: "destructive" as const,
            }
        ];
        return <CustomActionsDropdown items={items} />;
    };

    return (
        <div className="mt-4 space-y-6">
            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchUsers}
                placeholder={t("admin.users.users.searchPlaceholder", "Search users...")}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchUsers(searchQuery)}
                    endSlot={
                        <UserColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Users Table */}
            <UsersTable
                data={users}
                isLoading={isLoading}
                searchQuery={searchQuery}
                renderActions={renderTableActions}
                onAssignClick={handleAssignConfirm}
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
                        onClick={loadMoreUsers}
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

            {/* Delete Confirmation Dialog */}
            <UserDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                user={userToDelete}
                onConfirm={handleDeleteUser}
                isDeleting={deletingUser}
            />

            {/* Assign User Dialog */}
            {userToAssign && orgId && (
                <UserAssignmentAddModal
                    open={assignModalOpen}
                    onOpenChange={setAssignModalOpen}
                    orgId={orgId}
                    user={userToAssign}
                    onSuccess={handleAssignSuccess}
                />
            )}

            {/* Remove Assignment Confirmation Dialog */}
            <UserAssignmentRemoveModal
                open={removeAssignmentModalOpen}
                onOpenChange={setRemoveAssignmentModalOpen}
                user={userToRemoveAssignment}
                onConfirm={handleRemoveAssignment}
                isRemoving={removingAssignment}
            />
        </div>
    );
};

export default UsersTab;
