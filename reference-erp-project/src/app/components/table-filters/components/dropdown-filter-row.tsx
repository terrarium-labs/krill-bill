import { FilterString, FilterNumber, FilterBoolean, FilterDate, FilterArray, FilterCountry, FilterDateTime } from "@/types/general/filters";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "../../forms-elements/multi-select";
import { MultiSelectApi } from "../../forms-elements/multi-select-api";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { getOperatorsForType, getOperatorName, operatorRequiresValue } from "@/utils/filters";
import { useLabelRenderer } from "@/utils/labels";
import { formatDate, formatDateForAPI, parseLocalDateString, replacePlaceholders, keysToSnakeCase } from "@/utils/miscelanea";
import { sortStatusesByCategoryAndPosition } from "@/utils/sorting";
import { useSortable } from '@dnd-kit/sortable';
import { useParams } from "react-router-dom";
import CountriesSelect from '@/app/components/table-filters/components/countries-select';
import { MultiSelectApiHierarchy } from "@/app/components/forms-elements/multi-select-api-hierarchy";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";

const baseApiUrl = localStorage.getItem("main-api-url") === "dev" ? process.env.REACT_APP_MAIN_API_URL_DEV : process.env.REACT_APP_MAIN_API_URL;
import { laiaFetch } from '@/api/0.core/basics';


type FilterType = FilterString | FilterNumber | FilterBoolean | FilterArray | FilterDate | FilterCountry | FilterDateTime;


export interface FilterRowData {
    id: string;
    selectedKey: string | null;
    selectedOperator: string | null;
    value: (string | number | boolean | null)[];
    /** Full item objects for selected values (used to display labels before fetch) */
    selectedItemsData?: any[];
}

interface FilterRowProps {
    rowData: FilterRowData;
    availableFilters: FilterType[];
    onUpdate: (id: string, updates: Partial<FilterRowData>) => void;
    onDelete: (id: string) => void;
    rowIndex: number;
    globalOperator: "AND" | "OR" | null;
    onGlobalOperatorChange?: (operator: "AND" | "OR") => void;
}

