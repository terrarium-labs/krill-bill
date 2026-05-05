import { useState, useRef } from "react";
import PageHeader from "@/app/components/page-header";
import { useWorkPlace } from "../context/WorkPlaceContext";
import IdBadge from "@/app/components/id-badge";
import WorkplaceEmployeesSection, { WorkplaceEmployeesSectionRef } from "./components/workplace-employees-section";
import { WorkplaceInfoCard } from "./components/workplace-info-card";
import WorkplaceHolidaysCard from "./components/workplace-holidays-card";
import { DynamicIcon } from "lucide-react/dynamic";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { deleteWorkplace } from "@/api/orgs/workplaces/workplaces";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import WorkplaceEditModal from "../components/workplace-edit-modal";
import WorkplaceDeleteModal from "../components/workplace-delete-modal";
import WorkplaceEmployeeAddModal from "./components/workplace-employee-add-modal";

const WorkplacesDetailPageContent = () => {
  const { workplace, refetchWorkplace } = useWorkPlace();
  const { t } = useTranslation();
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const workplaceUsersRef = useRef<WorkplaceEmployeesSectionRef>(null);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workplace || !orgId) return;

    setIsDeleting(true);
    try {
      const response = await deleteWorkplace(orgId, workplace.id);
      if (response?.success) {
        toast.success(t("admin.workplaces.deletedSuccess", "Workplace deleted successfully"));
        navigate(`/${orgId}/admin/workplaces`);
      } else {
        toast.error(
          response?.error || t("admin.workplaces.deleteError", "Failed to delete workplace")
        );
      }
    } catch (error) {
      console.error("Error deleting workplace:", error);
      toast.error(t("admin.workplaces.deleteError", "Failed to delete workplace"));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleWorkplaceUpdated = async () => {
    await refetchWorkplace();
  };

  const handleAddEmployee = () => {
    setIsAddEmployeeModalOpen(true);
  };

  const handleEmployeeAdded = () => {
    // Refresh the employees list when an employee is added
    workplaceUsersRef.current?.refreshEmployees();
  };

  return (
    <>
      <PageHeader
        beforeTextChildren={
          workplace?.icon_url ? (
            <div className="flex items-center gap-2 bg-muted rounded-md min-h-14 min-w-14 justify-center">
              <DynamicIcon
                name={workplace?.icon_url as any}
                className="h-6 w-6"
              />
            </div>
          ) : null
        }
        title={workplace?.name || ""}
        action={
          <div className="flex items-center gap-2">
            <IdBadge id={workplace?.id || ""} />
            <Button onClick={handleAddEmployee}>
              <Plus className="h-4 w-4" />
              {t("workplaces.employees.addEmployee", "Add employee")}
            </Button>
            <CustomActionsDropdown
              items={[
                {
                  label: t('common.actions.edit', 'Edit'),
                  icon: "edit",
                  onClick: handleEdit,
                },
                {
                  label: t('common.actions.delete', 'Delete'),
                  icon: "trash-2",
                  onClick: handleDelete,
                  variant: "destructive",
                },
              ]}
            />

          </div>
        }
        description={[
          workplace?.address_line_1 || "",
          workplace?.address_line_2 || "",
          workplace?.city || "",
          workplace?.state_province || "",
          workplace?.postal_code || "",
        ].filter(Boolean).join(", ")}
        showBackButton={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <WorkplaceInfoCard onEdit={handleEdit} />
          <WorkplaceHolidaysCard />
        </div>
        <div className="lg:col-span-2">
          <WorkplaceEmployeesSection ref={workplaceUsersRef} onAddEmployeeClick={handleAddEmployee} />
        </div>
      </div>

      {/* Edit Modal */}
      {orgId && (
        <WorkplaceEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onWorkplaceCreated={handleWorkplaceUpdated}
          orgId={orgId}
          workplace={workplace}
          mode="update"
          renderActions={(_workplace, closeModal) => (
            <CustomActionsDropdown
              items={[
                {
                  label: t('common.delete', 'Delete'),
                  icon: "trash-2",
                  onClick: () => {
                    closeModal();
                    handleDelete();
                  },
                  variant: "destructive",
                },
              ]}
            />
          )}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <WorkplaceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        workplace={workplace || null}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Add Employee Modal */}
      {orgId && workplace?.id && (
        <WorkplaceEmployeeAddModal
          open={isAddEmployeeModalOpen}
          onOpenChange={setIsAddEmployeeModalOpen}
          orgId={orgId}
          workplaceId={workplace.id}
          onSuccess={handleEmployeeAdded}
        />
      )}
    </>
  );
};

export default WorkplacesDetailPageContent;
