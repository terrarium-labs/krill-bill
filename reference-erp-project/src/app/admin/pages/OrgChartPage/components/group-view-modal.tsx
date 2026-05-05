import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Users, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { Separator } from '@/components/ui/separator';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import Tag from '@/app/components/tag/tag';
import IdBadge from '@/app/components/id-badge';
import SearchBar from '@/app/components/search-bar';
import { getOrgGroupEmployees, deleteOrgGroupEmployee } from '@/api/orgs/groups/employees/employees';
import { deleteOrgGroup } from '@/api/orgs/groups/groups';
import { Employee } from '@/types/employees/employees';
import { Group } from '@/types/general/groups';
import { Icon, IconName } from '@/components/ui/icon-picker';
import PageHeader from '@/app/components/page-header';
import GroupEmployeesTable from './group-employees-table';
import GroupEmployeeDeleteModal from './group-employee-delete-modal';

interface GroupViewModalProps {
    group: Group | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditGroup: (group: Group) => void;
    onGroupDeleted: () => void;
    onAddEmployeeClick: () => void;
}

export interface GroupViewModalRef {
    refreshEmployees: () => void;
}

const GroupViewModal = forwardRef<GroupViewModalRef, GroupViewModalProps>(({
    group,
    open,
    onOpenChange,
    onEditGroup,
    onGroupDeleted,
    onAddEmployeeClick,
}, ref) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteEmployeeModalOpen, setDeleteEmployeeModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState(false);

    const handleDeleteConfirm = useCallback((employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeleteEmployeeModalOpen(true);
    }, []);

    // Define renderActions for employees table
    const renderActions = useCallback((employee: Employee) => {
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

    const fetchEmployees = useCallback(async (query: string = "") => {
        if (!orgId || !group?.id) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getOrgGroupEmployees(
                orgId,
                group.id,
                query || null,
                null
            );

            if (response.success) {
                const fetchedEmployees = response.success.employees || [];
                setEmployees(fetchedEmployees);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("groups.employees.errorFetching", "Error fetching group employees")
                );
            }
        } catch (error) {
            console.error("Error fetching group employees:", error);
            toast.error(
                t("groups.employees.errorFetching", "Error fetching group employees")
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    }, [orgId, group?.id, t]);

    const loadMoreEmployees = useCallback(async () => {
        if (!orgId || !group?.id || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgGroupEmployees(
                orgId,
                group.id,
                searchQuery || null,
                nextPageToken
            );
            if (response.success && response.success.employees) {
                setEmployees(prev => [...prev, ...response.success.employees]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("groups.employees.errorFetching", "Error fetching employees"));
            }
        } catch (error) {
            toast.error(t("groups.employees.errorFetching", "Error fetching employees"));
        } finally {
            setIsLoadingMore(false);
        }
    }, [orgId, group?.id, nextPageToken, isLoadingMore, isLoading, searchQuery, t]);

    useEffect(() => {
        if (open && group?.id) {
            fetchEmployees();
        } else {
            // Reset state when modal closes
            setEmployees([]);
            setSearchQuery("");
            setNextPageToken(null);
        }
    }, [open, group?.id, fetchEmployees]);

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
        refreshEmployees: () => fetchEmployees(searchQuery)
    }), [fetchEmployees, searchQuery]);

    const handleDeleteEmployee = useCallback(async () => {
        if (!employeeToDelete || !orgId || !group?.id) return;

        setDeletingEmployee(true);
        try {
            const response = await deleteOrgGroupEmployee(orgId, group.id, {
                employees_ids: [employeeToDelete.id],
            });
            if (response?.success) {
                toast.success(t("groups.employees.employeeDeleted", "Employee removed from group successfully"));
                // Remove from local state
                setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
            } else {
                toast.error(t("groups.employees.errorDeleting", "Error removing employee from group"));
            }
        } catch (error) {
            toast.error(t("groups.employees.errorDeleting", "Error removing employee from group"));
        } finally {
            setDeletingEmployee(false);
            setDeleteEmployeeModalOpen(false);
            setEmployeeToDelete(null);
        }
    }, [employeeToDelete, orgId, group?.id, t]);

    const handleDeleteGroup = useCallback(async () => {
        if (!orgId || !group?.id) return;

        try {
            const response = await deleteOrgGroup(orgId, group.id);

            if (response.success) {
                toast.success(t('groups.deletedSuccess', 'Group deleted successfully'));
                onOpenChange(false);
                onGroupDeleted();
            } else {
                toast.error(response.error || t('groups.errorDeleting', 'Failed to delete group'));
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error(t('groups.errorDeleting', 'Failed to delete group'));
        }
    }, [orgId, group?.id, t, onOpenChange, onGroupDeleted]);

    // Early return after all hooks
    if (!group) return null;

    console.log(group);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-5xl flex flex-col" showCloseButton={false}>
                    <DialogHeader>
                        <div className="flex items-start gap-2">
                            <DialogTitle className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    {group.icon_url && (
                                        <Icon name={group.icon_url as IconName} className="min-h-5 min-w-5 max-h-5 max-w-5" />
                                    )}
                                    {group.name}
                                </div>
                            </DialogTitle>
                            <div className="flex items-center gap-2 ml-auto">
                                <Tag
                                    text={group.type}
                                    className="capitalize"
                                />
                                <IdBadge id={group.id} />
                            </div>
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t('common.edit', 'Edit'),
                                        icon: "edit",
                                        onClick: () => {
                                            onEditGroup(group);
                                            onOpenChange(false);
                                        },
                                    },
                                    {
                                        label: t('common.delete', 'Delete'),
                                        icon: "trash-2",
                                        onClick: handleDeleteGroup,
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide">
                        {/* Group Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('groups.type', 'Type')}</h4>
                                <Tag
                                    text={group.type}
                                    className="capitalize"
                                />
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('groups.responsible', 'Responsible')}</h4>
                                <EmployeeAvatar employee={group.responsible} showJobTitle />

                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('groups.parent', 'Parent Group')}</h4>
                                {group.parent ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{group.parent.name}</span>
                                        <IdBadge id={group.parent.id} />
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('groups.numEmployees', 'Number of Employees')}</h4>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span
                                        className="text-sm"
                                        title={`Direct: ${group.num_employees_group || 0} | Total (incl. sub-groups): ${group.num_employees_total || 0}`}
                                    >
                                        {(group.num_employees_group || 0) === (group.num_employees_total || 0)
                                            ? group.num_employees_group || 0
                                            : `${group.num_employees_group || 0} (${group.num_employees_total || 0})`
                                        }
                                    </span>
                                </div>
                                {(group.num_employees_group || 0) !== (group.num_employees_total || 0) && (
                                    <p className="text-xs text-muted-foreground">
                                        Direct: {group.num_employees_group || 0} | Total (incl. sub-groups): {group.num_employees_total || 0}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {group.description && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('groups.description', 'Description')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {group.description}
                                </p>
                            </div>
                        )}

                        <Separator className="my-4" />

                        {/* Employees Section */}
                        <div className="space-y-4">
                            <PageHeader
                                title={t('groups.employees.title', 'Employees')}
                                showBackButton={false}
                                action={
                                    <Button onClick={onAddEmployeeClick} size="sm">
                                        <Plus className="h-4 w-4" />
                                        {t("groups.employees.addEmployee", "Add Employees")}
                                    </Button>
                                }
                            />

                            {/* Search Bar */}
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={fetchEmployees}
                                placeholder={t(
                                    "groups.employees.searchPlaceholder",
                                    "Search employees in this group..."
                                )}
                                className="w-full"
                            />

                            {/* Employees Table */}
                            <GroupEmployeesTable
                                employees={employees}
                                isLoading={isLoading}
                                renderActions={renderActions}
                                emptyStateTitle={searchQuery
                                    ? t("groups.employees.noResultsFound", "No results found")
                                    : t("groups.employees.noEmployees", "No employees found")}
                                emptyStateDescription={searchQuery
                                    ? t(
                                        "groups.employees.noResultsDescription",
                                        'No results found for "{{searchQuery}}"',
                                        { searchQuery }
                                    )
                                    : t(
                                        "groups.employees.noEmployeesDescription",
                                        "No employees in this group yet."
                                    )}
                                onEmptyStateAction={onAddEmployeeClick}
                                emptyStateActionLabel={t("groups.employees.addEmployee", "Add Employee")}
                            />

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={loadMoreEmployees}
                                        disabled={isLoadingMore}
                                        size="sm"
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
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Employee Confirmation Dialog */}
            <GroupEmployeeDeleteModal
                open={deleteEmployeeModalOpen}
                onOpenChange={(open) => {
                    setDeleteEmployeeModalOpen(open);
                    if (!open) {
                        setEmployeeToDelete(null);
                    }
                }}
                employee={employeeToDelete}
                onConfirm={handleDeleteEmployee}
                isDeleting={deletingEmployee}
            />
        </>
    );
});

GroupViewModal.displayName = 'GroupViewModal';

export default GroupViewModal;

