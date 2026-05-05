import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Users, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { getOrgEmployees } from "@/api/employees/employees";
import { postOrgOnCallGroupEmployee } from "@/api/field-service/on-call/groups/groups";
import { Employee } from "@/types/employees/employees";

interface OnCallGroupEmployeesAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingEmployeeIds: string[];
  onEmployeesAdded?: () => void;
}

const OnCallGroupEmployeesAddModal = ({
  open,
  onOpenChange,
  groupId,
  existingEmployeeIds,
  onEmployeesAdded,
}: OnCallGroupEmployeesAddModalProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [addingEmployees, setAddingEmployees] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setEmployees([]);
      setSearchQuery("");
      setNextPageToken(null);
      setAddingEmployees(new Set());
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async (query: string = "", pageToken: string | null = null) => {
    if (!orgId) return;

    if (query) {
      setIsSearching(true);
    } else if (!pageToken) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

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
        pageToken || undefined,
        undefined
      );

      if (response.success) {
        const fetched = (response.success.employees || []).filter(
          (emp: Employee) => !existingEmployeeIds.includes(emp.id)
        );
        if (query || !pageToken) {
          setEmployees(fetched);
        } else {
          setEmployees((prev) => [...prev, ...fetched]);
        }
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(
          t("on-call.groups.employees.errorLoading", "Failed to load employees")
        );
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error(
        t("on-call.groups.employees.errorLoading", "Failed to load employees")
      );
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchEmployees(query);
  };

  const loadMoreEmployees = useCallback(() => {
    if (nextPageToken && !isLoadingMore && !isLoading) {
      fetchEmployees(searchQuery, nextPageToken);
    }
  }, [nextPageToken, isLoadingMore, isLoading, searchQuery]);

  useEffect(() => {
    if (!nextPageToken || isLoadingMore) return;
    const scrollEl = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!scrollEl || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) loadMoreEmployees();
      },
      { root: scrollEl, rootMargin: "100px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextPageToken, isLoadingMore, loadMoreEmployees]);

  const handleAddEmployee = async (employee: Employee) => {
    if (!orgId || !groupId) return;

    setAddingEmployees((prev) => new Set(prev).add(employee.id));
    try {
      const response = await postOrgOnCallGroupEmployee(orgId, groupId, {
        employees_ids: [employee.id],
      });
      if (response.error) {
        toast.error(
          t("on-call.groups.employees.errorAdding", "Error adding employee")
        );
      } else {
        toast.success(
          t("on-call.groups.employees.employeeAdded", "Employee added")
        );
        setEmployees((prev) => prev.filter((emp) => emp.id !== employee.id));
        onEmployeesAdded?.();
      }
    } catch (error) {
      console.error("Error adding employee to group:", error);
      toast.error(
        t("on-call.groups.employees.errorAdding", "Error adding employee")
      );
    } finally {
      setAddingEmployees((prev) => {
        const next = new Set(prev);
        next.delete(employee.id);
        return next;
      });
    }
  };

  if (!orgId || !groupId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("on-call.groups.employees.addEmployee", "Add employee")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <SearchBar
            value={searchQuery}
            isLoading={isSearching}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder={t(
              "on-call.groups.employees.searchPlaceholder",
              "Search employees..."
            )}
            className="w-full"
          />

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto space-y-2 pr-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "on-call.groups.employees.loadingEmployees",
                      "Loading employees..."
                    )}
                  </p>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">
                    {searchQuery
                      ? t(
                          "on-call.groups.employees.noEmployeesFound",
                          "No employees found"
                        )
                      : t(
                          "on-call.groups.employees.noEmployeesAvailable",
                          "No employees available"
                        )}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {employees.map((employee) => {
                  const isAdding = addingEmployees.has(employee.id);
                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between"
                    >
                      <EmployeeAvatar
                        employee={employee}
                        showJobTitle={true}
                        showEmail={true}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddEmployee(employee)}
                        disabled={isAdding}
                        variant="outline"
                        className="shrink-0"
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("common.adding", "Adding...")}
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            {t("common.add", "Add")}
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
                {nextPageToken && (
                  <div
                    ref={loadMoreSentinelRef}
                    className="flex justify-center py-3"
                  >
                    {isLoadingMore && (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnCallGroupEmployeesAddModal;
