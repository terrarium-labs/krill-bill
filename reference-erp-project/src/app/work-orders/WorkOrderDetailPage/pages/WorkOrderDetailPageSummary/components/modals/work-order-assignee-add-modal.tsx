import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, Loader2, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SearchBar from '@/app/components/search-bar';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import { getOrgEmployees } from '@/api/employees/employees';
import { postWorkOrderAssignee } from '@/api/field-service/work-orders/assignees/assignees';
import { Employee } from '@/types/employees/employees';

interface WorkOrderAssigneeAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    onSuccess?: () => void;
}

const WorkOrderAssigneeAddModal: React.FC<WorkOrderAssigneeAddModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    onSuccess,
}) => {
    const { t } = useTranslation();
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
            const response = await getOrgEmployees(orgId, undefined, undefined, undefined, undefined, workOrderId || undefined, undefined, query || undefined, pageToken || undefined, undefined);

            if (response.success) {
                const fetched = response.success.employees || [];
                if (query || !pageToken) {
                    setEmployees(fetched);
                } else {
                    setEmployees(prev => [...prev, ...fetched]);
                }
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('workOrders.errorFetchingEmployees', 'Failed to load employees'));
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error(t('workOrders.errorFetchingEmployees', 'Failed to load employees'));
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
            { root: scrollEl, rootMargin: '100px', threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [nextPageToken, isLoadingMore, loadMoreEmployees]);

    const handleAddAssignee = async (employee: Employee) => {
        if (!orgId || !workOrderId) return;

        setAddingEmployees(prev => new Set(prev).add(employee.id));
        try {
            const response = await postWorkOrderAssignee(orgId, workOrderId, { employee_id: employee.id });
            if (response.success) {
                toast.success(t('workOrders.assigneeAddedSuccessfully', 'Assignee added successfully'));
                setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
                onSuccess?.();
            } else {
                toast.error(response.error || t('workOrders.errorAddingAssignee', 'Error adding assignee'));
            }
        } catch (error) {
            console.error('Error adding assignee:', error);
            toast.error(t('workOrders.errorAddingAssignee', 'Error adding assignee'));
        } finally {
            setAddingEmployees(prev => {
                const next = new Set(prev);
                next.delete(employee.id);
                return next;
            });
        }
    };

    if (!orgId || !workOrderId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {t('workOrders.addAssignee', 'Add Assignee')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={t('workOrders.searchEmployees', 'Search employees...')}
                        className="w-full"
                    />

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        {t('workOrders.loadingEmployees', 'Loading employees...')}
                                    </p>
                                </div>
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t('workOrders.noEmployeesFound', 'No employees found')
                                            : t('workOrders.noEmployees', 'No employees available')}
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
                                                onClick={() => handleAddAssignee(employee)}
                                                disabled={isAdding}
                                                variant="outline"
                                                className="shrink-0"
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {t('workOrders.adding', 'Adding...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4" />
                                                        {t('workOrders.add', 'Add')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
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

export default WorkOrderAssigneeAddModal;
