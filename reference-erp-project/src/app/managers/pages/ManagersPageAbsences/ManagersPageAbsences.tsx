import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { Absence } from "@/types/employees/absences";
import {
  getManagerAbsences,
  postManagerAbsenceStatusAll,
  postManagerAbsenceStatus,
  patchManagerAbsence,
} from "@/api/managers/absences/absences";
import { toast } from "sonner";
import { useManager } from "@/app/managers/contexts/ManagerContext";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  X,
} from "lucide-react";
import AbsencesTable from "@/app/absences/components/absences-table";
import {
  postAbsenceStatusAll,
  postAbsenceStatus,
  patchAbsence,
  deleteAbsence,
} from "@/api/orgs/absences/absences";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AbsenceVerificationModal from "@/app/absences/components/modals/absence-verification-modal";
import AbsenceEditAdminModal from "@/app/absences/components/modals/absence-edit-admin-modal";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import AbsenceDeleteModal from "@/app/absences/components/modals/absence-delete-modal";
import AbsenceBulkActionModal from "@/app/absences/components/modals/absence-bulk-action-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { mergeEmployeeFilterIntoTableFilters } from "@/utils/filter-templates";

const ManagersPageAbsences = () => {
  const { t } = useTranslation();
  const { orgId, managerId } = useParams<{
    orgId: string;
    managerId: string;
  }>();
  const [searchParams] = useSearchParams();
  const employeeIdFromUrl = searchParams.get("employeeId");
  const { manager } = useManager();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "rejected" | "cancelled"
  >("approved");
  const [verificationReason, setVerificationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the table filters hook with session storage (no default filters)
  const { tableFilters, setTableFilters } = useTableFilters();
  const tableFiltersRef = useRef(tableFilters);
  tableFiltersRef.current = tableFilters;

  // Sync employeeId from URL into tableFilters so it appears in the filter UI and can be modified
  useEffect(() => {
    if (employeeIdFromUrl) {
      const merged = mergeEmployeeFilterIntoTableFilters(tableFiltersRef.current, employeeIdFromUrl);
      if (merged) setTableFilters(merged);
    }
  }, [employeeIdFromUrl, setTableFilters]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAbsence, setViewAbsence] = useState<Absence | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Bulk action state
  const [bulkActionReason, setBulkActionReason] = useState("");

  // Fetch absences function
  const fetchAbsences = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId || !managerId) return;

    try {
      const response = await getManagerAbsences(
        orgId,
        managerId,
        query || undefined,
        undefined,
        tableFilters || undefined
      );
      if (response.success && response.success.absences) {
        setAbsences(response.success.absences);
        setNextPageToken(response.success.next_page_token || null);
        if (!tableFilters && response.success.params) {
          setTableFilters(mergeEmployeeFilterIntoTableFilters(response.success.params, employeeIdFromUrl));
        }
      } else {
        toast.error(
          t("absences.errorFetchingAbsences") || "Error fetching absences"
        );
      }
    } catch (error) {
      toast.error(
        t("absences.errorFetchingAbsences") || "Error fetching absences"
      );
      console.error("Error fetching absences:", error);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orgId && managerId) {
      fetchAbsences();
    }
  }, [orgId, managerId, tableFilters]);

  // Load more absences
  const loadMoreAbsences = async () => {
    if (!orgId || !managerId || !nextPageToken || loadingMore || isLoading)
      return;

    setLoadingMore(true);
    try {
      const response = await getManagerAbsences(
        orgId,
        managerId,
        searchQuery || undefined,
        nextPageToken,
        tableFilters || undefined
      );
      if (response.success && response.success.absences) {
        setAbsences((prev) => [...prev, ...response.success.absences]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(
          t("absences.errorFetchingAbsences") || "Error fetching absences"
        );
      }
    } catch (error) {
      toast.error(
        t("absences.errorFetchingAbsences") || "Error fetching absences"
      );
      console.error("Error fetching absences:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle bulk action confirmation
  const handleBulkAction = (action: "approve" | "reject") => {
    setActionType(action);
    setBulkActionReason("");
    setConfirmDialogOpen(true);
  };

  const handleCloseBulkActionModal = () => {
    setConfirmDialogOpen(false);
    setActionType(null);
    setBulkActionReason("");
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (!orgId || !managerId || !actionType) return;

    setIsProcessing(true);
    try {
      let response;

      // If managerId is "me", use postManagerAbsenceStatusAll, otherwise use postAbsenceStatusAll
      if (managerId === "me") {
        response = await postManagerAbsenceStatusAll(orgId, managerId, {
          status: actionType === "approve" ? "approved" : "rejected",
          reason:
            bulkActionReason ||
            (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
        });
      } else {
        response = await postAbsenceStatusAll(orgId, {
          status: actionType === "approve" ? "approved" : "rejected",
          reason:
            bulkActionReason ||
            (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
        });
      }

      if (response.success) {
        toast.success(
          t(
            actionType === "approve"
              ? "absences.allApproved"
              : "absences.allRejected",
            actionType === "approve"
              ? "All absences approved successfully"
              : "All absences rejected successfully"
          )
        );
        fetchAbsences();
        handleCloseBulkActionModal();
      } else {
        toast.error(t("absences.errorProcessing", "Error processing absences"));
      }
    } catch (error) {
      toast.error(t("absences.errorProcessing", "Error processing absences"));
      console.error("Error processing bulk action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verification modal handlers
  const handleOpenVerificationModal = (
    absence: Absence,
    status: "approved" | "rejected" | "cancelled"
  ) => {
    setSelectedAbsence(absence);
    setVerificationStatus(status);
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

  // Edit handlers
  const handleOpenEditModal = (absence: Absence) => {
    setEditingAbsence(absence);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setEditingAbsence(null);
    }
  };

  const handleAbsenceUpdated = () => {
    fetchAbsences();
  };

  // Custom update function for manager editing (admin mode)
  const handleAdminUpdateAbsence = async (
    absenceId: string,
    data: {
      status: string;
      reason: string | null;
      start_date: string;
      end_date: string;
    }
  ) => {
    if (!orgId || !managerId) return { error: "Missing orgId or managerId" };
    // If managerId is "me", use patchManagerAbsence, otherwise use patchAbsence
    if (managerId === "me") {
      return patchManagerAbsence(orgId, managerId, absenceId, data);
    } else {
      return patchAbsence(orgId, absenceId, data);
    }
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

  // Custom render function for table actions (Manager view)
  const renderTableActions = (absence: Absence) => {
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
            {
              showOption: status === "approved",
              label: t("absences.reject", "Reject"),
              icon: "x",
              onClick: () => handleOpenVerificationModal(absence, "rejected"),
            },
            {
              showOption: status === "rejected" && managerId !== "me",
              label: t("absences.approve", "Approve"),
              icon: "check",
              onClick: () => handleOpenVerificationModal(absence, "approved"),
            },
            {
              showOption: status !== "cancelled",
              label: t("common.edit", "Edit"),
              icon: "edit",
              onClick: () => handleOpenEditModal(absence),
            },
            {
              showOption: managerId !== "me",
              label: t("common.delete", "Delete"),
              icon: "trash-2",
              onClick: () => handleOpenDeleteModal(absence),
              variant: "destructive" as const,
            },
          ]}
        />
      </div>
    );
  };

  // Render function for modal header actions (excludes View option)
  const renderModalActions = (absence: Absence) => {
    const status = absence.status;
    const items = [
      // For approved, show reject option
      {
        label: t("absences.reject", "Reject"),
        icon: "x",
        onClick: () => {
          setIsViewModalOpen(false);
          handleOpenVerificationModal(absence, "rejected");
        },
        showOption: status === "approved",
      },
      // For rejected, show approve option (only when managerId is not "me")
      {
        label: t("absences.approve", "Approve"),
        icon: "check",
        onClick: () => {
          setIsViewModalOpen(false);
          handleOpenVerificationModal(absence, "approved");
        },
        showOption: status === "rejected" && managerId !== "me",
      },
      // Allow editing for pending, approved, or rejected absences (not cancelled)
      {
        label: t("common.edit", "Edit"),
        icon: "edit",
        onClick: () => {
          setIsViewModalOpen(false);
          handleOpenEditModal(absence);
        },
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
    ];

    // Only render dropdown if there are actions available
    if (items.length === 0) return null;
    return <CustomActionsDropdown items={items} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("managers.absences.title", "Absences")}
        description={t(
          "managers.absences.description",
          `Manage ${managerId == "me"
            ? "your"
            : `${manager?.first_name} ${manager?.last_name}`
          } team absences`
        )}
        action={
          <div className="flex items-center gap-2">
            <CustomActionsDropdown
              items={[
                {
                  label: t("absences.acceptAll", "Accept All"),
                  icon: "check",
                  onClick: () => handleBulkAction("approve"),
                },
                {
                  variant: "destructive",
                  label: t("absences.denyAll", "Deny All"),
                  icon: "x",
                  onClick: () => handleBulkAction("reject"),
                },
              ]}
              triggerIcon="chevron-down"
              triggerVariant="default"
              triggerLabel={t("timeRecords.bulkActions", "Bulk Actions")}
            />
          </div>
        }
      />

      <SearchBar
        value={searchQuery}
        isLoading={isSearching}
        onChange={(query) => setSearchQuery(query)}
        onSearch={fetchAbsences}
        placeholder={t("absences.searchPlaceholder", "Search absences...")}
      />

      {/* Filters */}
      {tableFilters && (
        <TableFiltersRow
          value={tableFilters}
          onChange={(filters) => setTableFilters(filters)}
          onFilter={(_) => fetchAbsences(searchQuery)}
        />
      )}

      {/* Absences Table */}
      <AbsencesTable
        absences={absences}
        isLoading={isLoading}
        renderActions={renderTableActions}
        onRowClick={(absence) => handleViewAbsence(absence)}
        clickableRows
      />

      {/* Load More Button */}
      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreAbsences}
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

      {/* Bulk Action Modal */}
      <AbsenceBulkActionModal
        isOpen={confirmDialogOpen}
        onClose={handleCloseBulkActionModal}
        actionType={actionType}
        reason={bulkActionReason}
        onReasonChange={setBulkActionReason}
        onConfirm={executeBulkAction}
        isProcessing={isProcessing}
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

      {/* Admin Edit Modal */}
      {orgId && editingAbsence && (
        <AbsenceEditAdminModal
          open={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          onAbsenceUpdated={handleAbsenceUpdated}
          orgId={orgId}
          employeeId={editingAbsence.employee.id}
          managerId={managerId === "me" ? "me" : undefined}
          absence={editingAbsence}
          onUpdateAbsence={handleAdminUpdateAbsence}
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
            viewAbsence?.status === "pending"
              ? () => (
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
    </div>
  );
};

export default ManagersPageAbsences;
