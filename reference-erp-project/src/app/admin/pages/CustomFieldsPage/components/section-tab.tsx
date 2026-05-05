import { TabsContent } from "@/components/ui/shadcn-io/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import CustomFieldAddModal from "./custom-field-add-modal";
import CustomFieldsTable, { Field } from "./custom-fields-table";
import CustomFieldDeleteModal from "./custom-field-delete-modal";
import { getOrgSectionsSection } from "@/api/orgs/sections/sections";
import { deleteOrgField } from "@/api/orgs/fields/fields";
import { toast } from "sonner";
import IdBadge from "@/app/components/id-badge";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";

const SectionTab = ({ section, handleEditSection, handleDeleteSection, onFieldCreated, table_name }: { section: any, handleEditSection: (section: any) => void, handleDeleteSection: (section: any) => void, onFieldCreated?: () => void, table_name: string }) => {
    const { t } = useTranslation();
    const { orgId } = useParams();
    const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState<Field | null>(null);
    const [fields, setFields] = useState<Field[]>(section.fields || []);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
    const [deletingField, setDeletingField] = useState(false);

    const fetchSection = async () => {
        setIsLoading(true);
        try {
            const response = await getOrgSectionsSection(orgId || "", section.id);
            if (response.success) {
                setFields(response.success.section.fields || []);
            } else {
                toast.error(t("admin.customFields.errorFetchingFields", "Error fetching fields"));
            }
        } catch (error) {
            console.error("Error fetching section:", error);
            toast.error(t("admin.customFields.errorFetchingFields", "Error fetching fields"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddField = () => {
        setFieldToEdit(null);
        setIsAddFieldModalOpen(true);
    };

    const handleCloseAddFieldModal = () => {
        setIsAddFieldModalOpen(false);
        setFieldToEdit(null);
    };

    const handleFieldCreated = () => {
        if (onFieldCreated) {
            onFieldCreated();
        }
        fetchSection();
    };

    // Handle delete execution
    const handleDeleteField = async () => {
        if (!fieldToDelete || !orgId) return;

        setDeletingField(true);
        try {
            const response = await deleteOrgField(orgId, fieldToDelete.id);
            if (response.success) {
                toast.success(t("admin.customFields.field.deletedSuccess", "Field deleted successfully"));
                // Remove from local state
                setFields(prev => prev.filter(f => f.id !== fieldToDelete.id));
                if (onFieldCreated) {
                    onFieldCreated();
                }
            } else {
                toast.error(t("admin.customFields.field.deleteError", "Error deleting field"));
            }
        } catch (error) {
            console.error("Error deleting field:", error);
            toast.error(t("admin.customFields.field.deleteError", "Error deleting field"));
        } finally {
            setDeletingField(false);
            setDeleteModalOpen(false);
            setFieldToDelete(null);
        }
    };

    // Handle edit field
    const handleEditField = useCallback((field: Field) => {
        setFieldToEdit(field);
        setIsAddFieldModalOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((field: Field) => {
        setFieldToDelete(field);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((field: Field) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(field),
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [t, handleDeleteConfirm]);

    return (
        <>
            <TabsContent value={section.id} transition={{ duration: 0 }}>
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 w-full justify-end items-center">
                        <IdBadge
                            id={section.id}
                        />
                        <Button variant="outline" onClick={handleAddField}>
                            <Plus className="h-4 w-4" />
                            {t("common.addField", "Add Field")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => handleEditSection(section),
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteSection(section),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                </div>

                {/* Fields Table */}
                <CustomFieldsTable
                    fields={fields}
                    isLoading={isLoading}
                    onFieldClick={handleEditField}
                    onAddField={handleAddField}
                    renderActions={renderActions}
                />

                <CustomFieldAddModal
                    open={isAddFieldModalOpen}
                    onOpenChange={handleCloseAddFieldModal}
                    onFieldCreated={handleFieldCreated}
                    field={fieldToEdit}
                    orgId={orgId || ""}
                    sectionId={section.id}
                    table_name={table_name}
                />
            </TabsContent>

            {/* Delete Confirmation Dialog */}
            <CustomFieldDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setFieldToDelete(null);
                    }
                }}
                field={fieldToDelete}
                onConfirm={handleDeleteField}
                isDeleting={deletingField}
            />
        </>
    )
}

export default SectionTab;