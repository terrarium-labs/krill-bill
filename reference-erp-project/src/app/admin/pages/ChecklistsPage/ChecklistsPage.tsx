import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import TipsCard from "@/app/components/cards/tips-card";
import SearchBar from "@/app/components/search-bar";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Checklist } from '@/types/general/checklists';
import ChecklistEditModal from './components/checklist-edit-modal';
import ChecklistsTable from './components/checklists-table';
import ChecklistDeleteModal from './components/checklist-delete-modal';
import { getChecklists, deleteChecklist, postChecklist } from "@/api/orgs/checklists/checklists";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useChecklistsTablePreferences } from "@/hooks/use-checklists-table-preferences";
import { ChecklistsColumnSelector } from "./components/checklists-column-selector";

const ChecklistsPageContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useChecklistsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null);
    const [deletingChecklist, setDeletingChecklist] = useState(false);
    const [duplicatingChecklistId, setDuplicatingChecklistId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

    const fetchChecklists = async () => {
        if (!orgId) return;

        setIsLoading(true);

        try {
            const response = await getChecklists(orgId);
            if (response.success) {
                setChecklists(response.success.checklists as Checklist[]);
            } else {
                toast.error(t("checklists.errorFetching", "Error fetching checklists"));
            }
        } catch (error) {
            toast.error(t("checklists.errorFetching", "Error fetching checklists"));
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchChecklists();
        }
    }, [orgId]);

    // Filter checklists based on search query
    const filteredChecklists = useMemo(() => {
        if (!searchQuery.trim()) {
            return checklists;
        }
        const searchLower = searchQuery.toLowerCase();
        return checklists.filter(
            (checklist) =>
                checklist.name.toLowerCase().includes(searchLower) ||
                (checklist.description && checklist.description.toLowerCase().includes(searchLower))
        );
    }, [checklists, searchQuery]);

    const handleRowClick = useCallback((checklist: Checklist) => {
        // Navigate to the checklist detail page for editing
        navigate(`/${orgId}/admin/checklists/${checklist.id}`);
    }, [navigate, orgId]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedChecklist(null);
    };

    const handleChecklistCreatedOrUpdated = () => {
        // Refresh the checklists list
        fetchChecklists();
        handleModalClose();
    };

    // Handle duplicate
    const handleDuplicate = useCallback(async (checklist: Checklist) => {
        if (!orgId || duplicatingChecklistId) return;

        setDuplicatingChecklistId(checklist.id);
        try {
            const requestData = {
                name: `${checklist.name} (Copy)`,
                description: checklist.description || null,
                data: checklist.data || {},
            };

            const response = await postChecklist(orgId, requestData);

            if (response.success && response.success.checklist_id) {
                toast.success(t("checklists.duplicated", "Checklist duplicated successfully"));
                navigate(`/${orgId}/admin/checklists/${response.success.checklist_id}`);
                fetchChecklists();
            } else {
                toast.error(response.error || t("checklists.errorDuplicating", "Error duplicating checklist"));
            }
        } catch (error) {
            toast.error(t("checklists.errorDuplicating", "Error duplicating checklist"));
        } finally {
            setDuplicatingChecklistId(null);
        }
    }, [orgId, navigate, t, duplicatingChecklistId]);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((checklist: Checklist) => {
        setChecklistToDelete(checklist);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((checklist: Checklist) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => navigate(`/${orgId}/admin/checklists/${checklist.id}`),
                    },
                    {
                        label: t("common.duplicate", "Duplicate"),
                        icon: "copy",
                        onClick: () => handleDuplicate(checklist),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(checklist),
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [t, navigate, orgId, handleDeleteConfirm, handleDuplicate]);

    // Handle delete execution
    const handleDeleteChecklist = async () => {
        if (!checklistToDelete || !orgId) return;

        setDeletingChecklist(true);
        try {
            const response = await deleteChecklist(orgId, checklistToDelete.id);
            if (response.success) {
                toast.success(t("checklists.deleted", "Checklist deleted successfully"));
                // Remove from local state
                setChecklists(prev => prev.filter(cl => cl.id !== checklistToDelete.id));
            } else {
                toast.error(t("checklists.errorDeleting", "Error deleting checklist"));
            }
        } catch (error) {
            toast.error(t("checklists.errorDeleting", "Error deleting checklist"));
        } finally {
            setDeletingChecklist(false);
            setDeleteModalOpen(false);
            setChecklistToDelete(null);
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("checklists.title", "Checklists")}
                description={t("checklists.description", "Manage checklists templates for field service")}
                showBackButton={true}
                action={<Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("checklists.addChecklist", "New checklist")}
                </Button>
                } />

            <TipsCard
                summary={t(
                    "checklists.tipsCard",
                    "Build reusable inspection forms for field service. Drag in field types, configure options, and attach checklists to work order types.",
                )}
                variant="row"
                doc={{ slug: "pd_admin_checklists" }}
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="flex-1"
                    onChange={(query) => setSearchQuery(query)}
                    placeholder={t("checklists.searchPlaceholder", "Search checklists...")}
                />
                <ChecklistsColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Checklists Table */}
            <ChecklistsTable
                checklists={filteredChecklists}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onRowClick={handleRowClick}
                onAddChecklist={() => setIsModalOpen(true)}
                renderActions={renderActions}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* New Checklist Modal */}
            <ChecklistEditModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                onChecklistCreated={handleChecklistCreatedOrUpdated}
                orgId={orgId!}
                checklist={selectedChecklist}
            />

            {/* Delete Confirmation Dialog */}
            <ChecklistDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setChecklistToDelete(null);
                    }
                }}
                checklist={checklistToDelete}
                onConfirm={handleDeleteChecklist}
                isDeleting={deletingChecklist}
            />
        </>
    );
};

const ChecklistsPage = () => {
    return <ChecklistsPageContent />;
};

export default ChecklistsPage;

