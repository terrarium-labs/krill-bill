import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { toast } from "sonner";
import { getEmployeeBonusTypes, deleteEmployeeBonusType } from "@/api/employees/bonus-types/bonus-types";
import { BonusTypeEmployee } from "@/types/employees/bonus-types";
import { useEmployee } from "../../../contexts/EmployeeContext";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import EmployeeBonusTypesTable from "./components/employee-bonus-types-table";
import EmployeeBonusTypeAssignModal from "./components/employee-bonus-type-assign-modal";
import EmployeeBonusTypeDeleteModal from "./components/employee-bonus-type-delete-modal";

const EmployeeDetailPageBonus = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { employee } = useEmployee();
    const [bonusTypeEmployees, setBonusTypeEmployees] = useState<BonusTypeEmployee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bonusTypeToEdit, setBonusTypeToEdit] = useState<BonusTypeEmployee | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bonusTypeToDelete, setBonusTypeToDelete] = useState<BonusTypeEmployee | null>(null);
    const [deletingBonusType, setDeletingBonusType] = useState(false);

    const fetchBonusTypes = useCallback(
        async (query: string = "", pageToken?: string | null) => {
            if (!orgId || !employee?.id) return;
            if (pageToken) {
                setLoadingMore(true);
            } else if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
            try {
                const response = await getEmployeeBonusTypes(orgId, employee.id, query || undefined, pageToken);
                if (response.success) {
                    setBonusTypeEmployees((prev) =>
                        pageToken
                            ? [...prev, ...(response.success.bonus_types_employees ?? [])]
                            : (response.success.bonus_types_employees ?? [])
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(t("employees.bonusTypes.errorFetching", "Error fetching bonus types"));
                }
            } catch {
                toast.error(t("employees.bonusTypes.errorFetching", "Error fetching bonus types"));
            } finally {
                setIsLoading(false);
                setIsSearching(false);
                setLoadingMore(false);
            }
        },
        [orgId, employee?.id, t]
    );

    useEffect(() => {
        fetchBonusTypes();
    }, [fetchBonusTypes]);

    const handleEditBonusType = useCallback((item: BonusTypeEmployee) => {
        setBonusTypeToEdit(item);
        setEditModalOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback((item: BonusTypeEmployee) => {
        setBonusTypeToDelete(item);
        setDeleteModalOpen(true);
    }, []);

    const renderActions = useCallback(
        (item: BonusTypeEmployee) => (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditBonusType(item),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(item),
                        variant: "destructive",
                    },
                ]}
            />
        ),
        [t, handleEditBonusType, handleDeleteConfirm]
    );

    const handleDelete = async () => {
        if (!bonusTypeToDelete || !orgId || !employee?.id) return;
        setDeletingBonusType(true);
        try {
            const response = await deleteEmployeeBonusType(orgId, employee.id, bonusTypeToDelete.id);
            if (response.success) {
                toast.success(t("employees.bonusTypes.bonusTypeRemoved", "Bonus type removed successfully"));
                setBonusTypeEmployees((prev) => prev.filter((b) => b.id !== bonusTypeToDelete.id));
            } else {
                toast.error(t("employees.bonusTypes.errorDeleting", "Error removing bonus type"));
            }
        } catch {
            toast.error(t("employees.bonusTypes.errorDeleting", "Error removing bonus type"));
        } finally {
            setDeletingBonusType(false);
            setDeleteModalOpen(false);
            setBonusTypeToDelete(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={(query) => fetchBonusTypes(query)}
                        placeholder={t("employees.bonusTypes.searchPlaceholder", "Search bonus types...")}
                    />
                </div>
                <Button onClick={() => setAssignModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("employees.bonusTypes.assignBonusType", "Assign Bonus Type")}
                </Button>
            </div>

            <EmployeeBonusTypesTable
                bonusTypeEmployees={bonusTypeEmployees}
                isLoading={isLoading}
                loadingMore={loadingMore}
                hasMore={!!nextPageToken}
                searchQuery={searchQuery}
                onLoadMore={() => fetchBonusTypes(searchQuery, nextPageToken)}
                onAdd={() => setAssignModalOpen(true)}
                renderActions={renderActions}
            />

            <EmployeeBonusTypeAssignModal
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                employeeId={employee?.id ?? ""}
                onSuccess={() => fetchBonusTypes()}
            />

            <EmployeeBonusTypeAssignModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) setBonusTypeToEdit(null);
                }}
                employeeId={employee?.id ?? ""}
                onSuccess={() => fetchBonusTypes()}
                bonusTypeEmployeeToEdit={bonusTypeToEdit}
                mode="edit"
            />

            <EmployeeBonusTypeDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                bonusTypeEmployee={bonusTypeToDelete}
                deleting={deletingBonusType}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default EmployeeDetailPageBonus;
