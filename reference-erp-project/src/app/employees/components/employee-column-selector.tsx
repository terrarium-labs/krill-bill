import { useRef, useState } from "react";
import { Columns3, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { EmployeeTableColumnKey } from "./employees-table";

/** Columns the user can toggle and reorder (excludes actions which is always last) */
export const CONFIGURABLE_COLUMNS: { id: EmployeeTableColumnKey; label: string }[] = [
    // Core — visible by default
    { id: "id", label: "ID" },
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
    { id: "role", label: "Role" },
    { id: "status", label: "Status" },
    // Location
    { id: "city", label: "City" },
    { id: "country", label: "Country" },
    { id: "state_province", label: "State / Province" },
    { id: "postal_code", label: "Postal Code" },
    { id: "address_line_1", label: "Address Line 1" },
    { id: "address_line_2", label: "Address Line 2" },
    // Personal
    { id: "date_of_birth", label: "Date of Birth" },
    { id: "nationality", label: "Nationality" },
    { id: "national_id_number", label: "National ID" },
    { id: "tax_id_number", label: "Tax ID" },
    // Organisation
    { id: "workplace", label: "Workplace" },
    { id: "absence_policy", label: "Absence Policy" },
    { id: "time_policy", label: "Time Policy" },
    { id: "groups", label: "Groups" },
    // Reporting
    { id: "reporting_to", label: "Reports To" },
    { id: "reporting_absence_to", label: "Absence Supervisor" },
    { id: "is_supervisor", label: "Is Supervisor" },
    { id: "is_absence_supervisor", label: "Is Absence Supervisor" },
];

interface EmployeeColumnSelectorProps {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    onColumnVisibilityChange: (id: string, visible: boolean) => void;
    onColumnOrderChange: (order: string[]) => void;
    onReset: () => void;
}

export function EmployeeColumnSelector({
    columnVisibility,
    columnOrder,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onReset,
}: EmployeeColumnSelectorProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const dragItemId = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    /** Ordered list of configurable columns, respecting current column order */
    const orderedColumns = (() => {
        const configurableIds = CONFIGURABLE_COLUMNS.map((c) => c.id);
        const ordered = columnOrder.filter((id) => configurableIds.includes(id as EmployeeTableColumnKey));
        const remaining = CONFIGURABLE_COLUMNS.filter((c) => !ordered.includes(c.id));
        return [
            ...ordered.map((id) => CONFIGURABLE_COLUMNS.find((c) => c.id === id)!),
            ...remaining,
        ].filter(Boolean);
    })();

    const handleDragStart = (id: string) => {
        dragItemId.current = id;
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        setDragOverId(id);
    };

    const handleDrop = (targetId: string) => {
        const sourceId = dragItemId.current;
        if (!sourceId || sourceId === targetId) {
            setDragOverId(null);
            dragItemId.current = null;
            return;
        }

        const ids = orderedColumns.map((c) => c.id);
        const fromIdx = ids.indexOf(sourceId as EmployeeTableColumnKey);
        const toIdx = ids.indexOf(targetId as EmployeeTableColumnKey);

        const reordered = [...ids];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        // Append non-configurable columns at the end so the full order is set
        onColumnOrderChange([...reordered, "actions"]);
        setDragOverId(null);
        dragItemId.current = null;
    };

    const handleDragEnd = () => {
        setDragOverId(null);
        dragItemId.current = null;
    };

    const isVisible = (id: string) => columnVisibility[id] !== false;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 shadow-none gap-1.5">
                            <Columns3 className="h-3.5 w-3.5" />
                            <span>{t("common.columns", "Columns")}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    {t("employees.table.columnSelectorTooltip", "Show, hide and reorder columns")}
                </TooltipContent>
            </Tooltip>

            <PopoverContent className="w-56 p-0" align="end">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">
                        {t("employees.table.columns", "Columns")}
                    </span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={onReset}
                            >
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
                            onDragStart={() => handleDragStart(col.id)}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDrop={() => handleDrop(col.id)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 cursor-default select-none transition-colors",
                                dragOverId === col.id && dragItemId.current !== col.id
                                    ? "bg-muted"
                                    : "hover:bg-muted/50",
                            )}
                        >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                            <Checkbox
                                id={`col-${col.id}`}
                                checked={isVisible(col.id)}
                                onCheckedChange={(checked) =>
                                    onColumnVisibilityChange(col.id, checked === true)
                                }
                            />
                            <label
                                htmlFor={`col-${col.id}`}
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
