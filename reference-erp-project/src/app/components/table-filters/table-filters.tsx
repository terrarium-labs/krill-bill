import { TableFilters } from "@/types/general/filters";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import DropdownSort from "./components/dropdown-sort";
import DropdownFilter from "./components/dropdown-filters";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface TableFiltersRowProps {
    onChange?: (tableFilters: TableFilters) => void;
    onFilter?: (tableFilters: TableFilters) => void;
    debounceMs?: number;
    value?: TableFilters;
    /** Extra content rendered on the right side of the filters row (e.g. column selector) */
    endSlot?: ReactNode;
}

const TableFiltersRow = ({
    onChange,
    onFilter,
    debounceMs = 737,
    value: controlledValue,
    endSlot,
}: TableFiltersRowProps) => {
    const { t } = useTranslation();
    const [internalValue, setInternalValue] = useState<TableFilters | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Use controlled value if provided, otherwise use internal state
    const tableFilters = controlledValue !== undefined ? controlledValue : internalValue;

    // Track if this is the first render to avoid auto-filter on mount
    const isFirstRender = useRef(true);

    // Debounced onFilter effect
    useEffect(() => {
        if (onFilter && tableFilters) {
            // Skip on first render to avoid auto-filter
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }

            // Clear existing timeout
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            // Set new timeout
            debounceRef.current = setTimeout(() => {
                onFilter(tableFilters);
            }, debounceMs);
        }

        // Cleanup function
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [tableFilters, debounceMs]);

    const handleFiltersChange = (newFilters: TableFilters) => {
        if (controlledValue === undefined) {
            // Uncontrolled: update internal state
            setInternalValue(newFilters);
        }

        // Always call onChange immediately for controlled components
        if (onChange) {
            onChange(newFilters);
        }
    };

    const handleClearFilters = () => {
        if (!tableFilters) return;

        const clearedFilters: TableFilters = {
            ...tableFilters,
            filters: null,
            order_by: null,
            global_operator: null,
        };

        handleFiltersChange(clearedFilters);
    };

    if (!tableFilters) return null;

    const hasActiveFilters =
        (tableFilters.filters?.length ?? 0) > 0 ||
        (tableFilters.order_by?.length ?? 0) > 0;

    return (
        <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
                <DropdownSort
                    tableFilters={tableFilters}
                    setTableFilters={handleFiltersChange}
                />
                <DropdownFilter
                    tableFilters={tableFilters}
                    setTableFilters={handleFiltersChange}
                />
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shadow-none text-muted-foreground gap-1 px-2"
                        onClick={handleClearFilters}
                    >
                        <X className="h-3 w-3" />
                        {t("common.clear", "Clear")}
                    </Button>
                )}
            </div>
            {endSlot && (
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    {endSlot}
                </div>
            )}
        </div>
    );
};

export default TableFiltersRow;
