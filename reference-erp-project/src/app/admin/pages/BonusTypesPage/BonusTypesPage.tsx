import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { toast } from "sonner";
import { getBonusTypes, deleteBonusType } from "@/api/orgs/bonus-types/bonus-types";
import { BonusType } from "@/types/general/bonus-types";
import BonusTypesTable from "./components/bonus-types-table";
import BonusTypeEditModal from "./components/bonus-type-edit-modal";
import BonusTypeDeleteModal from "./components/bonus-type-delete-modal";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useBonusTypesTablePreferences } from "@/hooks/use-bonus-types-table-preferences";
import { BonusTypesColumnSelector } from "./components/bonus-types-column-selector";

const BonusTypesPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [bonusTypes, setBonusTypes] = useState<BonusType[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useBonusTypesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bonusTypeToEdit, setBonusTypeToEdit] = useState<BonusType | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bonusTypeToDelete, setBonusTypeToDelete] = useState<BonusType | null>(null);
    const [deletingBonusType, setDeletingBonusType] = useState(false);

    const fetchBonusTypes = useCallback(
        async (query: string = "", pageToken?: string | null) => {
            if (!orgId) return;
            if (pageToken) {
                setLoadingMore(true);
            } else if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }

            try {
                const response = await getBonusTypes(orgId, query || undefined, pageToken);
                if (response.success) {
                    setBonusTypes((prev) =>
                        pageToken
                            ? [...prev, ...(response.success.bonus_types ?? [])]
                            : (response.success.bonus_types ?? [])
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(t("admin.bonusTypes.errorFetchingBonusTypes", "Error fetching bonus types"));
                }
            } catch {
                toast.error(t("admin.bonusTypes.errorFetchingBonusTypes", "Error fetching bonus types"));
            } finally {
                setIsLoading(false);
                setIsSearching(false);
                setLoadingMore(false);
            }
        },
        [orgId, t]
    );

    useEffect(() => {
        fetchBonusTypes();
    }, []);

    const handleEditBonusType = useCallback((bonusType: BonusType) => {
        setBonusTypeToEdit(bonusType);
        setEditModalOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback((bonusType: BonusType) => {
        setBonusTypeToDelete(bonusType);
        setDeleteModalOpen(true);
    }, []);

    const renderActions = useCallback(
        (bonusType: BonusType) => (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditBonusType(bonusType),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(bonusType),
                        variant: "destructive",
                    },
                ]}
            />
        ),
        [t, handleEditBonusType, handleDeleteConfirm]
    );

    const handleDeleteBonusType = async () => {
        if (!bonusTypeToDelete || !orgId) return;

        setDeletingBonusType(true);
        try {
            const response = await deleteBonusType(orgId, bonusTypeToDelete.id);
            if (response.success) {
                toast.success(t("admin.bonusTypes.bonusTypeDeleted", "Bonus type deleted successfully"));
                setBonusTypes((prev) => prev.filter((b) => b.id !== bonusTypeToDelete.id));
            } else {
                toast.error(t("admin.bonusTypes.errorDeletingBonusType", "Error deleting bonus type"));
            }
        } catch {
            toast.error(t("admin.bonusTypes.errorDeletingBonusType", "Error deleting bonus type"));
        } finally {
            setDeletingBonusType(false);
            setDeleteModalOpen(false);
            setBonusTypeToDelete(null);
        }
    };

    return (
        <>
            <PageHeader
                title={t("admin.bonusTypes.title", "Bonus Types")}
                description={t("admin.bonusTypes.description", "Manage your organization's employee bonus types.")}
                docs={{ slug: "pd_admin_bonus_types" }}
                action={
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {t("admin.bonusTypes.addBonusType", "Add Bonus Type")}
                    </Button>
                }
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="flex-1"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchBonusTypes(query)}
                    placeholder={t("admin.bonusTypes.searchPlaceholder", "Search bonus types...")}
                />
                <BonusTypesColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            <BonusTypesTable
                bonusTypes={bonusTypes}
                isLoading={isLoading}
                loadingMore={loadingMore}
                hasMore={!!nextPageToken}
                searchQuery={searchQuery}
                onLoadMore={() => fetchBonusTypes(searchQuery, nextPageToken)}
                onAddBonusType={() => setCreateModalOpen(true)}
                renderActions={renderActions}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            <BonusTypeEditModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onBonusTypeCreated={() => fetchBonusTypes()}
            />

            <BonusTypeEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) setBonusTypeToEdit(null);
                }}
                onBonusTypeCreated={() => fetchBonusTypes()}
                bonusTypeToEdit={bonusTypeToEdit}
                mode="edit"
            />

            <BonusTypeDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                bonusType={bonusTypeToDelete}
                deleting={deletingBonusType}
                onConfirm={handleDeleteBonusType}
            />
        </>
    );
};

export default BonusTypesPage;
