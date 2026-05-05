import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BoxIcon, CarIcon, ClockIcon, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useClient } from "../contexts/ClientContext";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ClientDetailPageInfo from "./pages/ClientDetailPageInfo/ClientDetailPageInfo";
import ClientDetailPageLocations from "./pages/ClientDetailPageLocations/ClientDetailPageLocations";
import ClientDetailPageRates, { ClientDetailPageRatesRef } from "./pages/ClientDetailPageRates/ClientDetailPageRates";
import ClientDetailPageHourlyRates, { ClientDetailPageHourlyRatesRef } from "./pages/ClientDetailPageHourlyRates/ClientDetailPageHourlyRates";
import ClientDetailPageCommutingRates, { ClientDetailPageCommutingRatesRef } from "./pages/ClientDetailPageCommutingRates/ClientDetailPageCommutingRates";
import ClientRatesAddModal from "./pages/ClientDetailPageRates/components/client-rates-add-modal";
import ClientHourlyRatesAddModal from "./pages/ClientDetailPageHourlyRates/components/client-hourly-rates-add-modal";
import ClientCommutingRatesAddModal from "./pages/ClientDetailPageCommutingRates/components/client-commuting-rates-add-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewClientModal from "../components/client-edit-modal";
import { deleteClient } from "@/api/clients/clients";
import FilesSection from "@/app/components/files/files-section";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { VerticalMenu, VerticalMenuItem } from "@/components/ui/vertical-menu";

