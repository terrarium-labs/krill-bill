import { Group } from "./groups";
import { Employee } from "../employees/employees";

export type SignatureWorkflowType = "parallel" | "bulk";

export type SignatureRequestStatus = "pending" | "signed" | "incomplete";

/** Lifecycle status for a signer (API). */
export type SignerStatus =
    | "in_queue"
    | "ready"
    | "signing"
    | "completed"
    | "expired"
    | "canceled"
    | "declined"
    | "error";

export interface SigningRequest {
    id: string;
    name: string;
    description?: string | null;
    workflow_type: SignatureWorkflowType;
    number_of_signers: number;
    number_of_signers_pendings?: number | null;
    number_of_signers_errors?: number | null;
    created_at?: string;
    updated_at?: string;
    overall_status: SignatureRequestStatus;
}

/**
 * Create signing request: pass a browser `File` (preferred; same pattern as org file upload) or base64 string.
 * `postSigningRequest` sends multipart: `name`, `workflow_type`, `expire_time`, `signers` (JSON), `file`, optional `description`, optional `reminders` (JSON).
 */
export interface NewSigningRequest {
    name: string;
    description?: string | null;
    workflow_type: SignatureWorkflowType;
    /** Days until the envelope expires. */
    expire_time: number;
    /**
     * Days to wait before sending each automatic reminder after the previous send (single number or list).
     * Omit when not configured. Use `0` to disable reminders.
     */
    reminders?: number | number[] | null;
    signers: NewSigner[];
    file: globalThis.File | string;
}

export interface Signer {
    id: string;
    employee?: Employee | null;
    group?: Group | null;
    email: string;
    status: SignerStatus;
}

/**
 * Allowed `options.validation_rule` values for API `type: "text"` (validated single-line fields).
 * Editor types: `email`, `phone`, `zip`, `dni`, `iban`.
 */
export const SIGNATURIT_VALIDATION_RULE_TEXT = [
    "dni",
    "phone",
    "iban",
    "email",
    "zip",
] as const;

export type SignaturitValidationRuleText = (typeof SIGNATURIT_VALIDATION_RULE_TEXT)[number];

/** Allowed `options.validation_rule` for `type: "date"` (editor field type `age`). */
export type SignaturitValidationRuleDate = "age";

export type SignaturitValidationRule = SignaturitValidationRuleText | SignaturitValidationRuleDate;

/** Signaturit-style field types for placement on the PDF (replacing Tecalis). */
export type SignaturitFieldType =
    | "signature"
    | "name"
    | "surname"
    | "date"
    | "city"
    | "textArea"
    | "Company"
    | "checkbox"
    | "radio"
    | "image"
    | "dropdown"
    /** Validated `text` widgets — API `options: { validation_rule: … }` with {@link SIGNATURIT_VALIDATION_RULE_TEXT}. */
    | "email"
    | "phone"
    | "zip"
    | "dni"
    | "iban"
    /** Validated `date` widget — API `options: { validation_rule: "age" }`. */
    | "age";

/**
 * `widgets[].options` — API shape varies by widget `type` (object or literal string).
 * For `radio`, `index` is **0-based** (first placement in the group is `0`).
 */
export type SignatureAreaWidgetOptions =
    | { select: Array<{ value: string; default: 0 | 1 }> }
    | { validation_rule: SignaturitValidationRule }
    | { index: number }
    | "show_yes_no_option";

/** @deprecated Legacy Tecalis-style payload; create flow uses {@link SignatureArea}. */
export interface SignaturitFieldPayload {
    field_type: SignaturitFieldType;
    field_name: string;
    field_id: string;
    /** Omitted when `field_type` is `image` or when there is no default (never `""`). */
    default_value?: string;
    mandatory: 0 | 1;
    editable: 0 | 1;
    /** Same shapes as {@link SignatureAreaWidgetOptions} when mirroring widget payloads. */
    options?: SignatureAreaWidgetOptions;
    /** @deprecated Prefer `options.select[].default`; kept for older integrations. */
    default_option_index?: number;
    /** @deprecated Prefer `options === "show_yes_no_option"` for checkbox Yes/No. */
    yes_no_options?: boolean;
}

/**
 * Widget kind for Signaturit (`widgets[].type`). Distinct from {@link SignaturitFieldType} used in the PDF editor.
 * Single-line text inputs map to `text`; {@link SignaturitFieldType} `textArea` maps to `textarea`.
 */
export type NewSignatureAreaType =
    | "date"
    | "image"
    | "check"
    | "radio"
    | "select"
    | "text"
    | "signature"
    | "digital certificate"
    | "dcf";

/**
 * One Signaturit widget placement forwarded by the backend.
 * `left`, `top`, `width`, `height` are **0–100** (percent of the page’s rendered width/height), not PDF points.
 * See {@link SignatureAreaWidgetOptions} for `options` by widget kind.
 * Omit `default` when there is no default value (never send `""`).
 * For `radio`, `default` is the **same on every widget in the group**: stringified **0-based** index of which option is selected as default (`"0"` = first in document order). `options.index` is this widget’s 0-based option index (document order: page, then top, then left).
 */
export interface SignatureArea {
    page: number;
    /** 0–100: horizontal position as % of page width. */
    left: number;
    /** 0–100: vertical position as % of page height. */
    top: number;
    /** 0–100: width as % of page width. */
    width: number;
    /** 0–100: height as % of page height. */
    height: number;
    type: NewSignatureAreaType;
    /** Omitted when `type` is `image`. */
    default?: string;
    /** `0` = false, `1` = true (API expects numbers, not booleans). */
    editable: 0 | 1;
    /** `0` = false, `1` = true (maps from editor “mandatory”; API expects numbers, not booleans). */
    required: 0 | 1;
    options?: SignatureAreaWidgetOptions;
    /** Radio only: groups widgets (same id as the editor field id for that radio group). Omit for other types. */
    custom_id?: string;
}

/** API signing mode per signer. The create UI only sends `advanced` (Signaturit widgets) for now. */
export type NewSignerSignatureType = "simple" | "advanced";

export const DEFAULT_NEW_SIGNER_SIGNATURE_TYPE: NewSignerSignatureType = "advanced";

export interface NewSigner {
    employee_id?: string | null;
    group_id?: string | null;
    email?: string | null;
    signature_type: NewSignerSignatureType;
    /** Signaturit widget placements for this signer (all areas for this recipient, in document order). */
    widgets?: SignatureArea[];
}

/** Client-side state for a Signaturit field (camelCase); mapped to {@link SignatureArea} for POST. */
export interface SignaturitFieldFormState {
    fieldType: SignaturitFieldType;
    fieldName: string;
    fieldId: string;
    /** Used when `fieldType` is not `dropdown`. */
    defaultValue: string;
    /** Used when `fieldType` is `dropdown`: labels in order (e.g. Option 1, Option 2, …). */
    dropdownOptions: string[];
    /** Used when `fieldType` is `dropdown`: which option is selected by default (0-based). */
    dropdownDefaultIndex: number;
    /** Used when `fieldType` is `radio`: whether this placement is the default option in the group (same `fieldId`). */
    radioIsDefault: boolean;
    /** Used when `fieldType` is `checkbox`: default is checked when true. */
    checkboxDefaultChecked: boolean;
    /** Used when `fieldType` is `checkbox`: Yes/No style options instead of a plain toggle. */
    checkboxYesNoOptions: boolean;
    mandatory: boolean;
    editable: boolean;
}
