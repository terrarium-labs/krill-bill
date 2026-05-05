import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import { useRole } from "../context/RoleContext";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import RoleEditModal from "../components/role-edit-modal";
import RoleDeleteModal from "../components/role-delete-modal";
import { deleteOrgRole } from "@/api/orgs/roles/roles";
import RoleUsersTab from "./pages/RoleUsersTab";
import RolePermissionsTab from "./pages/RolePermissionsTab";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";

const IAMDetailPage = React.memo(() => {
    const { t } = useTranslation();
    const { role, refetchRole } = useRole();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get current tab from URL or default to 'users'
    const currentTab = searchParams.get('tab') || 'users';

    // Valid tab values
    const validTabs = ['users', 'permissions'];

    // Ensure current tab is valid, otherwise default to 'users'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'users';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handlers
    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!role || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgRole(orgId, role.id);
            if (response.success) {
                toast.success(t("admin.iam.roleDeletedSuccessfully", "Role deleted successfully"));
                navigate(`/${orgId}/admin/iam`);
            } else {
                toast.error(
                    response.error || t("admin.iam.errorDeletingRole", "Failed to delete role")
                );
            }
        } catch (error) {
            console.error("Error deleting role:", error);
            toast.error(t("admin.iam.errorDeletingRole", "Failed to delete role"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRoleUpdated = async () => {
        await refetchRole();
        setIsEditModalOpen(false);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setIsDeleteDialogOpen(false);
    };

    return (
        <>
            {/* Page Header */}
            <PageHeader
                title={role?.name || ""}
                description={role?.description || ""}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={role?.id || ""} />

                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: handleEdit,
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDelete,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName='border-b-2 border-primary -mb-1.5'
                >
                    <TabsTrigger className="py-0" value="users">
                        {t("admin.iam.tabs.users", "Users")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="permissions">
                        {t("admin.iam.tabs.permissions", "Permissions")}
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="users" transition={{ duration: 0 }}>
                        <RoleUsersTab />
                    </TabsContent>

                    <TabsContent value="permissions" transition={{ duration: 0 }}>
                        <RolePermissionsTab />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Modal */}
            {role && orgId && (
                <RoleEditModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onRoleCreatedOrUpdated={handleRoleUpdated}
                    role={role}
                    mode="edit"
                    renderActions={() => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        setIsEditModalOpen(false);
                                        setTimeout(() => {
                                            handleDelete();
                                        }, 100);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}

            {/* Delete Confirmation Modal */}
            <RoleDeleteModal
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setIsDeleting(false);
                }}
                role={role}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default IAMDetailPage;

