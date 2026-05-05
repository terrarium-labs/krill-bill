import React from "react";
import { useOrg } from "@/app/contexts/OrgContext";
import { cn } from "@/lib/utils";

// ─── Public API types ──────────────────────────────────────────────────────────

type LicensePlateLabelData =
    | string
    | { name: string; country?: string | null }
    | null
    | undefined;

type LicensePlateLabelSize = "sm" | "md" | "lg" | "xl";


interface LicensePlateLabelProps {
    data: LicensePlateLabelData;
    /** Preset size. Ignored when `height` is provided. */
    size?: LicensePlateLabelSize;
    /** Override height in pixels. Takes precedence over `size`. */
    height?: number;
    className?: string;
}

// ─── Size presets ──────────────────────────────────────────────────────────────

interface SizeConfig {
    height: number;
    fontSize: number;
    stripWidth: number;
    stripCodeSize: number;
    starSize: number;
    padX: number;
    radius: number;
    border: number;
}

const SIZE_PRESETS: Record<LicensePlateLabelSize, SizeConfig> = {
    sm: { height: 24, fontSize: 10, stripWidth: 16, stripCodeSize: 5.5, starSize: 4, padX: 6, radius: 2, border: 1.5 },
    md: { height: 32, fontSize: 14, stripWidth: 22, stripCodeSize: 7.5, starSize: 6, padX: 8, radius: 3, border: 2 },
    lg: { height: 44, fontSize: 20, stripWidth: 30, stripCodeSize: 10, starSize: 8, padX: 10, radius: 4, border: 2 },
    xl: { height: 60, fontSize: 27, stripWidth: 40, stripCodeSize: 13, starSize: 11, padX: 14, radius: 5, border: 2.5 },
};

// ─── Country → plate family mapping ───────────────────────────────────────────

/**
 * Vehicle-registration plate codes used inside the EU blue strip.
 * These often differ from ISO alpha-2 (e.g. DE→D, ES→E, GB→GB).
 */
const EU_STRIP_CODE: Record<string, string> = {
    AD: "AND", AT: "A", BE: "B", BG: "BG", CH: "CH", CY: "CY",
    CZ: "CZ", DE: "D", DK: "DK", EE: "EST", ES: "E", FI: "FIN",
    FR: "F", GR: "GR", HR: "HR", HU: "H", IE: "IRL", IS: "IS",
    IT: "I", LI: "FL", LT: "LT", LU: "L", LV: "LV", MC: "MC",
    ME: "MNE", MK: "NMK", MT: "M", NL: "NL", NO: "N", PL: "PL",
    PT: "P", RO: "RO", RS: "SRB", SE: "S", SI: "SLO", SK: "SK",
    SM: "RSM", VA: "V",
};

/** Countries that use the EU-style blue left strip */
const EU_COUNTRIES = new Set(Object.keys(EU_STRIP_CODE));

type PlateFamily = "eu" | "uk" | "us" | "jp" | "br" | "generic";

interface PlateStyle {
    family: PlateFamily;
    plateBg: string;
    plateText: string;
    borderColor: string;
    /** Left-strip background (EU / UK style) */
    stripBg?: string;
    /** Code shown in the left strip */
    stripCode?: string;
    /** Star / text colour inside the strip */
    stripAccent?: string;
    /** Top banner for non-EU styles (e.g. US state bar) */
    topBg?: string;
    topText?: string;
    topLabel?: string;
}

