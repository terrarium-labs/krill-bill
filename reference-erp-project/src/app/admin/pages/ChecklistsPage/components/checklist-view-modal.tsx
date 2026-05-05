import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { ChecklistField } from "@/types/general/checklist-field";
import FieldPreview from "@/app/admin/pages/ChecklistsPage/ChecklistDetailPage/components/FieldPreview";
import { extractFieldsFromChecklistData } from "@/utils/checklist-data";

export type ChecklistViewItem = {
    id: string;
    name: string;
    description?: string;
    data?: { fields?: ChecklistField[] };
    completed?: Record<string, any>;
};

interface ChecklistViewModalBaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklist: ChecklistViewItem | null;
    /** Render custom action buttons in the header (e.g. CustomActionsDropdown with Delete) */
    renderActions?: (checklist: ChecklistViewItem) => ReactNode;
}

interface ChecklistViewModalReadOnlyProps extends ChecklistViewModalBaseProps {
    editMode?: false;
    fieldValues?: never;
    onValueChange?: never;
    onSave?: never;
    isDirty?: never;
    isSaving?: never;
}

interface ChecklistViewModalEditProps extends ChecklistViewModalBaseProps {
    editMode: true;
    fieldValues: Record<string, any>;
    onValueChange: (fieldId: string, value: any) => void;
    onSave: () => void;
    isDirty: boolean;
    isSaving: boolean;
}

type ChecklistViewModalProps = ChecklistViewModalReadOnlyProps | ChecklistViewModalEditProps;

const ChecklistViewModal = (props: ChecklistViewModalProps) => {
    const {
        open,
        onOpenChange,
        checklist,
        renderActions,
        editMode = false,
    } = props;

    const { t } = useTranslation();

    if (!checklist) return null;

    const fields: ChecklistField[] = extractFieldsFromChecklistData(checklist?.data);
    const fieldValues = editMode
        ? (props.fieldValues ?? {})
        : (checklist?.completed ?? {});

    const onValueChange = editMode ? props.onValueChange : undefined;
    const onSave = editMode ? props.onSave : undefined;
    const isDirty = editMode ? props.isDirty : false;
    const isSaving = editMode ? props.isSaving : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <span>{checklist.name}</span>
                        {renderActions && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {renderActions(checklist)}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10 pb-10">
                    {fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            {t("workorders.checklist.noFields", "No fields in this checklist")}
                        </p>
                    ) : (
                        fields.map((field) => (
                            <FieldPreview
                                key={field.id}
                                field={field}
                                interactive={editMode}
                                fieldValues={fieldValues}
                                onValueChange={onValueChange}
                                allFields={fields}
                            />
                        ))
                    )}
                </div>
                {editMode && (
                    <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            {t("common.close", "Close")}
                        </Button>
                        {isDirty && (
                            <Button
                                type="button"
                                onClick={onSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {t("common.save", "Save")}
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ChecklistViewModal;
