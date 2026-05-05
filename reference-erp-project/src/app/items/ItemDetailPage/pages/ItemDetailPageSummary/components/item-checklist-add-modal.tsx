import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ListTodo, Loader2, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { getChecklists } from "@/api/orgs/checklists/checklists";
import { getOrgItemChecklists, postOrgItemChecklists } from "@/api/items/checklists/checklists";
import { useParams } from "react-router-dom";

type ChecklistTemplate = { id: string; name: string; description?: string };

interface ItemChecklistAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChecklistUpdated: () => void;
    orgId?: string;
    itemId?: string;
}

const ItemChecklistAddModal = ({
    open,
    onOpenChange,
    onChecklistUpdated,
    orgId: orgIdProp,
    itemId: itemIdProp,
}: ItemChecklistAddModalProps) => {
    const { t } = useTranslation();
    const { orgId: orgIdParam } = useParams<{ orgId: string }>();
    const orgId = orgIdProp ?? orgIdParam;
    const itemId = itemIdProp;

    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [alreadyAddedIds, setAlreadyAddedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        if (!orgId || !itemId) return;
        setIsLoading(true);
        try {
            const [templatesRes, itemRes] = await Promise.all([
                getChecklists(orgId),
                getOrgItemChecklists(orgId, itemId),
            ]);
            if (templatesRes.success && templatesRes.success.checklists) {
                setTemplates(templatesRes.success.checklists);
            }
            if (itemRes?.success?.checklists) {
                const added = new Set<string>();
                (itemRes.success.checklists as any[]).forEach((c: any) => {
                    const tid = c.data?.template_id ?? c.data?.checklist_id ?? c.id;
                    if (tid) added.add(tid);
                });
                setAlreadyAddedIds(added);
            } else {
                setAlreadyAddedIds(new Set());
            }
        } catch (error) {
            console.error("Error fetching checklists:", error);
            toast.error(t("items.checklist.errorLoading", "Error loading checklists"));
        } finally {
            setIsLoading(false);
        }
    }, [orgId, itemId, t]);

    useEffect(() => {
        if (open && orgId && itemId) {
            setSearchQuery("");
            setAddingIds(new Set());
            fetchData();
        }
    }, [open, orgId, itemId, fetchData]);

    const availableTemplates = templates.filter((tpl) => !alreadyAddedIds.has(tpl.id));
    const filtered = searchQuery.trim()
        ? availableTemplates.filter(
            (tpl) =>
                tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tpl.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : availableTemplates;

    const handleAdd = async (template: ChecklistTemplate) => {
        if (!orgId || !itemId) {
            toast.error(t("items.checklist.missingInfo", "Organization or Item ID is missing"));
            return;
        }
        setAddingIds((prev) => new Set(prev).add(template.id));
        try {
            const response = await postOrgItemChecklists(orgId, itemId, { checklists_ids: [template.id] });
            if (response.success) {
                toast.success(t("items.checklist.addedSuccessfully", "Checklist template added successfully"));
                setAlreadyAddedIds((prev) => new Set(prev).add(template.id));
                onChecklistUpdated();
            } else {
                toast.error(
                    (response as any).error?.message ?? t("items.checklist.errorAdding", "Error adding checklist")
                );
            }
        } catch (error) {
            console.error("Error adding checklist:", error);
            toast.error(t("items.checklist.errorAdding", "Error adding checklist"));
        } finally {
            setAddingIds((prev) => {
                const next = new Set(prev);
                next.delete(template.id);
                return next;
            });
        }
    };

    if (!orgId || !itemId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {t("items.checklist.addTemplate", "Add Checklist Template")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={() => { }}
                        placeholder={t("items.checklist.searchTemplates", "Search templates...")}
                        className="w-full"
                    />

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        {t("items.checklist.loading", "Loading templates...")}
                                    </p>
                                </div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <ListTodo className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">
                                        {searchQuery.trim()
                                            ? t("items.checklist.noResults", "No templates match your search")
                                            : alreadyAddedIds.size > 0 && availableTemplates.length === 0
                                                ? t("items.checklist.allAdded", "All templates are already added")
                                                : t("items.checklist.noTemplates", "No checklist templates available")}
                                    </h3>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {filtered.map((template) => {
                                    const isAdding = addingIds.has(template.id);
                                    return (
                                        <div
                                            key={template.id}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{template.name}</div>
                                                {template.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                        {template.description}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAdd(template)}
                                                disabled={isAdding}
                                                variant="outline"
                                                className="shrink-0"
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {t("common.adding", "Adding...")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4" />
                                                        {t("common.add", "Add")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ItemChecklistAddModal;
