import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import TipsCard from "@/app/components/cards/tips-card";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TicketWorkOrderTypeModal from './components/ticket-work-order-type-modal';
import TicketWorkOrderTypeDeleteModal from './components/ticket-work-order-type-delete-modal';
import TicketWorkOrderTypesTable from './components/ticket-work-order-types-table';
import {
    getOrgTicketWorkOrderTypes,
    deleteOrgTicketWorkOrderType,
} from "@/api/field-service/tickets-work-orders-types/tickets-work-orders-types";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { TicketWorkOrderType } from "@/types/field-service/ticket-work-order-types";

const TicketWorkOrderTypesPageContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [ticketWorkOrderTypes, setTicketWorkOrderTypes] = useState<TicketWorkOrderType[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<TicketWorkOrderType | null>(null);
    const [deletingType, setDeletingType] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<TicketWorkOrderType | null>(null);

    const fetchTicketWorkOrderTypes = async () => {
        if (!orgId) return;
        setIsLoading(true);

        try {
            const response = await getOrgTicketWorkOrderTypes(orgId, undefined);
            if (response.success) {
                setTicketWorkOrderTypes(response.success.tickets_wo_types as TicketWorkOrderType[]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.ticketWorkOrderTypes.fetchError", "Error fetching ticket work order types"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("admin.ticketWorkOrderTypes.fetchError", "Error fetching ticket work order types"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!orgId || !nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgTicketWorkOrderTypes(orgId, undefined, nextPageToken);
            if (response.success) {
                setTicketWorkOrderTypes((prev) => [...prev, ...response.success.tickets_wo_types]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.ticketWorkOrderTypes.fetchError", "Error fetching ticket work order types"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("admin.ticketWorkOrderTypes.fetchError", "Error fetching ticket work order types"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchTicketWorkOrderTypes();
        }
    }, [orgId]);

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedType(null);
            setDeleteModalOpen(false);
        }
    };

    const handleTypeCreatedOrUpdated = () => {
        // Refresh the list
        fetchTicketWorkOrderTypes();
        setIsModalOpen(false);
        setSelectedType(null);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (type: TicketWorkOrderType) => {
        setTypeToDelete(type);
        setDeleteModalOpen(true);
    };

    const handleDeleteFromEditModal = (type: TicketWorkOrderType) => {
        setIsModalOpen(false);
        setTypeToDelete(type);
        setDeleteModalOpen(true);
    };

    const handleEdit = (type: TicketWorkOrderType) => {
        setSelectedType(type);
        setIsModalOpen(true);
    };

    const renderTableActions = (type: TicketWorkOrderType) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEdit(type),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(type),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle delete execution
    const handleDeleteType = async () => {
        if (!typeToDelete || !orgId) return;

        setDeletingType(true);
        try {
            const response = await deleteOrgTicketWorkOrderType(orgId, typeToDelete.id);
            if (response.success) {
                toast.success(t("admin.ticketWorkOrderTypes.deleted", "Ticket work order type deleted successfully"));
                // Remove from local state
                setTicketWorkOrderTypes(prev => prev.filter(t => t.id !== typeToDelete.id));
            } else {
                toast.error(t("admin.ticketWorkOrderTypes.deleteError", "Error deleting ticket work order type"));
            }
        } catch (error) {
            toast.error(t("admin.ticketWorkOrderTypes.deleteError", "Error deleting ticket work order type"));
        } finally {
            setDeletingType(false);
            setDeleteModalOpen(false);
            setTypeToDelete(null);
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("admin.ticketWorkOrderTypes.title", "Ticket Work Order Types")}
                description={t("admin.ticketWorkOrderTypes.description", "Manage ticket work order types for your organization")}
                showBackButton={true}
                action={
                    <Button onClick={() => {
                        setSelectedType(null);
                        setIsModalOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        {t("admin.ticketWorkOrderTypes.addType", "New Type")}
                    </Button>
                }
            />

            <TipsCard
                summary={t(
                    "admin.ticketWorkOrderTypes.tipsCard",
                    "Classify field service work by type. Used to route tickets and filter work orders; types appear in reports and SLA definitions.",
                )}
                variant="row"
                doc={{ slug: "pd_admin_ticket_wo_types" }}
            />

            {/* Types Table */}
            <TicketWorkOrderTypesTable
                data={ticketWorkOrderTypes}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onEmptyStateAction={() => setIsModalOpen(true)}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
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

            {/* Create/Edit Modal */}
            <TicketWorkOrderTypeModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                onTypeCreatedOrUpdated={handleTypeCreatedOrUpdated}
                orgId={orgId!}
                mode={selectedType ? 'edit' : 'create'}
                ticketWorkOrderType={selectedType}
                renderActions={
                    selectedType ? (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteFromEditModal(selectedType),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    ) : undefined
                }
            />

            {/* Delete Confirmation Dialog */}
            <TicketWorkOrderTypeDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                ticketWorkOrderType={typeToDelete}
                onConfirm={handleDeleteType}
                isDeleting={deletingType}
            />
        </>
    );
};

const TicketWorkOrderTypesPage = () => {
    return <TicketWorkOrderTypesPageContent />;
};

export default TicketWorkOrderTypesPage;
