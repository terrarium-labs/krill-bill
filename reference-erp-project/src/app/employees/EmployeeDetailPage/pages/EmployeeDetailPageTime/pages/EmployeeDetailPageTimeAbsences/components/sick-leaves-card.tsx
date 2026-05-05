import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { SickLeave } from "@/types/employees/sick-leaves";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, Plus, Loader2, ArrowRight } from "lucide-react";
import { formatTime } from "@/utils/miscelanea";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SickLeaveViewModal from "@/app/sick-leaves/components/sick-leave-view-modal";
import SickLeaveEditModal from "@/app/sick-leaves/components/sick-leave-edit-modal";
import SickLeaveDeleteModal from "@/app/sick-leaves/components/sick-leave-delete-modal";
import CalendarDayLabel from "@/app/components/labels/calendar-day-label";
import { cn } from "@/lib/utils";
import { useParams } from "react-router";
import { getEmployeeSickLeaves } from "@/api/employees/sick-leaves/sick-leaves";
import { postSickLeave, patchSickLeave, deleteSickLeave } from "@/api/orgs/sick-leaves/sick-leaves";
import { toast } from "sonner";

// Helper function to check if two dates are the same day
const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
  const normalizeDate = (date: Date): Date => {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
  };
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
};

export type SickLeavesCardHandle = {
  /** Opens the same view modal as clicking a row in this card. */
  openView: (sickLeave: SickLeave) => void;
};

interface SickLeavesCardProps {
  selectedYear: number;
  employeeId: string;
  /** Sick leaves from context (avoids duplicate fetching). If not provided, card will fetch internally. */
  sickLeaves?: SickLeave[];
  /** Callback when sick leaves change (create/update/delete). Used to refresh context. */
  onSickLeavesChange?: () => void;
}

