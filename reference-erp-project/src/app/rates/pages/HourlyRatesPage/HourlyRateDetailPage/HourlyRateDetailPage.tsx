import { useHourlyRate } from "@/app/rates/contexts/HourlyRateContext";
import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import NewHourlyRateModal from "../components/hourly-rate-edit-modal";
import { deleteOrgHourlyRate } from "@/api/orgs/hourly-rates/hourly-rates";
import { formatDate } from "@/utils/miscelanea";
import HourlyRateDetailPageClients, { HourlyRateDetailPageClientsRef } from "./HourlyRateDetailPageClients/HourlyRateDetailPageClients";
import HourlyRateClientsAddModal from "./HourlyRateDetailPageClients/components/hourly-rate-clients-add-modal";
import HourlyRateTableSection from "./components/hourly-rate-table-section";
import Tag from "@/app/components/tag/tag";

// TODO: Implement job titles section for the first tab
// This is a basic placeholder structure following the rates pattern

const HourlyRateDetailPage = () => {
    const { hourlyRate, refreshHourlyRate } = useHourlyRate();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingHourlyRate, setDeletingHourlyRate] = useState(false);
    const [showAutosaved, setShowAutosaved] = useState(false);
    const [addClientsModalOpen, setAddClientsModalOpen] = useState(false);

    // Ref for clients component to refresh after adding
    const clientsRef = useRef<HourlyRateDetailPageClientsRef>(null);

    // Get current tab from URL or default to 'hourly-rate'
    const currentTab = searchParams.get('tab') || 'hourly-rate';

    // Valid tab values
    const validTabs = ['hourly-rate', 'clients'];

    // Ensure current tab is valid, otherwise default to 'hourly-rate'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'hourly-rate';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit hourly rate
    const handleEditHourlyRate = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteHourlyRate = async () => {
        if (!hourlyRate?.id || !orgId) return;

        setDeletingHourlyRate(true);
        try {
            const response = await deleteOrgHourlyRate(orgId, hourlyRate.id);
            if (response.success) {
                toast.success(t("hourlyRates.hourlyRateDeleted", "Hourly rate deleted successfully"));
                // Navigate back to rates list
                navigate(`/${orgId}/rates`);
            } else {
                toast.error(t("hourlyRates.errorDeletingHourlyRate", "Error deleting hourly rate"));
            }
        } catch (error) {
            toast.error(t("hourlyRates.errorDeletingHourlyRate", "Error deleting hourly rate"));
        } finally {
            setDeletingHourlyRate(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle hourly rate updated
    const handleHourlyRateUpdated = () => {
        refreshHourlyRate();
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
                title={hourlyRate.name}
                description={
                    "Valid from: " + formatDate(hourlyRate.valid_from, { showTime: true, showSeconds: false }) + (
                        hourlyRate.due_date ? " - Valid to: " + formatDate(hourlyRate.due_date, { showTime: true, showSeconds: false }) : ""
                    )
                }
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Tag text="autosaved" className={`${showAutosaved ? "opacity-100" : "opacity-0"} transition-all duration-300`} />
                        <Tag text={hourlyRate?.status || ""} className="capitalize" />
                        <IdBadge id={hourlyRate.id || ""} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEditHourlyRate,
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
                    <TabsTrigger className="py-0" value="hourly-rate">{t('hourlyRatesDetail.hourlyRate', 'Hourly Rate')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="clients">{t('hourlyRatesDetail.clients', 'Clients')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="hourly-rate" transition={{ duration: 0 }}>
                        <HourlyRateTableSection onAutosave={handleAutosave} />
                    </TabsContent>
                    <TabsContent value="clients" transition={{ duration: 0 }}>
                        <HourlyRateDetailPageClients ref={clientsRef} onAddClientClick={handleAddClientClick} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Hourly Rate Modal */}
            <NewHourlyRateModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onHourlyRateCreated={handleHourlyRateUpdated}
                hourlyRate={hourlyRate}
                mode="update"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("hourlyRates.deleteHourlyRate", "Delete Hourly Rate")}</DialogTitle>
                        <DialogDescription>
                            {t("hourlyRates.deleteHourlyRateConfirmation", "Are you sure you want to delete this hourly rate? This action cannot be undone.")}
                            {hourlyRate && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{hourlyRate.name}</strong>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingHourlyRate}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteHourlyRate}
                            disabled={deletingHourlyRate}
                        >
                            {deletingHourlyRate ? (
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

            {/* Add Clients Modal */}
            {orgId && hourlyRate.id && (
                <HourlyRateClientsAddModal
                    open={addClientsModalOpen}
                    onOpenChange={setAddClientsModalOpen}
                    onClientsAdded={handleClientsAdded}
                    orgId={orgId}
                    hourlyRateId={hourlyRate.id}
                />
            )}
        </>
    );
};

export default HourlyRateDetailPage;

