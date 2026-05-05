import type { SignaturitFieldType } from "@/types/general/signing-requests";

/** Placement in PDF / rendered page bitmap coordinates (same units as `pdf-multi-signature-canvas`). */
export type SignatureRectPdf = {
    coordinate_x: number;
    coordinate_y: number;
    width: number;
    height: number;
};

/**
 * Layout rules aligned with Signaturit-style field widgets (bitmap / PDF point space).
 * Sizes are in the same units as the rendered page (typically PDF points).
 */
export const SIGNATURIT_GEOMETRY = {
    /** All field types: minimum size so overlay preview stays usable. */
    UNIVERSAL_MIN_WIDTH: 20,
    UNIVERSAL_MIN_HEIGHT: 20,
    /** Checkbox & radio: square; max side length. */
    SQUARE_MAX_SIDE: 48,
    SQUARE_MIN_SIDE: 18,
    /** Text / date / dropdown: max height ≈ two lines (12pt text, ~1.5 line-height). */
    TWO_LINE_MAX_HEIGHT: 36,
    TWO_LINE_MIN_HEIGHT: 22,
    TWO_LINE_MIN_WIDTH: 96,
    TWO_LINE_MAX_WIDTH: 520,
} as const;

export type SignaturitGeometryMode = "unlimited" | "square" | "two_line";

export function signaturitFieldGeometryMode(ft: SignaturitFieldType): SignaturitGeometryMode {
    switch (ft) {
        case "checkbox":
        case "radio":
            return "square";
        case "name":
        case "surname":
        case "date":
        case "age":
        case "city":
        case "Company":
        case "email":
        case "phone":
        case "zip":
        case "dni":
        case "iban":
        case "dropdown":
            return "two_line";
        case "signature":
        case "textArea":
        case "image":
            return "unlimited";
    }
}

const ABS_MIN = 4;

function enforceUniversalMinSize(r: SignatureRectPdf): SignatureRectPdf {
    const w = Math.max(r.width, SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_WIDTH);
    const h = Math.max(r.height, SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_HEIGHT);
    return { ...r, width: w, height: h };
}

/** Clamp rect to page bounds (min 4×4 for interaction; universal mins applied in `fitSignaturitRectToConstraints`). */
export function clampRectPage(r: SignatureRectPdf, cw: number, ch: number): SignatureRectPdf {
    let x = Math.max(0, Math.min(r.coordinate_x, cw - ABS_MIN));
    let y = Math.max(0, Math.min(r.coordinate_y, ch - ABS_MIN));
    let w = Math.min(r.width, cw - x);
    let h = Math.min(r.height, ch - y);
    w = Math.max(w, ABS_MIN);
    h = Math.max(h, ABS_MIN);
    if (x + w > cw) x = Math.max(0, cw - w);
    if (y + h > ch) y = Math.max(0, ch - h);
    return { coordinate_x: x, coordinate_y: y, width: w, height: h };
}

/**
 * Fits a rectangle to Signaturit-style constraints for the field type.
 * Top-left (`coordinate_x`, `coordinate_y`) is kept fixed when clamping size so resize does not drift the box.
 */
export function fitSignaturitRectToConstraints(
    rect: SignatureRectPdf,
    ft: SignaturitFieldType,
    cw: number,
    ch: number
): SignatureRectPdf {
    const mode = signaturitFieldGeometryMode(ft);
    const x0 = rect.coordinate_x;
    const y0 = rect.coordinate_y;

    if (mode === "unlimited") {
        const withMin = enforceUniversalMinSize(rect);
        return clampRectPage(withMin, cw, ch);
    }

    if (mode === "square") {
        let side = Math.min(rect.width, rect.height, SIGNATURIT_GEOMETRY.SQUARE_MAX_SIDE);
        side = Math.max(
            side,
            SIGNATURIT_GEOMETRY.SQUARE_MIN_SIDE,
            SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_WIDTH,
            SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_HEIGHT
        );
        return clampRectPage(
            {
                coordinate_x: x0,
                coordinate_y: y0,
                width: side,
                height: side,
            },
            cw,
            ch
        );
    }

    let w = rect.width;
    let h = rect.height;
    w = Math.min(Math.max(w, SIGNATURIT_GEOMETRY.TWO_LINE_MIN_WIDTH), SIGNATURIT_GEOMETRY.TWO_LINE_MAX_WIDTH);
    h = Math.min(Math.max(h, SIGNATURIT_GEOMETRY.TWO_LINE_MIN_HEIGHT), SIGNATURIT_GEOMETRY.TWO_LINE_MAX_HEIGHT);
    w = Math.max(w, SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_WIDTH);
    h = Math.max(h, SIGNATURIT_GEOMETRY.UNIVERSAL_MIN_HEIGHT);
    return clampRectPage(
        {
            coordinate_x: x0,
            coordinate_y: y0,
            width: w,
            height: h,
        },
        cw,
        ch
    );
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Raw resize without Signaturit shape rules (same as previous canvas `applyResize`). */
export function applyResizeRaw(
    handle: ResizeHandle,
    orig: SignatureRectPdf,
    dx: number,
    dy: number,
    cw: number,
    ch: number
): SignatureRectPdf {
    const left = orig.coordinate_x;
    const top = orig.coordinate_y;
    const right = orig.coordinate_x + orig.width;
    const bottom = orig.coordinate_y + orig.height;

    let nl = left;
    let nt = top;
    let nr = right;
    let nb = bottom;

    switch (handle) {
        case "nw":
            nl = left + dx;
            nt = top + dy;
            break;
        case "n":
            nt = top + dy;
            break;
        case "ne":
            nr = right + dx;
            nt = top + dy;
            break;
        case "e":
            nr = right + dx;
            break;
        case "se":
            nr = right + dx;
            nb = bottom + dy;
            break;
        case "s":
            nb = bottom + dy;
            break;
        case "sw":
            nl = left + dx;
            nb = bottom + dy;
            break;
        case "w":
            nl = left + dx;
            break;
        default:
            break;
    }

    let x = Math.min(nl, nr);
    let y = Math.min(nt, nb);
    let w = Math.abs(nr - nl);
    let h = Math.abs(nb - nt);
    return clampRectPage({ coordinate_x: x, coordinate_y: y, width: w, height: h }, cw, ch);
}

export function applyResizeSignaturit(
    handle: ResizeHandle,
    orig: SignatureRectPdf,
    dx: number,
    dy: number,
    cw: number,
    ch: number,
    ft: SignaturitFieldType
): SignatureRectPdf {
    const raw = applyResizeRaw(handle, orig, dx, dy, cw, ch);
    return fitSignaturitRectToConstraints(raw, ft, cw, ch);
}
