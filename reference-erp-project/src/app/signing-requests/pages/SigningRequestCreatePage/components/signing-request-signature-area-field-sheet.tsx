import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { SignatureAreaVisual } from "@/app/signing-requests/pages/SigningRequestCreatePage/components/pdf-multi-signature-canvas";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { SignaturitFieldTypeIcon } from "@/app/signing-requests/pages/SigningRequestCreatePage/components/signaturit-field-type-icon";
import { cn } from "@/lib/utils";
import {
    signaturitFieldTypeDefaultLabel,
    signaturitFieldTypeLabelKey,
} from "@/app/signing-requests/utils/signaturit-field-type-labels";
import type { SignaturitFieldFormState, SignaturitFieldType } from "@/types/general/signing-requests";
import {
    SIGNATURIT_FIELD_TYPES,
    clampSignaturitDropdownDefaultIndex,
    createDefaultSignaturitFieldState,
    nextSignaturitFieldIdFromAreas,
} from "@/utils/signing-requests";

/**
 * Old Signaturit API: hide editor types that map to single-line `text` widgets (re-enable when the new API ships).
 * Previously listed here — keep for future re-implementation:
 *   - "name"
 *   - "surname"
 *   - "city"
 *   - "Company"
 * `textArea` stays available (multi-line text).
 */
const SIGNATURIT_FIELD_TYPES_DISABLED_OLD_API: SignaturitFieldType[] = [
    "name",
    "surname",
    "city",
    "Company",
];

/** Persisted areas may still store removed `editableField`; coerce to `textArea` on load. */
const LEGACY_SIGNATURIT_FIELD_TYPES_COERCE_TO_TEXTAREA: readonly string[] = [
    ...SIGNATURIT_FIELD_TYPES_DISABLED_OLD_API,
    "editableField",
];

const SIGNATURIT_FIELD_TYPES_SHEET_SELECTOR = SIGNATURIT_FIELD_TYPES.filter(
    (ft) => !SIGNATURIT_FIELD_TYPES_DISABLED_OLD_API.includes(ft)
);

function parseSignaturitDefaultDate(raw: string): Date | null {
    const s = raw.trim();
    if (!s) return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) {
        const y = Number(iso[1]);
        const mo = Number(iso[2]) - 1;
        const d = Number(iso[3]);
        const date = new Date(y, mo, d);
        if (
            date.getFullYear() === y &&
            date.getMonth() === mo &&
            date.getDate() === d
        ) {
            return date;
        }
    }
    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSignaturitDefaultDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function mergeSignaturit(area: SignatureAreaVisual | null): SignaturitFieldFormState {
    if (!area?.signaturit) return createDefaultSignaturitFieldState();
    const merged = { ...createDefaultSignaturitFieldState(), ...area.signaturit };
    const defaults = createDefaultSignaturitFieldState();
    if (!merged.dropdownOptions?.length) {
        merged.dropdownOptions = defaults.dropdownOptions;
    }
    merged.dropdownDefaultIndex = clampSignaturitDropdownDefaultIndex(
        merged.dropdownOptions.length,
        merged.dropdownDefaultIndex
    );
    merged.radioIsDefault = merged.radioIsDefault ?? false;
    merged.checkboxDefaultChecked = merged.checkboxDefaultChecked ?? false;
    merged.checkboxYesNoOptions = merged.checkboxYesNoOptions ?? false;
    if (
        merged.fieldType === "checkbox" &&
        !merged.checkboxDefaultChecked &&
        merged.defaultValue.trim().toLowerCase() === "true"
    ) {
        merged.checkboxDefaultChecked = true;
    }
    if (SIGNATURIT_FIELD_TYPES_DISABLED_OLD_API.includes(merged.fieldType)) {
        merged.fieldType = "textArea";
    }
    return merged;
}

type SigningRequestSignatureAreaFieldSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    area: SignatureAreaVisual | null;
    pageLabel: number;
    /** All placement areas (for default field ids when changing type). */
    allAreas: SignatureAreaVisual[];
    onChange: (areaId: string, next: SignaturitFieldFormState) => void;
    /** Adds another radio placement with the same field id (same page, offset rect). */
    onAddRadioGroupMember?: (sourceAreaId: string) => void;
};

