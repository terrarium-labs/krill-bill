import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Generate a unique ID
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

import PageHeader from '@/app/components/page-header';
import FieldTypesList from './components/FieldTypesList';
import PreviewArea from './components/PreviewArea';
import FieldOptionsPanel from './components/FieldOptionsPanel';
import { ChecklistField } from '@/types/general/checklist-field';
import { ChecklistFieldTemplate } from '@/types/general/checklist-field';
import { patchChecklist, deleteChecklist, postChecklist } from '@/api/orgs/checklists/checklists';
import { CustomActionsDropdown } from '@/app/components/custom-actions-dropdown';
import ChecklistEditModal from '../components/checklist-edit-modal';
import ChecklistDeleteModal from '../components/checklist-delete-modal';
import IdBadge from '@/app/components/id-badge';
import { useChecklist } from '@/app/admin/pages/ChecklistsPage/contexts/ChecklistContext';
import { extractFieldsFromChecklistData } from '@/utils/checklist-data';

const ChecklistDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { checklist, isLoading, refreshChecklist } = useChecklist();
    const navigate = useNavigate();

    const checklistName = checklist?.name || 'Untitled Checklist';
    const [fields, setFields] = useState<ChecklistField[]>(() =>
        extractFieldsFromChecklistData(checklist?.data)
    );

    useEffect(() => {
        setFields(extractFieldsFromChecklistData(checklist?.data));
        setSelectedFieldId(null);
        setIsDirty(false);
    }, [checklist?.id]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingChecklist, setDeletingChecklist] = useState(false);

    const addFieldFromTemplate = (template: ChecklistFieldTemplate) => {
        const newField: ChecklistField = {
            id: generateId(),
            type: template.type,
            ...template.defaultConfig,
            label: template.defaultConfig.label || template.label,
        };

        setFields((prev) => [...prev, newField]);
        setSelectedFieldId(newField.id);
        setIsDirty(true);
        toast.success(`${template.label} added`);
    };

    const handleFieldUpdate = (updatedField: ChecklistField) => {
        setFields((prev) =>
            prev.map((field) => (field.id === updatedField.id ? updatedField : field))
        );
        setIsDirty(true);
    };

    const handleFieldDelete = (fieldId: string) => {
        setFields((prev) => prev.filter((field) => field.id !== fieldId));
        if (selectedFieldId === fieldId) {
            setSelectedFieldId(null);
        }
        setIsDirty(true);
        toast.success(t('checklists.fieldDeleted', 'Field deleted'));
    };

    const handleFieldDuplicate = (fieldId: string) => {
        const fieldToDuplicate = fields.find((f) => f.id === fieldId);
        if (fieldToDuplicate) {
            const duplicatedField: ChecklistField = {
                ...fieldToDuplicate,
                id: generateId(),
                label: `${fieldToDuplicate.label} (Copy)`,
            };
            setFields((prev) => {
                const index = prev.findIndex((f) => f.id === fieldId);
                const newFields = [...prev];
                newFields.splice(index + 1, 0, duplicatedField);
                return newFields;
            });
            setSelectedFieldId(duplicatedField.id);
            setIsDirty(true);
            toast.success(t('checklists.fieldDuplicated', 'Field duplicated'));
        }
    };

    const handleFieldsReorder = (newFields: ChecklistField[]) => {
        setFields(newFields);
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!orgId) {
            toast.error('Organization ID is required');
            return;
        }

        if (!checklistName.trim()) {
            toast.error(t('checklists.nameRequired', 'Checklist name is required'));
            return;
        }

        setIsSaving(true);
        try {
            const checklistData = {
                name: checklistName,
                description: checklist?.description ?? '',
                data: {
                    fields,
                },
            };

            if (checklist?.id) {
                const response = await patchChecklist(orgId, checklist?.id, checklistData);
                if (response.success) {
                    toast.success(t('checklists.savedSuccessfully', 'Checklist saved successfully'));
                    setIsDirty(false);
                } else {
                    toast.error(t('checklists.errorSaving', 'Error saving checklist'));
                }
            } else {
                const response = await postChecklist(orgId, checklistData);
                if (response.success) {
                    toast.success(t('checklists.savedSuccessfully', 'Checklist saved successfully'));
                    setIsDirty(false);
                    navigate(`/${orgId}/admin/checklists`);
                }
            }


        } catch (error) {
            console.error('Error saving checklist:', error);
            toast.error(t('checklists.errorSaving', 'Error saving checklist'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = () => {
        if (checklist) {
            setEditModalOpen(true);
        }
    };

    const handleDelete = () => {
        setDeleteModalOpen(true);
    };

    const handleChecklistUpdated = () => {
        // Reload the checklist after updating
        refreshChecklist();
        setEditModalOpen(false);
    };

    const handleDeleteChecklist = async () => {
        if (!checklist || !orgId) return;

        setDeletingChecklist(true);
        try {
            const response = await deleteChecklist(orgId, checklist.id);
            if (response.success) {
                toast.success(t("checklists.deleted", "Checklist deleted successfully"));
                // Navigate back to checklists list
                navigate(`/${orgId}/admin/checklists`);
            } else {
                toast.error(t("checklists.errorDeleting", "Error deleting checklist"));
            }
        } catch (error) {
            toast.error(t("checklists.errorDeleting", "Error deleting checklist"));
        } finally {
            setDeletingChecklist(false);
            setDeleteModalOpen(false);
        }
    };

    const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

    if (isLoading) {
        return (
            <PageSkeleton
                showBackButton={true}
                showIcon={false}
                tabCount={0}
                variant="three-panel"
            />
        );
    }

    return (
        <div className="space-y-6 overflow-hidden max-h-[calc(100vh-5.5rem)]">
            {/* Header */}
            <PageHeader
                title={checklistName}
                description={checklist?.description || t('checklists.description', 'Manage checklist fields and options')}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={checklist?.id || ""} />
                        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t('common.saving', 'Saving...')}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {t('common.save', 'Save')}
                                </>
                            )}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: 'edit',
                                    onClick: handleEdit,
                                },
                                {
                                    label: t('common.actions.delete', 'Delete'),
                                    icon: 'trash-2',
                                    onClick: handleDelete,
                                    variant: 'destructive',
                                },
                            ]}
                        />
                    </div>
                }
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full grid grid-cols-12 gap-4">
                    {/* Left Panel - Field Types */}
                    <div className="col-span-3 h-full">
                        <FieldTypesList
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onFieldTypeClick={addFieldFromTemplate}
                        />
                    </div>

                    {/* Center Panel - Preview */}
                    <div className="col-span-6 h-full">
                        <PreviewArea
                            fields={fields}
                            selectedFieldId={selectedFieldId}
                            onFieldSelect={setSelectedFieldId}
                            onFieldDelete={handleFieldDelete}
                            onFieldDuplicate={handleFieldDuplicate}
                            onFieldsReorder={handleFieldsReorder}
                        />
                    </div>

                    {/* Right Panel - Field Options */}
                    <div className="col-span-3 h-full">
                        <FieldOptionsPanel
                            field={selectedField}
                            allFields={fields}
                            onFieldUpdate={handleFieldUpdate}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Checklist Modal */}
            <ChecklistEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onChecklistCreated={handleChecklistUpdated}
                orgId={orgId!}
                checklist={checklist}
            />

            {/* Delete Confirmation Dialog */}
            <ChecklistDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                checklist={checklist || null}
                onConfirm={handleDeleteChecklist}
                isDeleting={deletingChecklist}
            />
        </div>
    );
};

export default ChecklistDetailPage;

