import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Employee } from "@/types/employees/employees";
import SearchBar from "../components/search-bar";
import { getOrgEmployees, deleteEmployee } from "@/api/employees/employees";
import { toast } from "sonner";
import EmployeeCreateModal from "./components/employee-create-modal";
import TableFiltersRow from "../components/table-filters/table-filters";
import EmployeesTable from "./components/employees-table";
import EmployeeDeleteModal from "./components/employee-delete-modal";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useEmployeeTablePreferences } from "@/hooks/use-employee-table-preferences";
import { EmployeeColumnSelector } from "./components/employee-column-selector";

const EmployeesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newEmployeeModalOpen, setNewEmployeeModalOpen] = useState(false);
  
  // Use the table filters hook with session storage and default filters
  const { 
    tableFilters, 
    setTableFilters, 
    hasInitializedFilters, 
    setHasInitializedFilters 
  } = useTableFilters({
    defaultFilters: "employees"
  });

  // Column preferences persisted in localStorage (visibility, order, sizing)
  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useEmployeeTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) => {
      setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
    },
    [setColumnVisibility],
  );

  const handleColumnOrderChange = useCallback(
    (order: string[]) => {
      setColumnOrder(order);
    },
    [setColumnOrder],
  );

  // Fetch employees function
  const fetchEmployees = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getOrgEmployees(
        orgId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        query || undefined,
        undefined,
        tableFilters || undefined
      );
      if (response.success && response.success.employees) {
        setEmployees(response.success.employees);
        setNextPageToken(response.success.next_page_token || null);
        // Initialize filters from API response only once, merging with default filters
        if (!hasInitializedFilters && response.success.params) {
          setTableFilters({
            ...response.success.params,
            // Preserve the default filters if they exist
            filters: tableFilters?.filters || response.success.params.filters,
          });
          // Set flag after state update to prevent onFilter from being called during initialization
          setHasInitializedFilters(true);
        }
      } else {
        toast.error(
          t("employees.errorFetchingEmployees") || "Error fetching employees"
        );
      }
    } catch (error) {
      toast.error(
        t("employees.errorFetchingEmployees") || "Error fetching employees"
      );
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchEmployees();
    }
  }, [orgId]);


  // Load more employees
  const loadMoreEmployees = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getOrgEmployees(
        orgId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        searchQuery || undefined,
        nextPageToken,
        tableFilters || undefined
      );
      if (response.success && response.success.employees) {
        setEmployees((prev) => [...prev, ...response.success.employees]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(
          t("employees.errorFetchingEmployees") || "Error fetching employees"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        t("employees.errorFetchingEmployees") || "Error fetching employees"
      );
    } finally {
      setLoadingMore(false);
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  // Handle delete execution
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete || !orgId) return;

    setIsDeleting(true);
    try {
      const response = await deleteEmployee(orgId, employeeToDelete.id);
      if (response.success) {
        toast.success(
          t("employees.employeeDeleted", "Employee deleted successfully")
        );
        // Remove from local state
        setEmployees((prev) =>
          prev.filter((e) => e.id !== employeeToDelete.id)
        );
        handleCloseDeleteModal();
      } else {
        toast.error(
          t("employees.errorDeletingEmployee", "Error deleting employee")
        );
      }
    } catch (error) {
      toast.error(
        t("employees.errorDeletingEmployee", "Error deleting employee")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  // Navigate to employee detail
  const handleViewEmployee = (employeeId: string) => {
    navigate(`/${orgId}/employees/${employeeId}`);
  };

  // Render actions for table
  const renderTableActions = (employee: Employee) => {
    return (
      <div className="flex justify-center items-center">
        <CustomActionsDropdown
          items={[
            {
              label: t("common.view", "View"),
              icon: "eye",
              onClick: () => handleViewEmployee(employee.id),
            },
            {
              label: t("common.delete", "Delete"),
              icon: "trash-2",
              onClick: () => handleDeleteConfirm(employee),
              variant: "destructive",
            },
          ]}
        />
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <PageHeader
        title={t("employees.title", "Employees")}
        description={t(
          "employees.description",
          "Manage your organization's employees."
        )}
        docs={{ slug: "pd_mod_employees" }}
        showBackButton={false}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setNewEmployeeModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("employees.addEmployee", "Add Employee")}
            </Button>
          </div>
        }
      />

      <SearchBar
        value={searchQuery}
        isLoading={isSearching}
        onChange={(query) => setSearchQuery(query)}
        onSearch={fetchEmployees}
        placeholder={t("employees.searchPlaceholder", "Search employees...")}
      />

      {tableFilters && (
        <TableFiltersRow
          value={tableFilters}
          onChange={(filters) => setTableFilters(filters)}
          onFilter={hasInitializedFilters ? (_) => fetchEmployees(searchQuery) : undefined}
          endSlot={
            <EmployeeColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
          }
        />
      )}

      {/* Employees Table */}
      <EmployeesTable
        employees={employees}
        isLoading={isLoading}
        renderActions={renderTableActions}
        onRowClick={(employee) => handleViewEmployee(employee.id)}
        clickableRows={true}
        emptyStateTitle={
          searchQuery
            ? t("employees.noResultsFound", "No employees found")
            : t("employees.noEmployeesTitle", "No employees yet")
        }
        emptyStateDescription={
          searchQuery
            ? t(
              "employees.noResultsDescription",
              "No employees match your search for '{{searchQuery}}'",
              { searchQuery }
            )
            : t(
              "employees.noEmployeesDescription",
              "Start by adding your first employee"
            )
        }
        onEmptyStateAction={() => setNewEmployeeModalOpen(true)}
        emptyStateActionLabel={t("employees.addEmployee", "Add Employee")}
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
            onClick={loadMoreEmployees}
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

      <EmployeeCreateModal
        open={newEmployeeModalOpen}
        onOpenChange={setNewEmployeeModalOpen}
        onEmployeeCreated={fetchEmployees}
      />

      {/* Delete Confirmation Modal */}
      <EmployeeDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        employee={employeeToDelete}
        onConfirm={handleDeleteEmployee}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default EmployeesPage;
