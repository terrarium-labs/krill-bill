import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, SquarePen, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Checklist as WorkOrderChecklist } from "@/types/field-service/work-orders/checklists";
import { Checklist as GeneralChecklist } from "@/types/general/checklists";
import { ChecklistField } from "@/types/general/checklist-field";
import WorkOrderChecklistAddModal from "./modals/work-order-checklist-add-modal";
import WorkOrderChecklistEditModal from "./modals/work-order-checklist-edit-modal";
import ChecklistViewModal from "@/app/admin/pages/ChecklistsPage/components/checklist-view-modal";
import ChecklistEditorModal from "@/app/admin/pages/ChecklistsPage/components/checklist-editor-modal";
import { toast } from "sonner";
import { getWorkOrderChecklists, deleteWorkOrderChecklist, patchWorkOrderChecklist } from "@/api/field-service/work-orders/checklists/checklists";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface WorkOrderChecklistSectionProps {
    onChecklistChange?: () => void;
    editMode?: boolean;
}

const WorkOrderChecklistSection = ({
    onChecklistChange,
    editMode = false,
}: WorkOrderChecklistSectionProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();
    const [checklists, setChecklists] = useState<WorkOrderChecklist[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [fieldValuesByChecklist, setFieldValuesByChecklist] = useState<Record<string, Record<string, any>>>({});
    const [originalFieldValuesByChecklist, setOriginalFieldValuesByChecklist] = useState<Record<string, Record<string, any>>>({});
    const [dirtyChecklists, setDirtyChecklists] = useState<Set<string>>(new Set());
    const [savingChecklists, setSavingChecklists] = useState<Set<string>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<GeneralChecklist | null>(null);
    const [deletingChecklist, setDeletingChecklist] = useState(false);
    const [viewModalChecklistId, setViewModalChecklistId] = useState<string | null>(null);

    const fetchChecklists = async (query: string = "") => {
        if (!orgId || !workOrderId) return;
        if (query) {
            setIsSearching(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await getWorkOrderChecklists(orgId, workOrderId, query || undefined, undefined);
            if (response.success) {
                setChecklists(response.success.checklists || []);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                setError(response.error || "Error fetching checklists");
            }
        } catch (error) {
            setError(error as string);
        } finally {
            setIsSearching(false);
            setLoading(false);
        }
    };

    const loadMoreChecklists = async () => {
        if (!orgId || !workOrderId || !nextPageToken || loadingMore || loading) return;

        setLoadingMore(true);
        try {
            const response = await getWorkOrderChecklists(orgId, workOrderId, searchQuery || undefined, nextPageToken);
            if (response.success) {
                setChecklists(prev => [...prev, ...(response.success.checklists || [])]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                setError(response.error || "Error loading more checklists");
            }
        } catch (error) {
            setError(error as string);
        } finally {
            setLoadingMore(false);
        }
    };

    // Initialize field values from checklists completed data
    useEffect(() => {
        const newFieldValues: Record<string, Record<string, any>> = {};
        const newOriginalFieldValues: Record<string, Record<string, any>> = {};

        checklists.forEach(checklist => {
            newFieldValues[checklist.id] = checklist.completed || {};
            newOriginalFieldValues[checklist.id] = checklist.completed || {};
        });

        setFieldValuesByChecklist(newFieldValues);
        setOriginalFieldValuesByChecklist(newOriginalFieldValues);
    }, [checklists]);

    // Check if values have changed for each checklist
    useEffect(() => {
        const newDirtyChecklists = new Set<string>();

        Object.keys(fieldValuesByChecklist).forEach(checklistId => {
            const hasChanges = JSON.stringify(fieldValuesByChecklist[checklistId]) !==
                JSON.stringify(originalFieldValuesByChecklist[checklistId]);
            if (hasChanges) {
                newDirtyChecklists.add(checklistId);
            }
        });

        setDirtyChecklists(newDirtyChecklists);
    }, [fieldValuesByChecklist, originalFieldValuesByChecklist]);

    useEffect(() => {
        fetchChecklists();
    }, [orgId, workOrderId]);

    const handleValueChange = (checklistId: string, fieldId: string, value: any) => {
        setFieldValuesByChecklist(prev => ({
            ...prev,
            [checklistId]: {
                ...(prev[checklistId] || {}),
                [fieldId]: value
            }
        }));
    };

    const handleSave = async (checklistId: string) => {
        if (!orgId || !workOrderId) {
            toast.error(t('workorders.checklist.errorSaving', 'Error saving checklist progress'));
            return;
        }

        setSavingChecklists(prev => new Set(prev).add(checklistId));

        try {
            // Prepare the completed field data with id and value pairs
            const completedData = fieldValuesByChecklist[checklistId] || {};

            // Transform the data to ensure it's in the correct format (field id -> value)
            const completed: Record<string, any> = {};
            Object.keys(completedData).forEach(fieldId => {
                completed[fieldId] = completedData[fieldId];
            });

            // Call API to save the completed field
            const response = await patchWorkOrderChecklist(orgId, workOrderId, checklistId, {
                completed: completed
            });

            if (response.success) {
                // Update the original values to mark as saved
                setOriginalFieldValuesByChecklist(prev => ({
                    ...prev,
                    [checklistId]: fieldValuesByChecklist[checklistId]
                }));

                // Refresh checklists to get updated data from server
                await fetchChecklists();

                toast.success(t('workorders.checklist.savedSuccessfully', 'Checklist progress saved successfully'));
                onChecklistChange?.();
            } else {
                toast.error(response.error?.message || t('workorders.checklist.errorSaving', 'Error saving checklist progress'));
            }
        } catch (error) {
            console.error('Error saving checklist:', error);
            toast.error(t('workorders.checklist.errorSaving', 'Error saving checklist progress'));
        } finally {
            setSavingChecklists(prev => {
                const newSet = new Set(prev);
                newSet.delete(checklistId);
                return newSet;
            });
        }
    };

    const handleEdit = (checklistId: string) => {
        const checklist = checklists.find(c => c.id === checklistId);
        if (checklist) {
            // Convert WorkOrderChecklist to GeneralChecklist format
            const generalChecklist: GeneralChecklist = {
                id: checklist.id,
                name: checklist.name,
                description: checklist.description || '',
                data: checklist.data,
            };
            setEditingChecklist(generalChecklist);
            setIsEditorModalOpen(true);
        }
    };

    const handleAddNew = () => {
        setIsAddModalOpen(true);
    };

    const handleEditNameDescription = (checklistId: string) => {
        setEditingChecklistId(checklistId);
        setIsEditModalOpen(true);
    };

    const handleChecklistUpdated = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingChecklistId(null);
        fetchChecklists();
        onChecklistChange?.();
    };

    const handleEditorModalClose = () => {
        setIsEditorModalOpen(false);
        setEditingChecklist(null);
    };

    const handleChecklistEditorUpdated = () => {
        handleEditorModalClose();
        fetchChecklists();
        onChecklistChange?.();
    };

    const handleDeleteChecklist = async () => {
        if (!editingChecklist || !orgId || !workOrderId) return;

        setDeletingChecklist(true);
        try {
            const response = await deleteWorkOrderChecklist(orgId, workOrderId, editingChecklist.id);
            if (response.success) {
                toast.success(t('workorders.checklist.deletedSuccessfully', 'Checklist removed successfully'));
                handleEditorModalClose();
                fetchChecklists();
                onChecklistChange?.();
            } else {
                toast.error(response.error?.message || t('workorders.checklist.errorDeleting', 'Error removing checklist'));
            }
        } catch (error) {
            console.error('Error deleting checklist:', error);
            toast.error(t('workorders.checklist.errorDeleting', 'Error removing checklist'));
        } finally {
            setDeletingChecklist(false);
        }
    };

    const handleChecklistSave = async (checklistId: string, data: { name: string; description: string; data: { fields: ChecklistField[] } }) => {
        if (!orgId || !workOrderId) {
            throw new Error('Organization ID or Work Order ID is required');
        }
        return await patchWorkOrderChecklist(orgId, workOrderId, checklistId, data);
    };

    // Display-only field types that don't require user input
    const DISPLAY_ONLY_FIELD_TYPES = ['section-header', 'heading', 'separator', 'text'];

    const hasCompletedValue = (value: any): boolean => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    };

    const canChecklistBeChecked = (checklist: WorkOrderChecklist): boolean => {
        const fields: ChecklistField[] = checklist?.data?.fields || [];
        const completed = fieldValuesByChecklist[checklist.id] || checklist.completed || {};
        const requiredFields = fields.filter(
            (f) => f.required && !DISPLAY_ONLY_FIELD_TYPES.includes(f.type || '')
        );
        return requiredFields.every((field) => hasCompletedValue(completed[field.id]));
    };

    const handleToggleComplete = async (checklist: WorkOrderChecklist, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!orgId || !workOrderId || savingChecklists.has(checklist.id)) return;

        const isCompleted = !!checklist.completed_at;
        const willComplete = !isCompleted;

        if (willComplete && !canChecklistBeChecked(checklist)) {
            toast.error(t('workorders.checklist.requiredFieldsIncomplete', 'Please complete all required fields first'));
            return;
        }

        setSavingChecklists((prev) => new Set(prev).add(checklist.id));
        try {
            const completedData = fieldValuesByChecklist[checklist.id] || checklist.completed || {};
            const payload = willComplete
                ? { completed: completedData, completed_at: new Date().toISOString() }
                : { completed_at: null };
            const response = await patchWorkOrderChecklist(orgId, workOrderId, checklist.id, payload);

            if (response.success) {
                await fetchChecklists();
                toast.success(
                    willComplete
                        ? t('workorders.checklist.markedComplete', 'Checklist marked as complete')
                        : t('workorders.checklist.markedIncomplete', 'Checklist marked as incomplete')
                );
                onChecklistChange?.();
            } else {
                toast.error(response.error?.message || t('workorders.checklist.errorSaving', 'Error updating checklist'));
            }
        } catch (err) {
            console.error('Error toggling checklist:', err);
            toast.error(t('workorders.checklist.errorSaving', 'Error updating checklist'));
        } finally {
            setSavingChecklists((prev) => {
                const next = new Set(prev);
                next.delete(checklist.id);
                return next;
            });
        }
    };

    const handleDeleteChecklistRow = async (checklistId: string, e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        if (!orgId || !workOrderId) return;
        try {
            const response = await deleteWorkOrderChecklist(orgId, workOrderId, checklistId);
            if (response.success) {
                toast.success(t('workorders.checklist.deletedSuccessfully', 'Checklist removed successfully'));
                fetchChecklists();
                onChecklistChange?.();
            } else {
                toast.error(response.error?.message || t('workorders.checklist.errorDeleting', 'Error removing checklist'));
            }
        } catch (err) {
            console.error('Error deleting checklist:', err);
            toast.error(t('workorders.checklist.errorDeleting', 'Error removing checklist'));
        }
    };

    const renderChecklistActions = () => {
        if (!editingChecklist || !editMode) return null;

        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("workorders.checklist.editNameDescription", "Edit name & description"),
                        icon: "edit",
                        onClick: () => handleEditNameDescription(editingChecklist.id),
                    },
                    {
                        label: t('common.actions.delete', 'Delete'),
                        icon: 'trash-2',
                        onClick: () => {
                            if (!deletingChecklist) {
                                handleDeleteChecklist();
                            }
                        },
                        variant: 'destructive',
                    },
                ]}
            />
        );
    };

    if (checklists.length === 0 && !loading && !searchQuery) {
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {t('workorders.checklist.checklists', 'Checklists')}
                    <Badge variant="secondary">0</Badge>
                </h3>
                <div className="flex items-center justify-between gap-2">
                    {editMode && (
                        <>
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                className="w-full"
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={fetchChecklists}
                                placeholder={t('workorders.checklist.searchPlaceholder', 'Search checklists...')}
                                disabled={true}
                            />
                            <Button onClick={handleAddNew} type="button">
                                <Plus className="h-4 w-4" />
                                {t('workorders.checklist.addTemplate', 'Add Template')}
                            </Button>
                        </>
                    )}
                </div>
                {editMode && (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {t('workorders.checklist.noTemplate', 'No checklist template assigned')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('workorders.checklist.addTemplateDesc', 'Click "Add Template" to select a checklist template')}
                            </p>
                        </div>
                    </div>
                )}
                <WorkOrderChecklistAddModal
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                    onChecklistUpdated={handleChecklistUpdated}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                {t('workorders.checklist.checklists', 'Checklists')}
                <Badge variant="secondary">{checklists.length}</Badge>
            </h3>
            <div className="flex items-center justify-between gap-2">
                {(checklists.length > 5 || editMode) && (
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        className="w-full"
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchChecklists}
                        placeholder={t('workorders.checklist.searchPlaceholder', 'Search checklists...')}
                    />)}
                {editMode && (
                    <Button onClick={handleAddNew} type="button">
                        <Plus className="h-4 w-4" />
                        {t('workorders.checklist.addTemplate', 'Add Template')}
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="flex items-center justify-center p-8">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            ) : checklists.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t('workorders.checklist.noResults', 'No checklists found')}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {checklists.map((checklist) => {
                        const isCompleted = !!checklist.completed_at;
                        const canCheck = canChecklistBeChecked(checklist);
                        const isToggling = savingChecklists.has(checklist.id);

                        return (
                            <div
                                key={checklist.id}
                                className="flex items-center justify-between text-sm py-2 px-2 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted/60"
                                onClick={() => setViewModalChecklistId(checklist.id)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                        className={cn(
                                            "shrink-0",
                                            (canCheck || isCompleted) && "cursor-pointer"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (canCheck || isCompleted) handleToggleComplete(checklist, e);
                                        }}
                                    >
                                        <Checkbox
                                            checked={isCompleted}
                                            disabled
                                            className="pointer-events-none shrink-0 h-5 w-5 rounded-md border-2 data-[state=checked]:border-primary"
                                            aria-hidden
                                        />
                                    </div>
                                    {isToggling && (
                                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{checklist.name}</div>
                                        {checklist.description && (
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {checklist.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {editMode && (
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(checklist.id);
                                            }}
                                        >
                                            <SquarePen className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => handleDeleteChecklistRow(checklist.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {nextPageToken && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={loadMoreChecklists}
                        disabled={loadingMore}
                        className="min-w-32"
                    >
                        {loadingMore ? (
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

            <WorkOrderChecklistAddModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onChecklistUpdated={handleChecklistUpdated}
            />
            <WorkOrderChecklistEditModal
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open);
                    if (!open) setEditingChecklistId(null);
                }}
                checklist={editingChecklistId ? checklists.find(c => c.id === editingChecklistId) || null : null}
                onChecklistUpdated={handleChecklistUpdated}
            />
            <ChecklistViewModal
                open={!!viewModalChecklistId}
                onOpenChange={(open) => !open && setViewModalChecklistId(null)}
                checklist={viewModalChecklistId ? checklists.find(c => c.id === viewModalChecklistId) || null : null}
                fieldValues={viewModalChecklistId ? (fieldValuesByChecklist[viewModalChecklistId] || {}) : {}}
                onValueChange={(fieldId, value) => viewModalChecklistId && handleValueChange(viewModalChecklistId, fieldId, value)}
                onSave={() => viewModalChecklistId && handleSave(viewModalChecklistId)}
                isDirty={viewModalChecklistId ? dirtyChecklists.has(viewModalChecklistId) : false}
                isSaving={viewModalChecklistId ? savingChecklists.has(viewModalChecklistId) : false}
                editMode={true}
            />
            <ChecklistEditorModal
                open={isEditorModalOpen}
                onOpenChange={setIsEditorModalOpen}
                checklist={editingChecklist}
                onChecklistUpdated={handleChecklistEditorUpdated}
                renderActions={renderChecklistActions}
                onSave={handleChecklistSave}
            />
        </div>
    );
};

export default WorkOrderChecklistSection;