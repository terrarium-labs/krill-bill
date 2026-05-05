import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import { useSupplier } from "../contexts/SupplierContext";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SupplierEditModal from "../components/supplier-edit-modal";
import SupplierDeleteModal from "../components/supplier-delete-modal";
import { deleteSupplier } from "@/api/suppliers/suppliers";
import FilesSection from "@/app/components/files/files-section";
import SupplierDetailPageInfo from "./pages/SupplierDetailPageInfo/SupplierDetailPageInfo";
import SupplierDetailPageItems from "./pages/SupplierDetailPageItems";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";

const SupplierDetailPage = () => {
    const { t } = useTranslation();
    const { supplier, refreshSupplier } = useSupplier();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSupplier, setDeletingSupplier] = useState(false);

    // Get current tab from URL or default to 'summary' (summary is the default tab)
    const currentTab = searchParams.get('tab') || 'summary';

    // Valid tab values
    const validTabs = ['summary', 'items', 'files'];

    // Ensure current tab is valid, otherwise default to 'summary'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'summary';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit supplier
    const handleEditSupplier = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteSupplier = async () => {
        if (!supplier?.id || !orgId) return;

        setDeletingSupplier(true);
        try {
            const response = await deleteSupplier(orgId, supplier.id);
            if (response.success) {
                toast.success(t("suppliers.supplierDeleted", "Supplier deleted successfully"));
                // Navigate back to suppliers list
                navigate(`/${orgId}/suppliers`);
            } else {
                toast.error(t("suppliers.errorDeletingSupplier", "Error deleting supplier"));
            }
        } catch (error) {
            toast.error(t("suppliers.errorDeletingSupplier", "Error deleting supplier"));
        } finally {
            setDeletingSupplier(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle supplier updated
    const handleSupplierUpdated = () => {
        refreshSupplier();
    };

    // Handle edit modal close
    const handleEditModalClose = (open: boolean) => {
        setEditModalOpen(open);
        if (!open) {
            // Reset delete modal state when edit modal closes
            setDeleteModalOpen(false);
        }
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={<SupplierAvatar supplier={supplier} size="2xl" showName={false} imageEditable={true} onImageChange={handleSupplierUpdated} />}
                title={`${supplier.trade_name} ${supplier.supplier_name ? `(${supplier.supplier_name})` : ""}`}
                description={`${supplier.tax_code}`}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={supplier.id || ""} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.actions.edit", "Edit"),
                                    icon: "edit",
                                    onClick: handleEditSupplier,
                                },
                                {
                                    label: t("common.actions.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteConfirm,
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
                    <TabsTrigger className="py-0" value="summary">{t('suppliersDetail.summary', 'Summary')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="items">{t('suppliersDetail.items', 'Items')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="files">{t('suppliersDetail.files', 'Files')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="summary" transition={{ duration: 0 }}>
                        <SupplierDetailPageInfo onEdit={handleEditSupplier} />
                    </TabsContent>
                    <TabsContent value="items" transition={{ duration: 0 }}>
                        <SupplierDetailPageItems />
                    </TabsContent>
                    <TabsContent value="files" transition={{ duration: 0 }}>
                        <FilesSection key={`supplier-files-${supplier.id}`} entity_id={supplier.id} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Supplier Modal */}
            <SupplierEditModal
                open={editModalOpen}
                onOpenChange={handleEditModalClose}
                onSupplierCreatedOrUpdated={handleSupplierUpdated}
                supplier={supplier}
                mode="edit"
                renderActions={() => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => {
                                    setEditModalOpen(false);
                                    handleDeleteConfirm();
                                },
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
            />

            {/* Delete Confirmation Modal */}
            <SupplierDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                supplier={supplier}
                onConfirm={handleDeleteSupplier}
                isDeleting={deletingSupplier}
            />
        </>
    );
};

export default SupplierDetailPage;

