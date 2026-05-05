import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import { useTimePolicy } from "../context/TimePolicyContext";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import TimePolicyEditModal from "../components/time-policy-edit-modal.tsx";
import TimePolicyDeleteModal from "../components/time-policy-delete-modal.tsx";
import { deleteTimePolicy } from "@/api/orgs/time-policies/time-policies";
import TimePolicyDetailPageGeneral from "./pages/TimePolicyDetailPageGeneral/TimePolicyDetailPageGeneral";
import TimePolicyDetailPageShifts from "./pages/TimePolicyDetailPageShifts/TimePolicyDetailPageShifts.tsx";
import TimePolicyDetailPageOvertimeRules from "./pages/TimePolicyDetailPageOvertimeRules/TimePolicyDetailPageOvertimeRules";

const TimePolicyDetailPage = React.memo(() => {
    const { t } = useTranslation();
    const { timePolicy, refetchTimePolicy } = useTimePolicy();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get current tab from URL or default to 'general'
    const currentTab = searchParams.get('tab') || 'general';

    // Valid tab values
    const validTabs = ['general', 'shifts', 'overtime-rules'];

    // Ensure current tab is valid, otherwise default to 'general'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'general';

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
        if (!timePolicy || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteTimePolicy(orgId, timePolicy.id);
            if (response.success) {
                toast.success(t("timePolicies.deletedSuccess", "Time policy deleted successfully"));
                navigate(`/${orgId}/admin/time-policies`);
            } else {
                toast.error(
                    response.error || t("timePolicies.deleteError", "Failed to delete time policy")
                );
            }
        } catch (error) {
            console.error("Error deleting time policy:", error);
            toast.error(t("timePolicies.deleteError", "Failed to delete time policy"));
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handlePolicyUpdated = async () => {
        await refetchTimePolicy();
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
                title={timePolicy?.name || ""}
                description={timePolicy?.description || ""}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={timePolicy?.id || ""} />
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
                    <TabsTrigger className="py-0" value="general">
                        {t("timePolicies.tabs.general", "General")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="shifts">
                        {t("timePolicies.tabs.shifts", "Shifts")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="overtime-rules">
                        {t("timePolicies.tabs.overtimeRules", "Overtime Rules")}
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="general" transition={{ duration: 0 }}>
                        <TimePolicyDetailPageGeneral />
                    </TabsContent>

                    <TabsContent value="shifts" transition={{ duration: 0 }}>
                        <TimePolicyDetailPageShifts />
                    </TabsContent>

                    <TabsContent value="overtime-rules" transition={{ duration: 0 }}>
                        <TimePolicyDetailPageOvertimeRules />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Modal */}
            {timePolicy && orgId && (
                <TimePolicyEditModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTimePolicyCreatedOrUpdated={handlePolicyUpdated}
                    orgId={orgId}
                    mode="edit"
                    policy={timePolicy}
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

            {/* Delete Confirmation Dialog */}
            <TimePolicyDeleteModal
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setIsDeleting(false);
                }}
                policy={timePolicy}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default TimePolicyDetailPage;

