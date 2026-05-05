import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import SearchBar from "@/app/components/search-bar";
import { getEmployeeContracts } from "@/api/employees/contracts/contracts";
import { toast } from "sonner";
import { useParams } from "react-router";
import { EmployeeContract } from "@/types/employees/contracts";
import ContractViewModal from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageContracts/components/contract-view-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import ContractsTable from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageContracts/components/contracts-table";

const CONTRACT_VISIBILITY_KEY = "contract_amounts_visible";

const DashboardEmployeePageContracts = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [contracts, setContracts] = useState<EmployeeContract[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
        if (!orgId) return;

        try {
            const response = await getEmployeeContracts(orgId, "me", query, null);
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
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getEmployeeContracts(orgId, "me", searchQuery, nextPageToken);
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

    return (
        <div className="space-y-4">
            {/* Search */}
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
            </div>

            {/* Contracts Table */}
            <ContractsTable
                contracts={contracts}
                isLoading={isLoading}
                amountsVisible={amountsVisible}
                clickableRows={true}
                onRowClick={handleViewContract}
                searchQuery={searchQuery}
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

            {/* View Contract Modal */}
            <ContractViewModal
                contract={contractToView}
                open={viewContractModalOpen}
                onOpenChange={setViewContractModalOpen}
                isAdmin={true}
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

export default DashboardEmployeePageContracts;
