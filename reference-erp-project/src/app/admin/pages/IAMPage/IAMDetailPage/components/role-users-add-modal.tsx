import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, Loader2, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getOrgUsers } from '@/api/orgs/users/users';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SearchBar from '@/app/components/search-bar';
import { postOrgRoleUsers } from '@/api/orgs/roles/users/users';
import { OrgUser } from '@/types/general/user';
import { OrgUserAvatar } from '@/app/components/avatars/org-user-avatar';

interface RoleUsersAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    roleId: string;
    onUsersAdded?: () => void;
}

const RoleUsersAddModal: React.FC<RoleUsersAddModalProps> = ({
    open,
    onOpenChange,
    orgId,
    roleId,
    onUsersAdded,
}) => {
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [addingUsers, setAddingUsers] = useState<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setUsers([]);
            setSearchQuery("");
            setNextPageToken(null);
            setAddingUsers(new Set());
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async (query: string = "", pageToken: string | null = null) => {
        if (!orgId) return;

        if (query) {
            setIsSearching(true);
        } else if (!pageToken) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await getOrgUsers(orgId, undefined, query || undefined, pageToken || undefined);

            if (response.success) {
                const fetchedUsers = response.success?.org_users || [];

                if (query || !pageToken) {
                    // Reset users for new search or initial load
                    setUsers(fetchedUsers);
                } else {
                    // Append users for pagination
                    setUsers(prev => [...prev, ...fetchedUsers]);
                }

                setNextPageToken(response.success?.next_page_token || null);
            } else {
                toast.error(
                    t("admin.iam.users.errorFetchingUsers", "Failed to load users")
                );
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(
                t("admin.iam.users.errorFetchingUsers", "Failed to load users")
            );
        } finally {
            setIsLoading(false);
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        fetchUsers(query);
    };

    const loadMoreUsers = useCallback(() => {
        if (nextPageToken && !isLoadingMore && !isLoading) {
            fetchUsers(searchQuery, nextPageToken);
        }
    }, [nextPageToken, isLoadingMore, isLoading, searchQuery]);

    // Scroll-based load more
    useEffect(() => {
        if (!nextPageToken || isLoadingMore) return;
        const scrollEl = scrollContainerRef.current;
        const sentinel = loadMoreSentinelRef.current;
        if (!scrollEl || !sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry?.isIntersecting) loadMoreUsers();
            },
            { root: scrollEl, rootMargin: "100px", threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [nextPageToken, isLoadingMore, loadMoreUsers]);

    const handleAddUser = async (orgUser: OrgUser) => {
        if (!orgId || !roleId) {
            toast.error(t("admin.iam.users.errorMissingIds", "Organization ID and Role ID are required"));
            return;
        }

        // Add to adding set to show loading state
        setAddingUsers(prev => new Set(prev).add(orgUser.id));

        try {
            const response = await postOrgRoleUsers(orgId, roleId, {
                users_ids: [orgUser.id]
            });

            if (response.success) {
                toast.success(
                    t("admin.iam.users.userAddedSuccess", "User added successfully to role")
                );

                // Remove user from list since they've been added
                setUsers(prev => prev.filter(u => u.id !== orgUser.id));

                if (onUsersAdded) {
                    onUsersAdded();
                }
            } else {
                toast.error(
                    response.error || t("admin.iam.users.errorAddingUser", "Failed to add user to role")
                );
            }
        } catch (error) {
            console.error("Error adding user to role:", error);
            toast.error(
                t("admin.iam.users.errorAddingUser", "Failed to add user to role")
            );
        } finally {
            // Remove from adding set
            setAddingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(orgUser.id);
                return newSet;
            });
        }
    };

    if (!orgId || !roleId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t("admin.iam.users.addUsers", "Add Users")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Search Bar */}
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={t("admin.iam.users.searchUsers", "Search users...")}
                        className="w-full"
                    />

                    {/* User List */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        {t("admin.iam.users.loadingUsers", "Loading users...")}
                                    </p>
                                </div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("admin.iam.users.noUsersFound", "No users found")
                                            : t("admin.iam.users.noUsers", "No users available")
                                        }
                                    </h3>
                                    <p className="text-sm text-muted-foreground text-center">
                                        {searchQuery
                                            ? t(
                                                "admin.iam.users.noUsersFoundDescription",
                                                "No users found for '{{query}}'",
                                                { query: searchQuery }
                                            )
                                            : t(
                                                "admin.iam.users.noUsersDescription",
                                                "No users available to add to this role"
                                            )
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 w-full">
                                {users.map((orgUser) => {
                                    const isAdding = addingUsers.has(orgUser.id);

                                    return (
                                        <div
                                            key={orgUser.id}
                                            className="flex items-center justify-between gap-2 w-full"
                                        >
                                            <OrgUserAvatar
                                                orgUser={orgUser}
                                                showName={true}
                                                showEmail={true}
                                                showType={true}
                                                size="sm"
                                                variant="full"
                                            />
                                            {/* Add Button */}
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddUser(orgUser)}
                                                disabled={isAdding}
                                                variant="outline"
                                                className="shrink-0"
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {t("admin.iam.users.adding", "Adding...")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4" />
                                                        {t("admin.iam.users.add", "Add")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}

                                {/* Scroll sentinel for load more */}
                                {nextPageToken && (
                                    <div ref={loadMoreSentinelRef} className="flex justify-center py-3">
                                        {isLoadingMore && (
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RoleUsersAddModal;