function getPlateStyle(countryCode: string): PlateStyle {
    const c = countryCode.toUpperCase();

    if (c === "GB")
        return {
            family: "uk",
            plateBg: "#F5CB08",
            plateText: "#000",
            borderColor: "#2a2a2a",
            stripBg: "#003399",
            stripCode: "GB",
            stripAccent: "#FFD700",
        };

    if (EU_COUNTRIES.has(c))
        return {
            family: "eu",
            plateBg: "#FFFFF0",
            plateText: "#000",
            borderColor: "#555",
            stripBg: "#003399",
            stripCode: EU_STRIP_CODE[c] ?? c,
            stripAccent: "#FFD700",
        };

    if (c === "JP")
        return {
            family: "jp",
            plateBg: "#FFFFFF",
            plateText: "#1a1a6e",
            borderColor: "#1a1a6e",
        };

    if (c === "BR" || c === "AR")
        return {
            family: "br",
            plateBg: "#FFFFFF",
            plateText: "#000",
            borderColor: "#1a6629",
            topBg: "#1a6629",
            topText: "#FFD700",
            topLabel: "MERCOSUL",
        };

    if (c === "US" || c === "CA")
        return {
            family: "us",
            plateBg: "#FFFFFF",
            plateText: "#1133AA",
            borderColor: "#1133AA",
        };

    // Generic fallback
    return {
        family: "generic",
        plateBg: "#F0F0F0",
        plateText: "#111",
        borderColor: "#666",
    };
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

const LicensePlateLabel: React.FC<LicensePlateLabelProps> = ({
    data,
    size = "md",
    height: heightProp,
    className,
}) => {
    const { org } = useOrg();

    if (!data) return <span className="text-muted-foreground">-</span>;

    const plateId = typeof data === "string" ? data : data.name;
    const rawCountry =
        typeof data === "object" && data.country
            ? data.country
            : (org?.country ?? "EU");
    const country = rawCountry.toUpperCase();

    if (!plateId) return <span className="text-muted-foreground">-</span>;

    const preset = SIZE_PRESETS[size];
    const h = heightProp ?? preset.height;

    // Scale all dimensions proportionally when a custom height is given
    const scale = h / preset.height;
    const fontSize = preset.fontSize * scale;
    const stripWidth = preset.stripWidth * scale;
    const stripCodeSz = preset.stripCodeSize * scale;
    const starSize = preset.starSize * scale;
    const padX = preset.padX * scale;
    const radius = preset.radius * scale;
    const border = preset.border;

    const style = getPlateStyle(country);
    const hasStrip = !!(style.stripBg && style.stripCode);
    const hasTop = !!(style.topBg && style.topLabel);
    const showStars = h >= 30;

    return (
        <div
            className={cn("inline-flex shrink-0 select-none overflow-hidden", className)}
            style={{
                height: h,
                borderRadius: radius,
                border: `${border}px solid ${style.borderColor}`,
                background: style.plateBg,
                fontFamily: "'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif",
                flexDirection: hasTop ? "column" : "row",
            }}
        >
            {/* Top banner (e.g. Mercosul) */}
            {hasTop && (
                <div
                    style={{
                        background: style.topBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: h * 0.22,
                        paddingInline: padX * 0.5,
                    }}
                >
                    <span
                        style={{
                            color: style.topText,
                            fontSize: h * 0.13,
                            fontWeight: 700,
                            fontFamily: "Arial, sans-serif",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {style.topLabel}
                    </span>
                </div>
            )}

            {/* Row: left strip + number */}
            <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
                {/* Left strip (EU / UK) */}
                {hasStrip && (
                    <div
                        style={{
                            width: stripWidth,
                            minWidth: stripWidth,
                            background: style.stripBg,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: starSize * 0.2,
                            paddingBlock: h * 0.06,
                        }}
                    >
                        {showStars && (
                            <div style={{ display: "flex", gap: starSize * 0.15, lineHeight: 1 }}>
                                {["★", "★", "★"].map((s, i) => (
                                    <span
                                        key={i}
                                        style={{ fontSize: starSize, color: style.stripAccent, lineHeight: 1 }}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                        <span
                            style={{
                                fontSize: stripCodeSz,
                                color: style.stripAccent,
                                fontWeight: 900,
                                fontFamily: "Arial, sans-serif",
                                lineHeight: 1,
                                letterSpacing: 0,
                            }}
                        >
                            {style.stripCode}
                        </span>
                    </div>
                )}

                {/* Plate number */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingInline: padX,
                        fontSize,
                        color: style.plateText,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                    }}
                >
                    {plateId.toUpperCase()}
                </div>
            </div>
        </div>
    );
};

export default LicensePlateLabel;