const SickLeavesCard = forwardRef<SickLeavesCardHandle, SickLeavesCardProps>(function SickLeavesCard(
  {
  selectedYear,
  employeeId,
  sickLeaves: sickLeavesProp,
  onSickLeavesChange,
  },
  ref
) {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [sickLeavesLocal, setSickLeavesLocal] = useState<SickLeave[]>([]);
  const [selectedSickLeave, setSelectedSickLeave] = useState<SickLeave | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const useContextData = sickLeavesProp !== undefined;
  const sickLeaves = useContextData ? sickLeavesProp : sickLeavesLocal;
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Modal state for create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSickLeave, setDeletingSickLeave] = useState<SickLeave | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const isAdminView = employeeId !== "me";

  const fetchSickLeaves = async () => {
    if (!orgId || !employeeId) return;
    try {
      setIsLoading(true);
      const response = await getEmployeeSickLeaves(
        orgId,
        employeeId,
        selectedYear ? selectedYear + "-01-01" : undefined,
        selectedYear ? selectedYear + "-12-31" : undefined,
        undefined,
        undefined,
      );
      const data = response?.success?.sick_leaves;

      if (Array.isArray(data)) {
        setSickLeavesLocal(data);
        setNextPageToken(response.success.next_page_token || null);
      }
    } catch (error) {
      console.error("Error fetching sick leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more sick leaves
  const loadMoreSickLeaves = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getEmployeeSickLeaves(
        orgId,
        employeeId,
        selectedYear ? selectedYear + "-01-01" : undefined,
        selectedYear ? selectedYear + "-12-31" : undefined,
        undefined,
        nextPageToken,
      );
      if (response.success && response.success.sick_leaves) {
        setSickLeavesLocal((prev) => [...prev, ...response.success.sick_leaves]);
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

  useEffect(() => {
    if (!useContextData && orgId && employeeId && selectedYear) {
      fetchSickLeaves();
    }
  }, [useContextData, orgId, employeeId, selectedYear]);

  const sortedSickLeaves = useMemo(
    () =>
      [...(sickLeaves || [])].sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      ),
    [sickLeaves]
  );

  const handleViewSickLeave = (sickLeave: SickLeave) => {
    setSelectedSickLeave(sickLeave);
    setIsViewModalOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openView: (sickLeave: SickLeave) => {
      handleViewSickLeave(sickLeave);
    },
  }));

  // Action handlers
  const handleEditSickLeave = (sickLeave: SickLeave) => {
    setSelectedSickLeave(sickLeave);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleNewSickLeave = () => {
    setSelectedSickLeave(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedSickLeave(null);
    }
  };

  // Custom API functions for admin control over employee sick leaves
  const handleCreateSickLeave = async (data: {
    employee_id: string;
    name: string;
    start_date: string;
    end_date: string;
    description: string | null;
  }) => {
    if (!orgId) return { error: "Missing orgId" };
    return postSickLeave(orgId, data);
  };

  const handleUpdateSickLeave = async (
    sickLeaveId: string,
    data: {
      employee_id: string;
      name: string;
      start_date: string;
      end_date: string;
      description: string | null;
    }
  ) => {
    if (!orgId) return { error: "Missing orgId" };
    return patchSickLeave(orgId, sickLeaveId, data);
  };

  const handleSickLeaveCreatedOrUpdated = () => {
    if (useContextData && onSickLeavesChange) {
      onSickLeavesChange();
    } else {
      fetchSickLeaves();
    }
  };

  // Delete handlers
  const handleOpenDeleteModal = (sickLeave: SickLeave) => {
    setDeletingSickLeave(sickLeave);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSickLeave(null);
    setIsDeleteSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSickLeave || !orgId) return;

    setIsDeleteSubmitting(true);
    try {
      const response = await deleteSickLeave(orgId, deletingSickLeave.id);
      if (response.success || response === undefined) {
        toast.success(t("employees.sickLeaves.deleteSuccess", "Sick leave deleted successfully"));
        if (useContextData && onSickLeavesChange) {
          onSickLeavesChange();
        } else {
          fetchSickLeaves();
        }
        handleCloseDeleteModal();
      } else {
        toast.error(response.error?.message || t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
      }
    } catch (error) {
      toast.error(t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
      console.error("Error deleting sick leave:", error);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const renderModalActions = (sickLeave: SickLeave) => {
    // Don't render any actions for employee self-view
    if (!isAdminView) return null;

    return (
      <CustomActionsDropdown
        items={[
          {
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => {
              setIsViewModalOpen(false);
              handleEditSickLeave(sickLeave);
            },
          },
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleOpenDeleteModal(sickLeave),
            variant: "destructive",
          },
        ]}
      />
    );
  };

  const renderTimeRange = (sickLeave: SickLeave) => {
    const startDate = new Date(sickLeave.start_date);
    const endDate = new Date(sickLeave.end_date);
    return (
      <>
        {formatTime(startDate, { useUTC: true })} – {formatTime(endDate, { useUTC: true })}
      </>
    );
  };

  return (
    <>
      <Card className="shadow-none gap-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 justify-between">
            {t("sickLeaves.title", "Sick Leaves")}
            {isAdminView ? (
              <Button onClick={handleNewSickLeave} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
                {t("employees.addSickLeave", "Add")}
              </Button>
            ) : (
              <Badge variant="secondary">{sickLeaves.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSickLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("sickLeaves.empty", "No sick leaves recorded")}
            </p>
          ) : (
            <div className="overflow-y-auto max-h-64">
              <div className="space-y-2 pr-4">
                {sortedSickLeaves.map((sickLeave) => {
                  const startDate = new Date(sickLeave.start_date);
                  const endDate = new Date(sickLeave.end_date);
                  const isMultiDay = !isSameCalendarDay(startDate, endDate);

                  return (
                    <div
                      key={sickLeave.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer min-w-0",
                        "hover:bg-accent/50"
                      )}
                      onClick={() => handleViewSickLeave(sickLeave)}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <CalendarDayLabel data={startDate} />
                        {isMultiDay && (
                          <>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <CalendarDayLabel data={endDate} />
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                        <h4 className="font-semibold text-sm">
                          {sickLeave.name || t("sickLeaves.unnamed", "Sick leave")}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {renderTimeRange(sickLeave)}
                        </span>
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSickLeave(sickLeave);
                          }}
                          className="hover:underline text-xs cursor-pointer flex items-center gap-1 text-blue-500"
                        >
                          <Paperclip className="h-3 w-3" />
                          {t("absences.addFiles", "Add files")}
                          {sickLeave.num_files > 0 && <> ({sickLeave.num_files})</>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!useContextData && nextPageToken && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreSickLeaves}
                      disabled={loadingMore}
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SickLeaveViewModal
        open={isViewModalOpen}
        employeeId={employeeId}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedSickLeave(null);
        }}
        sickLeave={selectedSickLeave}
        renderActions={selectedSickLeave ? renderModalActions : undefined}
      />

      {/* Create/Edit Sick Leave Modal - Only for admin view */}
      {isAdminView && orgId && modalMode === "create" && (
        <SickLeaveEditModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onSickLeaveCreatedOrUpdated={handleSickLeaveCreatedOrUpdated}
          orgId={orgId}
          employeeId={employeeId}
          sickLeave={null}
          mode="create"
          onCreateSickLeave={handleCreateSickLeave}
        />
      )}

      {isAdminView && orgId && modalMode === "edit" && selectedSickLeave && (
        <SickLeaveEditModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onSickLeaveCreatedOrUpdated={handleSickLeaveCreatedOrUpdated}
          orgId={orgId}
          employeeId={employeeId}
          sickLeave={selectedSickLeave}
          mode="edit"
          onUpdateSickLeave={handleUpdateSickLeave}
          renderActions={(sickLeave, closeModal) => (
            <CustomActionsDropdown
              items={[
                {
                  label: t("common.delete", "Delete"),
                  icon: "trash-2",
                  onClick: () => {
                    closeModal();
                    handleOpenDeleteModal(sickLeave);
                  },
                  variant: "destructive",
                },
              ]}
            />
          )}
        />
      )}

      {/* Delete Modal - Only for admin view */}
      {isAdminView && (
        <SickLeaveDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          sickLeave={deletingSickLeave}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleteSubmitting}
        />
      )}
    </>
  );
});

export default SickLeavesCard;
