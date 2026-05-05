import { memo, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Eye, Check, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getManagerAbsences,
  postManagerAbsenceStatus,
} from "@/api/managers/absences/absences";
import { postAbsenceStatus, deleteAbsence } from "@/api/orgs/absences/absences";
import { Absence } from "@/types/employees/absences";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AbsenceVerificationModal from "@/app/absences/components/modals/absence-verification-modal";
import AbsencesTable from "@/app/absences/components/absences-table";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import AbsenceDeleteModal from "@/app/absences/components/modals/absence-delete-modal";
import AbsenceEditAdminModal from "@/app/absences/components/modals/absence-edit-admin-modal";
import { TableFilters } from "@/types/general/filters";

interface ManagerAbsencesSectionProps {
  /** The manager's employee ID */
  managerId: string | undefined;
  /** Maximum number of records to display */
  maxRecords?: number;
  /** Filter by specific employee ID */
  employeeId?: string | null;
}

const ManagerAbsencesSectionComponent = ({
  managerId,
  maxRecords = 10,
  employeeId: employeeIdProp,
}: ManagerAbsencesSectionProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdFromUrl = searchParams.get("employeeId");
  const employeeId = employeeIdProp ?? employeeIdFromUrl;

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "rejected" | "cancelled"
  >("approved");
  const [verificationReason, setVerificationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAbsence, setViewAbsence] = useState<Absence | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

  // Table filters: include employee filter when employeeId (selectedEmployee) is provided
  const tableFilters: TableFilters = useMemo(() => {
    const filters: TableFilters["filters"] = [
      {
        "key": "status",
        "type": "array",
        "options": [],
        "endpoint": null,
        "is_sortable": false,
        "operator": "inArray",
        "value": ["pending"]
      }
    ];
    if (employeeId) {
      filters.push({
        "key": "employee",
        "type": "array",
        "options": [],
        "endpoint": null,
        "is_sortable": false,
        "operator": "inArray",
        "value": [employeeId]
      });
    }
    return {
      global_operator: "AND",
      filters,
      order_by: null,
      keys: []
    };
  }, [employeeId]);

  const handleSeeAll = () => {
    const params = new URLSearchParams();
    if (employeeId) {
      params.set("employee", employeeId);
    }
    const queryString = params.toString();
    const url = `/${orgId}/managers/${managerId}/absences${queryString ? `?${queryString}` : ""
      }`;
    navigate(url);
  };

  const fetchAbsences = async () => {
    if (!orgId || !managerId) return;
    setIsLoading(true);
    try {
      const response = await getManagerAbsences(
        orgId,
        managerId,
        undefined,
        undefined,
        tableFilters
      );
      if (response.success && response.success.absences) {
        setAbsences(response.success.absences);
      }
    } catch (error) {
      toast.error(
        t("absences.errorFetchingAbsences", "Error fetching absences")
      );
      console.error("Error fetching absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verification modal handlers
  const handleOpenVerificationModal = (
    absence: Absence,
    newStatus: "approved" | "rejected" | "cancelled"
  ) => {
    setSelectedAbsence(absence);
    setVerificationStatus(newStatus);
    setVerificationReason("");
    setIsVerificationModalOpen(true);
  };

  const handleCloseVerificationModal = () => {
    setIsVerificationModalOpen(false);
    setSelectedAbsence(null);
    setVerificationReason("");
    setIsSubmitting(false);
  };

  const handleSubmitVerification = async () => {
    if (!selectedAbsence || !orgId || !managerId) return;

    setIsSubmitting(true);
    try {
      let response;

      // If managerId is "me", use postManagerAbsenceStatus, otherwise use postAbsenceStatus
      if (managerId === "me") {
        response = await postManagerAbsenceStatus(orgId, managerId, {
          absence_ids: [selectedAbsence.id],
          status: verificationStatus,
          reason: verificationReason || null,
        });
      } else {
        response = await postAbsenceStatus(orgId, {
          absence_ids: [selectedAbsence.id],
          status: verificationStatus,
          reason: verificationReason || null,
        });
      }

      if (response.success) {
        toast.success(
          t(
            "absences.verificationSuccess",
            "Absence status updated successfully"
          )
        );
        await fetchAbsences();
        handleCloseVerificationModal();
      } else {
        toast.error(
          response.error?.message ||
          t("absences.verificationError", "Error updating absence status")
        );
      }
    } catch (error) {
      toast.error(
        t("absences.verificationError", "Error updating absence status")
      );
      console.error("Error updating absence status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View handlers
  const handleViewAbsence = (absence: Absence) => {
    setViewAbsence(absence);
    setIsViewModalOpen(true);
  };

  // Delete handlers
  const handleOpenDeleteModal = (absence: Absence) => {
    setDeletingAbsence(absence);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAbsence(null);
    setIsDeleteSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!orgId || !deletingAbsence) return;

    setIsDeleteSubmitting(true);
    try {
      const response = await deleteAbsence(orgId, deletingAbsence.id);

      if (response.success) {
        toast.success(
          t("absences.deleteSuccess", "Absence deleted successfully")
        );
        await fetchAbsences();
        handleCloseDeleteModal();
      } else {
        toast.error(
          response.error?.message ||
          t("absences.deleteError", "Error deleting absence")
        );
      }
    } catch (error) {
      toast.error(t("absences.deleteError", "Error deleting absence"));
      console.error("Error deleting absence:", error);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = (absence: Absence) => {
    setEditingAbsence(absence);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAbsence(null);
  };

  const handleEditSuccess = () => {
    fetchAbsences();
    handleCloseEditModal();
  };

  // Render approve/reject buttons for pending absences
  const renderApproveRejectButtons = (
    absence: Absence,
    onComplete?: () => void
  ) => {
    if (absence.status !== "pending") return null;

    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenVerificationModal(absence, "rejected");
            onComplete?.();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenVerificationModal(absence, "approved");
            onComplete?.();
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      </>
    );
  };

  // Render actions for each absence row
  const renderActions = (absence: Absence) => {
    const status = absence.status;
    return (
      <div className="flex items-center gap-2 justify-end">
        {renderApproveRejectButtons(absence)}
        <CustomActionsDropdown
          items={[
            {
              label: t("common.view", "View"),
              icon: "eye",
              onClick: () => handleViewAbsence(absence),
            },
            // Allow editing for pending, approved, or rejected absences (not cancelled)
            {
              label: t("common.edit", "Edit"),
              icon: "edit",
              onClick: () => handleOpenEditModal(absence),
              showOption: status !== "cancelled",
            },
            // Only allow deleting when managerId is not "me"
            {
              label: t("common.delete", "Delete"),
              icon: "trash-2",
              onClick: () => handleOpenDeleteModal(absence),
              variant: "destructive" as const,
              showOption: managerId !== "me",
            },
          ]}
        />
      </div>
    );
  };

  // Render function for modal header actions (excludes View option, includes approve/reject)
  const renderModalActions = (absence: Absence) => {
    const status = absence.status;
    const items = [
      // For approved, show reject option
      ...(status === "approved"
        ? [
          {
            label: t("absences.reject", "Reject"),
            icon: "x",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenVerificationModal(absence, "rejected");
            },
          },
        ]
        : []),
      // For rejected, show approve option
      ...(status === "rejected"
        ? [
          {
            label: t("absences.approve", "Approve"),
            icon: "check",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenVerificationModal(absence, "approved");
            },
          },
        ]
        : []),
      // Allow editing for non-cancelled absences
      ...(status !== "cancelled"
        ? [
          {
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenEditModal(absence);
            },
          },
        ]
        : []),
      // Only allow deleting when managerId is not "me"
      ...(managerId !== "me"
        ? [
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleOpenDeleteModal(absence),
            variant: "destructive" as const,
          },
        ]
        : []),
    ];

    return <CustomActionsDropdown items={items} />;
  };

  useEffect(() => {
    if (orgId && managerId) {
      fetchAbsences();
    }
  }, [orgId, managerId, employeeId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <span className="text-[16px] font-semibold">
            {t("absences.pendingAbsences.title", "Pending Absences")}
          </span>
        }
        showBackButton={false}
        action={
          <Button variant="outline" onClick={handleSeeAll}>
            <Eye className="h-4 w-4" />
            {t("common.actions.seeAll", "See All")}
          </Button>
        }
      />

      <AbsencesTable
        absences={absences}
        isLoading={isLoading}
        hiddenColumns={["responded_by", "status", "notes", "start_date", "end_date", "year"]}
        maxRecords={maxRecords}
        renderActions={renderActions}
        onRowClick={(absence) => handleViewAbsence(absence)}
        clickableRows
      />

      {/* Verification Modal */}
      <AbsenceVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleCloseVerificationModal}
        absence={selectedAbsence}
        verificationStatus={verificationStatus}
        verificationReason={verificationReason}
        onReasonChange={setVerificationReason}
        onSubmit={handleSubmitVerification}
        isSubmitting={isSubmitting}
      />

      {/* View Absence Modal */}
      {orgId && viewAbsence && (
        <AbsenceViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          orgId={orgId}
          employeeId={viewAbsence.employee.id}
          absenceId={viewAbsence.id}
          renderActions={renderModalActions}
          renderFooterActions={
            viewAbsence?.status === "pending" ? () => (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenVerificationModal(viewAbsence, "rejected");
                  }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                  {t("absences.reject", "Reject")}
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenVerificationModal(viewAbsence, "approved");
                  }}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                  {t("common.accept", "Accept")}
                </Button>
              </div>
            )
              : undefined
          }
        />
      )}

      {/* Delete Modal */}
      <AbsenceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        absence={deletingAbsence}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleteSubmitting}
      />

      {/* Edit Admin Modal */}
      {orgId && editingAbsence && (
        <AbsenceEditAdminModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseEditModal();
          }}
          orgId={orgId}
          employeeId={editingAbsence.employee.id}
          absence={editingAbsence}
          onAbsenceUpdated={handleEditSuccess}
          renderActions={
            managerId !== "me"
              ? (absence, closeModal) => (
                <CustomActionsDropdown
                  items={[
                    {
                      label: t("common.delete", "Delete"),
                      icon: "trash-2",
                      onClick: () => {
                        closeModal();
                        handleOpenDeleteModal(absence);
                      },
                      variant: "destructive",
                    },
                  ]}
                />
              )
              : undefined
          }
        />
      )}
    </div>
  );
};

export const ManagerAbsencesSection = memo(ManagerAbsencesSectionComponent);

export default ManagerAbsencesSection;
