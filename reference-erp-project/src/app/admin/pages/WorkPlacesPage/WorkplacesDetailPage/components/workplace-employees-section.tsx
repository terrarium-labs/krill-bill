import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getWorkplaceEmployees, deleteWorkplaceEmployee } from "@/api/orgs/workplaces/workplaces";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import WorkplaceEmployeesTable from "./workplace-employees-table";
import WorkplaceEmployeeDeleteModal from "./workplace-employee-delete-modal";

interface WorkplaceEmployeesSectionProps {
  onAddEmployeeClick?: () => void;
}

export interface WorkplaceEmployeesSectionRef {
  refreshEmployees: () => void;
}

const WorkplaceEmployeesSection = forwardRef<WorkplaceEmployeesSectionRef, WorkplaceEmployeesSectionProps>(({ onAddEmployeeClick }, ref) => {
  const { t } = useTranslation();
  const { orgId, workplaceId } = useParams();
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const fetchEmployees = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId || !workplaceId) return;

    try {
      const response = await getWorkplaceEmployees(
        orgId,
        workplaceId,
        query || null,
        null
      );

      if (response.success) {
        const fetchedEmployees = response.success.employees || [];
        setEmployees(fetchedEmployees);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(
          t(
            "workplaces.employees.error",
            "Error al obtener los empleados del lugar de trabajo"
          )
        );
      }
    } catch (error) {
      console.error("Error fetching workplace users:", error);
      toast.error(
        t(
          "workplaces.users.error",
          "Error al obtener los usuarios del lugar de trabajo"
        )
      );
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const response = await getWorkplaceEmployees(
        orgId,
        workplaceId!,
        searchQuery || null,
        nextPageToken
      );
      if (response.success && response.success.employees) {
        setEmployees(prev => [...prev, ...response.success.employees]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("workplaces.employees.error", "Error fetching employees"));
      }
    } catch (error) {
      toast.error(t("workplaces.employees.error", "Error fetching employees"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshEmployees: () => fetchEmployees()
  }));

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((employee: any) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  }, []);

  // Define renderActions for table rows
  const renderActions = useCallback((employee: any) => {
    return (
      <CustomActionsDropdown
        items={[
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleDeleteConfirm(employee),
            variant: "destructive",
          },
        ]}
      />
    );
  }, [t, handleDeleteConfirm]);

  // Handle delete execution
  const handleDeleteUser = async () => {
    if (!employeeToDelete || !orgId || !workplaceId) return;

    setDeletingUser(true);
    try {
      const response = await deleteWorkplaceEmployee(orgId, workplaceId, {
        employees_ids: [employeeToDelete.id],
      });
      if (response?.success) {
        toast.success(t("workplaces.employees.employeeDeleted", "Employee deleted successfully"));
        // Remove from local state
        setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
      } else {
        toast.error(t("workplaces.employees.errorDeletingEmployee", "Error deleting employee"));
      }
    } catch (error) {
      toast.error(t("workplaces.employees.errorDeletingEmployee", "Error deleting employee"));
    } finally {
      setDeletingUser(false);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      <div className="flex gap-4 w-full">
        <SearchBar
          value={searchQuery}
          isLoading={isSearching}
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchEmployees}
          placeholder={t(
            "workplaces.employees.searchPlaceholder",
            "Search employees in this workplace..."
          )}
          className="w-full"
        />
      </div>



      {/* Employees Table */}
      <WorkplaceEmployeesTable
        employees={employees}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onAddEmployee={onAddEmployeeClick}
        renderActions={renderActions}
      />

      {/* Load More Button */}
      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreUsers}
            disabled={isLoadingMore}
            className="min-w-32"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading", "Loading...")}
              </>
            ) : (
              t("common.loadMore", "Load more")
            )}
          </Button>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <WorkplaceEmployeeDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) {
            setEmployeeToDelete(null);
          }
        }}
        employee={employeeToDelete}
        onConfirm={handleDeleteUser}
        isDeleting={deletingUser}
      />
    </div>
  );
});

export default WorkplaceEmployeesSection;
