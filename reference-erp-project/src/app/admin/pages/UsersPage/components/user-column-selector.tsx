import { useRef, useState } from "react";
import { Columns3, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { UsersTableColumnKey } from "./users-table";

export const CONFIGURABLE_COLUMNS: { id: UsersTableColumnKey; label: string }[] = [
    { id: "id", label: "ID" },
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
    { id: "type", label: "Type" },
    { id: "assigned_to", label: "Assigned To" },
];

interface UserColumnSelectorProps {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    onColumnVisibilityChange: (id: string, visible: boolean) => void;
    onColumnOrderChange: (order: string[]) => void;
    onReset: () => void;
}

export function UserColumnSelector({
    columnVisibility,
    columnOrder,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onReset,
}: UserColumnSelectorProps) {
    const { t } = useTranslation();
    const dragItemId = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const orderedColumns = (() => {
        const ids = CONFIGURABLE_COLUMNS.map((c) => c.id);
        const ordered = columnOrder.filter((id) => ids.includes(id as UsersTableColumnKey));
        const remaining = CONFIGURABLE_COLUMNS.filter((c) => !ordered.includes(c.id));
        return [
            ...ordered.map((id) => CONFIGURABLE_COLUMNS.find((c) => c.id === id)!),
            ...remaining,
        ].filter(Boolean);
    })();

    const handleDrop = (targetId: string) => {
        const sourceId = dragItemId.current;
        if (!sourceId || sourceId === targetId) {
            setDragOverId(null);
            dragItemId.current = null;
            return;
        }
        const ids = orderedColumns.map((c) => c.id);
        const reordered = [...ids];
        const [moved] = reordered.splice(ids.indexOf(sourceId as UsersTableColumnKey), 1);
        reordered.splice(ids.indexOf(targetId as UsersTableColumnKey), 0, moved);
        onColumnOrderChange([...reordered, "actions"]);
        setDragOverId(null);
        dragItemId.current = null;
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 shadow-none gap-1.5">
                            <Columns3 className="h-3.5 w-3.5" />
                            <span>{t("common.columns", "Columns")}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("table.columnSelectorTooltip", "Show, hide and reorder columns")}</TooltipContent>
            </Tooltip>

            <PopoverContent className="w-56 p-0" align="end">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">{t("table.columns", "Columns")}</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset}>
                                <RotateCcw className="h-3 w-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.resetToDefault", "Reset to default")}</TooltipContent>
                    </Tooltip>
                </div>

                <ul className="max-h-80 overflow-y-auto scrollbar-thin py-1">
                    {orderedColumns.map((col) => (
                        <li
                            key={col.id}
                            draggable
                            onDragStart={() => { dragItemId.current = col.id; }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverId(col.id); }}
                            onDrop={() => handleDrop(col.id)}
                            onDragEnd={() => { setDragOverId(null); dragItemId.current = null; }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 cursor-default select-none transition-colors",
                                dragOverId === col.id && dragItemId.current !== col.id
                                    ? "bg-muted"
                                    : "hover:bg-muted/50",
                            )}
                        >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                            <Checkbox
                                id={`user-col-${col.id}`}
                                checked={columnVisibility[col.id] !== false}
                                onCheckedChange={(checked) => onColumnVisibilityChange(col.id, checked === true)}
                            />
                            <label
                                htmlFor={`user-col-${col.id}`}
                                className="text-sm cursor-pointer flex-1 truncate leading-none"
                                title={col.label}
                            >
                                {col.label}
                            </label>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
