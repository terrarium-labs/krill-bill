import { Button } from "@/components/ui/button";
import { Loader2, Plus, Eye, EyeOff, Upload } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { Payroll } from "@/types/employees/payrolls";
import SearchBar from "@/app/components/search-bar";
import { getOrgPayrolls } from "@/api/orgs/payrolls/payrolls";
import { deleteEmployeePayroll } from "@/api/employees/payrolls/payrolls";
import { toast } from "sonner";
import PayrollEditModal from "@/app/payrolls/components/payroll-edit-modal";
import PayrollDeleteModal from "@/app/payrolls/components/payroll-delete-modal";
import ImportPayrollsModal from "@/app/payrolls/components/import-payrolls-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import PayrollsTable from "@/app/payrolls/components/payrolls-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import { usePayrollsTablePreferences } from "@/hooks/use-payrolls-table-preferences";
import { PayrollColumnSelector } from "@/app/payrolls/components/payroll-column-selector";

const PAYROLL_VISIBILITY_KEY = "payroll_amounts_visible";

const PayrollsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);
    const [deletingPayroll, setDeletingPayroll] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [payrollModalOpen, setPayrollModalOpen] = useState(false);
    const [payrollModalMode, setPayrollModalMode] = useState<"create" | "edit">("create");
    const [payrollToEdit, setPayrollToEdit] = useState<Payroll | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [amountsVisible, setAmountsVisible] = useState<boolean>(() => {
        const stored = localStorage.getItem(PAYROLL_VISIBILITY_KEY);
        return stored === "true";
    });
    const [visibilityConfirmModalOpen, setVisibilityConfirmModalOpen] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = usePayrollsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Handle visibility toggle
    const handleVisibilityToggle = () => {
        if (amountsVisible) {
            // Hiding - no confirmation needed
            setAmountsVisible(false);
            localStorage.setItem(PAYROLL_VISIBILITY_KEY, "false");
        } else {
            // Showing - need confirmation
            pendingActionRef.current = null;
            setVisibilityConfirmModalOpen(true);
        }
    };

    const confirmShowAmounts = () => {
        // Only change global visibility if there's no pending action (came from visibility toggle)
        if (!pendingActionRef.current) {
            setAmountsVisible(true);
            localStorage.setItem(PAYROLL_VISIBILITY_KEY, "true");
        }
        setVisibilityConfirmModalOpen(false);
        // Execute pending action if any (row click case)
        if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

    // Fetch payrolls function
    const fetchPayrolls = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgPayrolls(
                orgId,
                undefined,
                undefined,
                undefined,
                query,
                undefined,
                tableFilters || undefined
            );
            if (response.success && response.success.payrolls) {
                setPayrolls(response.success.payrolls);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
            }
        } catch (error) {
            toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchPayrolls();
        }
    }, [orgId]);

    // Load more payrolls
    const loadMorePayrolls = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgPayrolls(
                orgId,
                undefined,
                undefined,
                undefined,
                searchQuery,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.payrolls) {
                setPayrolls(prev => [...prev, ...response.success.payrolls]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
            }
        } catch (error) {
            toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (payroll: Payroll) => {
        setPayrollToDelete(payroll);
        setDeleteModalOpen(true);
    };

    // Handle create payroll
    const handleCreatePayroll = () => {
        setPayrollToEdit(null);
        setPayrollModalMode("create");
        setPayrollModalOpen(true);
    };

    // Handle edit payroll
    const handleEditPayroll = (payroll: Payroll) => {
        if (!amountsVisible) {
            // Show warning modal first, then open detail modal after confirmation (without changing global visibility)
            pendingActionRef.current = () => {
                setPayrollToEdit(payroll);
                setPayrollModalMode("edit");
                setPayrollModalOpen(true);
            };
            setVisibilityConfirmModalOpen(true);
        } else {
            setPayrollToEdit(payroll);
            setPayrollModalMode("edit");
            setPayrollModalOpen(true);
        }
    };


    // Handle payroll saved
    const handlePayrollSaved = () => {
        fetchPayrolls(searchQuery);
    };

    // Handle payrolls imported
    const handlePayrollsImported = () => {
        fetchPayrolls(searchQuery);
    };

    // Handle delete execution
    const handleDeletePayroll = async () => {
        if (!payrollToDelete || !orgId) return;

        const employeeId = payrollToDelete.employee?.id;
        if (!employeeId) {
            toast.error(t("payrolls.errorDeletingPayroll", "Error deleting payroll"));
            return;
        }

        setDeletingPayroll(true);
        try {
            const response = await deleteEmployeePayroll(orgId, employeeId, payrollToDelete.id);
            if (response.success) {
                toast.success(t("payrolls.payrollDeleted", "Payroll deleted successfully"));
                // Remove from local state
                setPayrolls(prev => prev.filter(p => p.id !== payrollToDelete.id));
            } else {
                toast.error(t("payrolls.errorDeletingPayroll", "Error deleting payroll"));
            }
        } catch (error) {
            toast.error(t("payrolls.errorDeletingPayroll", "Error deleting payroll"));
        } finally {
            setDeletingPayroll(false);
            setDeleteModalOpen(false);
            setPayrollToDelete(null);
        }
    };

    // Render actions for table
    const renderTableActions = (payroll: Payroll) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditPayroll(payroll),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(payroll),
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
                title={t("payrolls.title", "Payrolls")}
                description={t("payrolls.description", "Manage your organization's payrolls.")}
                docs={{ slug: "pd_mod_payrolls" }}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleCreatePayroll}>
                            <Plus className="h-4 w-4" />
                            {t("payrolls.addPayroll", "Add Payroll")}
                        </Button>
                        <Button onClick={() => setImportModalOpen(true)}>
                            <Upload className="h-4 w-4" />
                            {t("payrolls.importPayrolls", "Import Payrolls")}
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    className="w-full"
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchPayrolls}
                    placeholder={t("payrolls.searchPlaceholder", "Search payrolls...")}
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVisibilityToggle}
                    title={amountsVisible ? t("payrolls.hideAmounts", "Hide amounts") : t("payrolls.showAmounts", "Show amounts")}
                >
                    {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
            </div>

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchPayrolls(searchQuery)}
                    endSlot={
                        <PayrollColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Payrolls Table */}
            <PayrollsTable
                payrolls={payrolls}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleEditPayroll}
                clickableRows={true}
                onEmptyStateAction={handleCreatePayroll}
                onEmptyStateSecondaryAction={() => setImportModalOpen(true)}
                searchQuery={searchQuery}
                amountsVisible={amountsVisible}
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
                        onClick={loadMorePayrolls}
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

            {/* Delete Confirmation Dialog */}
            <PayrollDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                payroll={payrollToDelete}
                onConfirm={handleDeletePayroll}
                isDeleting={deletingPayroll}
                amountsVisible={amountsVisible}
            />

            {/* Payroll Create/Edit Modal */}
            {orgId && (
                <PayrollEditModal
                    open={payrollModalOpen}
                    onOpenChange={setPayrollModalOpen}
                    onPayrollSaved={handlePayrollSaved}
                    orgId={orgId}
                    employeeId={payrollToEdit?.employee?.id}
                    payrollId={payrollToEdit?.id}
                    mode={payrollModalMode}
                    renderActions={() => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        setPayrollModalOpen(false);
                                        handleDeleteConfirm(payrollToEdit!);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}

            {/* Import Payrolls Modal */}
            {orgId && (
                <ImportPayrollsModal
                    open={importModalOpen}
                    onOpenChange={setImportModalOpen}
                    onPayrollsImported={handlePayrollsImported}
                    orgId={orgId}
                />
            )}

            {/* Visibility Confirmation Modal */}
            <SensitiveDataWarningModal
                open={visibilityConfirmModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        pendingActionRef.current = null;
                    }
                    setVisibilityConfirmModalOpen(open);
                }}
                onConfirm={confirmShowAmounts}
                title={t("payrolls.sensitiveDataWarning", "Sensitive Data Warning")}
                description={t("payrolls.sensitiveDataDescription", "You are about to view sensitive payroll information. Please ensure you are in a private environment and that no unauthorized persons can see your screen.")}
                confirmText={t("payrolls.showAmounts", "Show Amounts")}
            />
        </>
    );
};

export default PayrollsPage;
