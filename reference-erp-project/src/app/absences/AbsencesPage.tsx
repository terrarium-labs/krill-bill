import PageHeader from "../components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { Absence } from "@/types/employees/absences";
import {
  getAbsences,
  postAbsenceStatusAll,
  postAbsenceStatus,
  deleteAbsence,
  patchAbsence,
} from "@/api/orgs/absences/absences";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  X,
} from "lucide-react";
import AbsencesTable from "./components/absences-table";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AbsenceVerificationModal from "./components/modals/absence-verification-modal";
import AbsenceEditAdminModal from "./components/modals/absence-edit-admin-modal";
import AbsenceViewModal from "./components/modals/absence-view-modal";
import AbsenceDeleteModal from "./components/modals/absence-delete-modal";
import AbsenceBulkActionModal from "./components/modals/absence-bulk-action-modal";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useAbsencesTablePreferences } from "@/hooks/use-absences-table-preferences";
import { AbsenceColumnSelector } from "./components/absence-column-selector";

const AbsencesPage = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { me: orgMe } = useOrgMe();

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
  
  // Use the table filters hook with session storage (no default filters for absences)
  const { tableFilters, setTableFilters } = useTableFilters();

  // Column preferences persisted in localStorage
  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useAbsencesTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );

  // Modal states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "rejected" | "cancelled"
  >("approved");
  const [verificationReason, setVerificationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAbsence, setViewAbsence] = useState<Absence | null>(null);

  // Bulk action state
  const [bulkActionReason, setBulkActionReason] = useState("");

  // Fetch absences function
  const fetchAbsences = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getAbsences(
        orgId,
        query,
        null,
        tableFilters || undefined
      );
      if (response.success && response.success.absences) {
        setAbsences(response.success.absences);
        setNextPageToken(response.success.next_page_token || null);
        if (!tableFilters) {
          setTableFilters(response.success.params);
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
    if (orgId) {
      fetchAbsences();
    }
  }, [orgId]);

  // Load more absences
  const loadMoreAbsences = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getAbsences(
        orgId,
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
    if (!orgId || !actionType) return;

    setIsProcessing(true);
    try {
      const response = await postAbsenceStatusAll(orgId, {
        status: actionType === "approve" ? "approved" : "rejected",
        reason:
          bulkActionReason ||
          (actionType === "approve" ? "Bulk approval" : "Bulk rejection"),
      });

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
    if (!selectedAbsence || !orgId || !orgMe) return;

    setIsSubmitting(true);
    try {
      const response = await postAbsenceStatus(orgId, {
        absence_ids: [selectedAbsence.id],
        status: verificationStatus,
        reason: verificationReason || null,
      });
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

  // Custom update function for admin editing
  const handleAdminUpdateAbsence = async (
    absenceId: string,
    data: {
      status: string;
      reason: string | null;
      start_date: string;
      end_date: string;
    }
  ) => {
    if (!orgId) return { error: "Missing orgId" };
    return patchAbsence(orgId, absenceId, data);
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
    if (!deletingAbsence || !orgId) return;

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

  // Custom render function for table actions (Admin view - full control)
  const renderTableActions = (absence: Absence, allAbsences: Absence[]) => {
    const status = absence.status;
    const hasPending = allAbsences.some((a) => a.status === "pending");

    return (
      <div
        className={`flex items-center gap-2 ${hasPending ? "justify-end" : "justify-center"
          }`}
      >
        {/* Show approve/reject buttons for pending status */}
        {renderApproveRejectButtons(absence)}

        {/* Three dots menu */}
        <CustomActionsDropdown
          items={[
            {
              label: t("common.view", "View"),
              icon: "eye",
              onClick: () => handleViewAbsence(absence),
            },
            // For approved/rejected, show approve/reject/edit/delete
            {
              label: t("absences.reject", "Reject"),
              icon: "x",
              onClick: () =>
                handleOpenVerificationModal(absence, "rejected"),
              showOption: status === "approved",
            },
            {
              label: t("absences.approve", "Approve"),
              icon: "check",
              onClick: () =>
                handleOpenVerificationModal(absence, "approved"),
              showOption: status === "rejected",
            },
            // Allow editing for pending, approved, or rejected absences (not cancelled)
            {
              label: t("common.edit", "Edit"),
              icon: "edit",
              onClick: () => handleOpenEditModal(absence),
              showOption: status !== "cancelled",
            },
            {
              label: t("common.delete", "Delete"),
              icon: "trash-2",
              onClick: () => handleOpenDeleteModal(absence),
              variant: "destructive",
            },
          ]}
        />
      </div>
    );
  };

  // Render function for modal header actions (three-dots menu only, no approve/reject buttons or View option)
  const renderModalActions = (absence: Absence) => {
    const status = absence.status;

    return (
      <CustomActionsDropdown
        items={[
          {
            showOption: status === "approved",
            label: t("absences.reject", "Reject"),
            icon: "x",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenVerificationModal(absence, "rejected");
            },
          },
          {
            showOption: status === "rejected",
            label: t("absences.approve", "Approve"),
            icon: "check",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenVerificationModal(absence, "approved");
            },
          },
          {
            showOption: status !== "cancelled",
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => {
              setIsViewModalOpen(false);
              handleOpenEditModal(absence);
            },
          },
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleOpenDeleteModal(absence),
            variant: "destructive",
          },
        ]}
      />
    );
  };

  return (
    <>
      <PageHeader
        title={t("absences.title", "Absences")}
        description={t(
          "absences.description",
          "Manage your organization's absences."
        )}
        docs={{ slug: "pd_mod_absences" }}
        showBackButton={false}
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
              triggerLabel={t("absences.bulkActions", "Bulk Actions")}
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
          onFilter={() => fetchAbsences(searchQuery)}
          endSlot={
            <AbsenceColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
          }
        />
      )}

      {/* Absences Table */}
      <AbsencesTable
        absences={absences}
        isLoading={isLoading}
        renderActions={renderTableActions}
        onRowClick={(absence) => handleViewAbsence(absence)}
        clickableRows
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
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
          absence={editingAbsence}
          onUpdateAbsence={handleAdminUpdateAbsence}
          renderActions={(absence, closeModal) => (
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
          )}
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

      {/* View Absence Modal */}
      {orgId && (
        <AbsenceViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          orgId={orgId}
          employeeId={viewAbsence?.employee.id || ""}
          absenceId={viewAbsence?.id || null}
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
    </>
  );
};

export default AbsencesPage;
