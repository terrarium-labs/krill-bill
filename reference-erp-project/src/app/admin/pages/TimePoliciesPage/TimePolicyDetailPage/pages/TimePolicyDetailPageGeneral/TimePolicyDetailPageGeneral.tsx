import { useTimePolicy } from "../../../context/TimePolicyContext";
import { TimePolicyInfoCard } from "./components/time-policy-info-card";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getTimePolicyEmployees, deleteTimePolicyEmployees } from '@/api/orgs/time-policies/time-policies';
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TimePolicyEmployeesTable from "./components/time-policy-employees-table";
import TimePolicyEmployeeDeleteModal from "./components/time-policy-employee-delete-modal";
import TimePolicyEmployeesAddModal from "./components/time-policy-employees-add-modal";

const TimePolicyDetailPageGeneral = () => {
    const { t } = useTranslation();
    const { timePolicy } = useTimePolicy();
    const { orgId, policyId } = useParams();
    
    // Employees state
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState(false);
    const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false);

    const fetchEmployees = async (query: string, page_token: string | null) => {
        if (!orgId || !policyId) return;

        // Set loading state for search (not for pagination)
        if (!page_token) {
            if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
        }

        try {
            const response = await getTimePolicyEmployees(orgId, policyId, page_token, query || null);

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
                        "timePolicies.employees.error",
                        "Error fetching time policy employees"
                    )
                );
                // Reset to empty array on error for new searches
                if (!page_token) {
                    setEmployees([]);
                }
            }
        } catch (error) {
            console.error("Error fetching time policy employees:", error);
            toast.error(
                t(
                    "timePolicies.employees.error",
                    "Error fetching time policy employees"
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
            toast.error(t("timePolicies.employees.error", "Error loading more employees"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && policyId) {
            fetchEmployees(searchQuery, null);
        }
    }, [orgId, policyId]);

    // Handle delete confirmation
    const handleDeleteConfirm = (employee: any) => {
        setEmployeeToDelete(employee);
        setDeleteModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (employee: any) => {
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
    };

    // Handle delete execution
    const handleDeleteEmployee = async () => {
        if (!employeeToDelete || !orgId || !policyId) return;

        setDeletingEmployee(true);
        try {
            const response = await deleteTimePolicyEmployees(orgId, policyId, {
                employees_ids: [employeeToDelete.id],
            });
            if (response?.success) {
                toast.success(t("timePolicies.employees.employeeDeleted", "Employee removed from time policy successfully"));
                // Remove from local state
                setEmployees(prev => prev.filter(u => u.id !== employeeToDelete.id));
            } else {
                toast.error(t("timePolicies.employees.errorDeletingEmployee", "Error removing employee from time policy"));
            }
        } catch (error) {
            toast.error(t("timePolicies.employees.errorDeletingEmployee", "Error removing employee from time policy"));
        } finally {
            setDeletingEmployee(false);
            setDeleteModalOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const handleAddEmployeeClick = () => {
        setAddEmployeesModalOpen(true);
    };

    const handleEmployeesAdded = () => {
        fetchEmployees("", null);
    };

    if (!timePolicy) return null;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                    <TimePolicyInfoCard />
                </div>
                <div className="lg:col-span-2">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center gap-4">
                            <SearchBar
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={(query) => fetchEmployees(query, null)}
                                placeholder={t(
                                    "timePolicies.employees.searchPlaceholder",
                                    "Search employees..."
                                )}
                                className="flex-1"
                            />
                            <Button onClick={handleAddEmployeeClick}>
                                <Plus className="h-4 w-4" />
                                {t("timePolicies.employees.addEmployee", "Add employee")}
                            </Button>
                        </div>

                        {/* Employees Table */}
                        <TimePolicyEmployeesTable
                            data={employees}
                            isLoading={isLoading}
                            renderActions={renderTableActions}
                            onEmptyStateAction={handleAddEmployeeClick}
                            searchQuery={searchQuery}
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
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <TimePolicyEmployeeDeleteModal
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

            {/* Add Employees Modal */}
            {orgId && policyId && (
                <TimePolicyEmployeesAddModal
                    open={addEmployeesModalOpen}
                    onOpenChange={setAddEmployeesModalOpen}
                    onEmployeesAdded={handleEmployeesAdded}
                    orgId={orgId}
                    policyId={policyId}
                />
            )}
        </>
    );
};

export default TimePolicyDetailPageGeneral;

