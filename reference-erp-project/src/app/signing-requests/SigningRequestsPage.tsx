import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "../components/search-bar";
import { getSigningRequests, deleteSigningRequest } from "@/api/orgs/signing-requests/signing-requests";
import { SigningRequest } from "@/types/general/signing-requests";
import SigningRequestsTable from "./components/signing-requests-table";
import SignatureRequestDeleteModal from "./components/signing-request-delete-modal";
import SigningRequestsSummaryCard from "./components/signing-requests-summary-card";
import { isSigningRequestListCompleted } from "./utils/signing-request-progress";
import { useSigningRequestsTablePreferences } from "@/hooks/use-signing-requests-table-preferences";
import { SigningRequestColumnSelector } from "./components/signing-request-column-selector";

const SigningRequestsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const [signingRequests, setSigningRequests] = useState<SigningRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<SigningRequest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useSigningRequestsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const fetchSigningRequests = useCallback(
        async (query: string = "", pageToken?: string) => {
            if (!orgId) return;

            if (query) {
                setIsSearching(true);
            } else if (!pageToken) {
                setIsLoading(true);
            }

            try {
                const response = await getSigningRequests(orgId, query || undefined, pageToken);
                if (response.success && response.success.signing_requests) {
                    const rows = response.success.signing_requests as SigningRequest[];
                    if (pageToken) {
                        setSigningRequests((prev) => [...prev, ...rows]);
                    } else {
                        setSigningRequests(rows);
                    }
                    setNextPageToken(response.success.next_page_token ?? null);
                } else {
                    toast.error(
                        t("signingRequests.errorFetching", "Could not load signing requests")
                    );
                }
            } catch {
                toast.error(t("signingRequests.errorFetching", "Could not load signing requests"));
            } finally {
                setIsSearching(false);
                setIsLoading(false);
            }
        },
        [orgId, t]
    );

    useEffect(() => {
        if (orgId) {
            fetchSigningRequests();
        }
    }, [orgId, fetchSigningRequests]);

    const dashboardStats = useMemo(() => {
        let completed = 0;
        for (const r of signingRequests) {
            if (isSigningRequestListCompleted(r)) completed++;
        }
        return {
            total: signingRequests.length,
            pending: signingRequests.length - completed,
            completed,
        };
    }, [signingRequests]);

    const loadMore = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;
        setLoadingMore(true);
        try {
            await fetchSigningRequests(searchQuery, nextPageToken);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleView = (id: string) => {
        navigate(`/${orgId}/signing-requests/${id}`);
    };

    const handleDeleteConfirm = (row: SigningRequest) => {
        setRequestToDelete(row);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!orgId || !requestToDelete) return;
        setIsDeleting(true);
        try {
            const response = await deleteSigningRequest(orgId, requestToDelete.id);
            if (response.success) {
                toast.success(t("signingRequests.deleted", "Signing request deleted"));
                setSigningRequests((prev) => prev.filter((r) => r.id !== requestToDelete.id));
                setDeleteModalOpen(false);
                setRequestToDelete(null);
            } else {
                toast.error(t("signingRequests.errorDeleting", "Could not delete signing request"));
            }
        } catch {
            toast.error(t("signingRequests.errorDeleting", "Could not delete signing request"));
        } finally {
            setIsDeleting(false);
        }
    };

    const renderTableActions = (row: SigningRequest) => (
        <div className="flex justify-center items-center">
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.view", "View"),
                        icon: "eye",
                        onClick: () => handleView(row.id),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(row),
                        variant: "destructive",
                    },
                ]}
            />
        </div>
    );

    return (
        <>
            <PageHeader
                title={t("signingRequests.title", "Signing Requests")}
                description={t(
                    "signingRequests.dashboardDescription",
                    "Send documents for e-signature with Signaturit — track envelopes and signer progress in one place."
                )}
                docs={{ slug: "pd_mod_signing_requests" }}
                showBackButton={false}
                action={
                    <Button
                        onClick={() => orgId && navigate(`/${orgId}/signing-requests/create`)}
                        disabled={!orgId}
                    >
                        <Plus className="h-4 w-4" />
                        {t("signingRequests.createRequest", "New signing request")}
                    </Button>
                }
            />

            <SigningRequestsSummaryCard stats={dashboardStats} />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <SearchBar
                            className="w-full"
                            value={searchQuery}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={fetchSigningRequests}
                            placeholder={t("signingRequests.searchPlaceholder", "Search signing requests…")}
                        />
                        <SigningRequestColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    </div>
                    <SigningRequestsTable
                        signingRequests={signingRequests}
                        isLoading={isLoading}
                        renderActions={renderTableActions}
                        onRowClick={(row) => handleView(row.id)}
                        clickableRows
                        searchQuery={searchQuery}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        columnOrder={columnOrder}
                        onColumnOrderChange={setColumnOrder}
                        columnSizing={columnSizing}
                        onColumnSizingChange={setColumnSizing}
                    />
                </div>

            {nextPageToken && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="min-w-32"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.loading", "Loading…")}
                            </>
                        ) : (
                            t("common.loadMore", "Load more")
                        )}
                    </Button>
                </div>
            )}

            <SignatureRequestDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setRequestToDelete(null);
                }}
                signingRequest={requestToDelete}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default SigningRequestsPage;
