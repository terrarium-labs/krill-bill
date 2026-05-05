import { useParams } from "react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { ReportParameter, ReportParameterValues } from "@/types/general/reports";
import { getOrgEmployees } from "@/api/employees/employees";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface DynamicFieldProps {
    param: ReportParameter;
    values: ReportParameterValues;
    onChange: (key: string, value: ReportParameterValues[string]) => void;
    error?: string;
}

const EMPLOYEE_OPTIONAL_HINT = "Leave empty to include all employees";
const ALL_OPTIONAL_HINT = "Optional — leave empty to include all";

function getHint(param: ReportParameter): string | undefined {
    if (param.required) return undefined;
    if (param.type === "employee_select" || param.type === "employee_multi_select") {
        return EMPLOYEE_OPTIONAL_HINT;
    }
    if (param.type === "select" || param.type === "text" || param.type === "number") {
        return ALL_OPTIONAL_HINT;
    }
    return undefined;
}

const DynamicField = ({ param, values, onChange, error }: DynamicFieldProps) => {
    const { orgId } = useParams<{ orgId: string }>();
    const { t } = useTranslation();

    const fieldId = `report-field-${param.key}`;
    const value = values[param.key];
    const hint = getHint(param);

    const labelNode = (
        <Label htmlFor={fieldId} className="text-sm font-medium">
            {param.label}
            {param.required && <span className="text-foreground ml-0.5">*</span>}
        </Label>
    );

    const hintNode = hint && (
        <p className="text-xs text-muted-foreground">{t(`reports.hints.${param.key}`, hint)}</p>
    );

    if (param.type === "date") {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <DateTimePicker
                    className="w-full"
                    value={(value as Date | null | undefined) ?? null}
                    onChange={(date) => onChange(param.key, date)}
                    placeholder={param.placeholder}
                />
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "date_range") {
        const fromKey = `${param.key}_from`;
        const toKey = `${param.key}_to`;
        return (
            <div className="space-y-1.5 w-full">
                <p className="text-sm font-medium">
                    {param.label}
                    {param.required && <span className="text-foreground ml-0.5">*</span>}
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{param.range_label_from ?? "From"}</Label>
                        <DateTimePicker
                            className="w-full"
                            value={(values[fromKey] as Date | null | undefined) ?? null}
                            onChange={(date) => onChange(fromKey, date)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{param.range_label_to ?? "To"}</Label>
                        <DateTimePicker
                            className="w-full"
                            value={(values[toKey] as Date | null | undefined) ?? null}
                            onChange={(date) => onChange(toKey, date)}
                        />
                    </div>
                </div>
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "text") {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <Input
                    id={fieldId}
                    value={(value as string | undefined) ?? ""}
                    onChange={(e) => onChange(param.key, e.target.value)}
                    placeholder={param.placeholder}
                    className={cn("w-full", error && "border-destructive")}
                />
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "number") {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <Input
                    id={fieldId}
                    type="number"
                    value={(value as string | undefined) ?? ""}
                    onChange={(e) => onChange(param.key, e.target.value)}
                    placeholder={param.placeholder}
                    className={cn("w-full", error && "border-destructive")}
                />
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "select" && param.options) {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <Select
                    value={(value as string | undefined) ?? ""}
                    onValueChange={(v) => onChange(param.key, v)}
                >
                    <SelectTrigger id={fieldId} className={cn("w-full", error && "border-destructive")}>
                        <SelectValue placeholder={param.placeholder ?? "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                        {param.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "employee_select") {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <MultiSelectApi
                    fetchOptions={getOrgEmployees}
                    fetchArgs={[orgId]}
                    optionsKey="employees"
                    customValueKey={(e: any) => e.id}
                    customLabelKey={(e: any) => `${e.first_name} ${e.last_name}`}
                    value={(value as string[] | undefined) ?? []}
                    onChangeValue={(v) => onChange(param.key, v)}
                    maxCount={1}
                    placeholder={param.placeholder ?? "Search employee..."}
                    className="w-full"
                />
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "employee_multi_select") {
        return (
            <div className="space-y-1.5 w-full">
                {labelNode}
                <MultiSelectApi
                    fetchOptions={getOrgEmployees}
                    fetchArgs={[orgId]}
                    optionsKey="employees"
                    customValueKey={(e: any) => e.id}
                    customLabelKey={(e: any) => `${e.first_name} ${e.last_name}`}
                    value={(value as string[] | undefined) ?? []}
                    onChangeValue={(v) => onChange(param.key, v)}
                    placeholder={param.placeholder ?? "Search employees..."}
                    className="w-full"
                />
                {hintNode}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    if (param.type === "boolean") {
        return (
            <div className="flex items-center gap-3 py-1 w-full">
                <Switch
                    id={fieldId}
                    checked={(value as boolean | undefined) ?? false}
                    onCheckedChange={(checked) => onChange(param.key, checked)}
                />
                {labelNode}
            </div>
        );
    }

    return null;
};

export default DynamicField;
