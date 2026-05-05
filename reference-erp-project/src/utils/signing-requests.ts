import type {
    NewSignatureAreaType,
    SignatureArea,
    SignaturitFieldFormState,
    SignaturitFieldPayload,
    SignaturitFieldType,
    SignaturitValidationRuleText,
    SignerStatus,
} from "@/types/general/signing-requests";

export const SIGNER_STATUSES: readonly SignerStatus[] = [
    "in_queue",
    "ready",
    "signing",
    "completed",
    "expired",
    "canceled",
    "declined",
    "error",
] as const;

export function isSignerStatus(value: string): value is SignerStatus {
    return (SIGNER_STATUSES as readonly string[]).includes(value);
}

export const SIGNATURIT_FIELD_TYPES: readonly SignaturitFieldType[] = [
    "signature",
    "name",
    "surname",
    "date",
    "city",
    "textArea",
    "Company",
    "checkbox",
    "radio",
    "image",
    "dropdown",
    "email",
    "phone",
    "zip",
    "dni",
    "age",
    "iban",
] as const;

/**
 * Editor types that map to API `type: "text"` with `options: { validation_rule: … }`.
 * Rule strings: `dni`, `phone`, `iban`, `email`, `zip` (see `SIGNATURIT_VALIDATION_RULE_TEXT` in types).
 * `age` is excluded — it uses `type: "date"` with `validation_rule: "age"`.
 */
export function signaturitValidatedTextOptionKey(
    ft: SignaturitFieldType
): SignaturitValidationRuleText | null {
    switch (ft) {
        case "email":
        case "phone":
        case "zip":
        case "dni":
        case "iban":
            return ft;
        default:
            return null;
    }
}

/** Widget API expects `0` / `1`, not JSON booleans, for editable/required flags. */
export function signaturitBoolTo01(value: boolean): 0 | 1 {
    return value ? 1 : 0;
}

export function createDefaultSignaturitFieldState(): SignaturitFieldFormState {
    return {
        fieldType: "signature",
        fieldName: "",
        fieldId: "",
        defaultValue: "",
        dropdownOptions: ["Option 1", "Option 2"],
        dropdownDefaultIndex: 0,
        radioIsDefault: false,
        checkboxDefaultChecked: false,
        checkboxYesNoOptions: false,
        mandatory: true,
        editable: true,
    };
}

/**
 * Default Signaturit `field_id` prefix per field type. Shared counters use the same prefix
 * (e.g. name, surname, city, Company → `textfield_n`).
 */
export function signaturitFieldIdPrefixForType(ft: SignaturitFieldType): string {
    switch (ft) {
        case "signature":
            return "signature";
        case "name":
        case "surname":
        case "city":
        case "Company":
        case "email":
        case "phone":
        case "zip":
        case "dni":
        case "iban":
            return "textfield";
        case "textArea":
            return "textarea";
        case "date":
        case "age":
            return "date";
        case "checkbox":
            return "checkbox";
        case "dropdown":
            return "select";
        case "image":
            return "image";
        case "radio":
            return "radio";
    }
}

/**
 * Next `field_id` for a type, e.g. `signature_2`, `textfield_1`. Counts existing `prefix_n` ids
 * across all areas; optionally excludes one area (e.g. current row when changing type).
 */
