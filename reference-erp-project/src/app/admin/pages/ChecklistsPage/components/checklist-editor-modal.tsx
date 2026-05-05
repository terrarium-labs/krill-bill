import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// Generate a unique ID
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

import FieldTypesList from '../ChecklistDetailPage/components/FieldTypesList';
import PreviewArea from '../ChecklistDetailPage/components/PreviewArea';
import FieldOptionsPanel from '../ChecklistDetailPage/components/FieldOptionsPanel';
import { ChecklistField } from '@/types/general/checklist-field';
import { ChecklistFieldTemplate } from '@/types/general/checklist-field';
import { patchChecklist } from '@/api/orgs/checklists/checklists';
import { Checklist } from '@/types/general/checklists';
import IdBadge from '@/app/components/id-badge';
import { extractFieldsFromChecklistData } from '@/utils/checklist-data';

interface ChecklistEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklist: Checklist | null;
    onChecklistUpdated?: () => void;
    renderActions?: () => React.ReactNode;
    onSave?: (checklistId: string, data: { name: string; description: string; data: { fields: ChecklistField[] } }) => Promise<any>;
}

const ChecklistEditorModal: React.FC<ChecklistEditorModalProps> = ({
    open,
    onOpenChange,
    checklist,
    onChecklistUpdated,
    renderActions,
    onSave,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [checklistName, setChecklistName] = useState('Untitled Checklist');
    const [fields, setFields] = useState<ChecklistField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Initialize from checklist prop
    useEffect(() => {
        if (open && checklist) {
            setChecklistName(checklist.name);
            setFields(extractFieldsFromChecklistData(checklist.data));
            setSelectedFieldId(null);
            setSearchQuery('');
            setIsDirty(false);
        }
    }, [open, checklist]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && isDirty) {
            // You could add a confirmation dialog here if needed
            const shouldClose = window.confirm(t('checklists.unsavedChanges', 'You have unsaved changes. Are you sure you want to close?'));
            if (!shouldClose) return;
        }
        onOpenChange(newOpen);
    };

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
        if (!checklist?.id) {
            toast.error('Checklist ID is required');
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
                description: checklist.description || '',
                data: {
                    fields,
                },
            };

            let response;
            if (onSave) {
                // Use custom save handler if provided
                response = await onSave(checklist.id, checklistData);
            } else {
                // Use default patchChecklist if no custom handler
                if (!orgId) {
                    toast.error('Organization ID is required');
                    return;
                }
                response = await patchChecklist(orgId, checklist.id, checklistData);
            }

            if (response.success) {
                toast.success(t('checklists.savedSuccessfully', 'Checklist saved successfully'));
                setIsDirty(false);
                onChecklistUpdated?.();
                onOpenChange(false);
            } else {
                toast.error(t('checklists.errorSaving', 'Error saving checklist'));
            }
        } catch (error) {
            console.error('Error saving checklist:', error);
            toast.error(t('checklists.errorSaving', 'Error saving checklist'));
        } finally {
            setIsSaving(false);
        }
    };

    const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

    if (!checklist) {
        return null;
    }

    return (
        <>
            <style>{`
                .checklist-editor-modal .field-types-wrapper > div:first-child {
                    height: 100% !important;
                    max-height: 100% !important;
                }
                .checklist-editor-modal .preview-wrapper > div:first-child {
                    height: 100% !important;
                    max-height: 100% !important;
                }
                .checklist-editor-modal .options-wrapper > div:first-child {
                    height: 100% !important;
                    max-height: 100% !important;
                }
                .checklist-editor-modal [data-radix-scroll-area-viewport] {
                    max-height: 100% !important;
                }
            `}</style>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent showCloseButton={false} className="checklist-editor-modal max-w-5xl md:min-w-7xl w-full max-h-[90vh] min-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-8 pt-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="flex items-center justify-between gap-2 text-xl font-semibold">
                            <span>{checklistName}</span>
                            {checklist && (
                                <div className="flex items-center gap-2">
                                    <IdBadge id={checklist.id} />
                                    {renderActions && renderActions()}
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Main Content */}
                    <div className="flex-1 overflow-hidden px-8 h-full min-h-0">
                        <div className="h-full grid grid-cols-12 gap-6">
                            {/* Left Panel - Field Types */}
                            <div className="col-span-2 h-full overflow-hidden flex flex-col min-h-0">
                                <div className="h-full field-types-wrapper">
                                    <FieldTypesList
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onFieldTypeClick={addFieldFromTemplate}
                                    />
                                </div>
                            </div>

                            {/* Center Panel - Preview */}
                            <div className="col-span-7 h-full overflow-hidden flex flex-col min-h-0">
                                <div className="h-full preview-wrapper">
                                    <PreviewArea
                                        fields={fields}
                                        selectedFieldId={selectedFieldId}
                                        onFieldSelect={setSelectedFieldId}
                                        onFieldDelete={handleFieldDelete}
                                        onFieldDuplicate={handleFieldDuplicate}
                                        onFieldsReorder={handleFieldsReorder}
                                    />
                                </div>
                            </div>

                            {/* Right Panel - Field Options */}
                            <div className="col-span-3 h-full overflow-hidden flex flex-col min-h-0">
                                <div className="h-full options-wrapper">
                                    <FieldOptionsPanel
                                        field={selectedField}
                                        allFields={fields}
                                        onFieldUpdate={handleFieldUpdate}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 px-8 py-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSaving}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('common.saving', 'Saving...')}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t('common.save', 'Save')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ChecklistEditorModal;
