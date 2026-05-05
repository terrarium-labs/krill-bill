import { useState, useRef } from "react";
import PageHeader from "@/app/components/page-header";
import { useJobTitle, JobTitleProvider } from "./context/JobTitleContext";
import IdBadge from "@/app/components/id-badge";
import JobTitleEmployeesSection, { JobTitleEmployeesSectionRef } from "./components/job-title-employees-section";
import { JobTitleInfoCard } from "./components/job-title-info-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { deleteOrgJobTitle } from '@/api/orgs/job-titles/job-titles';
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import JobTitleEditModal from "../components/job-title-edit-modal";
import JobTitleEmployeeAddModal from "./components/job-title-employee-add-modal";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import JobTitleDeleteModal from "../components/job-title-delete-modal";

const JobTitleDetailPageContent = () => {
    const { jobTitle, refetchJobTitle } = useJobTitle();
    const { t } = useTranslation();
    const { orgId, jobTitleId } = useParams();
    const navigate = useNavigate();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const jobTitleEmployeesRef = useRef<JobTitleEmployeesSectionRef>(null);

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!jobTitle || !orgId || !jobTitleId) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgJobTitle(orgId, jobTitleId);
            if (response?.success) {
                toast.success(t("admin.jobTitles.deletedSuccess", "Job title deleted successfully"));
                navigate(`/${orgId}/admin/job-titles`);
            } else {
                toast.error(
                    response?.error || t("admin.jobTitles.deleteError", "Failed to delete job title")
                );
            }
        } catch (error) {
            console.error("Error deleting job title:", error);
            toast.error(t("admin.jobTitles.deleteError", "Failed to delete job title"));
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleJobTitleUpdated = async () => {
        await refetchJobTitle();
    };

    const handleAddEmployee = () => {
        setIsAddEmployeeModalOpen(true);
    };

    const handleEmployeeAdded = () => {
        // Refresh the employees list when an employee is added
        jobTitleEmployeesRef.current?.refreshEmployees();
    };

    return (
        <>
            <PageHeader
                title={jobTitle?.name || ""}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={jobTitle?.id || ""} />
                        <Button onClick={handleAddEmployee}>
                            <Plus className="h-4 w-4" />
                            {t("jobTitles.employees.addEmployee", "Add employee")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: handleEdit,
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDelete,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
                description={jobTitle?.description || ""}
                showBackButton={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <JobTitleInfoCard onEdit={handleEdit} />
                </div>
                <div className="lg:col-span-2">
                    <JobTitleEmployeesSection ref={jobTitleEmployeesRef} onAddEmployeeClick={handleAddEmployee} />
                </div>
            </div>

            {/* Edit Modal */}
            {orgId && (
                <JobTitleEditModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onJobTitleCreated={handleJobTitleUpdated}
                    jobTitleToEdit={jobTitle}
                    mode="edit"
                />
            )}

            <JobTitleDeleteModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                jobTitle={jobTitle || null}
                deleting={isDeleting}
                onConfirm={handleDeleteConfirm}
            />

            {/* Add Employee Modal */}
            {orgId && jobTitleId && (
                <JobTitleEmployeeAddModal
                    open={isAddEmployeeModalOpen}
                    onOpenChange={setIsAddEmployeeModalOpen}
                    orgId={orgId}
                    jobTitleId={jobTitleId}
                    onSuccess={handleEmployeeAdded}
                />
            )}
        </>
    );
};

const JobTitleDetailPage = () => {
    return (
        <JobTitleProvider>
            <JobTitleDetailPageContent />
        </JobTitleProvider>
    );
};

export default JobTitleDetailPage;