export function nextSignaturitFieldIdFromAreas(
    areas: readonly { id: string; signaturit?: { fieldId?: string } }[],
    ft: SignaturitFieldType,
    excludeAreaId?: string,
): string {
    const prefix = signaturitFieldIdPrefixForType(ft);
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_(\\d+)$`);
    let max = -1;
    for (const a of areas) {
        if (excludeAreaId !== undefined && a.id === excludeAreaId) continue;
        const fid = a.signaturit?.fieldId?.trim();
        if (!fid) continue;
        const m = fid.match(re);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `${prefix}_${max + 1}`;
}

export function clampSignaturitDropdownDefaultIndex(optionsLength: number, index: number): number {
    if (optionsLength <= 0) return 0;
    return Math.min(Math.max(0, index), optionsLength - 1);
}

/**
 * Parses reminder offsets from the create form (comma-separated days). Empty → omit field.
 * One number → sent as a single value; several → array. `0` disables reminders.
 */
export function parseRemindersInput(raw: string): number | number[] | undefined {
    const t = raw.trim();
    if (t === "") return undefined;
    const parts = t.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) return undefined;
    if (nums.length === 0) return undefined;
    if (nums.length === 1) return nums[0];
    return nums;
}

/** Checkbox Yes/No: `options` is this literal string (not an array). */
export const SIGNATURE_AREA_CHECKBOX_YES_NO_OPTION = "show_yes_no_option" as const;

/**
 * Maps PDF editor {@link SignaturitFieldType} to API {@link NewSignatureAreaType} (Signaturit widget `type`).
 * Single-line text fields (`name`, `surname`, etc.) → `text`; multi-line editor type → `textarea`.
 */
export function signaturitFieldTypeToNewSignatureAreaType(ft: SignaturitFieldType): NewSignatureAreaType {
    switch (ft) {
        case "signature":
            return "signature";
        case "name":
        case "surname":
        case "city":
        case "Company":
        case "email":
        case "phone":
        case "zip":
        case "dni":
        case "iban":
        case "textArea":
            return "text";
        case "date":
        case "age":
            return "date";
        case "checkbox":
            return "check";
        case "radio":
            return "radio";
        case "image":
            return "image";
        case "dropdown":
            return "select";
    }
}

/** Area row for radio grouping — `page` / `rect` used to sort option indices in document order. */
export type SignaturitFieldAreaRow = {
    id: string;
    page?: number;
    rect?: { coordinate_x: number; coordinate_y: number };
    signaturit?: SignaturitFieldFormState;
};

export type SignaturitFieldToSignatureAreaContext = {
    /** All placements (same array the editor passes: include `page` + `rect` for correct radio `index`). */
    allAreasInOrder: readonly SignaturitFieldAreaRow[];
    currentAreaId: string;
    /** Rendered page size in px (same coordinate space as `rect`); used for 0–100 % geometry. */
    pageSize: { w: number; h: number };
};

/** Radio options are 0-based in **document order** (page, then top, then left). */
function sortRadioGroupByDocumentOrder<T extends SignaturitFieldAreaRow>(group: readonly T[]): T[] {
    if (group.length <= 1) return [...group];
    const hasPage = group.some((a) => a.page != null);
    if (!hasPage) return [...group];
    return [...group].sort((a, b) => {
        const pa = a.page ?? 0;
        const pb = b.page ?? 0;
        if (pa !== pb) return pa - pb;
        const ya = a.rect?.coordinate_y ?? 0;
        const yb = b.rect?.coordinate_y ?? 0;
        if (ya !== yb) return ya - yb;
        return (a.rect?.coordinate_x ?? 0) - (b.rect?.coordinate_x ?? 0);
    });
}

type RectLike = {
    coordinate_x: number;
    coordinate_y: number;
    width: number;
    height: number;
};

/** Convert bitmap/PDF-point rect to Signaturit’s 0–100 % box (per-axis, clamped). */
export function signatureRectPdfToSignaturitPercent(
    rect: RectLike,
    pageWidth: number,
    pageHeight: number
): { left: number; top: number; width: number; height: number } {
    const pw = Math.max(1, pageWidth);
    const ph = Math.max(1, pageHeight);
    const clampPct = (v: number) => {
        if (!Number.isFinite(v)) return 0;
        return Math.min(100, Math.max(0, v));
    };
    const round = (v: number) => Math.round(v * 1e6) / 1e6;
    return {
        left: round(clampPct((rect.coordinate_x / pw) * 100)),
        top: round(clampPct((rect.coordinate_y / ph) * 100)),
        width: round(clampPct((rect.width / pw) * 100)),
        height: round(clampPct((rect.height / ph) * 100)),
    };
}

/**
 * Maps editor state + PDF rect to the `widgets[]` entry the API forwards to Signaturit.
 * Geometry is sent as **percentages 0–100** using `ctx.pageSize` (same units as the canvas rect).
 * Radio: `custom_id` + `options: { index }` (0-based in document order); `default` is the **same** on every widget — stringified 0-based index of which option is the group default.
 */
export function signaturitFieldStateToSignatureArea(
    state: SignaturitFieldFormState,
    rect: RectLike,
    page: number,
    ctx: SignaturitFieldToSignatureAreaContext
): SignatureArea {
    const radioGroupId = state.fieldId.trim();
    const { left, top, width, height } = signatureRectPdfToSignaturitPercent(
        rect,
        ctx.pageSize.w,
        ctx.pageSize.h
    );

    if (state.fieldType === "image") {
        return {
            page,
            left,
            top,
            width,
            height,
            type: "image",
            editable: signaturitBoolTo01(state.editable),
            required: signaturitBoolTo01(state.mandatory),
        };
    }

    const base: SignatureArea = {
        page,
        left,
        top,
        width,
        height,
        type: signaturitFieldTypeToNewSignatureAreaType(state.fieldType),
        editable: signaturitBoolTo01(state.editable),
        required: signaturitBoolTo01(state.mandatory),
    };

    if (state.fieldType === "dropdown") {
        const labels = state.dropdownOptions.map((s) => s.trim());
        const idx = clampSignaturitDropdownDefaultIndex(labels.length, state.dropdownDefaultIndex);
        return {
            ...base,
            options: {
                select: labels.map((value, i) => ({
                    value,
                    default: i === idx ? 1 : 0,
                })),
            },
            ...(labels.length > 0 ? { default: String(idx) } : {}),
        };
    }

    if (state.fieldType === "radio") {
        const filtered = ctx.allAreasInOrder.filter(
            (a) =>
                a.signaturit?.fieldType === "radio" &&
                (a.signaturit.fieldId?.trim() ?? "") === radioGroupId
        );
        const groupOrdered = sortRadioGroupByDocumentOrder(filtered);
        const optionIndexRaw = groupOrdered.findIndex((x) => x.id === ctx.currentAreaId);
        const optionIndex = optionIndexRaw >= 0 ? optionIndexRaw : 0;
        const defaultIdx = groupOrdered.findIndex((x) => x.signaturit?.radioIsDefault);
        /** Same string on every radio in the group: 0-based index of the default option. */
        const defaultOptionIndexStr = String(defaultIdx >= 0 ? defaultIdx : 0);
        const radioWidget: SignatureArea = {
            ...base,
            options: { index: optionIndex },
            default: defaultOptionIndexStr,
        };
        if (radioGroupId) {
            radioWidget.custom_id = radioGroupId;
        }
        return radioWidget;
    }

    if (state.fieldType === "checkbox") {
        base.default = state.checkboxDefaultChecked ? "1" : "0";
        if (state.editable && state.checkboxYesNoOptions) {
            base.options = SIGNATURE_AREA_CHECKBOX_YES_NO_OPTION;
        }
        return base;
    }

    if (state.fieldType === "age") {
        base.options = { validation_rule: "age" };
    } else {
        const validatedTextKey = signaturitValidatedTextOptionKey(state.fieldType);
        if (validatedTextKey !== null) {
            base.options = { validation_rule: validatedTextKey };
        }
    }

    const defaultTrimmed = (state.defaultValue ?? "").trim();
    if (defaultTrimmed !== "") {
        base.default = defaultTrimmed;
    }
    return base;
}

/** @deprecated Legacy Tecalis payload; prefer {@link signaturitFieldStateToSignatureArea}. */
export function signaturitFieldStateToPayload(state: SignaturitFieldFormState): SignaturitFieldPayload {
    if (state.fieldType === "dropdown") {
        const labels = state.dropdownOptions.map((s) => s.trim());
        const idx = clampSignaturitDropdownDefaultIndex(labels.length, state.dropdownDefaultIndex);
        return {
            field_type: state.fieldType,
            field_name: state.fieldName.trim(),
            field_id: state.fieldId.trim(),
            mandatory: signaturitBoolTo01(state.mandatory),
            editable: signaturitBoolTo01(state.editable),
            options: {
                select: labels.map((value, i) => ({
                    value,
                    default: i === idx ? 1 : 0,
                })),
            },
            ...(labels.length > 0 ? { default_value: String(idx) } : {}),
        };
    }
    if (state.fieldType === "radio") {
        // default index (0-based) requires group context; see signaturitFieldStateToSignatureArea.
        return {
            field_type: state.fieldType,
            field_name: state.fieldName.trim(),
            field_id: state.fieldId.trim(),
            mandatory: signaturitBoolTo01(state.mandatory),
            editable: signaturitBoolTo01(state.editable),
        };
    }
    if (state.fieldType === "checkbox") {
        return {
            field_type: state.fieldType,
            field_name: state.fieldName.trim(),
            field_id: state.fieldId.trim(),
            default_value: state.checkboxDefaultChecked ? "1" : "0",
            mandatory: signaturitBoolTo01(state.mandatory),
            editable: signaturitBoolTo01(state.editable),
            ...(state.editable && state.checkboxYesNoOptions
                ? { options: SIGNATURE_AREA_CHECKBOX_YES_NO_OPTION }
                : {}),
            yes_no_options: state.checkboxYesNoOptions,
        };
    }
    if (state.fieldType === "image") {
        return {
            field_type: state.fieldType,
            field_name: state.fieldName.trim(),
            field_id: state.fieldId.trim(),
            mandatory: signaturitBoolTo01(state.mandatory),
            editable: signaturitBoolTo01(state.editable),
        };
    }
    const validatedTextKey = signaturitValidatedTextOptionKey(state.fieldType);
    const payloadDefault = (state.defaultValue ?? "").trim();
    return {
        field_type: state.fieldType,
        field_name: state.fieldName.trim(),
        field_id: state.fieldId.trim(),
        mandatory: signaturitBoolTo01(state.mandatory),
        editable: signaturitBoolTo01(state.editable),
        ...(payloadDefault !== "" ? { default_value: payloadDefault } : {}),
        ...(state.fieldType === "age"
            ? { options: { validation_rule: "age" } }
            : validatedTextKey !== null
              ? { options: { validation_rule: validatedTextKey } }
              : {}),
    };
}