const ClientDetailPage = () => {
  const { t } = useTranslation();
  const { client, refreshClient } = useClient();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  const [addRatesModalOpen, setAddRatesModalOpen] = useState(false);
  const [addHourlyRatesModalOpen, setAddHourlyRatesModalOpen] = useState(false);
  const [addCommutingRatesModalOpen, setAddCommutingRatesModalOpen] = useState(false);

  // Ref for rates component to refresh after adding
  const ratesRef = useRef<ClientDetailPageRatesRef>(null);
  const hourlyRatesRef = useRef<ClientDetailPageHourlyRatesRef>(null);
  const commutingRatesRef = useRef<ClientDetailPageCommutingRatesRef>(null);

  // Get current tab from URL or default to 'summary'
  const currentTab = searchParams.get('tab') || 'summary';

  // Valid main tab values (for the top-level tab bar)
  const validTabs = ['summary', 'rates', 'locations', 'files'];

  // Tab values that show the rates section (for backwards navigation / deep links)
  const ratesTabValues = ['rates', 'items-rates', 'hourly-rates', 'commuting-rates'] as const;

  // Map rates tab param to active main tab
  const activeTab = ratesTabValues.includes(currentTab as (typeof ratesTabValues)[number])
    ? 'rates'
    : validTabs.includes(currentTab)
      ? currentTab
      : 'summary';

  // Derive rates sub-tab from URL
  const ratesSubTab =
    currentTab === 'hourly-rates'
      ? 'hourly'
      : currentTab === 'commuting-rates'
        ? 'commuting'
        : 'items'; // 'rates' or 'items-rates' or default → items

  // Handle main tab change
  const handleTabChange = (value: string) => {
    if (validTabs.includes(value)) {
      setSearchParams({ tab: value === 'rates' ? 'rates' : value });
    }
  };

  // Handle rates sub-tab change (updates URL for proper back navigation)
  const handleRatesSubTabChange = (value: 'items' | 'hourly' | 'commuting') => {
    const tabParam =
      value === 'hourly' ? 'hourly-rates' : value === 'commuting' ? 'commuting-rates' : 'rates';
    setSearchParams({ tab: tabParam });
  };

  // Handle edit client
  const handleEditClient = () => {
    setEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    setDeleteModalOpen(true);
  };

  // Handle delete execution
  const handleDeleteClient = async () => {
    if (!client?.id || !orgId) return;

    setDeletingClient(true);
    try {
      const response = await deleteClient(orgId, client.id);
      if (response.success) {
        toast.success(t("clients.clientDeleted", "Client deleted successfully"));
        // Navigate back to clients list
        navigate(`/${orgId}/clients`);
      } else {
        toast.error(t("clients.errorDeletingClient", "Error deleting client"));
      }
    } catch (error) {
      toast.error(t("clients.errorDeletingClient", "Error deleting client"));
    } finally {
      setDeletingClient(false);
      setDeleteModalOpen(false);
    }
  };

  // Handle client updated
  const handleClientUpdated = () => {
    refreshClient();
  };

  // Handle add rates modal
  const handleAddRateClick = () => {
    setAddRatesModalOpen(true);
  };

  // Handle rates added
  const handleRatesAdded = () => {
    ratesRef.current?.refreshRates();
  };

  // Handle add hourly rates modal
  const handleAddHourlyRateClick = () => {
    setAddHourlyRatesModalOpen(true);
  };

  // Handle hourly rates added
  const handleHourlyRatesAdded = () => {
    hourlyRatesRef.current?.refreshHourlyRates();
  };

  // Handle add commuting rates modal
  const handleAddCommutingRateClick = () => {
    setAddCommutingRatesModalOpen(true);
  };

  // Handle commuting rates added
  const handleCommutingRatesAdded = () => {
    commutingRatesRef.current?.refreshCommutingRates();
  };

  return (
    <>
      <PageHeader
        beforeTextChildren={<ClientAvatar client={client} size="2xl" showName={false} imageEditable={true} onImageChange={handleClientUpdated} />}
        title={`${client.trade_name} ${client.client_name ? `(${client.client_name})` : ""}`}
        description={`${client.tax_code}`} showBackButton={true}
        action={
          <div className="flex items-center gap-2">
            <IdBadge id={client.id || ""} className="h-6 px-4 text-xs" />
            <CustomActionsDropdown
              items={[
                {
                  label: t('common.actions.edit', 'Edit'),
                  icon: "edit",
                  onClick: handleEditClient,
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
          <TabsTrigger className="py-0" value="summary">{t('clientsDetail.summary', 'Summary')}</TabsTrigger>
          <TabsTrigger className="py-0" value="rates">{t('clientsDetail.rates', 'Rates')}</TabsTrigger>
          <TabsTrigger className="py-0" value="locations">{t('clientsDetail.locations', 'Locations')}</TabsTrigger>
          <TabsTrigger className="py-0" value="files">{t('clientsDetail.files', 'Files')}</TabsTrigger>
        </TabsList>

        <TabsContents transition={{ duration: 0 }}>
          <TabsContent value="summary" transition={{ duration: 0 }}>
            <ClientDetailPageInfo onEdit={handleEditClient} />
          </TabsContent>
          <TabsContent value="rates" transition={{ duration: 0 }}>
            <div className="flex gap-6">
              <VerticalMenu value={ratesSubTab} onValueChange={(v) => handleRatesSubTabChange(v as 'items' | 'hourly' | 'commuting')}>
                <VerticalMenuItem value="items">
                  <div className="flex items-center gap-2">
                    <BoxIcon className="w-4 h-4" />
                    {t('clientsDetail.itemRates', 'Items Rates')}
                  </div>
                </VerticalMenuItem>
                <VerticalMenuItem value="hourly">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    {t('clientsDetail.hourlyRates', 'Hourly Rates')}
                  </div>
                </VerticalMenuItem>
                <VerticalMenuItem value="commuting">
                  <div className="flex items-center gap-2">
                    <CarIcon className="w-4 h-4" />
                    {t('clientsDetail.commutingRates', 'Commuting Rates')}
                  </div>
                </VerticalMenuItem>

              </VerticalMenu>
              <div className="flex-1 min-w-0">
                {ratesSubTab === 'items' ? (
                  <ClientDetailPageRates ref={ratesRef} onAddRateClick={handleAddRateClick} />
                ) : ratesSubTab === 'hourly' ? (
                  <ClientDetailPageHourlyRates ref={hourlyRatesRef} onAddHourlyRateClick={handleAddHourlyRateClick} />
                ) : (
                  <ClientDetailPageCommutingRates ref={commutingRatesRef} onAddCommutingRateClick={handleAddCommutingRateClick} />
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="locations" transition={{ duration: 0 }}>
            <ClientDetailPageLocations />
          </TabsContent>
          <TabsContent value="files" transition={{ duration: 0 }}>
            <FilesSection key={`client-files-${client.id}`} entity_id={client.id} />
          </TabsContent>
        </TabsContents>
      </Tabs>

      {/* Edit Client Modal */}
      <NewClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onClientCreated={handleClientUpdated}
        client={client}
        mode="update"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("clients.deleteClient", "Delete Client")}</DialogTitle>
            <DialogDescription>
              {t("clients.deleteClientConfirmation", "Are you sure you want to delete this client? This action cannot be undone.")}
              {client && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{client.trade_name}</strong>
                  {client.client_name && ` (${client.client_name})`}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deletingClient}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={deletingClient}
            >
              {deletingClient ? (
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

      {/* Add Rates Modal */}
      {orgId && client.id && (
        <ClientRatesAddModal
          open={addRatesModalOpen}
          onOpenChange={setAddRatesModalOpen}
          onRatesAdded={handleRatesAdded}
          orgId={orgId}
          clientId={client.id}
        />
      )}

      {/* Add Hourly Rates Modal */}
      {orgId && client.id && (
        <ClientHourlyRatesAddModal
          open={addHourlyRatesModalOpen}
          onOpenChange={setAddHourlyRatesModalOpen}
          onHourlyRatesAdded={handleHourlyRatesAdded}
          orgId={orgId}
          clientId={client.id}
        />
      )}

      {/* Add Commuting Rates Modal */}
      {orgId && client.id && (
        <ClientCommutingRatesAddModal
          open={addCommutingRatesModalOpen}
          onOpenChange={setAddCommutingRatesModalOpen}
          onCommutingRatesAdded={handleCommutingRatesAdded}
          orgId={orgId}
          clientId={client.id}
        />
      )}
    </>
  );
};

export default ClientDetailPage;
