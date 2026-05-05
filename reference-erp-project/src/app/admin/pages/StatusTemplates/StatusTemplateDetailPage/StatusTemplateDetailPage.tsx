import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useStatusTemplate } from "../contexts/StatusTemplateContext";
import StatusEditor from "../components/status-editor";
import StatusTemplateMetadataModal from "../components/status-template-metadata-modal";
import StatusTemplateDeleteModal from "../components/status-template-delete-modal";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { toast } from "sonner";
import { deleteOrgStatusTemplate, patchOrgStatusTemplate } from "@/api/orgs/status-templates/status-templates";
import { StatusCategory, Status } from "@/types/general/status-templates";

const StatusTemplateDetailPage = React.memo(() => {
    const { t } = useTranslation();
    const { statusTemplate, refreshStatusTemplate } = useStatusTemplate();
    const navigate = useNavigate();
    const { orgId, statusTemplateId } = useParams<{ orgId: string; statusTemplateId: string }>();

    // Helper function to get category colors
    const getCategoryColor = (category: StatusCategory): string => {
        switch (category) {
            case "not_started":
                return "yellow";
            case "active":
                return "green";
            case "done":
                return "blue";
            case "closed":
                return "red";
            default:
                return "gray";
        }
    };

    // Helper function to get category labels
    const getCategoryLabel = (category: StatusCategory): string => {
        switch (category) {
            case "not_started":
                return t("statusTemplates.category.notStarted", "Not Started");
            case "active":
                return t("statusTemplates.category.active", "Active");
            case "done":
                return t("statusTemplates.category.done", "Done");
            case "closed":
                return t("statusTemplates.category.closed", "Closed");
            default:
                return category;
        }
    };

    // Modal states for Status Template
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    const [isDeleteTemplateModalOpen, setIsDeleteTemplateModalOpen] = useState(false);
    const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Statuses state for inline editing
    const [statuses, setStatuses] = useState<any[]>([]);
    const [initialStatuses, setInitialStatuses] = useState<Status[]>([]);

    // Initialize statuses when statusTemplate changes
    useEffect(() => {
        if (statusTemplate && statusTemplate.statuses) {
            setInitialStatuses(statusTemplate.statuses);
        }
    }, [statusTemplate]);

    // Handle statuses change from StatusEditor
    const handleStatusesChange = useCallback((updatedStatuses: any[]) => {
        setStatuses(updatedStatuses);
    }, []);

    // Check if there are any changes compared to initial statuses
    const hasChanges = useMemo(() => {
        if (!initialStatuses.length && !statuses.length) return false;
        if (initialStatuses.length !== statuses.filter(s => !s.isDeleted).length) return true;

        // Create a normalized comparison by sorting statuses
        const normalizeStatus = (status: any) => ({
            id: status.id,
            name: status.name,
            description: status.description || null,
            category: status.category,
            position: status.position,
            color: status.color,
            isDeleted: status.isDeleted || false,
        });

        const currentStatuses = statuses
            .filter(s => !s.isDeleted)
            .map(normalizeStatus)
            .sort((a, b) => {
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                return (a.position || 0) - (b.position || 0);
            });

        const initial = initialStatuses
            .map(normalizeStatus)
            .sort((a, b) => {
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                return (a.position || 0) - (b.position || 0);
            });

        if (currentStatuses.length !== initial.length) return true;

        // Deep comparison
        for (let i = 0; i < currentStatuses.length; i++) {
            const curr = currentStatuses[i];
            const init = initial[i];

            if (
                curr.id !== init.id ||
                curr.name !== init.name ||
                curr.description !== init.description ||
                curr.category !== init.category ||
                curr.position !== init.position ||
                curr.color !== init.color
            ) {
                return true;
            }
        }

        return false;
    }, [statuses, initialStatuses]);

    // Handlers for Status Template
    const handleEditMetadata = () => {
        setIsMetadataModalOpen(true);
    };

    const handleDeleteTemplate = () => {
        setIsDeleteTemplateModalOpen(true);
    };

    const handleDeleteTemplateConfirm = async () => {
        if (!statusTemplate || !orgId) return;

        setIsDeletingTemplate(true);
        try {
            const response = await deleteOrgStatusTemplate(orgId, statusTemplate.id);
            if (response.success) {
                toast.success(t("statusTemplates.deleted", "Status template deleted successfully"));
                navigate(`/${orgId}/admin/status-templates`);
            } else {
                toast.error(
                    response.error || t("statusTemplates.errorDeleting", "Failed to delete status template")
                );
            }
        } catch (error) {
            console.error("Error deleting status template:", error);
            toast.error(t("statusTemplates.errorDeleting", "Failed to delete status template"));
        } finally {
            setIsDeletingTemplate(false);
        }
    };

    const handleSaveStatuses = async () => {
        if (!statusTemplate || !orgId) return;

        setIsSaving(true);
        try {
            // Format statuses for API - remove internal flags and only include non-deleted statuses
            const activeStatuses = statuses.filter((status) => !status.isDeleted);

            // Group by category and ensure positions are sequential within each category
            const categorizedStatuses: Record<StatusCategory, any[]> = {
                not_started: [],
                active: [],
                done: [],
                closed: [],
            };

            activeStatuses.forEach((status) => {
                if (status.category && status.category in categorizedStatuses) {
                    categorizedStatuses[status.category as StatusCategory].push(status);
                }
            });

            // Sort by position within each category and reassign sequential positions
            const formattedStatuses: any[] = [];
            (Object.keys(categorizedStatuses) as StatusCategory[]).forEach((category) => {
                const categoryStatuses = categorizedStatuses[category];
                categoryStatuses
                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                    .forEach((status, index) => {
                        formattedStatuses.push({
                            id: status.isNew ? undefined : status.id,
                            name: status.name,
                            description: status.description || null,
                            category: status.category,
                            position: index,
                            color: status.color,
                        });
                    });
            });

            const requestData = {
                name: statusTemplate.name,
                description: statusTemplate.description || null,
                color: statusTemplate.color,
                statuses: formattedStatuses,
            };

            const response = await patchOrgStatusTemplate(orgId, statusTemplate.id, requestData);

            if (response.success) {
                toast.success(t('statusTemplates.updatedSuccess', 'Status template updated successfully'));
                // Update initialStatuses to reflect the saved state
                const savedStatuses = statuses.filter(s => !s.isDeleted).map(s => ({ ...s, isNew: false }));
                setInitialStatuses(savedStatuses);
                refreshStatusTemplate();
            } else {
                toast.error(response.error || t('statusTemplates.updateError', 'Failed to update status template'));
            }
        } catch (error) {
            console.error('Error updating status template:', error);
            toast.error(t('statusTemplates.updateError', 'Failed to update status template'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveMetadata = async (values: { name: string; description?: string; color: string }) => {
        if (!statusTemplate || !orgId) return;

        // Format statuses for API - group by category and ensure sequential positions
        const activeStatuses = statuses.filter((status) => !status.isDeleted);

        const categorizedStatuses: Record<StatusCategory, any[]> = {
            not_started: [],
            active: [],
            done: [],
            closed: [],
        };

        activeStatuses.forEach((status) => {
            if (status.category && status.category in categorizedStatuses) {
                categorizedStatuses[status.category as StatusCategory].push(status);
            }
        });

        const formattedStatuses: any[] = [];
        (Object.keys(categorizedStatuses) as StatusCategory[]).forEach((category) => {
            const categoryStatuses = categorizedStatuses[category];
            categoryStatuses
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .forEach((status, index) => {
                    formattedStatuses.push({
                        id: status.isNew ? undefined : status.id,
                        name: status.name,
                        description: status.description || null,
                        category: status.category,
                        position: index,
                        color: status.color,
                    });
                });
        });

        const requestData = {
            ...values,
            statuses: formattedStatuses,
        };

        const response = await patchOrgStatusTemplate(orgId, statusTemplate.id, requestData);

        if (!response.success) {
            throw new Error(response.error || 'Failed to update status template');
        }

        refreshStatusTemplate();
    };

    return (
        <>
            <PageHeader
                title={statusTemplateId !== "work-orders" ? statusTemplate.name : t("workOrders.workOrdersStatuses", "Work Orders Statuses")}
                description={statusTemplateId !== "work-orders" ? statusTemplate.description || t("statusTemplates.noDescription", "No description") : t("workOrders.workOrdersStatusDescription", "Collection of statuses that can be assigned to a work order.")}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSaveStatuses} disabled={isSaving || !hasChanges}>
                            <Save className="h-4 w-4" />
                            {isSaving ? t("common.saving", "Saving...") : t("common.save", "Save")}
                        </Button>

                        {statusTemplateId !== "work-orders" && <CustomActionsDropdown
                            items={[
                                {
                                    label: t("statusTemplates.editDetails", "Edit Details"),
                                    icon: "edit",
                                    onClick: handleEditMetadata,
                                    variant: "default",
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteTemplate,
                                    variant: "destructive",
                                },
                            ]}
                        />}
                    </div>
                }
            />

            {/* Statuses Editor - Grouped by Category */}
            <div className="space-y-6">
                <StatusEditor
                    isEditMode={true}
                    initialStatuses={initialStatuses}
                    onChange={handleStatusesChange}
                    getCategoryColor={getCategoryColor}
                    getCategoryLabel={getCategoryLabel}
                />
            </div>

            {/* Status Template Metadata Edit Modal */}
            <StatusTemplateMetadataModal
                open={isMetadataModalOpen}
                onOpenChange={setIsMetadataModalOpen}
                onSave={handleSaveMetadata}
                statusTemplate={statusTemplate}
            />

            {/* Status Template Delete Modal */}
            <StatusTemplateDeleteModal
                open={isDeleteTemplateModalOpen}
                onOpenChange={(open) => {
                    setIsDeleteTemplateModalOpen(open);
                    if (!open) setIsDeletingTemplate(false);
                }}
                statusTemplate={statusTemplate}
                onConfirm={handleDeleteTemplateConfirm}
                isDeleting={isDeletingTemplate}
            />
        </>
    );
});

export default StatusTemplateDetailPage;