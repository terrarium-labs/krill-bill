import { TableFilters, FilterString, FilterNumber, FilterBoolean, FilterDate, FilterArray, FilterDateTime } from "@/types/general/filters";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { isFilterComplete, getOperatorsForType } from "@/utils/filters";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import FilterRow, { FilterRowData } from "./dropdown-filter-row";
import { cn } from "@/lib/utils";

type FilterType = FilterString | FilterNumber | FilterBoolean | FilterArray | FilterDate | FilterDateTime;

interface DropdownFiltersProps {
    tableFilters: TableFilters;
    setTableFilters: (tableFilters: TableFilters) => void;
}

const DropdownFilters = ({ tableFilters, setTableFilters }: DropdownFiltersProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    // Local state to track all filter rows including incomplete ones
    const [localFilterRows, setLocalFilterRows] = useState<FilterRowData[]>([]);
    // Track if we've initialized to prevent overwriting local changes
    const [isInitialized, setIsInitialized] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize local state from tableFilters only on first load
    useEffect(() => {
        // Only sync on initial mount
        if (!isInitialized) {
            const rows = (tableFilters.filters || []).map((filter, index) => ({
                id: `filter-${index}-${filter.key}`,
                selectedKey: filter.key,
                selectedOperator: filter.operator,
                value: filter.value,
                selectedItemsData: undefined, // Will be populated when user interacts
            }));
            setLocalFilterRows(rows);
            setIsInitialized(true);
        }
    }, [isInitialized, tableFilters.filters]);

    const filterRows = localFilterRows;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = filterRows.findIndex(row => row.id === active.id);
        const newIndex = filterRows.findIndex(row => row.id === over.id);

        const reordered = arrayMove(filterRows, oldIndex, newIndex);

        // Update local state
        setLocalFilterRows(reordered);

        // Convert back to filters and update (only complete filters)
        const newFilters = reordered
            .filter(row => isFilterComplete(row))
            .map(row => {
                const baseFilter = tableFilters.keys.find(f => f.key === row.selectedKey);
                if (!baseFilter) return null;

                return {
                    ...baseFilter,
                    operator: row.selectedOperator,
                    value: row.value,
                } as FilterType;
            })
            .filter(Boolean) as FilterType[];

        setTableFilters({
            ...tableFilters,
            filters: newFilters.length > 0 ? newFilters : null,
        });
    };

    const addFilterRow = () => {
        const usedKeys = filterRows.map((row) => row.selectedKey);
        const availableKey = tableFilters.keys.find((k) => !usedKeys.includes(k.key));
        if (!availableKey) return;

        // Get the first operator for this filter type
        const operators = getOperatorsForType(availableKey.type);
        const firstOperator = operators.length > 0 ? operators[0] : null;

        const newRow: FilterRowData = {
            id: `filter-new-${Date.now()}`,
            selectedKey: availableKey.key,
            selectedOperator: firstOperator,
            value: [],
            selectedItemsData: undefined,
        };

        // Add to local state immediately (UI update)
        setLocalFilterRows([...filterRows, newRow]);

        // Don't update tableFilters yet - incomplete filter
    };

    const updateFilterRow = (id: string, updates: Partial<FilterRowData>) => {
        const rowIndex = filterRows.findIndex(row => row.id === id);
        if (rowIndex === -1) return;

        const updatedRow = { ...filterRows[rowIndex], ...updates };
        const updatedRows = filterRows.map((row, idx) => idx === rowIndex ? updatedRow : row);

        // Update local state immediately
        setLocalFilterRows(updatedRows);

        // Convert to filter format - only include complete filters
        const newFilters = updatedRows
            .filter(row => isFilterComplete(row))
            .map(row => {
                const baseFilter = tableFilters.keys.find(f => f.key === row.selectedKey);
                if (!baseFilter) return null;

                return {
                    ...baseFilter,
                    operator: row.selectedOperator,
                    value: row.value,
                } as FilterType;
            })
            .filter(Boolean) as FilterType[];

        setTableFilters({
            ...tableFilters,
            filters: newFilters.length > 0 ? newFilters : null,
        });
    };

    const deleteFilterRow = (id: string) => {
        const rowIndex = filterRows.findIndex(row => row.id === id);
        if (rowIndex === -1) return;

        const remainingRows = filterRows.filter((_, idx) => idx !== rowIndex);

        // Update local state
        setLocalFilterRows(remainingRows);

        const newFilters = remainingRows
            .filter(row => isFilterComplete(row))
            .map(row => {
                const baseFilter = tableFilters.keys.find(f => f.key === row.selectedKey);
                if (!baseFilter) return null;

                return {
                    ...baseFilter,
                    operator: row.selectedOperator,
                    value: row.value,
                } as FilterType;
            })
            .filter(Boolean) as FilterType[];

        setTableFilters({
            ...tableFilters,
            filters: newFilters.length > 0 ? newFilters : null,
        });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 shadow-none">
                    <Icon icon="lucide:filter" className="h-3 w-3" />
                    {t("common.filter", "Filter")}
                    {tableFilters.filters?.length ? (
                        <Badge variant="secondary">
                            {tableFilters.filters.length}
                        </Badge>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn(filterRows.length === 0 ? "min-w-md" : "min-w-2xl")}>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                            {filterRows.length ? t("filters.title", "Filters") : t("filters.noFiltersTitle", "No filters applied")}
                        </span>
                        {!filterRows.length && (
                            <span className="text-sm text-muted-foreground">
                                {t("filters.noFiltersDescription", "Add filters to refine your results")}
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {filterRows.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={filterRows.map(row => row.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex flex-col">
                                        {filterRows.map((row, index) => (
                                            <FilterRow
                                                key={row.id}
                                                rowData={row}
                                                availableFilters={tableFilters.keys}
                                                onUpdate={updateFilterRow}
                                                onDelete={deleteFilterRow}
                                                rowIndex={index}
                                                globalOperator={tableFilters.global_operator}
                                                onGlobalOperatorChange={(operator) => {
                                                    setTableFilters({
                                                        ...tableFilters,
                                                        global_operator: operator,
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : null}
                    </div>

                    <Button
                        size="sm"
                        className="w-fit mt-2"
                        onClick={addFilterRow}
                        disabled={filterRows.length >= tableFilters.keys.length}
                    >
                        <Icon icon="lucide:plus" className="h-3 w-3" />
                        {t("filters.addFilter", "Add Filter")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DropdownFilters;
