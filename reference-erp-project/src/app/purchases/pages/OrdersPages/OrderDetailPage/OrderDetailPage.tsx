import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import PageHeader from "@/app/components/page-header";
import { useOrder } from "../contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import FilesSection from "@/app/components/files/files-section";
import InfoOrderSection from "./components/info-order-section";
import OverviewSection from "./components/overview-section";
import OrderTrackingsCard from "./components/order-trackings-card";
import OrderItemsSection, { OrderItemsSectionRef } from "./components/order-items-section";
import { deleteOrgOrder, patchOrgOrder, postOrgOrderApprove, postOrgOrderCancel } from "@/api/orgs/orders/orders";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmationDialog } from "./components/confirmation-dialog";
import { OrderCancelModal } from "../components/order-cancel-modal";
import { OrderDeleteModal } from "../components/order-delete-modal";
import { ChangeNumberSeriesModal } from "../components/change-number-series-modal";
import DeliveriesSection from "./components/deliveries-section";
import { useState as useStateForOrderItems, useEffect as useEffectForOrderItems, useCallback as useCallbackForOrderItems } from "react";
import { getOrgOrderItems } from "@/api/orgs/orders/items/items";
import { OrderItem } from "@/types/orders/items/items";
import ThreadSection from "@/app/components/thread-section";
import Tag from "@/app/components/tag/tag";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import EventsTimeline from "@/app/components/events-timeline";

