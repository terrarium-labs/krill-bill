import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getOrgJobTitleEmployees, deleteOrgJobTitleEmployee } from '@/api/orgs/job-titles/job-titles';
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import JobTitleEmployeesTable from "./job-title-employees-table";
import JobTitleEmployeeDeleteModal from "./job-title-employee-delete-modal";

interface JobTitleEmployee {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    [key: string]: any; // Allow additional properties
}

interface JobTitleEmployeesSectionProps {
    onAddEmployeeClick?: () => void;
}

export interface JobTitleEmployeesSectionRef {
    refreshEmployees: () => void;
}

const JobTitleEmployeesSection = forwardRef<JobTitleEmployeesSectionRef, JobTitleEmployeesSectionProps>(({ onAddEmployeeClick }, ref) => {
    const { t } = useTranslation();
    const { orgId, jobTitleId } = useParams();
    const [employees, setEmployees] = useState<JobTitleEmployee[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<JobTitleEmployee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState(false);

    const fetchEmployees = async (query: string, page_token: string | null) => {
        if (!orgId || !jobTitleId) return;

        // Set loading state for search (not for pagination)
        if (!page_token) {
            if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
        }

        try {
            const response = await getOrgJobTitleEmployees(orgId, jobTitleId, page_token, query || null);

            if (response.success) {
                const fetchedEmployees = response.success.employees || [];

                if (page_token) {
                    // Loading more results - append to existing
                    setEmployees((prev) => [...prev, ...fetchedEmployees]);
                } else {
                    // New search or initial load - replace existing
                    setEmployees(fetchedEmployees);
                }

                // Handle next page token
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "jobTitles.employees.error",
                        "Error fetching job title employees"
                    )
                );
                // Reset to empty array on error for new searches
                if (!page_token) {
                    setEmployees([]);
                }
            }
        } catch (error) {
            console.error("Error fetching job title employees:", error);
            toast.error(
                t(
                    "jobTitles.employees.error",
                    "Error fetching job title employees"
                )
            );
            // Reset to empty array on error for new searches
            if (!page_token) {
                setEmployees([]);
            }
        } finally {
            // Clear loading state for search
            if (!page_token) {
                setIsSearching(false);
                setIsLoading(false);
            }
        }
    };

    // Load more function
    const loadMore = async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchEmployees(searchQuery, nextPageToken);
        } catch (error) {
            toast.error(t("jobTitles.employees.error", "Error loading more employees"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && jobTitleId) {
            fetchEmployees(searchQuery, null);
        }
    }, [orgId, jobTitleId]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshEmployees: () => fetchEmployees("", null)
    }));

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((employee: JobTitleEmployee) => {
        setEmployeeToDelete(employee);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((employee: JobTitleEmployee) => {
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
    const handleDeleteEmployee = async () => {
        if (!employeeToDelete || !orgId || !jobTitleId) return;

        setDeletingEmployee(true);
        try {
            const response = await deleteOrgJobTitleEmployee(orgId, jobTitleId, {
                employees_ids: [employeeToDelete.id],
            });
            if (response?.success) {
                toast.success(t("jobTitles.employees.employeeDeleted", "Employee removed from job title successfully"));
                // Remove from local state
                setEmployees(prev => prev.filter(u => u.id !== employeeToDelete.id));
            } else {
                toast.error(t("jobTitles.employees.errorDeletingEmployee", "Error removing employee from job title"));
            }
        } catch (error) {
            toast.error(t("jobTitles.employees.errorDeletingEmployee", "Error removing employee from job title"));
        } finally {
            setDeletingEmployee(false);
            setDeleteModalOpen(false);
            setEmployeeToDelete(null);
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 w-full">
                <SearchBar
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchEmployees(query, null)}
                    placeholder={t(
                        "jobTitles.employees.searchPlaceholder",
                        "Search employees in this job title..."
                    )}
                    className="w-full"
                />
            </div>

            {/* Employees Table */}
            <JobTitleEmployeesTable
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
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
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

            {/* Delete Confirmation Dialog */}
            <JobTitleEmployeeDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setEmployeeToDelete(null);
                    }
                }}
                employee={employeeToDelete}
                onConfirm={handleDeleteEmployee}
                isDeleting={deletingEmployee}
            />
        </div>
    );
});

export default JobTitleEmployeesSection;

