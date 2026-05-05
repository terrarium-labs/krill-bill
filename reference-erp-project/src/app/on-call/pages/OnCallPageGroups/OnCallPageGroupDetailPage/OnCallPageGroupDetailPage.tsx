import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/components/page-header";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "@/app/components/search-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnCallGroup } from "@/app/on-call/contexts/OnCallGroupContext";
import {
  getOrgOnCallGroupEmployees,
  deleteOrgOnCallGroup,
  deleteOrgOnCallGroupEmployee,
} from "@/api/field-service/on-call/groups/groups";
import { Employee } from "@/types/employees/employees";
import OnCallGroupInfoCard from "./components/on-call-group-info-card";
import OnCallGroupEmployeesTable from "./components/on-call-group-employees-table";
import OnCallGroupEmployeesAddModal from "./components/on-call-group-employees-add-modal";
import OnCallGroupEmployeeDeleteModal from "./components/on-call-group-employee-delete-modal";
import OnCallGroupEditModal from "../components/on-call-group-edit-modal";

const OnCallPageGroupDetailPage = () => {
  const { group, setGroup, refreshGroup } = useOnCallGroup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const [employeeDeleteModalOpen, setEmployeeDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

  const fetchEmployees = async (query: string = "") => {
    if (!orgId || !group.id) return;

    query ? setIsSearching(true) : setIsLoadingEmployees(true);
    try {
      const response = await getOrgOnCallGroupEmployees(
        orgId,
        group.id,
        query || undefined,
        undefined
      );
      const employeesList =
        (response.success as { employees?: Employee[] })?.employees ?? [];
      if (response.success) {
        setEmployees(employeesList);
        setNextPageToken(
          (response.success as { next_page_token?: string }).next_page_token ?? null
        );
      } else {
        toast.error(
          t("on-call.groups.employees.errorLoading", "Error fetching employees")
        );
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching on-call group employees:", error);
      toast.error(
        t("on-call.groups.employees.errorLoading", "Error fetching employees")
      );
      setEmployees([]);
    } finally {
      setIsSearching(false);
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (orgId && group.id) {
      fetchEmployees("");
    }
  }, [orgId, group.id]);

  const loadMoreEmployees = async () => {
    if (!orgId || !group.id || !nextPageToken) return;

    try {
      const response = await getOrgOnCallGroupEmployees(
        orgId,
        group.id,
        searchQuery || undefined,
        nextPageToken
      );
      const moreEmployees =
        (response.success as { employees?: Employee[] })?.employees ?? [];
      if (response.success) {
        setEmployees((prev) => [...prev, ...moreEmployees]);
        setNextPageToken(
          (response.success as { next_page_token?: string }).next_page_token ?? null
        );
      }
    } catch (error) {
      console.error("Error fetching on-call group employees:", error);
      toast.error(
        t("on-call.groups.employees.errorLoading", "Error fetching employees")
      );
    }
  };

  const handleDeleteGroupConfirm = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!group?.id || !orgId) return;

    setDeletingGroup(true);
    try {
      const response = await deleteOrgOnCallGroup(orgId, group.id);
      if (response.error) {
        toast.error(
          t("on-call.groups.errorDeletingGroup", "Error deleting group")
        );
      } else {
        toast.success(
          t("on-call.groups.groupDeleted", "Group deleted")
        );
        navigate(`/${orgId}/on-call`, { replace: true });
      }
    } catch {
      toast.error(
        t("on-call.groups.errorDeletingGroup", "Error deleting group")
      );
    } finally {
      setDeletingGroup(false);
      setDeleteModalOpen(false);
    }
  };

  const handleGroupUpdated = (updates: { name: string; description: string; color: string }) => {
    setGroup({ ...group, ...updates });
    refreshGroup();
  };

  const handleDeleteEmployeeConfirm = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setEmployeeDeleteModalOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete || !orgId || !group.id) return;

    setDeletingEmployee(true);
    try {
      const response = await deleteOrgOnCallGroupEmployee(orgId, group.id, {
        employees_ids: [employeeToDelete.id],
      });
      if (response.error) {
        toast.error(
          t("on-call.groups.employees.errorRemoving", "Error removing employee")
        );
      } else {
        toast.success(
          t("on-call.groups.employees.employeeRemoved", "Employee removed from group")
        );
        setEmployees((prev) =>
          prev.filter((e) => e.id !== employeeToDelete.id)
        );
        setEmployeeDeleteModalOpen(false);
        setEmployeeToDelete(null);
      }
    } catch {
      toast.error(
        t("on-call.groups.employees.errorRemoving", "Error removing employee")
      );
    } finally {
      setDeletingEmployee(false);
    }
  };

  const renderEmployeeActions = (employee: Employee) => (
    <CustomActionsDropdown
      items={[
        {
          label: t("common.delete", "Delete"),
          icon: "trash-2",
          onClick: () => handleDeleteEmployeeConfirm(employee),
          variant: "destructive",
        },
      ]}
    />
  );

  const handleSave = async (
    _group: typeof group,
    updates: { name: string; description: string; color: string }
  ): Promise<boolean> => {
    if (!orgId) return false;
    const { patchOrgOnCallGroup } = await import(
      "@/api/field-service/on-call/groups/groups"
    );
    const response = await patchOrgOnCallGroup(orgId, group.id, {
      name: updates.name,
      description: updates.description || null,
      color: updates.color,
    });
    if (response.error) {
      toast.error(t("on-call.groups.errorUpdatingGroup", "Error updating group"));
      return false;
    }
    handleGroupUpdated(updates);
    toast.success(t("on-call.groups.groupUpdated", "Group updated"));
    return true;
  };

  return (
    <>
      <PageHeader
        title={group.name}
        description={group.description ?? undefined}
        showBackButton={true}
        action={
          <div className="flex items-center gap-2">
            <IdBadge id={group.id} className="h-6 px-4 text-xs" />
            <CustomActionsDropdown
              items={[
                {
                  label: t("common.actions.edit", "Edit"),
                  icon: "edit",
                  onClick: () => setEditModalOpen(true),
                },
                {
                  label: t("common.actions.delete", "Delete"),
                  icon: "trash-2",
                  onClick: handleDeleteGroupConfirm,
                  variant: "destructive",
                },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <OnCallGroupInfoCard onEdit={() => setEditModalOpen(true)} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex gap-4 w-full">
            <SearchBar
              isLoading={isSearching}
              onChange={(query) => setSearchQuery(query)}
              onSearch={fetchEmployees}
              placeholder={t(
                "on-call.groups.employees.searchPlaceholder",
                "Search employees..."
              )}
              className="w-full"
            />
            <Button onClick={() => setAddEmployeesModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("on-call.groups.employees.addEmployee", "Add employee")}
            </Button>
          </div>

          <OnCallGroupEmployeesTable
            employees={employees}
            isLoading={isLoadingEmployees}
            searchQuery={searchQuery}
            onAddEmployee={() => setAddEmployeesModalOpen(true)}
            renderActions={renderEmployeeActions}
          />

          {nextPageToken && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMoreEmployees}
                className="min-w-32"
              >
                {t("common.loadMore", "Load More")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <OnCallGroupEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        group={group}
        onSave={handleSave}
        renderActions={() => (
          <CustomActionsDropdown
            items={[
              {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => {
                  setEditModalOpen(false);
                  setDeleteModalOpen(true);
                },
                variant: "destructive",
              },
            ]}
          />
        )}
      />

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {t("on-call.groups.deleteGroup", "Delete group")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "on-call.groups.deleteGroupDescription",
                'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                { name: group.name }
              )}
              <div className="mt-2 p-2 bg-muted rounded">
                <strong>{group.name}</strong>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deletingGroup}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
            >
              {deletingGroup ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.deleting", "Deleting...")}
                </>
              ) : (
                t("common.delete", "Delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {orgId && group.id && (
        <OnCallGroupEmployeesAddModal
          open={addEmployeesModalOpen}
          onOpenChange={setAddEmployeesModalOpen}
          groupId={group.id}
          existingEmployeeIds={employees.map((e) => e.id)}
          onEmployeesAdded={() => fetchEmployees(searchQuery)}
        />
      )}

      <OnCallGroupEmployeeDeleteModal
        open={employeeDeleteModalOpen}
        onOpenChange={(open) => {
          setEmployeeDeleteModalOpen(open);
          if (!open) setEmployeeToDelete(null);
        }}
        employee={employeeToDelete}
        onConfirm={handleDeleteEmployee}
        isDeleting={deletingEmployee}
      />
    </>
  );
};

export default OnCallPageGroupDetailPage;
