import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
    getTrainingCategories,
    deleteTrainingCategory,
} from "@/api/trainings/categories";
import type { TrainingCategory } from "@/types/trainings/trainings";

import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TrainingCategoriesTable from "./training-categories-table";
import CategoryCreateModal from "./category-create-modal";

const TrainingCategoriesTab = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [categories, setCategories] = useState<TrainingCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<TrainingCategory | null>(
        null
    );
    const [editOpen, setEditOpen] = useState(false);

    const fetchCategories = useCallback(
        async (query: string = "") => {
            if (!orgId) return;
            if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
            try {
                const response = await getTrainingCategories(orgId, query || null);
                if (response.success) {
                    setCategories(response.success.categories ?? []);
                } else {
                    toast.error(
                        t(
                            "trainings.categories.errorFetching",
                            "Error fetching categories"
                        )
                    );
                }
            } catch {
                toast.error(t("common.error", "An error occurred"));
            } finally {
                setIsSearching(false);
                setIsLoading(false);
            }
        },
        [orgId, t]
    );

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDelete = async (category: TrainingCategory) => {
        if (!orgId) return;
        try {
            const response = await deleteTrainingCategory(orgId, category.id);
            if (response.success) {
                toast.success(
                    t(
                        "trainings.categories.deletedSuccess",
                        "Category deleted"
                    )
                );
                setCategories((prev) =>
                    prev.filter((c) => c.id !== category.id)
                );
            } else {
                toast.error(
                    t(
                        "trainings.categories.errorDeleting",
                        "Error deleting category"
                    )
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        }
    };

    const handleRowClick = (category: TrainingCategory) => {
        setEditCategory(category);
        setEditOpen(true);
    };

    const renderTableActions = (category: TrainingCategory) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.delete", "Delete"),
                    icon: "trash-2",
                    onClick: () => handleDelete(category),
                    variant: "destructive",
                },
            ]}
        />
    );

    return (
        <>
            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchCategories}
                    placeholder={t(
                        "trainings.categories.searchPlaceholder",
                        "Search categories..."
                    )}
                />
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("trainings.categories.add", "Add Category")}
                </Button>
            </div>

            <TrainingCategoriesTable
                categories={categories}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows
                onEmptyStateAction={() => setCreateOpen(true)}
                searchQuery={searchQuery}
            />

            <CategoryCreateModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSaved={() => fetchCategories(searchQuery)}
            />

            <CategoryCreateModal
                open={editOpen}
                onOpenChange={setEditOpen}
                category={editCategory}
                mode="edit"
                onSaved={() => fetchCategories(searchQuery)}
            />
        </>
    );
};

export default TrainingCategoriesTab;
