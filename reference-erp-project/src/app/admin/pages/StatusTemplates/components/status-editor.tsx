import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useTranslation } from "@/hooks/useTranslation";
import { Status, StatusCategory } from "@/types/general/status-templates";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import ColorLabel from "@/app/components/labels/color-label";
import { LIST_COLORS } from "@/utils/miscelanea";

// Generate a unique ID
const generateId = () => `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

interface EditableStatus extends Omit<Status, "id"> {
    id: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface SortableRowProps {
    status: EditableStatus;
    onUpdate: (id: string, field: keyof EditableStatus, value: any) => void;
    onDelete: (id: string) => void;
    hideCategory?: boolean;
}

const SortableRow: React.FC<SortableRowProps> = ({ status, onUpdate, onDelete, hideCategory = false }) => {
    const { t } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: status.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getCategoryColor = (category: StatusCategory): string => {
        switch (category) {
            case "not_started":
                return "yellow";
            case "active":
                return "green";
            case "done":
                return "blue";
            case "closed":
                return "red";
            default:
                return "gray";
        }
    };

    const getCategoryLabel = (category: string): string => {
        switch (category) {
            case "not_started":
                return t("statusTemplates.category.notStarted", "Not Started");
            case "active":
                return t("statusTemplates.category.active", "Active");
            case "done":
                return t("statusTemplates.category.done", "Done");
            case "closed":
                return t("statusTemplates.category.closed", "Closed");
            default:
                return category;
        }
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                "group",
                isDragging && "opacity-50 bg-muted",
                status.isDeleted && "opacity-30"
            )}
        >
            {/* Drag Handle */}
            <TableCell className="w-8 p-0 pl-1">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                    disabled={status.isDeleted}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </TableCell>

            {/* Position */}
            <TableCell className="w-16 p-1">
                <div className="text-sm text-muted-foreground text-center font-medium">
                    {(status.position !== null && status.position !== undefined) ? status.position : "-"}
                </div>
            </TableCell>

            {/* Name */}
            <TableCell className="p-1">
                <Input
                    value={status.name}
                    onChange={(e) => onUpdate(status.id, "name", e.target.value)}
                    placeholder={t("statusTemplates.statusNamePlaceholder", "Status name...")}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent"
                    disabled={status.isDeleted}
                />
            </TableCell>

            {/* Description */}
            <TableCell className="p-1">
                <Input
                    value={status.description || ""}
                    onChange={(e) => onUpdate(status.id, "description", e.target.value)}
                    placeholder={t("statusTemplates.statusDescriptionPlaceholder", "Description...")}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent"
                    disabled={status.isDeleted}
                />
            </TableCell>

            {/* Category - conditionally rendered */}
            {!hideCategory && (
                <TableCell className="w-40 p-1">
                    <Select
                        value={status.category || "not_started"}
                        onValueChange={(value) => onUpdate(status.id, "category", value as StatusCategory)}
                        disabled={status.isDeleted}
                    >
                        <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-0 bg-transparent">
                            <Tag
                                text={getCategoryLabel(status.category || "not_started")}
                                color={getCategoryColor(status.category || "not_started")}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="not_started">
                                <Tag text={getCategoryLabel("not_started")} color={getCategoryColor("not_started")} />
                            </SelectItem>
                            <SelectItem value="active">
                                <Tag text={getCategoryLabel("active")} color={getCategoryColor("active")} />
                            </SelectItem>
                            <SelectItem value="done">
                                <Tag text={getCategoryLabel("done")} color={getCategoryColor("done")} />
                            </SelectItem>
                            <SelectItem value="closed">
                                <Tag text={getCategoryLabel("closed")} color={getCategoryColor("closed")} />
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
            )}

            {/* Color */}
            <TableCell className="w-40 p-1">
                <Select
                    value={status.color || "blue"}
                    onValueChange={(value) => onUpdate(status.id, "color", value)}
                    disabled={status.isDeleted}
                >
                    <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-0 bg-transparent">
                        <ColorLabel data={status.color || "blue"} />
                    </SelectTrigger>
                    <SelectContent>
                        {LIST_COLORS.map((color) => (
                            <SelectItem key={color} value={color}>
                                <ColorLabel data={color} />
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>

            {/* Actions */}
            <TableCell className="w-10 p-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(status.id)}
                    disabled={status.isDeleted}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};

interface StatusEditorProps {
    isEditMode: boolean;
    initialStatuses?: Status[];
    onChange?: (statuses: EditableStatus[]) => void;
    getCategoryColor?: (category: StatusCategory) => string;
    getCategoryLabel?: (category: StatusCategory) => string;
}

// Category Section Component
interface CategorySectionProps {
    category: StatusCategory;
    statuses: EditableStatus[];
    onUpdate: (id: string, field: keyof EditableStatus, value: any) => void;
    onDelete: (id: string) => void;
    onAdd: (category: StatusCategory) => void;
    onDragEnd: (event: DragEndEvent, category: StatusCategory) => void;
    isExpanded?: boolean;
    getCategoryColor?: (category: StatusCategory) => string;
    getCategoryLabel?: (category: StatusCategory) => string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    statuses,
    onUpdate,
    onDelete,
    onAdd,
    onDragEnd,
    getCategoryColor: externalGetCategoryColor,
    getCategoryLabel: externalGetCategoryLabel,
}) => {
    const { t } = useTranslation();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const defaultGetCategoryColor = (category: StatusCategory): string => {
        switch (category) {
            case "not_started":
                return "yellow";
            case "active":
                return "green";
            case "done":
                return "blue";
            case "closed":
                return "red";
            default:
                return "gray";
        }
    };

    const defaultGetCategoryLabel = (category: string): string => {
        switch (category) {
            case "not_started":
                return t("statusTemplates.category.notStarted", "Not Started");
            case "active":
                return t("statusTemplates.category.active", "Active");
            case "done":
                return t("statusTemplates.category.done", "Done");
            case "closed":
                return t("statusTemplates.category.closed", "Closed");
            default:
                return category;
        }
    };

    const getCategoryColor = externalGetCategoryColor || defaultGetCategoryColor;
    const getCategoryLabel = externalGetCategoryLabel || defaultGetCategoryLabel;

    const activeStatuses = statuses.filter((s) => !s.isDeleted && s.category === category);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Tag text={getCategoryLabel(category)} color={getCategoryColor(category)} />
                </h4>
            </div>

            <div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="w-16 text-center">Nº</TableHead>
                            <TableHead>{t("statusTemplates.columns.statusName", "Name")}</TableHead>
                            <TableHead>{t("statusTemplates.columns.description", "Description")}</TableHead>
                            <TableHead className="w-40">{t("statusTemplates.columns.color", "Color")}</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => onDragEnd(event, category)}
                    >
                        <SortableContext items={activeStatuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {activeStatuses.length > 0 ? (
                                    activeStatuses.map((status) => (
                                        <SortableRow
                                            key={status.id}
                                            status={status}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                            hideCategory
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-16 text-center text-muted-foreground text-sm">
                                            {t("statusTemplates.noStatusesInCategory", "No statuses in this category")}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </SortableContext>
                    </DndContext>
                </Table>

                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground w-full mx-auto justify-center text-xs"
                    onClick={() => onAdd(category)}
                >
                    <Plus className="h-3 w-3" />
                    {t("statusTemplates.addStatus", "Add Status")}
                </Button>
            </div>
        </div>
    );
};

const StatusEditor: React.FC<StatusEditorProps> = ({
    isEditMode,
    initialStatuses = [],
    onChange,
    getCategoryColor: externalGetCategoryColor,
    getCategoryLabel: externalGetCategoryLabel,
}) => {
    const [statuses, setStatuses] = useState<EditableStatus[]>([]);


    // Initialize statuses from initialStatuses prop
    useEffect(() => {
        if (isEditMode && initialStatuses.length > 0) {
            // Edit mode - use provided initial statuses
            const sortedStatuses = [...initialStatuses].sort((a, b) => (a.position || 0) - (b.position || 0));
            setStatuses(sortedStatuses.map((status: Status) => ({ ...status, isNew: false, isDeleted: false })));
        } else if (!isEditMode) {
            // Create mode - start with empty array
            setStatuses([]);
        }
    }, [isEditMode, initialStatuses]);

    useEffect(() => {
        if (onChange) onChange(statuses);
    }, [statuses, onChange]);

    const handleUpdateStatus = useCallback((id: string, field: keyof EditableStatus, value: any) => {
        setStatuses((prev) => prev.map((status) => status.id === id ? { ...status, [field]: value } : status));
    }, []);

    const handleDeleteStatus = useCallback((id: string) => {
        setStatuses((prev) => prev.map((status) => status.id === id ? { ...status, isDeleted: true } : status).filter((status) => !(status.isNew && status.isDeleted)));
    }, []);

    const handleAddStatus = useCallback((category: StatusCategory) => {
        const categoryStatuses = statuses.filter((s) => !s.isDeleted && s.category === category);

        // Determine default color based on category
        let defaultColor = "blue";
        switch (category) {
            case "not_started":
                defaultColor = "yellow";
                break;
            case "active":
                defaultColor = "green";
                break;
            case "done":
                defaultColor = "blue";
                break;
            case "closed":
                defaultColor = "red";
                break;
        }

        const newStatus: EditableStatus = {
            id: generateId(),
            name: "",
            description: null,
            category: category,
            position: categoryStatuses.length,
            color: defaultColor,
            isNew: true,
            isDeleted: false,
        };
        setStatuses((prev) => [...prev, newStatus]);
    }, [statuses]);

    const handleDragEnd = useCallback((event: DragEndEvent, category: StatusCategory) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setStatuses((prev) => {
                // Get only statuses from this category
                const categoryStatuses = prev.filter((s) => s.category === category && !s.isDeleted);
                const otherStatuses = prev.filter((s) => s.category !== category || s.isDeleted);

                const oldIndex = categoryStatuses.findIndex((s) => s.id === active.id);
                const newIndex = categoryStatuses.findIndex((s) => s.id === over.id);

                // Reorder within category and update positions
                const reordered = arrayMove(categoryStatuses, oldIndex, newIndex).map((status, index) => ({
                    ...status,
                    position: index,
                }));

                return [...otherStatuses, ...reordered];
            });
        }
    }, []);

    const categories: StatusCategory[] = ["not_started", "active", "done", "closed"];

    return (
        <div className="space-y-6">
            {categories.map((category) => (
                <CategorySection
                    key={category}
                    category={category}
                    statuses={statuses}
                    onUpdate={handleUpdateStatus}
                    onDelete={handleDeleteStatus}
                    onAdd={handleAddStatus}
                    onDragEnd={handleDragEnd}
                    getCategoryColor={externalGetCategoryColor}
                    getCategoryLabel={externalGetCategoryLabel}
                />
            ))}
        </div>
    );
};

export default StatusEditor;

