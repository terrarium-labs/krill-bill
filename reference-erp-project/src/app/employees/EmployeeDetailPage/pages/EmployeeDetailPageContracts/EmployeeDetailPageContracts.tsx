import { Button } from "@/components/ui/button";
import { Plus, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import SearchBar from "@/app/components/search-bar";
import {
    getEmployeeContracts,
    deleteEmployeeContract,
    activateEmployeeContract,
} from "@/api/employees/contracts/contracts";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useEmployee } from "../../../contexts/EmployeeContext";
import { useParams } from "react-router";
import { EmployeeContract } from "@/types/employees/contracts";
import ContractEditModal from "./components/contract-edit-modal";
import ContractViewModal from "./components/contract-view-modal";
import ContractDeleteModal from "./components/contract-delete-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import ContractsTable from "./components/contracts-table";

const CONTRACT_VISIBILITY_KEY = "contract_amounts_visible";

const EmployeeDetailPageContracts = () => {
    const { t } = useTranslation();
    const { employee } = useEmployee();
    const { orgId, employeeId } = useParams<{ orgId: string, employeeId: string }>();
    const [contracts, setContracts] = useState<EmployeeContract[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<EmployeeContract | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newContractModalOpen, setNewContractModalOpen] = useState(false);
    const [editContractModalOpen, setEditContractModalOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState<EmployeeContract | null>(null);
    const [togglingActive, setTogglingActive] = useState<string | null>(null);
    const [viewContractModalOpen, setViewContractModalOpen] = useState(false);
    const [contractToView, setContractToView] = useState<EmployeeContract | null>(null);
    const [amountsVisible, setAmountsVisible] = useState<boolean>(() => {
        const stored = localStorage.getItem(CONTRACT_VISIBILITY_KEY);
        return stored === "true";
    });
    const [visibilityConfirmModalOpen, setVisibilityConfirmModalOpen] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

    // Handle visibility toggle
    const handleVisibilityToggle = () => {
        if (amountsVisible) {
            // Hiding - no confirmation needed
            setAmountsVisible(false);
            localStorage.setItem(CONTRACT_VISIBILITY_KEY, "false");
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
            localStorage.setItem(CONTRACT_VISIBILITY_KEY, "true");
        }
        setVisibilityConfirmModalOpen(false);
        // Execute pending action if any (row click case)
        if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

    // Fetch contracts function
    const fetchContracts = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !employee) return;

        try {
            const response = await getEmployeeContracts(orgId, employee.id, query, null);
            if (response.success && response.success.contracts) {
                setContracts(response.success.contracts);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
            }
        } catch (error) {
            toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchContracts();
    }, []);

    // Load more contracts
    const loadMoreContracts = async () => {
        if (!orgId || !employee || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getEmployeeContracts(orgId, employee.id, searchQuery, nextPageToken);
            if (response.success && response.success.contracts) {
                setContracts(prev => [...prev, ...response.success.contracts]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
            }
        } catch (error) {
            toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle view contract
    const handleViewContract = (contract: EmployeeContract) => {
        if (!amountsVisible) {
            // Show warning modal first, then open view modal after confirmation
            pendingActionRef.current = () => {
                setContractToView(contract);
                setViewContractModalOpen(true);
            };
            setVisibilityConfirmModalOpen(true);
        } else {
            setContractToView(contract);
            setViewContractModalOpen(true);
        }
    };

    // Handle edit confirmation
    const handleEditConfirm = (contract: EmployeeContract) => {
        setContractToEdit(contract);
        setEditContractModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (contract: EmployeeContract) => {
        setContractToDelete(contract);
        setDeleteModalOpen(true);
    };

    // Handle delete from view modal
    const handleDeleteFromView = async () => {
        if (!contractToView || !orgId || !employee) return;

        try {
            const response = await deleteEmployeeContract(orgId, employee.id, contractToView.id!);
            if (response.success) {
                toast.success(t("employees.contracts.contractDeleted", "Contract deleted successfully"));
                setViewContractModalOpen(false);
                setContractToView(null);
                fetchContracts(searchQuery);
            } else {
                toast.error(t("employees.contracts.errorDeletingContract", "Error deleting contract"));
            }
        } catch (error) {
            toast.error(t("employees.contracts.errorDeletingContract", "Error deleting contract"));
        }
    };

    // Handle activate toggle
    const handleActivateToggle = async (contract: EmployeeContract, checked: boolean) => {
        if (!orgId || !employee || !contract.id) return;

        // If trying to activate and already active, do nothing
        if (checked === contract.is_active) return;

        // Only allow activation, not deactivation through the switch
        if (!checked) {
            toast.error(t("employees.contracts.cannotDeactivate", "Cannot deactivate a contract directly"));
            return;
        }

        setTogglingActive(contract.id);
        try {
            const response = await activateEmployeeContract(orgId, employee.id, contract.id);
            if (response.success) {
                toast.success(t("employees.contracts.contractActivated", "Contract activated successfully"));
                // Refresh contracts to get updated data
                fetchContracts(searchQuery);
            } else {
                toast.error(t("employees.contracts.errorActivatingContract", "Error activating contract"));
            }
        } catch (error) {
            toast.error(t("employees.contracts.errorActivatingContract", "Error activating contract"));
        } finally {
            setTogglingActive(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Add Button */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchContracts}
                        placeholder={t("employees.contracts.searchPlaceholder", "Search contracts...")}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVisibilityToggle}
                    title={amountsVisible ? t("contracts.hideAmounts", "Hide amounts") : t("contracts.showAmounts", "Show amounts")}
                >
                    {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button onClick={() => setNewContractModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("employees.contracts.addContract", "Add Contract")}
                </Button>
            </div>

            {/* Contracts Table */}
            <ContractsTable
                contracts={contracts}
                isLoading={isLoading}
                amountsVisible={amountsVisible}
                clickableRows={true}
                onRowClick={handleViewContract}
                renderActions={(contract) => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.edit", "Edit"),
                                icon: "edit",
                                onClick: () => handleEditConfirm(contract),
                            },
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => handleDeleteConfirm(contract),
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
                activeSwitchEditable={true}
                togglingActiveId={togglingActive}
                onActivateToggle={handleActivateToggle}
                searchQuery={searchQuery}
                onEmptyStateAction={() => setNewContractModalOpen(true)}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreContracts}
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

            <ContractEditModal
                open={newContractModalOpen}
                onOpenChange={setNewContractModalOpen}
                onContractCreated={fetchContracts}
                employeeId={employeeId}
            />

            {/* Edit Contract Modal */}
            <ContractEditModal
                open={editContractModalOpen}
                onOpenChange={setEditContractModalOpen}
                onContractCreated={fetchContracts}
                contract={contractToEdit}
                mode="update"
                employeeId={employeeId}
            />

            {/* View Contract Modal */}
            <ContractViewModal
                contract={contractToView}
                open={viewContractModalOpen}
                onOpenChange={setViewContractModalOpen}
                isAdmin={false}
                amountsVisible={amountsVisible}
                renderActions={
                    contractToView && (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => {
                                        handleEditConfirm(contractToView);
                                        setViewContractModalOpen(false);
                                    },
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteFromView,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )
                }
            />

            {/* Delete Confirmation Modal */}
            <ContractDeleteModal
                contract={contractToDelete}
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                orgId={orgId}
                employeeId={employee?.id}
                onDeleted={() => {
                    if (contractToDelete) {
                        setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
                        setContractToDelete(null);
                    }
                }}
            />

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
                title={t("contracts.sensitiveDataWarning", "Sensitive Data Warning")}
                description={t("contracts.sensitiveDataDescription", "You are about to view sensitive contract information including salary details. Please ensure you are in a private environment and that no unauthorized persons can see your screen.")}
                confirmText={t("contracts.showAmounts", "Show Amounts")}
            />
        </div>
    );
};

export default EmployeeDetailPageContracts;
