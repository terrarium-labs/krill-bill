import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import TipsCard from "@/app/components/cards/tips-card";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import StatusTemplateEditModal from './components/status-template-edit-modal';
import StatusTemplateDeleteModal from './components/status-template-delete-modal';
import StatusTemplatesTable from './components/status-templates-table';
import { getOrgStatusTemplates, deleteOrgStatusTemplate } from "@/api/orgs/status-templates/status-templates";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { StatusTemplate } from "@/types/general/status-templates";
import { useStatusTemplatesTablePreferences } from "@/hooks/use-status-templates-table-preferences";
import { StatusTemplatesColumnSelector } from "./components/status-templates-column-selector";

const StatusTemplatesPageContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [statusTemplates, setStatusTemplates] = useState<StatusTemplate[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useStatusTemplatesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [statusTemplateToDelete, setStatusTemplateToDelete] = useState<StatusTemplate | null>(null);
    const [deletingStatusTemplate, setDeletingStatusTemplate] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStatusTemplate, setSelectedStatusTemplate] = useState<StatusTemplate | null>(null);

    const fetchStatusTemplates = async () => {
        if (!orgId) return;
        setIsLoading(true);

        try {
            const response = await getOrgStatusTemplates(orgId, undefined);
            if (response.success) {
                setStatusTemplates(response.success.status_templates as StatusTemplate[]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("statusTemplates.errorFetching", "Error fetching status templates"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("statusTemplates.errorFetching", "Error fetching status templates"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!orgId || !nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgStatusTemplates(orgId, nextPageToken);
            if (response.success) {
                setStatusTemplates((prev) => [...prev, ...response.success.status_templates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("statusTemplates.errorFetching", "Error fetching status templates"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("statusTemplates.errorFetching", "Error fetching status templates"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchStatusTemplates();
        }
    }, [orgId]);

    const handleRowClick = (statusTemplate: StatusTemplate) => {
        navigate(`/${orgId}/admin/status-templates/${statusTemplate.id}`);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedStatusTemplate(null);
            setDeleteModalOpen(false);
        }
    };

    const handleStatusTemplateCreatedOrUpdated = () => {
        // Refresh the status templates list
        fetchStatusTemplates();
        setIsModalOpen(false);
        setSelectedStatusTemplate(null);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (statusTemplate: StatusTemplate) => {
        setStatusTemplateToDelete(statusTemplate);
        setDeleteModalOpen(true);
    };

    const handleDeleteFromEditModal = (statusTemplate: StatusTemplate) => {
        setIsModalOpen(false);
        setStatusTemplateToDelete(statusTemplate);
        setDeleteModalOpen(true);
    };

    const handleEdit = (statusTemplate: StatusTemplate) => {
        setSelectedStatusTemplate(statusTemplate);
        setIsModalOpen(true);
    };

    const renderTableActions = (statusTemplate: StatusTemplate) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEdit(statusTemplate),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(statusTemplate),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle delete execution
    const handleDeleteStatusTemplate = async () => {
        if (!statusTemplateToDelete || !orgId) return;

        setDeletingStatusTemplate(true);
        try {
            const response = await deleteOrgStatusTemplate(orgId, statusTemplateToDelete.id);
            if (response.success) {
                toast.success(t("statusTemplates.deleted", "Status template deleted successfully"));
                // Remove from local state
                setStatusTemplates(prev => prev.filter(st => st.id !== statusTemplateToDelete.id));
            } else {
                toast.error(t("statusTemplates.errorDeleting", "Error deleting status template"));
            }
        } catch (error) {
            toast.error(t("statusTemplates.errorDeleting", "Error deleting status template"));
        } finally {
            setDeletingStatusTemplate(false);
            setDeleteModalOpen(false);
            setStatusTemplateToDelete(null);
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("statusTemplates.title", "Status Templates")}
                description={t("statusTemplates.description", "Manage status templates for work orders")}
                showBackButton={true}
                action={
                    <Button onClick={() => {
                        setSelectedStatusTemplate(null);
                        setIsModalOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        {t("statusTemplates.addStatusTemplate", "New Status Template")}
                    </Button>
                }
            />

            <TipsCard
                summary={t(
                    "statusTemplates.tipsCard",
                    "Build custom status flows for work orders. The system template is read-only; create templates to assign custom workflows per work order type.",
                )}
                variant="row"
                doc={{ slug: "pd_admin_status_templates" }}
            />

            <div className="flex items-center justify-end">
                <StatusTemplatesColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Status Templates Table */}
            <StatusTemplatesTable
                data={statusTemplates}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows={true}
                onEmptyStateAction={() => setIsModalOpen(true)}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
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

            {/* Status Template Edit Modal */}
            <StatusTemplateEditModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                onStatusTemplateCreatedOrUpdated={handleStatusTemplateCreatedOrUpdated}
                orgId={orgId!}
                mode={selectedStatusTemplate ? 'edit' : 'create'}
                statusTemplate={selectedStatusTemplate}
                renderActions={
                    selectedStatusTemplate ? (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteFromEditModal(selectedStatusTemplate),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    ) : undefined
                }
            />

            {/* Delete Confirmation Dialog */}
            <StatusTemplateDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                statusTemplate={statusTemplateToDelete}
                onConfirm={handleDeleteStatusTemplate}
                isDeleting={deletingStatusTemplate}
            />
        </>
    );
};

const StatusTemplatesPage = () => {
    return <StatusTemplatesPageContent />;
};

export default StatusTemplatesPage;

