import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Plus, Trash2, Check, Pencil, Save } from "lucide-react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { SavedLayout } from "../hooks/useDashboardLayout";

interface LayoutSelectorProps {
    savedLayouts: SavedLayout[];
    activeLayoutId: string | null;
    isEditing: boolean;
    isSaving: boolean;
    onSelect: (id: string | null) => void;
    onSaveAs: (name: string) => Promise<void>;
    onUpdateActive: () => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRename: (id: string, name: string) => Promise<void>;
    onStartEditing: () => void;
}


export default function LayoutSelector({
    savedLayouts,
    activeLayoutId,
    isSaving,
    onSelect,
    onSaveAs,
    onUpdateActive,
    onDelete,
    onRename,
    onStartEditing,
}: LayoutSelectorProps) {
    const { t } = useTranslation();
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [renameDialogId, setRenameDialogId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSaveAs = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        await onSaveAs(trimmed);
        setNewName("");
        setSaveDialogOpen(false);
    };

    const handleRename = async () => {
        if (!renameDialogId) return;
        const trimmed = renameValue.trim();
        if (!trimmed) return;
        await onRename(renameDialogId, trimmed);
        setRenameDialogId(null);
        setRenameValue("");
    };

    const handleDelete = async (id: string) => {
        await onDelete(id);
        setDeletingId(null);
    };

    const openRename = (layout: SavedLayout) => {
        setRenameDialogId(layout.id);
        setRenameValue(layout.name);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6! w-6!">
                        <Icon icon="lucide:ellipsis-vertical" className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => onSelect(null)}
                            className="gap-2"
                        >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                            <span>{t("missionControl.layouts.default", "Default")}</span>
                            {activeLayoutId === null && (
                                <Check className="h-3 w-3 ml-auto" />
                            )}
                        </DropdownMenuItem>

                        {savedLayouts.length > 0 && <DropdownMenuSeparator />}

                        {savedLayouts.map((layout) => (
                            <DropdownMenuItem
                                key={layout.id}
                                className="gap-2 group"
                                onClick={() => onSelect(layout.id)}
                            >
                                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1 truncate">{layout.name}</span>
                                {activeLayoutId === layout.id && (
                                    <Check className="h-3 w-3 shrink-0" />
                                )}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                    <button
                                        className="p-0.5 rounded hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openRename(layout);
                                        }}
                                    >
                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 rounded hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingId(layout.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={onStartEditing} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            {t("common.edit_layout", "Edit Layout")}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => {
                                setNewName("");
                                setSaveDialogOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t("missionControl.layouts.saveAs", "New layout")}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {t("missionControl.layouts.saveDialogTitle", "Save layout")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("missionControl.layouts.saveDialogDesc", "Give this layout a name to save it.")}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveAs();
                        }}
                    >
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t("missionControl.layouts.namePlaceholder", "Layout name")}
                            autoFocus
                        />
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSaveDialogOpen(false)}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={!newName.trim() || isSaving}>
                                {isSaving
                                    ? t("missionControl.main.saving", "Saving…")
                                    : t("common.save", "Save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!renameDialogId} onOpenChange={(v) => !v && setRenameDialogId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {t("missionControl.layouts.renameTitle", "Rename layout")}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleRename();
                        }}
                    >
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder={t("missionControl.layouts.namePlaceholder", "Layout name")}
                            autoFocus
                        />
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRenameDialogId(null)}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={!renameValue.trim()}>
                                {t("common.save", "Save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {t("missionControl.layouts.deleteTitle", "Delete layout")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "missionControl.layouts.deleteDesc",
                                "Are you sure you want to delete this layout? This action cannot be undone."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deletingId && handleDelete(deletingId)}
                        >
                            {t("common.delete", "Delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
