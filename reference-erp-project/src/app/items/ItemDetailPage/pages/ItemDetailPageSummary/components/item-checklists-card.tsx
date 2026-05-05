import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useItem } from "@/app/items/contexts/ItemContext";
import { getOrgItemChecklists, deleteOrgItemChecklists } from "@/api/items/checklists/checklists";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ChecklistViewModal, { type ChecklistViewItem } from "@/app/admin/pages/ChecklistsPage/components/checklist-view-modal";
import ItemChecklistAddModal from "./item-checklist-add-modal";

const ItemChecklistsCard = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { item } = useItem();
    const itemId = item?.id;

    const [checklists, setChecklists] = useState<ChecklistViewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewModalChecklistId, setViewModalChecklistId] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const fetchChecklists = useCallback(async () => {
        if (!orgId || !itemId) return;
        setLoading(true);
        try {
            const response = await getOrgItemChecklists(orgId, itemId);
            if (response.success && response.success.checklists) {
                const list = (response.success.checklists as any[]).map((c: any) => ({
                    id: c.id,
                    name: c.name ?? c.data?.name ?? "Checklist",
                    description: c.description ?? c.data?.description,
                    data: c.data,
                    completed: c.completed,
                }));
                setChecklists(list);
            } else {
                setChecklists([]);
            }
        } catch (error) {
            console.error("Error fetching checklists:", error);
            toast.error(t("items.checklist.errorLoading", "Error loading checklists"));
            setChecklists([]);
        } finally {
            setLoading(false);
        }
    }, [orgId, itemId, t]);

    useEffect(() => {
        fetchChecklists();
    }, [fetchChecklists]);

    const handleChecklistUpdated = () => {
        setIsAddModalOpen(false);
        fetchChecklists();
    };

    const handleDeleteChecklist = async (checklistId: string, e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        if (!orgId || !itemId) return;
        setDeletingIds((prev) => new Set(prev).add(checklistId));
        try {
            const response = await deleteOrgItemChecklists(orgId, itemId, { checklists_ids: [checklistId] });
            if (response.success) {
                toast.success(t("items.checklist.deletedSuccessfully", "Checklist removed successfully"));
                setViewModalChecklistId(null);
                fetchChecklists();
            } else {
                toast.error((response as any).error?.message ?? t("items.checklist.errorDeleting", "Error removing checklist"));
            }
        } catch (err) {
            console.error("Error deleting checklist:", err);
            toast.error(t("items.checklist.errorDeleting", "Error removing checklist"));
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(checklistId);
                return next;
            });
        }
    };

    if (!orgId || !itemId) return null;

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {t("items.checklist.checklists", "Checklists")}
                        <Badge variant="secondary">{checklists.length}</Badge>
                    </CardTitle>
                    <Button onClick={() => setIsAddModalOpen(true)} size="sm" type="button" variant="outline">
                        <Plus className="h-4 w-4" />
                        {t("items.checklist.addTemplate", "Add Template")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : checklists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t("items.checklist.noTemplate", "No checklist template assigned")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t("items.checklist.addTemplateDesc", "Click \"Add Template\" to select a checklist template")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {checklists.map((checklist) => {
                            const isDeleting = deletingIds.has(checklist.id);
                            return (
                                <div
                                    key={checklist.id}
                                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg border border-border hover:bg-muted/60 cursor-pointer transition-colors"
                                    onClick={() => setViewModalChecklistId(checklist.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{checklist.name}</div>
                                        {checklist.description && (
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {checklist.description}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDeleteChecklist(checklist.id, e)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            <ItemChecklistAddModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onChecklistUpdated={handleChecklistUpdated}
                orgId={orgId}
                itemId={itemId}
            />

            <ChecklistViewModal
                open={!!viewModalChecklistId}
                onOpenChange={(open) => !open && setViewModalChecklistId(null)}
                checklist={viewModalChecklistId ? checklists.find((c) => c.id === viewModalChecklistId) ?? null : null}
                renderActions={(checklist) => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.actions.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => handleDeleteChecklist(checklist.id),
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
            />
        </Card>
    );
};

export default ItemChecklistsCard;
