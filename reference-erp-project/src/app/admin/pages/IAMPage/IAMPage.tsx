import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Role } from "@/types/general/roles";
import { getOrgRoles, deleteOrgRole } from "@/api/orgs/roles/roles";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import RoleEditModal from "./components/role-edit-modal";
import RolesTable from "./components/roles-table";
import RoleDeleteModal from "./components/role-delete-modal";
import { useRolesTablePreferences } from "@/hooks/use-roles-table-preferences";
import { RoleColumnSelector } from "./components/role-column-selector";

const IAMPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useRolesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit'>('create');
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch roles function
    const fetchRoles = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgRoles(
                orgId,
                query || null,
                null
            );
            if (response.success && response.success.roles) {
                setRoles(response.success.roles);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.iam.errorFetchingRoles") || "Error fetching roles");
            }
        } catch (error) {
            toast.error(t("admin.iam.errorFetchingRoles") || "Error fetching roles");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRoles();
    }, []);

    // Load more roles
    const loadMoreRoles = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgRoles(
                orgId,
                searchQuery || null,
                nextPageToken
            );
            if (response.success && response.success.roles) {
                setRoles(prev => [...prev, ...response.success.roles]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.iam.errorFetchingRoles") || "Error fetching roles");
            }
        } catch (error) {
            toast.error(t("admin.iam.errorFetchingRoles") || "Error fetching roles");
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle open create modal
    const handleOpenCreateModal = () => {
        setRoleModalMode('create');
        setRoleToEdit(null);
        setRoleModalOpen(true);
    };

    // Handle open edit modal
    const handleOpenEditModal = (role: Role) => {
        setRoleModalMode('edit');
        setRoleToEdit(role);
        setRoleModalOpen(true);
    };

    // Handle delete role
    const handleDeleteRole = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteRoleConfirm = async () => {
        if (!orgId || !roleToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgRole(orgId, roleToDelete.id);

            if (response.success) {
                toast.success(t("admin.iam.roleDeletedSuccessfully") || "Role deleted successfully");
                fetchRoles(searchQuery); // Refresh the list
                setRoleToDelete(null);
                setIsDeleteModalOpen(false);
            } else {
                toast.error(t("admin.iam.errorDeletingRole") || "Error deleting role");
            }
        } catch (error) {
            toast.error(t("admin.iam.errorDeletingRole") || "Error deleting role");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditModalClose = () => {
        setRoleModalOpen(false);
        setIsDeleteModalOpen(false);
    };

    // Custom render function for table actions
    const renderTableActions = (role: Role) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleOpenEditModal(role),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteRole(role),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle row click
    const handleRowClick = (role: Role) => {
        navigate(`/${orgId}/admin/iam/${role.id}?tab=users`);
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("admin.iam.title", "Identity & Access Management")}
                description={t("admin.iam.description", "Manage roles and permissions.")}
                docs={{ slug: "pd_admin_iam" }}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreateModal}>
                            <Plus className="h-4 w-4" />
                            {t("admin.iam.addRole", "Add Role")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchRoles}
                placeholder={t("admin.iam.searchPlaceholder", "Search roles...")}
            />

            <div className="flex justify-end">
                <RoleColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Roles Table */}
            <RolesTable
                data={roles}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows={true}
                onEmptyStateAction={handleOpenCreateModal}
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
                            onClick={loadMoreRoles}
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

            {/* Role Modal (Create/Edit) */}
            <RoleEditModal
                open={roleModalOpen}
                onOpenChange={handleEditModalClose}
                onRoleCreatedOrUpdated={() => fetchRoles(searchQuery)}
                role={roleToEdit}
                mode={roleModalMode}
                renderActions={
                    roleModalMode === 'edit' && roleToEdit
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              setRoleModalOpen(false);
                                              setTimeout(() => {
                                                  handleDeleteRole(roleToEdit);
                                              }, 100);
                                          },
                                          variant: "destructive",
                                      },
                                  ]}
                              />
                          )
                        : undefined
                }
            />

            {/* Delete Confirmation Modal */}
            <RoleDeleteModal
                open={isDeleteModalOpen}
                onOpenChange={(open) => {
                    setIsDeleteModalOpen(open);
                    if (!open) {
                        setRoleToDelete(null);
                        setIsDeleting(false);
                    }
                }}
                role={roleToDelete}
                onConfirm={handleDeleteRoleConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default IAMPage;

