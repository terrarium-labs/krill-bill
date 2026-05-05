import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getOrgRoleUsers, deleteOrgRoleUsers } from '@/api/orgs/roles/users/users';
import { OrgUser } from "@/types/general/user";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import RoleUserDeleteDialog from "./role-user-delete-dialog";
import RoleUsersTable from "./role-users-table";

interface RoleUsersSectionProps {
    onAddUserClick?: () => void;
}

export interface RoleUsersRef {
    refreshUsers: () => void;
}

const RoleUsersSection = forwardRef<RoleUsersRef, RoleUsersSectionProps>(({ onAddUserClick }, ref) => {
    const { t } = useTranslation();
    const { orgId, roleId } = useParams();
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<OrgUser | null>(null);
    const [deletingUser, setDeletingUser] = useState(false);

    const fetchUsers = async (query: string, page_token: string | null) => {
        if (!orgId || !roleId) return;

        // Set loading state for search (not for pagination)
        if (!page_token) {
            if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
        }

        try {
            const response = await getOrgRoleUsers(orgId, roleId, query || undefined, page_token);

            if (response.success) {
                const fetchedUsers = response.success?.users || [];

                if (page_token) {
                    // Loading more results - append to existing
                    setUsers((prev) => [...prev, ...fetchedUsers]);
                } else {
                    // New search or initial load - replace existing
                    setUsers(fetchedUsers);
                }

                // Handle next page token
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "admin.iam.users.error",
                        "Error fetching role users"
                    )
                );
                // Reset to empty array on error for new searches
                if (!page_token) {
                    setUsers([]);
                }
            }
        } catch (error) {
            console.error("Error fetching role users:", error);
            toast.error(
                t(
                    "admin.iam.users.error",
                    "Error fetching role users"
                )
            );
            // Reset to empty array on error for new searches
            if (!page_token) {
                setUsers([]);
            }
        } finally {
            // Clear loading state for search
            if (!page_token) {
                setIsSearching(false);
                setIsLoading(false);
            }
        }
    };

    // Load more function
    const loadMore = async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchUsers(searchQuery, nextPageToken);
        } catch (error) {
            toast.error(t("admin.iam.users.error", "Error loading more users"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && roleId) {
            fetchUsers(searchQuery, null);
        }
    }, [orgId, roleId]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshUsers: () => fetchUsers("", null)
    }));

    // Handle delete confirmation
    const handleDeleteConfirm = (orgUser: OrgUser) => {
        setUserToDelete(orgUser);
        setDeleteModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (orgUser: OrgUser) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(orgUser),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle delete execution
    const handleDeleteUser = async () => {
        if (!userToDelete || !orgId || !roleId) return;

        setDeletingUser(true);
        try {
            const response = await deleteOrgRoleUsers(orgId, roleId, {
                users_ids: [userToDelete.id]
            });
            if (response?.success) {
                toast.success(t("admin.iam.users.userDeleted", "User removed from role successfully"));
                // Remove from local state
                setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            } else {
                toast.error(t("admin.iam.users.errorDeletingUser", "Error removing user from role"));
            }
        } catch (error) {
            toast.error(t("admin.iam.users.errorDeletingUser", "Error removing user from role"));
        } finally {
            setDeletingUser(false);
            setDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center gap-4">
                <SearchBar
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchUsers(query, null)}
                    placeholder={t(
                        "admin.iam.users.searchPlaceholder",
                        "Search users..."
                    )}
                    className="flex-1"
                />
                <Button onClick={onAddUserClick}>
                    <Plus className="h-4 w-4" />
                    {t("admin.iam.users.addUser", "Add user")}
                </Button>
            </div>

            {/* Users Table */}
            <RoleUsersTable
                data={users}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onEmptyStateAction={onAddUserClick}
                searchQuery={searchQuery}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
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
            <RoleUserDeleteDialog
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setUserToDelete(null);
                    }
                }}
                user={userToDelete}
                onConfirm={handleDeleteUser}
                isDeleting={deletingUser}
            />
        </div>
    );
});

export default RoleUsersSection;

