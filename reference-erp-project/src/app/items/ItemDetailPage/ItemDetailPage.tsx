import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useItem } from "../contexts/ItemContext";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ItemDetailPageSummary from "./pages/ItemDetailPageSummary/ItemDetailPageSummary";
import ItemDetailPageSellPrices from "./pages/ItemDetailPageSellPrices/ItemDetailPageSellPrices";
import ItemDetailPageBuyPrices from "./pages/ItemDetailPageBuyPrices/ItemDetailPageBuyPrices";
import ItemDetailPageStock from "./pages/ItemDetailPageStock/ItemDetailPageStock";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewItemModal from "../components/new-item-modal";
import { deleteOrgItem } from "@/api/items/items";
import FilesSection from "@/app/components/files/files-section";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";

const ItemDetailPage = () => {
    const { t } = useTranslation();
    const { item, refreshItem } = useItem();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(false);

    // Get current tab from URL or default to 'summary'
    const currentTab = searchParams.get('tab') || 'summary';

    // Valid tab values
    const validTabs = ['summary', 'sell-prices', 'buy-prices', 'stock', 'files'];

    // Ensure current tab is valid, otherwise default to 'summary'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'summary';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit item
    const handleEditItem = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteItem = async () => {
        if (!item?.id || !orgId) return;

        setDeletingItem(true);
        try {
            const response = await deleteOrgItem(orgId, item.id);
            if (response.success) {
                toast.success(t("items.itemDeleted", "Item deleted successfully"));
                // Navigate back to items list
                navigate(`/${orgId}/items`);
            } else {
                toast.error(t("items.errorDeletingItem", "Error deleting item"));
            }
        } catch (error) {
            toast.error(t("items.errorDeletingItem", "Error deleting item"));
        } finally {
            setDeletingItem(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle item updated
    const handleItemUpdated = () => {
        refreshItem();
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={<ItemAvatar item={item} showName={false} size="2xl" className="font-bold" />}
                title={item.name}
                description={item.description || item.item_code || ""}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={item.id || ""} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEditItem,
                                },
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

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName='border-b-2 border-primary -mb-1.5'
                >
                    <TabsTrigger className="py-0" value="summary">{t('itemsDetail.summary', 'Summary')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="sell-prices">{t('itemsDetail.sellPrices', 'Sell Prices')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="buy-prices">{t('itemsDetail.buyPrices', 'Buy Prices')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="stock">{t('itemsDetail.stock', 'Stock')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="files">{t('itemsDetail.files', 'Files')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="summary" transition={{ duration: 0 }}>
                        <ItemDetailPageSummary onEdit={handleEditItem} />
                    </TabsContent>
                    <TabsContent value="sell-prices" transition={{ duration: 0 }}>
                        <ItemDetailPageSellPrices />
                    </TabsContent>
                    <TabsContent value="buy-prices" transition={{ duration: 0 }}>
                        <ItemDetailPageBuyPrices />
                    </TabsContent>
                    <TabsContent value="stock" transition={{ duration: 0 }}>
                        <ItemDetailPageStock />
                    </TabsContent>
                    <TabsContent value="files" transition={{ duration: 0 }}>
                        <FilesSection key={`item-files-${item.id}`} entity_id={item.id} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Item Modal */}
            <NewItemModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onItemCreated={handleItemUpdated}
                item={item}
                mode="update"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("items.deleteItem", "Delete Item")}</DialogTitle>
                        <DialogDescription>
                            {t("items.deleteItemConfirmation", "Are you sure you want to delete this item? This action cannot be undone.")}
                            {item && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{item.name}</strong>
                                    {item.item_code && ` (${item.item_code})`}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingItem}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteItem}
                            disabled={deletingItem}
                        >
                            {deletingItem ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.deleting", "Deleting...")}
                                </>
                            ) : (
                                t("common.delete", "Delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ItemDetailPage;

