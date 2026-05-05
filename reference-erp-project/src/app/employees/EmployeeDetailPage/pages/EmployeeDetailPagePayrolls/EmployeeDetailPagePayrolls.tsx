import { Button } from "@/components/ui/button";
import { Loader2, Plus, Eye, EyeOff } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Payroll } from "@/types/employees/payrolls";
import SearchBar from "@/app/components/search-bar";
import { getEmployeePayrolls, deleteEmployeePayroll } from "@/api/employees/payrolls/payrolls";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PayrollEditModal from "@/app/payrolls/components/payroll-edit-modal";
import PayrollDeleteModal from "@/app/payrolls/components/payroll-delete-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import PayrollsTable from "@/app/payrolls/components/payrolls-table";

const PAYROLL_VISIBILITY_KEY = "payroll_amounts_visible";
const EmployeeDetailPagePayrolls = () => {
    const { t } = useTranslation();
    const { orgId, employeeId } = useParams<{ orgId: string; employeeId: string }>();
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
    const [amountsVisible, setAmountsVisible] = useState<boolean>(() => {
        const stored = localStorage.getItem(PAYROLL_VISIBILITY_KEY);
        return stored === "true";
    });
    const [visibilityConfirmModalOpen, setVisibilityConfirmModalOpen] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

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
        if (!orgId || !employeeId) return;

        try {
            const response = await getEmployeePayrolls(orgId, employeeId, undefined, undefined, query, undefined);
            if (response.success && response.success.payrolls) {
                setPayrolls(response.success.payrolls);
                setNextPageToken(response.success.next_page_token || null);
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
        fetchPayrolls();
    }, [orgId, employeeId]);

    // Load more payrolls
    const loadMorePayrolls = async () => {
        if (!orgId || !employeeId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getEmployeePayrolls(orgId, employeeId, undefined, undefined, searchQuery, nextPageToken);
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
            // Show warning modal first, then open detail modal after confirmation
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

    // Handle delete execution
    const handleDeletePayroll = async () => {
        if (!payrollToDelete || !orgId || !employeeId) return;

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
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
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
                <Button onClick={handleCreatePayroll}>
                    <Plus className="h-4 w-4" />
                    {t("payrolls.addPayroll", "Add Payroll")}
                </Button>
            </div>
            {/* Payrolls Table */}
            <PayrollsTable
                payrolls={payrolls}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleEditPayroll}
                clickableRows={true}
                hiddenColumns={["employee"]}
                emptyStateTitle={searchQuery ? undefined : t("payrolls.noPayrollsTitle", "No payrolls yet")}
                emptyStateDescription={searchQuery ? undefined : t("payrolls.noPayrollsDescription", "This employee has no payrolls registered")}
                searchQuery={searchQuery}
                amountsVisible={amountsVisible}
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
            {orgId && employeeId && (
                <PayrollEditModal
                    open={payrollModalOpen}
                    onOpenChange={setPayrollModalOpen}
                    onPayrollSaved={handlePayrollSaved}
                    orgId={orgId}
                    employeeId={employeeId}
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
        </div>
    );
};

export default EmployeeDetailPagePayrolls;
