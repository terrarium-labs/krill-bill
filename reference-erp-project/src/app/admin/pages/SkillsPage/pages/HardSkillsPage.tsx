import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Skill } from '@/types/general/skills';
import SkillEditModal from '../components/skill-edit-modal';
import SkillDeleteModal from '../components/skill-delete-modal';
import SkillsTable from '../components/skills-table';
import { getOrgSkills, deleteOrgSkill } from "@/api/orgs/skills/skills";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useSkillsTablePreferences } from "@/hooks/use-skills-table-preferences";
import { SkillsColumnSelector } from "../components/skills-column-selector";

const HardSkillsPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [skills, setSkills] = useState<Skill[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useSkillsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
    const [deletingSkill, setDeletingSkill] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    const fetchSkills = async (query: string = "", page_token?: string) => {
        if (!orgId) return;

        if (query) {
            setIsSearching(true);
        } else if (!page_token) {
            setIsLoading(true);
        }

        try {
            const response = await getOrgSkills(orgId, "hard", query, page_token || undefined);
            if (response.success) {
                if (page_token) {
                    setSkills((prev) => [
                        ...prev,
                        ...(response.success.skills as Skill[]),
                    ]);
                } else {
                    setSkills(response.success.skills as Skill[]);
                }
                if (response.success.next_page_token) {
                    setNextPageToken(response.success.next_page_token);
                } else {
                    setNextPageToken(undefined);
                }
            } else {
                toast.error(t("skills.hardSkills.errorFetching", "Error fetching hard skills"));
            }
        } catch (error) {
            toast.error(t("skills.hardSkills.errorFetching", "Error fetching hard skills"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchSkills(searchQuery, nextPageToken);
        } catch (error) {
            toast.error(t("common.error"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchSkills();
        }
    }, [orgId]);

    const handleRowClick = (skill: Skill) => {
        setSelectedSkill(skill);
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedSkill(null);
            setDeleteModalOpen(false);
        }
    };

    const handleSkillCreatedOrUpdated = () => {
        fetchSkills(searchQuery);
        setIsModalOpen(false);
        setSelectedSkill(null);
    };

    const handleDeleteConfirm = (skill: Skill) => {
        setSkillToDelete(skill);
        setDeleteModalOpen(true);
    };

    const handleDeleteFromEditModal = (skill: Skill) => {
        setIsModalOpen(false);
        setSkillToDelete(skill);
        setDeleteModalOpen(true);
    };

    const renderTableActions = (skill: Skill) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleRowClick(skill),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(skill),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    const handleDeleteSkill = async () => {
        if (!skillToDelete || !orgId) return;

        setDeletingSkill(true);
        try {
            const response = await deleteOrgSkill(orgId, skillToDelete.id);
            if (response.success) {
                toast.success(t("skills.hardSkills.deleted", "Hard skill deleted successfully"));
                setSkills(prev => prev.filter(s => s.id !== skillToDelete.id));
            } else {
                toast.error(t("skills.hardSkills.errorDeleting", "Error deleting hard skill"));
            }
        } catch (error) {
            toast.error(t("skills.hardSkills.errorDeleting", "Error deleting hard skill"));
        } finally {
            setDeletingSkill(false);
            setDeleteModalOpen(false);
            setSkillToDelete(null);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchSkills}
                    placeholder={t("skills.hardSkills.searchPlaceholder", "Search hard skills...")}
                />
                <SkillsColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
                <Button onClick={() => {
                    setSelectedSkill(null);
                    setIsModalOpen(true);
                }}>
                    <Plus className="h-4 w-4" />
                    {t("skills.hardSkills.addSkill", "New hard skill")}
                </Button>
            </div>

            <SkillsTable
                data={skills}
                isLoading={isLoading}
                searchQuery={searchQuery}
                hiddenColumns={["type"]}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows={true}
                onEmptyStateAction={() => setIsModalOpen(true)}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}

            <SkillEditModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                onSkillCreatedOrUpdated={handleSkillCreatedOrUpdated}
                orgId={orgId!}
                mode={selectedSkill ? 'edit' : 'create'}
                skill={selectedSkill}
                defaultType="hard"
                renderActions={
                    selectedSkill ? (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteFromEditModal(selectedSkill),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    ) : undefined
                }
            />

            <SkillDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                skill={skillToDelete}
                onConfirm={handleDeleteSkill}
                isDeleting={deletingSkill}
            />
        </>
    );
};

export default HardSkillsPage;
