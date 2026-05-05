import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getEmployeeContracts } from "@/api/employees/contracts/contracts";
import { toast } from "sonner";
import { useParams } from "react-router";
import { EmployeeContract } from "@/types/employees/contracts";
import ContractViewModal from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageContracts/components/contract-view-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import ContractsTable from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageContracts/components/contracts-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONTRACT_VISIBILITY_KEY = "contract_amounts_visible";

const EmployeeContractsCard = () => {
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

    const handleVisibilityToggle = () => {
        if (amountsVisible) {
            setAmountsVisible(false);
            localStorage.setItem(CONTRACT_VISIBILITY_KEY, "false");
        } else {
            pendingActionRef.current = null;
            setVisibilityConfirmModalOpen(true);
        }
    };

    const confirmShowAmounts = () => {
        if (!pendingActionRef.current) {
            setAmountsVisible(true);
            localStorage.setItem(CONTRACT_VISIBILITY_KEY, "true");
        }
        setVisibilityConfirmModalOpen(false);
        if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

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
        } catch {
            toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

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
        } catch {
            toast.error(t("employees.contracts.errorFetchingContracts") || "Error fetching contracts");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleViewContract = (contract: EmployeeContract) => {
        if (!amountsVisible) {
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
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t("employeesDetail.contracts", "Contracts")}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleVisibilityToggle}
                            title={amountsVisible ? t("contracts.hideAmounts", "Hide amounts") : t("contracts.showAmounts", "Show amounts")}
                        >
                            {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    <ContractsTable
                        contracts={contracts}
                        isLoading={isLoading}
                        amountsVisible={amountsVisible}
                        clickableRows={true}
                        onRowClick={handleViewContract}
                        hiddenColumns={["id", "start_date", "end_date", "is_active"]}
                        searchQuery={searchQuery}
                    />

                    {nextPageToken && (
                        <div className="flex justify-center">
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
                </CardContent>
            </Card>

            <ContractViewModal
                contract={contractToView}
                open={viewContractModalOpen}
                onOpenChange={setViewContractModalOpen}
                isAdmin={true}
            />

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
        </>
    );
};

export default EmployeeContractsCard;
