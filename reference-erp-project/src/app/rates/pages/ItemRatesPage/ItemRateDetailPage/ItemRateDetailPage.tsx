import { useRate } from "../../../contexts/RateContext";
import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ItemRateEditModal from "../components/item-rate-edit-modal";
import ItemRateDeleteModal from "../components/item-rate-delete-modal";
import { deleteOrgRate } from "@/api/orgs/rates/rates";
import { formatDate } from "@/utils/miscelanea";
import ItemRateDetailPageClients, { ItemRateDetailPageClientsRef } from "./pages/ItemRateDetailPageClients";
import ItemRateClientsAddModal from "./components/item-rate-clients-add-modal";
import ItemRateDetailEditPage from "./pages/ItemRateDetailEditPage";
import Tag from "@/app/components/tag/tag";

const ItemRateDetailPage = () => {
    const { rate, refreshRate } = useRate();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRate, setDeletingRate] = useState(false);
    const [showAutosaved, setShowAutosaved] = useState(false);
    const [addClientsModalOpen, setAddClientsModalOpen] = useState(false);

    // Ref for clients component to refresh after adding
    const clientsRef = useRef<ItemRateDetailPageClientsRef>(null);

    // Get current tab from URL or default to 'rate'
    const currentTab = searchParams.get('tab') || 'rate';

    // Valid tab values
    const validTabs = ['rate', 'clients'];

    // Ensure current tab is valid, otherwise default to 'rate'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'rate';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit rate
    const handleEditRate = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteRate = async () => {
        if (!rate?.id || !orgId) return;

        setDeletingRate(true);
        try {
            const response = await deleteOrgRate(orgId, rate.id);
            if (response.success) {
                toast.success(t("rates.rateDeleted", "Rate deleted successfully"));
                // Navigate back to rates list
                navigate(`/${orgId}/rates`);
            } else {
                toast.error(t("rates.errorDeletingRate", "Error deleting rate"));
            }
        } catch (error) {
            toast.error(t("rates.errorDeletingRate", "Error deleting rate"));
        } finally {
            setDeletingRate(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle rate updated
    const handleRateUpdated = () => {
        refreshRate();
    };

    // Handle autosave
    const handleAutosave = () => {
        setShowAutosaved(true);
        setTimeout(() => {
            setShowAutosaved(false);
        }, 1000);
    };

    // Handle add clients modal
    const handleAddClientClick = () => {
        setAddClientsModalOpen(true);
    };

    // Handle clients added
    const handleClientsAdded = () => {
        clientsRef.current?.refreshClients();
    };

    return (
        <>
            <PageHeader
                title={rate.name}
                description={
                    "Valid from: " + formatDate(rate.valid_from, { showTime: true, showSeconds: false }) + (
                        rate.due_date ? " - Valid to: " + formatDate(rate.due_date, { showTime: true, showSeconds: false }) : ""
                    )
                }
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Tag text="autosaved" className={`${showAutosaved ? "opacity-100" : "opacity-0"} transition-all duration-300`} />
                        <Tag text={rate?.status || ""} className="capitalize" />
                        <IdBadge id={rate.id || ""} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEditRate,
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
                    <TabsTrigger className="py-0" value="rate">{t('ratesDetail.rate', 'Rate')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="clients">{t('ratesDetail.clients', 'Clients')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="rate" transition={{ duration: 0 }}>
                        <ItemRateDetailEditPage onSavingChange={handleAutosave} />
                    </TabsContent>
                    <TabsContent value="clients" transition={{ duration: 0 }}>
                        <ItemRateDetailPageClients ref={clientsRef} onAddClientClick={handleAddClientClick} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Rate Modal */}
            <ItemRateEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onRateCreated={handleRateUpdated}
                rate={rate}
                mode="update"
                renderActions={
                    rate
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              setEditModalOpen(false);
                                              setDeleteModalOpen(true);
                                          },
                                          variant: "destructive",
                                      },
                                  ]}
                              />
                          )
                        : undefined
                }
            />

            <ItemRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                rate={rate}
                onConfirm={handleDeleteRate}
                isDeleting={deletingRate}
            />

            {/* Add Clients Modal */}
            {orgId && rate.id && (
                <ItemRateClientsAddModal
                    open={addClientsModalOpen}
                    onOpenChange={setAddClientsModalOpen}
                    onClientsAdded={handleClientsAdded}
                    orgId={orgId}
                    rateId={rate.id}
                />
            )}
        </>
    );
};

export default ItemRateDetailPage;

