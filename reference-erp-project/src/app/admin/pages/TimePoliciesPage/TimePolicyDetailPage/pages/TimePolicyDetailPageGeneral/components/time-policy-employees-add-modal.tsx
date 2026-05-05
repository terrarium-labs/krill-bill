import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, Loader2, Plus } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { getOrgEmployees } from '@/api/employees/employees';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import SearchBar from '@/app/components/search-bar';
import { postTimePolicyEmployees } from '@/api/orgs/time-policies/time-policies';
import { Employee } from '@/types/employees/employees';

interface TimePolicyEmployeesAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    policyId: string;
    onEmployeesAdded?: () => void;
}

const TimePolicyEmployeesAddModal: React.FC<TimePolicyEmployeesAddModalProps> = ({
    open,
    onOpenChange,
    orgId,
    policyId,
    onEmployeesAdded,
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [addingEmployees, setAddingEmployees] = useState<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    // Reset state when modal opens
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
            const response = await getOrgEmployees(orgId, undefined, undefined, undefined, policyId || undefined, undefined, undefined, query || undefined, pageToken || undefined, undefined);

            if (response.success) {
                const fetchedEmployees = response.success.employees || [];

                if (query || !pageToken) {
                    // Reset employees for new search or initial load
                    setEmployees(fetchedEmployees);
                } else {
                    // Append employees for pagination
                    setEmployees(prev => [...prev, ...fetchedEmployees]);
                }

                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("timePolicies.employees.errorFetchingEmployees", "Failed to load employees")
                );
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error(
                t("timePolicies.employees.errorFetchingEmployees", "Failed to load employees")
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

    // Scroll-based load more
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
        if (!orgId || !policyId) {
            toast.error(t("timePolicies.employees.errorMissingIds", "Organization ID and Policy ID are required"));
            return;
        }

        // Add to adding set to show loading state
        setAddingEmployees(prev => new Set(prev).add(employee.id));

        try {
            const response = await postTimePolicyEmployees(orgId, policyId, {
                employees_ids: [employee.id]
            });

            if (response.success) {
                toast.success(
                    t("timePolicies.employees.employeeAddedSuccess", "Employee added successfully to time policy")
                );

                // Remove employee from list since they've been added
                setEmployees(prev => prev.filter(emp => emp.id !== employee.id));

                if (onEmployeesAdded) {
                    onEmployeesAdded();
                }
            } else {
                toast.error(
                    response.error || t("timePolicies.employees.errorAddingEmployee", "Failed to add employee to time policy")
                );
            }
        } catch (error) {
            console.error("Error adding employee to time policy:", error);
            toast.error(
                t("timePolicies.employees.errorAddingEmployee", "Failed to add employee to time policy")
            );
        } finally {
            // Remove from adding set
            setAddingEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(employee.id);
                return newSet;
            });
        }
    };

    if (!orgId || !policyId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t("timePolicies.employees.addEmployees", "Add Employees")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Search Bar */}
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={t("timePolicies.employees.searchEmployees", "Search employees...")}
                        className="w-full"
                    />

                    {/* Employee List */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        {t("timePolicies.employees.loadingEmployees", "Loading employees...")}
                                    </p>
                                </div>
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("timePolicies.employees.noEmployeesFound", "No employees found")
                                            : t("timePolicies.employees.noEmployees", "No employees available")
                                        }
                                    </h3>
                                    <p className="text-sm text-muted-foreground text-center">
                                        {searchQuery
                                            ? t(
                                                "timePolicies.employees.noEmployeesFoundDescription",
                                                "No employees found for '{{query}}'",
                                                { query: searchQuery }
                                            )
                                            : t(
                                                "timePolicies.employees.noEmployeesDescription",
                                                "No employees available to add to this time policy"
                                            )
                                        }
                                    </p>
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
                                            <EmployeeAvatar employee={employee} showJobTitle={true} showEmail={true} />

                                            {/* Add Button */}
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
                                                        {t("timePolicies.employees.adding", "Adding...")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4" />
                                                        {t("timePolicies.employees.add", "Add")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}

                                {/* Scroll sentinel for load more */}
                                {nextPageToken && (
                                    <div ref={loadMoreSentinelRef} className="flex justify-center py-3">
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

export default TimePolicyEmployeesAddModal;