const FilterRow = ({ rowData, availableFilters, onUpdate, onDelete, rowIndex, globalOperator, onGlobalOperatorChange }: FilterRowProps) => {
    const { t } = useTranslation();
    const params = useParams();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: rowData.id });

    const renderOperatorIndicator = () => {
        if (rowIndex === 0) {
            // First row: show "Where" text
            return (
                <span className="text-sm text-muted-foreground w-[60px] text-center">
                    {t("filters.where", "Where")}
                </span>
            );
        } else if (rowIndex === 1) {
            // Second row: show toggle button to switch between and/or
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-[60px] justify-center items-center shadow-none"
                    onClick={() => onGlobalOperatorChange?.(globalOperator === "OR" ? "AND" : "OR")}
                >
                    {globalOperator === "OR" ? t("filters.or", "or") : t("filters.and", "and")}
                </Button>
            );
        } else {
            // Other rows: show the selected operator as text
            return (
                <span className="text-sm text-muted-foreground w-[60px] text-center">
                    {globalOperator === "OR" ? t("filters.or", "or") : t("filters.and", "and")}
                </span>
            );
        }
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const selectedFilter = availableFilters.find(f => f.key === rowData.selectedKey);

    const operatorOptions = selectedFilter
        ? getOperatorsForType(selectedFilter.type)
            .filter(op => op !== null)
            .map(op => {
                const { key, fallback } = getOperatorName(op, selectedFilter.type);
                return {
                    value: op,
                    label: t(key, fallback)
                };
            })
        : [];

    const filterOptions = availableFilters.map(filter => ({
        value: filter.key,
        label: t(`filters.columns.${filter.key}`, filter.key.replace(/_/g, " ")),
    }));

    const renderValueInput = () => {
        if (!selectedFilter || !rowData.selectedOperator) return null;

        // Don't show input for operators that don't require a value
        if (!operatorRequiresValue(rowData.selectedOperator)) {
            return null;
        }

        switch (selectedFilter.type) {
            case "string":
                return (
                    <Input
                        type="text"
                        value={(rowData.value[0] as string) ?? ""}
                        onChange={(e) => onUpdate(rowData.id, { value: [e.target.value] })}
                        placeholder={t("filters.enterValue", "Enter value")}
                        className="h-8 shadow-none"
                    />
                );
            case "number":
                // Handle isBetween operator with two inputs
                if (rowData.selectedOperator === "isBetween") {
                    return (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={(rowData.value[0] as number) ?? ""}
                                onChange={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value) : null;
                                    onUpdate(rowData.id, { value: [newValue, rowData.value[1] ?? null] });
                                }}
                                placeholder={t("filters.min", "Min")}
                                className="h-8 shadow-none flex-1"
                            />
                            <span className="text-muted-foreground text-sm">—</span>
                            <Input
                                type="number"
                                value={(rowData.value[1] as number) ?? ""}
                                onChange={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value) : null;
                                    onUpdate(rowData.id, { value: [rowData.value[0] ?? null, newValue] });
                                }}
                                placeholder={t("filters.max", "Max")}
                                className="h-8 shadow-none flex-1"
                            />
                        </div>
                    );
                }
                return (
                    <Input
                        type="number"
                        value={(rowData.value[0] as number) ?? ""}
                        onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw.trim() === "" ? null : parseFloat(raw);
                            onUpdate(rowData.id, { value: [Number.isFinite(v) ? v : null] });
                        }}
                        placeholder={t("filters.enterValue", "Enter value")}
                        className="h-8 shadow-none"
                    />
                );
            case "boolean":
                return (
                    <div className="flex items-center gap-2 h-8">
                        <Checkbox
                            checked={(rowData.value[0] as boolean) ?? false}
                            onCheckedChange={(checked) => onUpdate(rowData.id, { value: [checked as boolean] })}
                        />
                        <span className="text-sm">{rowData.value[0] ? t("common.true", "True") : t("common.false", "False")}</span>
                    </div>
                );
            case "date":
                // Handle isBetween operator with date range picker
                if (rowData.selectedOperator === "isBetween") {
                    const fromDate = rowData.value[0] ? parseLocalDateString(rowData.value[0] as string) : undefined;
                    const toDate = rowData.value[1] ? parseLocalDateString(rowData.value[1] as string) : undefined;

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 w-full justify-start text-left font-normal shadow-none"
                                >
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    {fromDate && toDate
                                        ? `${formatDate(fromDate, { showTime: false })} — ${formatDate(toDate, { showTime: false })}`
                                        : fromDate
                                            ? `${formatDate(fromDate, { showTime: false })} — ...`
                                            : t("filters.selectDateRange", "Select date range")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    captionLayout="dropdown"
                                    selected={{ from: fromDate, to: toDate }}
                                    onSelect={(range) => {
                                        const from = range?.from ? formatDateForAPI(range.from) : null;
                                        const to = range?.to ? formatDateForAPI(range.to) : null;
                                        onUpdate(rowData.id, { value: [from, to] });
                                    }}
                                    numberOfMonths={2}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    );
                }
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-8 w-full justify-start text-left font-normal shadow-none"
                            >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {rowData.value[0]
                                    ? formatDate(parseLocalDateString(rowData.value[0] as string), { showTime: false })
                                    : t("filters.selectDate", "Select date")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                captionLayout="dropdown"
                                selected={rowData.value[0] ? parseLocalDateString(rowData.value[0] as string) : undefined}
                                onSelect={(date) => onUpdate(rowData.id, { value: [date ? formatDateForAPI(date) : null] })}
                            />
                        </PopoverContent>
                    </Popover>
                );
            case "datetime":
                // Handle isBetween: same range calendar as date, with from at 00:00:00 and to at 23:59:00 (no time inputs)
                if (rowData.selectedOperator === "isBetween") {
                    const fromRaw = rowData.value[0] as string | null | undefined;
                    const toRaw = rowData.value[1] as string | null | undefined;
                    const fromParsed = fromRaw == null || fromRaw === ""
                        ? undefined
                        : (fromRaw.includes("T") ? new Date(fromRaw) : parseLocalDateString(fromRaw));
                    const toParsed = toRaw == null || toRaw === ""
                        ? undefined
                        : (toRaw.includes("T") ? new Date(toRaw) : parseLocalDateString(toRaw));

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 w-full justify-start text-left font-normal shadow-none"
                                >
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    {fromParsed && toParsed
                                        ? `${formatDate(fromParsed, { showTime: false })} — ${formatDate(toParsed, { showTime: false })}`
                                        : fromParsed
                                            ? `${formatDate(fromParsed, { showTime: false })} — ...`
                                            : t("filters.selectDateRange", "Select date range")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    captionLayout="dropdown"
                                    selected={{ from: fromParsed ?? undefined, to: toParsed ?? undefined }}
                                    onSelect={(range) => {
                                        const from = range?.from
                                            ? (() => {
                                                const d = new Date(range.from!);
                                                d.setHours(0, 0, 0, 0);
                                                return formatDateForAPI(d, "minute");
                                            })()
                                            : null;
                                        const to = range?.to
                                            ? (() => {
                                                const d = new Date(range.to!);
                                                d.setHours(23, 59, 0, 0);
                                                return formatDateForAPI(d, "minute");
                                            })()
                                            : null;
                                        onUpdate(rowData.id, { value: [from, to] });
                                    }}
                                    numberOfMonths={2}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    );
                }
                // Single datetime: use DateTimePicker as in time-record-edit-modal (controlled mode)
                const raw = rowData.value[0] as string | null | undefined;
                const parsedDt = raw == null || raw === ""
                    ? undefined
                    : (raw.includes("T") ? new Date(raw) : parseLocalDateString(raw));

                return (
                    <div className="w-full min-w-0">
                        <DateTimePicker
                            value={parsedDt ?? null}
                            onChange={(d) =>
                                onUpdate(rowData.id, { value: [d ? formatDateForAPI(d, "minute") : null] })
                            }
                            placeholder={t("filters.selectDate", "Select date")}
                            showTime={true}
                            showMonthYearPicker={true}
                            format24h={true}
                            className="h-8"
                        />
                    </div>
                );
            case "country":
                return (
                    <CountriesSelect
                        value={Array.isArray(rowData.value) ? (rowData.value as string[]) : null}
                        onChange={(value) => onUpdate(rowData.id, { value })}
                        placeholder={t("filters.selectCountry", "Select country")}
                        className="h-8 w-full"
                    />
                );
            case "array":
                if (selectedFilter.options && selectedFilter.options.length > 0) {

                    const renderLabel = useLabelRenderer(selectedFilter.key);
                    return (
                        <MultiSelect
                            options={selectedFilter.options.map(opt => ({
                                value: opt,
                                label: renderLabel ? renderLabel(opt) : opt,
                            }))}
                            selected={rowData.value as string[]}
                            onSelectedChange={(value: string[]) => onUpdate(rowData.id, { value })}
                            placeholder={t("filters.selectValues", "Select values")}
                            size="sm"
                            className="w-full h-8"
                        />
                    );
                } else if (selectedFilter.endpoint) {

                    const fetchOptions = async (query: string, pageToken: string | null, _: null) => {
                        if (!selectedFilter.endpoint || !params) return { success: [] };
                        const normalizedParams = keysToSnakeCase(params);
                        const resolvedPath = replacePlaceholders(selectedFilter.endpoint.path, normalizedParams);
                        const url = new URL(resolvedPath, baseApiUrl);
                        if (query) {
                            url.searchParams.set("query", query);
                        }
                        if (pageToken) {
                            url.searchParams.set("page_token", pageToken);
                        }
                        const response = await laiaFetch(url, { method: "GET" });
                        if (selectedFilter.endpoint.key === "statuses" && response.success?.[selectedFilter.endpoint.key]) {
                            const statuses = sortStatusesByCategoryAndPosition(response.success[selectedFilter.endpoint.key] || []);
                            return { ...response, success: { ...response.success, [selectedFilter.endpoint.key]: statuses } };
                        }
                        return response;
                    };

                    const renderLabel = useLabelRenderer(selectedFilter.endpoint.key);

                    if (selectedFilter.endpoint.type === "hierarchy") {
                        return (
                            <MultiSelectApiHierarchy
                                key={`${rowData.id}-${selectedFilter.key}`}
                                fetchOptions={fetchOptions}
                                fetchArgs={[]}
                                optionsKey={selectedFilter.endpoint.key}
                                parentKey="parent"
                                customValueKey={(item) => item.id}
                                customLabelKey={(item) => renderLabel ? renderLabel(item) : item.name}
                                placeholder={t("filters.selectValues", "Select values")}
                                searchPlaceholder={t("filters.searchValues", "Search...")}
                                emptyText={t("filters.noOptionsFound", "No options found")}
                                value={rowData.value as string[]}
                                onChangeValue={(value: string[]) => onUpdate(rowData.id, { value })}
                                onChangeValueWithItem={(value: string[], itemsMap: Map<string, any>) => {
                                    // Store full item data for display before fetch
                                    const selectedItemsData = Array.from(itemsMap.values());
                                    onUpdate(rowData.id, { value, selectedItemsData });
                                }}
                                defaultItems={rowData.selectedItemsData}
                                size="sm"
                                className="w-full h-8 truncate"
                            />
                        );

                    } else {
                        return (
                            <MultiSelectApi
                                key={`${rowData.id}-${selectedFilter.key}`}
                                fetchOptions={fetchOptions}
                                fetchArgs={[]}
                                optionsKey={selectedFilter.endpoint.key}
                                customValueKey={(item) => item.id}
                                customLabelKey={(item) => renderLabel ? renderLabel(item) : item.name}
                                placeholder={t("filters.selectValues", "Select values")}
                                searchPlaceholder={t("filters.searchValues", "Search...")}
                                emptyText={t("filters.noOptionsFound", "No options found")}
                                value={rowData.value as string[]}
                                onChangeValue={(value: string[]) => onUpdate(rowData.id, { value })}
                                onChangeValueWithItem={(value: string[], itemsMap: Map<string, any>) => {
                                    // Store full item data for display before fetch
                                    const selectedItemsData = Array.from(itemsMap.values());
                                    onUpdate(rowData.id, { value, selectedItemsData });
                                }}
                                defaultItems={rowData.selectedItemsData}
                                size="sm"
                                className="w-full h-8 truncate"
                            />
                        );
                    }

                }
                return null;
            default:
                return null;
        }
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
            {/* Operator Indicator (Where / and/or dropdown / and/or text) */}
            {renderOperatorIndicator()}

            {/* Field Select */}
            <Select
                value={rowData.selectedKey || ""}
                onValueChange={(value) => {
                    const newFilter = availableFilters.find(f => f.key === value);
                    const operators = newFilter ? getOperatorsForType(newFilter.type) : [];
                    const firstOperator = operators.length > 0 ? operators[0] : null;
                    onUpdate(rowData.id, {
                        selectedKey: value || null,
                        selectedOperator: firstOperator,
                        value: [],
                        selectedItemsData: undefined
                    });
                }}
            >
                <SelectTrigger size="sm" className="flex-1 shadow-none capitalize">
                    <SelectValue placeholder={t("filters.selectField", "Select field")} />
                </SelectTrigger>
                <SelectContent>
                    {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="capitalize">
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Operator Select */}
            <Select
                value={rowData.selectedOperator || ""}
                onValueChange={(value) => onUpdate(rowData.id, {
                    selectedOperator: value || null,
                    value: [],
                    selectedItemsData: undefined
                })}
                disabled={!rowData.selectedKey}
            >
                <SelectTrigger size="sm" className="flex-1 shadow-none">
                    <SelectValue placeholder={t("filters.selectOperator", "Select operator")} />
                </SelectTrigger>
                <SelectContent>
                    {operatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Value Input */}
            <div className="flex-2 py-1">
                {renderValueInput()}
            </div>

            {/* Delete Button */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shadow-none"
                onClick={() => onDelete(rowData.id)}
            >
                <Icon icon="lucide:trash-2" className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default FilterRow;