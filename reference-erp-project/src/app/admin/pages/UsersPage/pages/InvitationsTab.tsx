import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Invitation } from "@/types/general/invitation";
import SearchBar from "@/app/components/search-bar";
import { getOrgInvitations, cancelOrgInvitation } from "@/api/orgs/invitations/invitations";
import { toast } from "sonner";
import InvitationsTable from "../components/invitations-table";
import InvitationDeleteModal from "../components/modals/invitation-delete-modal";
import { useInvitationsTablePreferences } from "@/hooks/use-invitations-table-preferences";
import { InvitationColumnSelector } from "../components/invitation-column-selector";

interface InvitationsTabProps {
    refreshTrigger?: number;
}

const InvitationsTab = ({ refreshTrigger }: InvitationsTabProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useInvitationsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);
    const [cancelingInvitation, setCancelingInvitation] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch invitations function
    const fetchInvitations = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgInvitations(orgId, query, null);
            if (response.success && response.success.invitations) {
                setInvitations(response.success.invitations);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.users.invitations.errorFetching") || "Error fetching invitations");
            }
        } catch (error) {
            console.error('Error fetching invitations:', error);
            toast.error(t("admin.users.invitations.errorFetching") || "Error fetching invitations");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Refresh function to reset search and reload data
    const refreshInvitations = () => {
        setSearchQuery("");
        setInvitations([]); // Clear current data to show loading state
        setNextPageToken(null); // Reset pagination
        fetchInvitations();
    };

    // Handle refresh trigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            refreshInvitations();
        }
    }, [refreshTrigger]); // Refresh when trigger changes

    // Initial load
    useEffect(() => {
        fetchInvitations();
    }, [orgId]); // Re-fetch when orgId changes

    // Load more invitations
    const loadMoreInvitations = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgInvitations(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.invitations) {
                setInvitations(prev => [...prev, ...response.success.invitations]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.users.invitations.errorFetching") || "Error fetching invitations");
            }
        } catch (error) {
            toast.error(t("admin.users.invitations.errorFetching") || "Error fetching invitations");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle cancel confirmation
    const handleCancelConfirm = (invitation: Invitation) => {
        setInvitationToCancel(invitation);
        setDeleteModalOpen(true);
    };

    // Handle cancel execution
    const handleCancelInvitation = async () => {
        if (!invitationToCancel || !orgId) return;

        setCancelingInvitation(true);
        try {
            const response = await cancelOrgInvitation(orgId, invitationToCancel.id);
            if (response.success) {
                toast.success(t("admin.users.invitations.canceled", "Invitation canceled successfully"));
                // Remove from local state
                setInvitations(prev => prev.filter(i => i.id !== invitationToCancel.id));
            } else {
                toast.error(t("admin.users.invitations.errorCanceling", "Error canceling invitation"));
            }
        } catch (error) {
            toast.error(t("admin.users.invitations.errorCanceling", "Error canceling invitation"));
        } finally {
            setCancelingInvitation(false);
            setDeleteModalOpen(false);
            setInvitationToCancel(null);
        }
    };

    const renderTableActions = (invitation: Invitation) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("admin.users.invitations.cancel", "Cancel Invitation"),
                        icon: "trash-2",
                        onClick: () => handleCancelConfirm(invitation),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    return (
        <div className="mt-4 space-y-6">
            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchInvitations}
                placeholder={t("admin.users.invitations.searchPlaceholder", "Search invitations...")}
            />

            <div className="flex justify-end">
                <InvitationColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Invitations Table */}
            <InvitationsTable
                data={invitations}
                isLoading={isLoading}
                searchQuery={searchQuery}
                renderActions={renderTableActions}
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
                        onClick={loadMoreInvitations}
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

            {/* Cancel Confirmation Dialog */}
            <InvitationDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                invitation={invitationToCancel}
                onConfirm={handleCancelInvitation}
                isCanceling={cancelingInvitation}
            />
        </div>
    );
};

export default InvitationsTab;
