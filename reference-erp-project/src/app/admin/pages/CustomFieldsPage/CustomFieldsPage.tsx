import PageHeader from "@/app/components/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SectionEditModal from "./components/section-edit-modal";
import SectionDeleteModal from "./components/section-delete-modal";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/ui/shadcn-io/tabs";
import { toast } from "sonner";
import SectionTab from "./components/section-tab";
import { deleteOrgSections, getOrgSections } from "@/api/orgs/sections/sections";


const CustomFieldsPage = (
    {
        table_name,
        title,
    }: {
        table_name: string;
        title: string;
    }
) => {
    const { t } = useTranslation();
    const { orgId } = useParams();

    const [customSections, setCustomSections] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<any>(null);
    const [deletingSection, setDeletingSection] = useState(false);
    const [selectedSection, setSelectedSection] = useState<any>(null);

    const fetchCustomSections = async (goToLastSection = false) => {
        try {
            const response = await getOrgSections(orgId || "", table_name);
            if (response.success) {
                setCustomSections(response.success.sections);
                if (selectedSection === null) {
                    setSelectedSection(response.success.sections[0].id);
                }
                if (goToLastSection) {
                    setSelectedSection(response.success.sections[response.success.sections.length - 1].id);
                }
            } else {
                toast.error(t("admin.customFields.errorFetchingSections", "Failed to fetch custom sections"));
            }
        } catch (error) {
            toast.error(t("admin.customFields.errorFetchingSections", "Failed to fetch custom sections"));
            console.error("Error fetching custom sections:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCustomSections();
    }, []);

    const handleOpenModal = () => {
        setEditingSection(null);
        setIsModalOpen(true);
    };

    const handleEditSection = (section: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        setEditingSection(section);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSection(null);
    };

    const handleSectionCreated = () => {
        fetchCustomSections(true);
    };

    const handleFieldCreated = () => {
        fetchCustomSections();
    };

    const handleDeleteSection = (section: any) => {
        setSectionToDelete(section);
        setDeleteModalOpen(true);
    };

    const handleDeleteSectionConfirm = async () => {
        if (!sectionToDelete || !orgId) return;

        setDeletingSection(true);
        try {
            const response = await deleteOrgSections(orgId, sectionToDelete.id);
            if (response.success) {
                toast.success(t("admin.customFields.section.deletedSuccess", "Section deleted successfully"));
                // Remove from local state
                const updatedSections = customSections.filter(s => s.id !== sectionToDelete.id);
                setCustomSections(updatedSections);
                // Update selected section if needed
                setSelectedSection(updatedSections[0].id);
            } else {
                toast.error(t("admin.customFields.section.deleteError", "Error deleting section"));
            }
        } catch (error) {
            console.error("Error deleting section:", error);
            toast.error(t("admin.customFields.section.deleteError", "Error deleting section"));
        } finally {
            setDeletingSection(false);
            setDeleteModalOpen(false);
            setSectionToDelete(null);
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader
                title={title}
                description={t("admin.customFields.description", "Manage your organization's custom fields for this table.")}
                docs={{ slug: "pd_admin_custom_fields" }}
                action={
                    <Button onClick={handleOpenModal}>
                        <Plus className="min-w-4 min-h-4" />
                        {t("admin.customFields.addSection", "Add Section")}
                    </Button>
                }
            />

            {isLoading || !selectedSection ? (
                <PageSkeleton showPageHeader={false} tabCount={3} variant="table" />
            ) : (
                <Tabs value={selectedSection} onValueChange={(value) => setSelectedSection(value)} >
                <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                    {customSections.map((section) => (
                        <TabsTrigger className="py-0" value={section.id} key={section.id}>{section.title}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    {customSections.map((section) => (
                        <TabsContent value={section.id} key={section.id} transition={{ duration: 0 }}>
                            <SectionTab  section={section} handleEditSection={handleEditSection} handleDeleteSection={handleDeleteSection} onFieldCreated={handleFieldCreated} table_name={table_name} />
                        </TabsContent>
                    ))}
                </TabsContents>
            </Tabs>
            )}

            <SectionEditModal
                open={isModalOpen}
                onOpenChange={handleCloseModal}
                onSectionCreated={handleSectionCreated}
                orgId={orgId || ""}
                section={editingSection}
                table_name={table_name}
            />

            {/* Delete Section Confirmation Dialog */}
            <SectionDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setSectionToDelete(null);
                    }
                }}
                section={sectionToDelete}
                onConfirm={handleDeleteSectionConfirm}
                isDeleting={deletingSection}
            />
        </div>
    )
}

export default CustomFieldsPage;