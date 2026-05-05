import { TableFilters, OrderBy } from "@/types/general/filters";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface SortableRowProps {
    orderBy: OrderBy;
    index: number;
    availableKeys: string[];
    onKeyChange: (index: number, key: string) => void;
    onDirectionChange: (index: number) => void;
    onDelete: (index: number) => void;
    t: (key: string, fallback: string) => string;
}

const SortableRow = ({ orderBy, index, availableKeys, onKeyChange, onDirectionChange, onDelete, t }: SortableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `${orderBy.key}-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 rounded-md bg-background",
                isDragging && "opacity-50 z-50 shadow-lg"
            )}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <Icon icon="lucide:grip-vertical" className="h-4 w-4" />
            </div>

            {/* Key Select */}
            <Select
                value={orderBy.key}
                onValueChange={(value) => onKeyChange(index, value)}
            >
                <SelectTrigger size="sm" className="flex-1 min-w-[120px] shadow-none capitalize">
                    <SelectValue placeholder={t("common.selectField", "Select field")} />
                </SelectTrigger>
                <SelectContent>
                    {availableKeys.map((key) => (
                        <SelectItem key={key} value={key} className="capitalize">
                            {t(`filters.columns.${key}`, key.replace(/_/g, " "))}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Direction Toggle */}
            <Button
                variant="outline"
                size="sm"
                className="w-20 justify-center items-center shadow-none"
                onClick={() => onDirectionChange(index)}
            >
                <Icon
                    icon={orderBy.direction === "ASC" ? "lucide:arrow-up" : "lucide:arrow-down"}
                    className="h-3 w-3"
                />
                {orderBy.direction}
            </Button>

            {/* Delete Button */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shadow-none"
                onClick={() => onDelete(index)}
            >
                <Icon icon="lucide:trash-2" className="h-4 w-4" />
            </Button>
        </div>
    );
};

interface DropdownSortProps {
    tableFilters: TableFilters;
    setTableFilters: (tableFilters: TableFilters) => void;
}

const DropdownSort = ({ tableFilters, setTableFilters}: DropdownSortProps) => {
    const { t } = useTranslation();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const availableKeys = tableFilters.keys.filter((k) => k.is_sortable).map((k) => k.key);
    const orderByList = tableFilters.order_by || [];

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = orderByList.findIndex((_, i) => `${orderByList[i].key}-${i}` === active.id);
        const newIndex = orderByList.findIndex((_, i) => `${orderByList[i].key}-${i}` === over.id);

        const reordered = arrayMove(orderByList, oldIndex, newIndex);
        setTableFilters({ ...tableFilters, order_by: reordered });
    };

    const handleKeyChange = (index: number, newKey: string) => {
        const updated = [...orderByList];
        updated[index] = { ...updated[index], key: newKey };
        setTableFilters({ ...tableFilters, order_by: updated });
    };

    const handleDirectionChange = (index: number) => {
        const updated = [...orderByList];
        updated[index] = {
            ...updated[index],
            direction: updated[index].direction === "ASC" ? "DESC" : "ASC"
        };
        setTableFilters({ ...tableFilters, order_by: updated });
    };

    const handleDelete = (index: number) => {
        const updated = orderByList.filter((_, i) => i !== index);
        setTableFilters({ ...tableFilters, order_by: updated.length > 0 ? updated : null });
    };

    const handleAddSort = () => {
        const usedKeys = orderByList.map((o) => o.key);
        const availableKey = availableKeys.find((k) => !usedKeys.includes(k));
        if (!availableKey) return;

        const newOrderBy: OrderBy = { key: availableKey, direction: "ASC" };
        setTableFilters({
            ...tableFilters,
            order_by: [...orderByList, newOrderBy]
        });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 shadow-none">
                    <Icon icon="lucide:arrow-down-up" className="h-3 w-3" />
                    {t("common.sort", "Sort")}
                    {tableFilters.order_by?.length && (
                        <Badge variant="secondary">
                            {tableFilters.order_by.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="min-w-md">
                <div className="flex flex-col gap-2">

                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                            {tableFilters.order_by?.length ? t("common.sortBy", "Sort by") : t("common.sortNone", "No sorting applied")}
                        </span>
                        {!tableFilters.order_by?.length && (
                            <span className="text-sm text-muted-foreground">
                                {t("common.sortNoneDescription", "Add a sorting to the table")}
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {/* DND Zone for Sorting */}
                        {orderByList.length > 0 && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={orderByList.map((o, i) => `${o.key}-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex flex-col gap-2">
                                        {orderByList.map((orderBy, index) => (
                                            <SortableRow
                                                key={`${orderBy.key}-${index}`}
                                                orderBy={orderBy}
                                                index={index}
                                                availableKeys={availableKeys}
                                                onKeyChange={handleKeyChange}
                                                onDirectionChange={handleDirectionChange}
                                                onDelete={handleDelete}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>

                    <Button
                        size="sm"
                        className="w-fit mt-2"
                        onClick={handleAddSort}
                        disabled={orderByList.length >= availableKeys.length}
                    >
                        <Icon icon="lucide:plus" className="h-3 w-3 " />
                        {t("common.addSorting", "Add sorting")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DropdownSort;