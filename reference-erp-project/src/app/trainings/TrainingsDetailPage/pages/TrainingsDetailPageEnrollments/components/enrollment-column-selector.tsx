import { useRef, useState } from "react";
import { Columns3, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { EnrollmentsTableColumnKey } from "./training-enrollments-table";

export const ENROLLMENT_CONFIGURABLE_COLUMNS: {
    id: EnrollmentsTableColumnKey;
    labelKey: string;
    defaultLabel: string;
}[] = [
    {
        id: "id",
        labelKey: "common.id",
        defaultLabel: "ID",
    },
    {
        id: "employee",
        labelKey: "trainings.enrollments.columns.employee",
        defaultLabel: "Employee",
    },
    {
        id: "training_title",
        labelKey: "trainings.columns.title",
        defaultLabel: "Training",
    },
    {
        id: "status",
        labelKey: "trainings.enrollments.columns.status",
        defaultLabel: "Status",
    },
    {
        id: "enrolled_at",
        labelKey: "trainings.enrollments.columns.enrolledAt",
        defaultLabel: "Enrolled At",
    },
    {
        id: "completion_date",
        labelKey: "trainings.enrollments.columns.completionDate",
        defaultLabel: "Completed",
    },
    {
        id: "expires_at",
        labelKey: "trainings.enrollments.columns.expiresAt",
        defaultLabel: "Expires",
    },
    {
        id: "attendance",
        labelKey: "trainings.enrollments.columns.attendance",
        defaultLabel: "Attendance",
    },
    {
        id: "score",
        labelKey: "trainings.enrollments.columns.score",
        defaultLabel: "Score",
    },
    {
        id: "progress",
        labelKey: "trainings.enrollments.columns.progress",
        defaultLabel: "Progress",
    },
    {
        id: "notes",
        labelKey: "trainings.enrollments.columns.notes",
        defaultLabel: "Notes",
    },
];

interface EnrollmentColumnSelectorProps {
    /** Columns forced hidden by the host page; omitted from this control. */
    hiddenColumns?: EnrollmentsTableColumnKey[] | EnrollmentsTableColumnKey;
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    onColumnVisibilityChange: (id: string, visible: boolean) => void;
    onColumnOrderChange: (order: string[]) => void;
    onReset: () => void;
}

export function EnrollmentColumnSelector({
    hiddenColumns,
    columnVisibility,
    columnOrder,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onReset,
}: EnrollmentColumnSelectorProps) {
    const { t } = useTranslation();
    const dragItemId = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const structural = (
        Array.isArray(hiddenColumns)
            ? hiddenColumns
            : hiddenColumns
              ? [hiddenColumns]
              : []
    ) as EnrollmentsTableColumnKey[];

    const configurableMeta = ENROLLMENT_CONFIGURABLE_COLUMNS.filter(
        (c) => !structural.includes(c.id),
    );

    const orderedColumns = (() => {
        const configurableIds = configurableMeta.map((c) => c.id);
        const ordered = columnOrder.filter((id) =>
            configurableIds.includes(id as EnrollmentsTableColumnKey),
        );
        const remaining = configurableMeta.filter((c) => !ordered.includes(c.id));
        return [
            ...ordered.map((id) => configurableMeta.find((c) => c.id === id)!),
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
        const [moved] = reordered.splice(
            ids.indexOf(sourceId as EnrollmentsTableColumnKey),
            1,
        );
        reordered.splice(
            ids.indexOf(targetId as EnrollmentsTableColumnKey),
            0,
            moved,
        );
        onColumnOrderChange([...reordered, "actions"]);
        setDragOverId(null);
        dragItemId.current = null;
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 shadow-none gap-1.5"
                        >
                            <Columns3 className="h-3.5 w-3.5" />
                            <span>{t("common.columns", "Columns")}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    {t(
                        "table.columnSelectorTooltip",
                        "Show, hide and reorder columns",
                    )}
                </TooltipContent>
            </Tooltip>

            <PopoverContent className="w-56 p-0" align="end">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">
                        {t("table.columns", "Columns")}
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
                        <TooltipContent>
                            {t("common.resetToDefault", "Reset to default")}
                        </TooltipContent>
                    </Tooltip>
                </div>

                <ul className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
                    {orderedColumns.map((col) => (
                        <li
                            key={col.id}
                            draggable
                            onDragStart={() => {
                                dragItemId.current = col.id;
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverId(col.id);
                            }}
                            onDrop={() => handleDrop(col.id)}
                            onDragEnd={() => {
                                setDragOverId(null);
                                dragItemId.current = null;
                            }}
                            className={cn(
                                "flex cursor-default select-none items-center gap-2 px-3 py-1.5 transition-colors",
                                dragOverId === col.id &&
                                    dragItemId.current !== col.id
                                    ? "bg-muted"
                                    : "hover:bg-muted/50",
                            )}
                        >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                            <Checkbox
                                id={`enrollment-col-${col.id}`}
                                checked={columnVisibility[col.id] !== false}
                                onCheckedChange={(checked) =>
                                    onColumnVisibilityChange(col.id, checked === true)
                                }
                            />
                            <label
                                htmlFor={`enrollment-col-${col.id}`}
                                className="flex-1 cursor-pointer truncate text-sm leading-none"
                                title={t(col.labelKey, col.defaultLabel)}
                            >
                                {t(col.labelKey, col.defaultLabel)}
                            </label>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
