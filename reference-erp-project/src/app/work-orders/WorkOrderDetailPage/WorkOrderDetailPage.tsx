import { useTranslation } from "react-i18next";
import { useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import { useWorkOrder } from "../contexts/WorkOrderContext";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { deleteWorkOrder } from "@/api/field-service/work-orders/work-orders";
import WorkOrderDetailPageSummary from "./pages/WorkOrderDetailPageSummary/WorkOrderDetailPageSummary";
import WorkOrderDetailPageHistory from "./pages/WorkOrderDetailPageHistory/WorkOrderDetailPageHistory";
import WorkOrderDetailPageFinancials from "./pages/WorkOrderDetailPageFinancials/WorkOrderDetailPageFinancials";
import WorkOrderDetailPagePurchases from "./pages/WorkOrderDetailPagePurchases/WorkOrderDetailPagePurchases";
import WorkOrderDeleteModal from "../components/work-order-delete-modal";
import { ClipboardCheck, Edit, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tag from "@/app/components/tag/tag";
import { UnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import UnsavedChangesModal from "@/app/components/forms-elements/modal-unsaved";
import WorkOrderFinishModal from "./components/work-order-finish-modal";

const WorkOrderDetailPage = () => {
    const { t } = useTranslation();
    const { workOrder } = useWorkOrder();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingWorkOrder, setDeletingWorkOrder] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showTabChangeModal, setShowTabChangeModal] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    // Refs to hold handlers from summary page
    const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
    const resetHandlerRef = useRef<(() => void) | null>(null);

    // Get current tab from URL or default to 'summary'
    const currentTab = searchParams.get('tab') || 'summary';

    // Valid tab values
    const validTabs = ['summary', 'history', 'financials', 'purchases'];

    // Ensure current tab is valid, otherwise default to 'summary'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'summary';

    // Register save handler from child component
    const registerSaveHandler = useCallback((handler: () => Promise<void>) => {
        saveHandlerRef.current = handler;
    }, []);

    // Register reset handler from child component
    const registerResetHandler = useCallback((handler: () => void) => {
        resetHandlerRef.current = handler;
    }, []);

    // Handle tab change with unsaved changes check
    const handleTabChange = (value: string) => {
        if (!validTabs.includes(value)) return;

        // If we have unsaved changes and we're in edit mode, show confirmation
        if (editMode && isDirty && activeTab === 'summary') {
            setPendingTab(value);
            setShowTabChangeModal(true);
            return;
        }

        // Exit edit mode when leaving summary tab
        if (activeTab === 'summary' && value !== 'summary') {
            setEditMode(false);
        }

        setSearchParams({ tab: value });
    };

    // Handle tab change confirmation
    const handleTabChangeConfirm = (confirmed: boolean) => {
        setShowTabChangeModal(false);
        if (confirmed) {
            // Reset form to original values
            if (resetHandlerRef.current) {
                resetHandlerRef.current();
            }

            if (pendingTab) {
                // Changing tabs - discard changes and switch tab
                setEditMode(false);
                setIsDirty(false);
                setSearchParams({ tab: pendingTab });
            } else {
                // Just canceling edit mode - discard changes and exit edit mode
                setEditMode(false);
                setIsDirty(false);
            }
        }
        setPendingTab(null);
    };

    // Handle edit button click
    const handleEnterEditMode = () => {
        setEditMode(true);
    };

    // Handle cancel button click
    const handleCancelEdit = () => {
        if (isDirty) {
            // Show confirmation modal
            setPendingTab(null); // Null means we're just canceling, not changing tabs
            setShowTabChangeModal(true);
        } else {
            setEditMode(false);
        }
    };

    // Handle save button click
    const handleSave = async () => {
        if (saveHandlerRef.current) {
            setIsSubmitting(true);
            try {
                await saveHandlerRef.current();
                setEditMode(false);
                setIsDirty(false);
            } catch (error) {
                // Error handling is done in the child component
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteWorkOrder = async () => {
        if (!workOrder?.id || !orgId) return;

        setDeletingWorkOrder(true);
        try {
            const response = await deleteWorkOrder(orgId, workOrder.id);
            if (response.success) {
                toast.success(t("workOrders.workOrderDeleted", "Work order deleted successfully"));
                // Navigate back to work orders list
                navigate(`/${orgId}/work-orders`);
            } else {
                toast.error(t("workOrders.errorDeletingWorkOrder", "Error deleting work order"));
            }
        } catch (error) {
            toast.error(t("workOrders.errorDeletingWorkOrder", "Error deleting work order"));
        } finally {
            setDeletingWorkOrder(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle work order updated
    // const handleWorkOrderUpdated = () => {
    //     refreshWorkOrder();
    // }; // TODO: Uncomment when WorkOrderEditModal is implemented


    return (
        <>
            <PageHeader
                title={workOrder.name || t('workOrders.untitledWorkOrder', 'Untitled Work Order')}
                description={workOrder.client?.trade_name ?? ""}
                showBackButton={true}
                origin={workOrder.origin || undefined}
                action={
                    <div className="flex items-center gap-2">
                        {workOrder.type && <Tag text={workOrder.type.name || "unknown"} color={workOrder.type.color || ""} />}
                        <IdBadge id={workOrder.id || ""} className="h-6 px-4 text-xs" />

                        {/* Show Edit/Cancel/Save buttons only on Summary tab */}
                        {activeTab === 'summary' && (
                            <>
                                {!editMode ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleEnterEditMode}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {t("common.edit", "Edit")}
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => setIsFinishModalOpen(true)}
                                        >
                                            <ClipboardCheck className="h-4 w-4 mr-2" />
                                            {t("workOrders.finishWorkOrder", "Finish Work Order")}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            disabled={isSubmitting}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            {t("common.cancel", "Cancel")}
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={handleSave}
                                            disabled={isSubmitting || !isDirty}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t("common.saving", "Saving...")}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {t("common.save", "Save")}
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Show Close Order button on other tabs */}
                        {activeTab !== 'summary' && (
                            <Button
                                variant="default"
                                onClick={() => setIsFinishModalOpen(true)}
                            >
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                {t("workOrders.finishWorkOrder", "Finish Work Order")}
                            </Button>
                        )}

                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDeleteConfirm,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <UnsavedChangesGuard hasUnsavedChanges={editMode && isDirty && activeTab === 'summary'}>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList
                        className="w-full justify-start border-b-2 border-border bg-background mb-4"
                        activeClassName='border-b-2 border-primary -mb-1.5'
                    >
                        <TabsTrigger className="py-0" value="summary">{t('workOrdersDetail.summary', 'Summary')}</TabsTrigger>
                        <TabsTrigger className="py-0" value="history">{t('workOrdersDetail.history', 'History')}</TabsTrigger>
                        <TabsTrigger className="py-0" value="financials">{t('workOrdersDetail.financials', 'Financials')}</TabsTrigger>
                        <TabsTrigger className="py-0" value="purchases">{t('workOrdersDetail.purchases', 'Purchases')}</TabsTrigger>
                    </TabsList>

                    <TabsContents transition={{ duration: 0 }}>
                        <TabsContent value="summary" transition={{ duration: 0 }} className={`${activeTab !== 'summary' ? 'hidden' : ''}`}>
                            <WorkOrderDetailPageSummary
                                editMode={editMode}
                                onDirtyChange={setIsDirty}
                                onRegisterSaveHandler={registerSaveHandler}
                                onRegisterResetHandler={registerResetHandler}
                            />
                        </TabsContent>
                        <TabsContent value="history" transition={{ duration: 0 }} className={`${activeTab !== 'history' ? 'hidden' : ''}`}>
                            <WorkOrderDetailPageHistory />
                        </TabsContent>
                        <TabsContent value="financials" transition={{ duration: 0 }} className={`${activeTab !== 'financials' ? 'hidden' : ''}`}>
                            <WorkOrderDetailPageFinancials />
                        </TabsContent>
                        <TabsContent value="purchases" transition={{ duration: 0 }} className={`${activeTab !== 'purchases' ? 'hidden' : ''}`}>
                            <WorkOrderDetailPagePurchases />
                        </TabsContent>
                    </TabsContents>
                </Tabs>
            </UnsavedChangesGuard>

            {/* Tab Change Confirmation Modal */}
            <UnsavedChangesModal
                isOpen={showTabChangeModal}
                onClose={handleTabChangeConfirm}
            />

            {/* Delete Confirmation Dialog */}
            <WorkOrderDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                workOrder={workOrder}
                onConfirm={handleDeleteWorkOrder}
                isDeleting={deletingWorkOrder}
            />

            {/* Work Order Finish Modal */}
            <WorkOrderFinishModal
                open={isFinishModalOpen}
                onOpenChange={setIsFinishModalOpen}
            />
        </>
    );
};

export default WorkOrderDetailPage;