const OrderDetailPage = () => {
    const { t } = useTranslation();
    const { order, refreshOrder } = useOrder();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [isApprovingOrder, setIsApprovingOrder] = useState(false);
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const [isDeletingOrder, setIsDeletingOrder] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showChangeNumberSeriesModal, setShowChangeNumberSeriesModal] = useState(false);
    const [isChangingNumberSeries, setIsChangingNumberSeries] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const sidebarPanelRef = useRef<any>(null);
    const orderItemsSectionRef = useRef<OrderItemsSectionRef>(null);
    const [orderItems, setOrderItems] = useStateForOrderItems<OrderItem[]>([]);

    // Determine if order is in draft status (can be edited)
    const isDraft = order.status === "draft";
    const isReadOnly = !isDraft;

    // Fetch order items for deliveries section
    const fetchOrderItems = useCallbackForOrderItems(async () => {
        if (!orgId || !order.id) return;

        try {
            const response = await getOrgOrderItems(orgId, order.id);
            if (response.success && response.success.order_items) {
                setOrderItems(response.success.order_items);
            }
        } catch (error) {
            console.error("Error fetching order items:", error);
        }
    }, [orgId, order.id]);

    useEffectForOrderItems(() => {
        fetchOrderItems();
    }, [fetchOrderItems]);

    const handleSave = async () => {
        if (!orgId) return;

        setIsSaving(true);
        try {
            // Save order items first
            if (orderItemsSectionRef.current) {
                await orderItemsSectionRef.current.saveOrderItems();
            }

            // Then save order metadata
            const updateData = {
                notes: order.notes,
                order_date: order.order_date,
                supplier_id: order.supplier?.id,
                supplier_reference: order.supplier_reference,
                internal_reference: order.internal_reference,
                location_id: order.location?.id,
                order_type_id: order.order_type?.id,
                due_date: order.due_date,
            };

            const response = await patchOrgOrder(orgId, order.id, updateData);

            if (response.success) {
                refreshOrder();
                toast.success(t('orders.orderUpdated', 'Order updated successfully'));
            } else {
                toast.error(t('orders.orderUpdateFailed', 'Failed to update order'));
            }
        } catch (error) {
            console.error("Error saving order:", error);
            toast.error(t('orders.orderUpdateError', 'Error updating order'));
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        // Only enable save shortcut if order is in draft status
        if (!isDraft) return;

        const down = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                // Do not open if the user is typing in an input
                const target = e.target as HTMLElement
                if (
                    target.isContentEditable ||
                    target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement ||
                    target instanceof HTMLSelectElement
                ) {
                    return
                }

                e.preventDefault()
                handleSave();
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [handleSave, isDraft])

    const handleChangeNumberSeries = async (serialNumberId: string) => {
        if (!orgId) return;

        setIsChangingNumberSeries(true);
        try {
            const response = await patchOrgOrder(orgId, order.id, {
                serial_number_id: serialNumberId,
            });

            if (response.success) {
                toast.success(t('orders.numberSeriesChanged', 'Number series changed successfully'));
                refreshOrder();
                setShowChangeNumberSeriesModal(false);
            } else {
                toast.error(t('orders.numberSeriesChangeFailed', 'Failed to change number series'));
            }
        } catch (error) {
            console.error("Error changing number series:", error);
            toast.error(t('orders.numberSeriesChangeError', 'Error changing number series'));
        } finally {
            setIsChangingNumberSeries(false);
        }
    };

    const handleApproveOrder = async () => {
        if (!orgId) return;

        setIsApprovingOrder(true);
        try {
            const response = await postOrgOrderApprove(orgId, order.id);

            if (response.success) {
                toast.success(t('orders.orderApproved', 'Order approved successfully'));
                refreshOrder();
                setShowApproveDialog(false);
            } else {
                toast.error(t('orders.orderApproveFailed', 'Failed to approve order'));
            }
        } catch (error) {
            console.error("Error approving order:", error);
            toast.error(t('orders.orderApproveError', 'Error approving order'));
        } finally {
            setIsApprovingOrder(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!orgId) return;

        setIsCancellingOrder(true);
        try {
            const response = await postOrgOrderCancel(orgId, order.id);

            if (response.success) {
                toast.success(t('orders.orderCancelled', 'Order cancelled successfully'));
                refreshOrder();
                setShowCancelDialog(false);
            } else {
                toast.error(t('orders.orderCancelFailed', 'Failed to cancel order'));
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error(t('orders.orderCancelError', 'Error cancelling order'));
        } finally {
            setIsCancellingOrder(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!orgId) return;

        setIsDeletingOrder(true);
        try {
            const response = await deleteOrgOrder(orgId, order.id);

            if (response.success) {
                toast.success(t('orders.orderDeleted', 'Order deleted successfully'));
                setShowDeleteDialog(false);
                navigate(`/${orgId}/purchases/orders`);
            } else {
                toast.error(t('orders.orderDeleteFailed', 'Failed to delete order'));
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error(t('orders.orderDeleteError', 'Error deleting order'));
        } finally {
            setIsDeletingOrder(false);
        }
    };

    const handleCopySerialNumber = async () => {
        if (!order.serial_number) return;

        try {
            await navigator.clipboard.writeText(order.serial_number);
            setIsCopied(true);
            toast.success(t('common.copiedToClipboard', 'Copied to clipboard'));
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error(t('common.copyFailed', 'Failed to copy'));
        }
    };

    return (
        <>
            <ResizablePanelGroup direction="horizontal" className="max-h-[calc(100vh-6rem)] min-h-[calc(100vh-6rem)]">
                {/* Left side: Order Details */}
                <ResizablePanel defaultSize={66} minSize={40}>
                    <ScrollArea className="h-full min-w-0 pr-4" >
                        <div className={`flex flex-col gap-4 min-w-0 ${isSidebarCollapsed ? '' : 'pr-4'}`}>
                            <PageHeader
                                origin={order.origin}
                                title={
                                    <div className="flex items-center gap-2 cursor-pointer hover:underline rounded-md" onClick={handleCopySerialNumber}>
                                        {order.serial_number}
                                        {isCopied ? <Check className={`h-4 w-4 text-green-500`} /> : <Copy className={`h-4 w-4`} />}
                                    </div>
                                }
                                showBackButton={true}
                                action={
                                    <div className="flex items-center gap-2">
                                        {order.is_paid ? <Tag text={t('common.paid', 'Paid')} color="green" /> : <Tag text={t('common.unpaid', 'Unpaid')} color="gray" />}
                                        <IdBadge id={order.id} />
                                        {isDraft ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowApproveDialog(true)}
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    {t('common.approveOrder', 'Approve Order')}
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                                                </Button>
                                            </>
                                        ) : (
                                            order.status.toLowerCase() !== "cancelled" && <Button
                                                onClick={() => setShowCancelDialog(true)}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                {t('common.cancelOrder', 'Cancel Order')}
                                            </Button>
                                        )}
                                        {isDraft && <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t('common.actions.changeNumberSeries', 'Change Number Series'),
                                                    icon: 'file-digit',
                                                    onClick: () => setShowChangeNumberSeriesModal(true),
                                                },
                                                {
                                                    label: t('common.delete', 'Delete'),
                                                    icon: 'trash-2',
                                                    onClick: () => setShowDeleteDialog(true),
                                                    variant: 'destructive',
                                                }
                                            ]}
                                        />}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                                if (sidebarPanelRef.current) {
                                                    if (isSidebarCollapsed) {
                                                        sidebarPanelRef.current.expand();
                                                    } else {
                                                        sidebarPanelRef.current.collapse();
                                                    }
                                                }
                                            }}
                                            title={isSidebarCollapsed ? t('common.expandSidebar', 'Expand Sidebar') : t('common.collapseSidebar', 'Collapse Sidebar')}
                                        >
                                            {isSidebarCollapsed ? <PanelRightOpen className="h-4 w-4 text-muted-foreground" /> : <PanelRightClose className="h-4 w-4 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                }
                            />
                            {/* Overview Section - Reception Status & Economic Value */}
                            <OverviewSection />
                            {/* Order Info Section */}
                            <InfoOrderSection isReadOnly={isReadOnly} />
                            {/* Order Items Section */}
                            <OrderItemsSection ref={orderItemsSectionRef} isReadOnly={isReadOnly} />
                        </div>
                    </ScrollArea>
                </ResizablePanel>

                {!isSidebarCollapsed && <ResizableHandle />}

                {/* Right side: Tabs Section */}
                <ResizablePanel
                    ref={sidebarPanelRef}
                    defaultSize={34}
                    minSize={25}
                    maxSize={60}
                    collapsible={true}
                    collapsedSize={0}
                    onCollapse={() => setIsSidebarCollapsed(true)}
                    onExpand={() => setIsSidebarCollapsed(false)}
                >
                    <div className="flex flex-col gap-4 pl-4">
                        <Tabs defaultValue="general">
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="general">{t("admin.absences.tabs.policies", "General")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="messages">{t("admin.absences.tabs.types", "Messages")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="history">{t("admin.absences.tabs.types", "History")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="invoices">{t("admin.absences.tabs.types", "Invoices")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="files">{t("admin.absences.tabs.types", "Files")}</TabsTrigger>
                            </TabsList>
                            <TabsContents transition={{ duration: 0 }} className="mt-2">
                                <TabsContent value="general" transition={{ duration: 0 }}>
                                    <div className="flex flex-col gap-4 h-[calc(100vh-9.5rem)]">
                                        <div className="flex-1 min-h-0">
                                            <DeliveriesSection orderId={order.id} orderItems={orderItems} />
                                        </div>
                                        <div className="flex-1 min-h-0">
                                            <OrderTrackingsCard />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="messages" transition={{ duration: 0 }}>
                                    <div className="w-full h-[calc(100vh-8.5rem)]">
                                        <ThreadSection entityId={order.id} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="history" transition={{ duration: 0 }}>
                                    <div className="h-[calc(100vh-8.5rem)]">
                                        <EventsTimeline entityId={order.id} showSearchbar="sticky" showTitle={false} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="invoices" transition={{ duration: 0 }}>
                                    <div className="flex items-center justify-center h-128 border border-dashed border-border rounded-lg">
                                        <div className="text-center">
                                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                                {t('clientsDetail.summaryTodo', 'Invoices')}
                                            </h3>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="files" transition={{ duration: 0 }}>
                                    <div className="mt-2">
                                        <FilesSection entity_id={order.id} showBreadcrumbs={false} showCreateFolder={false} />
                                    </div>
                                </TabsContent>
                            </TabsContents>
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                open={showApproveDialog}
                onOpenChange={setShowApproveDialog}
                title={t('orders.approveOrderTitle', 'Approve Order')}
                description={t('orders.approveOrderDescription', 'Are you sure you want to approve this order? Once approved, the order cannot be modified.')}
                confirmText={t('common.approve', 'Approve')}
                cancelText={t('common.cancel', 'Cancel')}
                onConfirm={handleApproveOrder}
                isLoading={isApprovingOrder}
            />

            <OrderCancelModal
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                onConfirm={handleCancelOrder}
                isLoading={isCancellingOrder}
            />

            <OrderDeleteModal
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteOrder}
                isLoading={isDeletingOrder}
            />

            <ChangeNumberSeriesModal
                open={showChangeNumberSeriesModal}
                onOpenChange={setShowChangeNumberSeriesModal}
                onConfirm={handleChangeNumberSeries}
                currentSerialNumberId={null}
                orgId={orgId || ""}
                isLoading={isChangingNumberSeries}
            />
        </>
    );
};

export default OrderDetailPage;