const SigningRequestSignatureAreaFieldSheet = ({
    open,
    onOpenChange,
    area,
    pageLabel,
    allAreas,
    onChange,
    onAddRadioGroupMember,
}: SigningRequestSignatureAreaFieldSheetProps) => {
    const { t } = useTranslation();
    const [local, setLocal] = useState<SignaturitFieldFormState>(createDefaultSignaturitFieldState());
    const allAreasRef = useRef(allAreas);
    allAreasRef.current = allAreas;

    useEffect(() => {
        if (!open || !area) return;
        let m = mergeSignaturit(area);
        const ft = m.fieldType;
        let shouldPersist = false;
        if (
            area.signaturit &&
            LEGACY_SIGNATURIT_FIELD_TYPES_COERCE_TO_TEXTAREA.includes(area.signaturit.fieldType as string)
        ) {
            shouldPersist = true;
        }
        if (!m.fieldName.trim()) {
            m = {
                ...m,
                fieldName: t(signaturitFieldTypeLabelKey(ft), signaturitFieldTypeDefaultLabel(ft)),
            };
            shouldPersist = true;
        }
        if (!m.fieldId.trim()) {
            m = {
                ...m,
                fieldId: nextSignaturitFieldIdFromAreas(allAreasRef.current, ft, area.id),
            };
            shouldPersist = true;
        }
        setLocal(m);
        if (shouldPersist) onChange(area.id, m);
    }, [open, area?.id, t, onChange]);

    if (!area) return null;

    const radioGroupSize =
        local.fieldType === "radio" && local.fieldId.trim().length > 0
            ? allAreas.filter(
                  (a) =>
                      a.signaturit?.fieldType === "radio" &&
                      (a.signaturit.fieldId?.trim() ?? "") === local.fieldId.trim()
              ).length
            : 0;

    /** Old API period: name/id are system-assigned only (see auto-fill in useEffect). */
    const fieldDetailsLocked = true;
    const showDefaultValueField =
        local.fieldType !== "dropdown" &&
        local.fieldType !== "radio" &&
        local.fieldType !== "checkbox" &&
        local.fieldType !== "signature" &&
        local.fieldType !== "image";

    const patch = (partial: Partial<SignaturitFieldFormState>) => {
        setLocal((prev) => {
            const next = { ...prev, ...partial };
            if (next.dropdownOptions.length > 0) {
                next.dropdownDefaultIndex = clampSignaturitDropdownDefaultIndex(
                    next.dropdownOptions.length,
                    next.dropdownDefaultIndex
                );
            }
            onChange(area.id, next);
            return next;
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto rounded-l-xl sm:max-w-2xl">
                <SheetHeader className="pb-0">
                    <SheetTitle>
                        {t("signingRequests.create.signaturitSheetTitle", "Field placement")}
                    </SheetTitle>
                    <SheetDescription>
                        {t(
                            "signingRequests.create.signaturitSheetDesc",
                            "Configure this Signaturit field for page {{page}}.",
                            { page: pageLabel }
                        )}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 p-6 pt-0">
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {t("signingRequests.create.signaturitSectionType", "Field type")}
                        </h3>
                        <Select
                            value={local.fieldType}
                            onValueChange={(v) => {
                                const ft = v as SignaturitFieldType;
                                const fieldName = t(
                                    signaturitFieldTypeLabelKey(ft),
                                    signaturitFieldTypeDefaultLabel(ft)
                                );
                                const fieldId = nextSignaturitFieldIdFromAreas(allAreas, ft, area.id);
                                const defaults = createDefaultSignaturitFieldState();
                                patch({
                                    ...defaults,
                                    fieldType: ft,
                                    fieldName,
                                    fieldId,
                                });
                            }}
                        >
                            <SelectTrigger id="sr-field-type" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SIGNATURIT_FIELD_TYPES_SHEET_SELECTOR.map((ft) => (
                                    <SelectItem key={ft} value={ft}>
                                        <span className="flex items-center gap-2">
                                            <SignaturitFieldTypeIcon
                                                type={ft}
                                                className="size-4 shrink-0 text-muted-foreground"
                                            />
                                            {t(
                                                signaturitFieldTypeLabelKey(ft),
                                                signaturitFieldTypeDefaultLabel(ft)
                                            )}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {t("signingRequests.create.signaturitSectionDetails", "Field details")}
                        </h3>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <div className="border-b border-border px-3 py-3 last:border-b-0">
                                <Label
                                    htmlFor="sr-field-name"
                                    className="text-xs font-medium text-muted-foreground"
                                >
                                    {t("signingRequests.create.signaturitFieldName", "Field name")}
                                </Label>
                                <Input
                                    id="sr-field-name"
                                    className="mt-1.5"
                                    value={local.fieldName}
                                    disabled={fieldDetailsLocked}
                                    onChange={(e) => patch({ fieldName: e.target.value })}
                                    placeholder={t(
                                        "signingRequests.create.signaturitFieldNamePlaceholder",
                                        "Visible label"
                                    )}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="border-b border-border px-3 py-3 last:border-b-0">
                                <Label
                                    htmlFor="sr-field-id"
                                    className="text-xs font-medium text-muted-foreground"
                                >
                                    {t("signingRequests.create.signaturitFieldId", "Field ID")}
                                </Label>
                                <Input
                                    id="sr-field-id"
                                    className={cn("mt-1.5 font-mono text-sm")}
                                    value={local.fieldId}
                                    disabled={fieldDetailsLocked}
                                    onChange={(e) => patch({ fieldId: e.target.value })}
                                    placeholder={t(
                                        "signingRequests.create.signaturitFieldIdPlaceholder",
                                        "Internal identifier"
                                    )}
                                    autoComplete="off"
                                />
                            </div>
                            {local.fieldType === "radio" ? (
                                <div className="space-y-2 border-t border-border px-3 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {t(
                                            "signingRequests.create.signaturitRadioGroupLabel",
                                            "Radio group ({{n}})",
                                            { n: radioGroupSize }
                                        )}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="w-full sm:w-auto"
                                        onClick={() => onAddRadioGroupMember?.(area.id)}
                                    >
                                        {t("signingRequests.create.signaturitRadioAddPlacement", "Add")}
                                    </Button>
                                </div>
                            ) : null}
                            {local.fieldType === "dropdown" ? (
                                <div className="px-3 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {t("signingRequests.create.signaturitDropdownOptions", "Options")}
                                    </p>
                                    <div className="mt-2 overflow-hidden rounded-md border border-border">
                                        {local.dropdownOptions.map((optionLabel, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "flex flex-wrap items-center gap-3 border-border px-3 py-2.5",
                                                    index < local.dropdownOptions.length - 1 && "border-b"
                                                )}
                                            >
                                                <Input
                                                    id={`sr-dropdown-opt-${index}`}
                                                    className="min-w-[8rem] flex-1"
                                                    value={optionLabel}
                                                    onChange={(e) =>
                                                        patch({
                                                            dropdownOptions: local.dropdownOptions.map((o, j) =>
                                                                j === index ? e.target.value : o
                                                            ),
                                                        })
                                                    }
                                                    placeholder={t(
                                                        "signingRequests.create.signaturitDropdownOptionPlaceholder",
                                                        "Option {{n}}",
                                                        { n: index + 1 }
                                                    )}
                                                    autoComplete="off"
                                                />
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Checkbox
                                                        id={`sr-dropdown-default-${index}`}
                                                        checked={local.dropdownDefaultIndex === index}
                                                        onCheckedChange={(c) => {
                                                            if (c === true) {
                                                                patch({ dropdownDefaultIndex: index });
                                                            } else if (local.dropdownDefaultIndex === index) {
                                                                patch({ dropdownDefaultIndex: 0 });
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`sr-dropdown-default-${index}`}
                                                        className="cursor-pointer text-sm font-normal leading-none"
                                                    >
                                                        {t(
                                                            "signingRequests.create.signaturitDropdownDefaultOption",
                                                            "Default"
                                                        )}
                                                    </Label>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-border px-3 py-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                onClick={() =>
                                                    patch({
                                                        dropdownOptions: [
                                                            ...local.dropdownOptions,
                                                            t(
                                                                "signingRequests.create.signaturitDropdownOptionN",
                                                                "Option {{n}}",
                                                                { n: local.dropdownOptions.length + 1 }
                                                            ),
                                                        ],
                                                    })
                                                }
                                            >
                                                {t("signingRequests.create.signaturitAddOption", "Add option")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : local.fieldType === "date" || local.fieldType === "age" ? (
                                <div className="px-3 py-3">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        {t("signingRequests.create.signaturitDefaultValue", "Default value")}
                                    </Label>
                                    <div className="mt-1.5">
                                        <DateTimePicker
                                            value={parseSignaturitDefaultDate(local.defaultValue)}
                                            onChange={(d) =>
                                                patch({
                                                    defaultValue: d ? formatSignaturitDefaultDate(d) : "",
                                                })
                                            }
                                            showTime={false}
                                            placeholder={t(
                                                "signingRequests.create.signaturitDefaultValuePlaceholder",
                                                "Leave blank if none"
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : showDefaultValueField ? (
                                <div className="px-3 py-3">
                                    <Label
                                        htmlFor="sr-default-value"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        {t("signingRequests.create.signaturitDefaultValue", "Default value")}
                                    </Label>
                                    <Input
                                        id="sr-default-value"
                                        className="mt-1.5"
                                        value={local.defaultValue}
                                        onChange={(e) => patch({ defaultValue: e.target.value })}
                                        placeholder={t(
                                            "signingRequests.create.signaturitDefaultValuePlaceholder",
                                            "Leave blank if none"
                                        )}
                                        autoComplete="off"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {local.fieldType !== "signature" ? (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {t("signingRequests.create.signaturitSectionOptions", "Options")}
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-border">
                                {local.fieldType === "radio" ? (
                                    <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-3">
                                        <Label
                                            htmlFor="sr-radio-default-value"
                                            className="text-sm font-medium leading-snug"
                                        >
                                            {t("signingRequests.create.signaturitDefaultValue", "Default value")}
                                        </Label>
                                        <Checkbox
                                            id="sr-radio-default-value"
                                            checked={local.radioIsDefault}
                                            onCheckedChange={(c) =>
                                                patch({ radioIsDefault: c === true })
                                            }
                                        />
                                    </div>
                                ) : null}
                                {local.fieldType === "checkbox" ? (
                                    <>
                                        <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-3">
                                            <Label
                                                htmlFor="sr-checkbox-default-value"
                                                className="text-sm font-medium leading-snug"
                                            >
                                                {t("signingRequests.create.signaturitDefaultValue", "Default value")}
                                            </Label>
                                            <Checkbox
                                                id="sr-checkbox-default-value"
                                                checked={local.checkboxDefaultChecked}
                                                onCheckedChange={(c) =>
                                                    patch({ checkboxDefaultChecked: c === true })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-3">
                                            <Label
                                                htmlFor="sr-checkbox-yes-no"
                                                className="text-sm font-medium leading-snug"
                                            >
                                                {t(
                                                    "signingRequests.create.signaturitCheckboxYesNoOptions",
                                                    "Yes/No options"
                                                )}
                                            </Label>
                                            <Checkbox
                                                id="sr-checkbox-yes-no"
                                                checked={local.checkboxYesNoOptions}
                                                onCheckedChange={(c) =>
                                                    patch({ checkboxYesNoOptions: c === true })
                                                }
                                            />
                                        </div>
                                    </>
                                ) : null}
                                <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-3 last:border-b-0">
                                    <Label htmlFor="sr-mandatory" className="text-sm font-medium leading-snug">
                                        {t("signingRequests.create.signaturitMandatory", "Mandatory field")}
                                    </Label>
                                    <Checkbox
                                        id="sr-mandatory"
                                        checked={local.mandatory}
                                        onCheckedChange={(c) => patch({ mandatory: c === true })}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4 px-3 py-3">
                                    <Label htmlFor="sr-editable" className="text-sm font-medium leading-snug">
                                        {t("signingRequests.create.signaturitEditable", "Editable field")}
                                    </Label>
                                    <Checkbox
                                        id="sr-editable"
                                        checked={local.editable}
                                        onCheckedChange={(c) => patch({ editable: c === true })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SigningRequestSignatureAreaFieldSheet;
