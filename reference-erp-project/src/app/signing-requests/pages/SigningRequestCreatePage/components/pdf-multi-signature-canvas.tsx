import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type Dispatch,
    type PointerEvent,
    type SetStateAction,
} from "react";
import { flushSync } from "react-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useTranslation } from "react-i18next";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { SignaturitFieldTypeIcon } from "@/app/signing-requests/pages/SigningRequestCreatePage/components/signaturit-field-type-icon";
import {
    signaturitFieldTypeDefaultLabel,
    signaturitFieldTypeLabelKey,
} from "@/app/signing-requests/utils/signaturit-field-type-labels";
import { cn } from "@/lib/utils";
import { pdfjsLib } from "@/lib/pdfjs";
import {
    applyResizeSignaturit,
    clampRectPage as clampRectToPage,
    fitSignaturitRectToConstraints,
    type SignatureRectPdf,
} from "@/app/signing-requests/utils/signaturit-field-geometry";
import type { SignaturitFieldFormState, SignaturitFieldType } from "@/types/general/signing-requests";
import { createDefaultSignaturitFieldState, nextSignaturitFieldIdFromAreas } from "@/utils/signing-requests";

export type { SignatureRectPdf };

export type SignatureAreaVisual = {
    id: string;
    page: number;
    rect: SignatureRectPdf;
    /** CSS color for border / tint */
    color: string;
    /** Parallel workflow: participant this area belongs to. */
    signerId?: string;
    /** Signaturit field configuration for this placement. */
    signaturit?: SignaturitFieldFormState;
};

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type Interaction =
    | { kind: "idle" }
    | { kind: "draw"; startX: number; startY: number; curX: number; curY: number }
    | { kind: "move"; areaId: string; startX: number; startY: number; orig: SignatureRectPdf }
    | {
          kind: "resize";
          areaId: string;
          handle: ResizeHandle;
          startPointerX: number;
          startPointerY: number;
          orig: SignatureRectPdf;
      }
    | { kind: "maybeClick"; areaId: string; startX: number; startY: number };

function normalizeRect(x1: number, y1: number, x2: number, y2: number): SignatureRectPdf {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    return {
        coordinate_x: left,
        coordinate_y: top,
        width: Math.max(width, 1),
        height: Math.max(height, 1),
    };
}

/** Clamp a signature rect to page bitmap dimensions (PDF coordinate space). */
export function clampSignatureRect(r: SignatureRectPdf, cw: number, ch: number): SignatureRectPdf {
    return clampRectToPage(r, cw, ch);
}

/** `primary` uses a single fixed color for every area (bulk workflow). */
export type SignatureAreaColorMode = "palette" | "primary";

/** Parallel workflow: why drawing on empty canvas may be blocked (toast). */
export type ParallelDrawBlockedReason = "none" | "add-participant" | "select-participant";

/**
 * Bulk workflow overlay color: fixed slate (not theme primary) so boxes stay visible on white PDFs
 * in both light and dark UI themes.
 */
export const BULK_SIGNATURE_AREA_COLOR = "#64748b";

interface PdfMultiSignatureCanvasProps {
    file: File | null;
    pageNumber: number;
    areas: SignatureAreaVisual[];
    selectedAreaId: string | null;
    setAreas: Dispatch<SetStateAction<SignatureAreaVisual[]>>;
    onSelectArea: (id: string) => void;
    onDocumentLoaded?: (numPages: number) => void;
    maxRenderWidth?: number;
    className?: string;
    /** When false, drawing and area interaction are disabled (e.g. workflow not chosen yet). */
    drawingEnabled?: boolean;
    /** Bulk: single fixed gray; parallel: rotating palette. */
    colorMode?: SignatureAreaColorMode;
    /** Parallel workflow: selected participant’s color for new areas. */
    parallelSignerColor?: string | null;
    parallelSignerId?: string | null;
    /** When not `none`, drawing a new area is blocked and a toast is shown. */
    parallelDrawBlockedReason?: ParallelDrawBlockedReason;
    /** Reported when the rendered page bitmap size is known (for Signaturit rect fitting off-canvas). */
    onPageBitmapSize?: (page: number, size: { w: number; h: number }) => void;
}

const HANDLE = "h-2.5 w-2.5 rounded-sm border-2 border-white bg-current shadow-sm";

/** Punches a hole through signature overlays where the remove badge sits (`h-6` / 2 + small margin vs border). */
const REMOVE_BADGE_MASK_RADIUS_PX = 10;

const REMOVE_BADGE_MASK_GRADIENT = `radial-gradient(circle at 0 0, transparent ${REMOVE_BADGE_MASK_RADIUS_PX}px, #000 ${REMOVE_BADGE_MASK_RADIUS_PX}px)`;

const SIGNATURE_AREA_REMOVE_BADGE_MASK_STYLE = {
    WebkitMaskImage: REMOVE_BADGE_MASK_GRADIENT,
    maskImage: REMOVE_BADGE_MASK_GRADIENT,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
} as const;

/** Hides field label text when it truncates (icon stays). */
function SignatureAreaFieldLabel({
    compactFieldLabel,
    fieldType,
    color,
    labelText,
}: {
    compactFieldLabel: boolean;
    fieldType: SignaturitFieldType;
    color: string;
    labelText: string;
}) {
    const rowRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [labelHidden, setLabelHidden] = useState(false);

    const measure = useCallback(() => {
        const text = textRef.current;
        const row = rowRef.current;
        if (!row) return;

        flushSync(() => setLabelHidden(false));

        let hideLabel = compactFieldLabel;
        if (!compactFieldLabel && text) {
            hideLabel = text.scrollWidth > text.clientWidth + 0.5;
        }

        flushSync(() => setLabelHidden(hideLabel));
    }, [compactFieldLabel, labelText]);

    useLayoutEffect(() => {
        measure();
    }, [measure]);

    useLayoutEffect(() => {
        const row = rowRef.current;
        if (!row || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => measure());
        ro.observe(row);
        return () => ro.disconnect();
    }, [measure]);

    return (
        <span
            ref={rowRef}
            className="pointer-events-none absolute inset-0 z-[22] flex w-full min-w-0 max-w-full items-center justify-center gap-2 px-1 text-sm font-semibold transition-opacity duration-150 select-none group-hover/area:opacity-0"
            style={{ color }}
            aria-hidden
        >
            <span
                className={cn(
                    "flex items-center gap-2",
                    compactFieldLabel ? "min-w-0 shrink-0" : "min-w-0 max-w-[min(100%,12rem)]"
                )}
            >
                <SignaturitFieldTypeIcon
                    type={fieldType}
                    className="h-5 w-5 shrink-0 opacity-90"
                />
                {!compactFieldLabel ? (
                    <span
                        ref={textRef}
                        className={cn(
                            "min-w-0 truncate text-xs font-semibold leading-tight",
                            labelHidden && "hidden"
                        )}
                    >
                        {labelText}
                    </span>
                ) : null}
            </span>
        </span>
    );
}

export function PdfMultiSignatureCanvas({
    file,
    pageNumber,
    areas,
    selectedAreaId,
    setAreas,
    onSelectArea,
    onDocumentLoaded,
    maxRenderWidth = 1100,
    className,
    drawingEnabled = true,
    colorMode = "palette",
    parallelSignerColor = null,
    parallelSignerId = null,
    parallelDrawBlockedReason = "none",
    onPageBitmapSize,
}: PdfMultiSignatureCanvasProps) {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const interactionLayerRef = useRef<HTMLDivElement>(null);
    const areasRef = useRef(areas);
    areasRef.current = areas;
    const onPageBitmapSizeRef = useRef(onPageBitmapSize);
    onPageBitmapSizeRef.current = onPageBitmapSize;
    /** Remove badge records pointer start so we only delete on click/tap, not after a drag started on the badge. */
    const removeBadgePointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [interaction, setInteraction] = useState<Interaction>({ kind: "idle" });
    const [loadError, setLoadError] = useState<string | null>(null);
    const [bitmapSize, setBitmapSize] = useState<{ w: number; h: number } | null>(null);

    const pageAreas = areas.filter((a) => a.page === pageNumber);

    useEffect(() => {
        if (!file) {
            setPdfDoc(null);
            return;
        }
        let cancelled = false;
        setLoadError(null);
        (async () => {
            try {
                const buf = await file.arrayBuffer();
                const loading = pdfjsLib.getDocument({ data: buf });
                const pdf = await loading.promise;
                if (cancelled) return;
                setPdfDoc(pdf);
                onDocumentLoaded?.(pdf.numPages);
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Failed to load PDF");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [file, onDocumentLoaded]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!pdfDoc || !canvas || pageNumber < 1 || pageNumber > pdfDoc.numPages) {
            setBitmapSize(null);
            return;
        }

        let cancelled = false;
        setBitmapSize(null);
        (async () => {
            const page = await pdfDoc.getPage(pageNumber);
            const baseViewport = page.getViewport({ scale: 1 });
            const maxW = maxRenderWidth;
            const scale = Math.min(maxW / baseViewport.width, 1.5);
            const viewport = page.getViewport({ scale });
            if (cancelled) return;

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            setBitmapSize({ w: viewport.width, h: viewport.height });

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const renderTask = page.render({
                canvas,
                viewport,
            });
            await renderTask.promise;
        })();

        return () => {
            cancelled = true;
        };
    }, [pdfDoc, pageNumber, maxRenderWidth]);

    useEffect(() => {
        if (bitmapSize) onPageBitmapSizeRef.current?.(pageNumber, bitmapSize);
        // Intentionally omit onPageBitmapSize from deps: parent may pass an inline callback;
        // we always invoke the latest ref so bitmap/page changes do not cause update loops.
    }, [bitmapSize, pageNumber]);

    const getLocalCoords = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        return {
            x: Math.max(0, Math.min(x, canvas.width)),
            y: Math.max(0, Math.min(y, canvas.height)),
        };
    }, []);

    const updateAreaRect = useCallback(
        (id: string, rect: SignatureRectPdf) => {
            if (!bitmapSize) return;
            const area = areasRef.current.find((a) => a.id === id);
            const ft: SignaturitFieldType = area?.signaturit?.fieldType ?? "signature";
            const fitted = fitSignaturitRectToConstraints(rect, ft, bitmapSize.w, bitmapSize.h);
            setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, rect: fitted } : a)));
        },
        [bitmapSize, setAreas]
    );

    const removeArea = useCallback(
        (id: string) => {
            setAreas((prev) => prev.filter((a) => a.id !== id));
        },
        [setAreas]
    );

    const captureLayer = useCallback((e: PointerEvent) => {
        interactionLayerRef.current?.setPointerCapture(e.pointerId);
    }, []);

    const onBackdropPointerDown = useCallback(
        (e: PointerEvent) => {
            if (!drawingEnabled || !pdfDoc || !bitmapSize) return;
            if (parallelDrawBlockedReason && parallelDrawBlockedReason !== "none") {
                if (parallelDrawBlockedReason === "add-participant") {
                    toast.error(
                        t(
                            "signingRequests.create.addParticipantBeforeDraw",
                            "Add a participant before drawing signature areas."
                        )
                    );
                } else {
                    toast.error(
                        t(
                            "signingRequests.create.selectParticipantBeforeDraw",
                            "Select a participant in the list before drawing signature areas."
                        )
                    );
                }
                return;
            }
            e.preventDefault();
            captureLayer(e);
            const { x, y } = getLocalCoords(e.clientX, e.clientY);
            setInteraction({ kind: "draw", startX: x, startY: y, curX: x, curY: y });
        },
        [
            drawingEnabled,
            pdfDoc,
            bitmapSize,
            getLocalCoords,
            captureLayer,
            parallelDrawBlockedReason,
            t,
        ]
    );

    const onAreaPointerDown = useCallback(
        (e: PointerEvent, areaId: string) => {
            if (!drawingEnabled) return;
            const target = e.target as HTMLElement | null;
            // Don't capture drag / preventDefault for nested controls (remove X, edit); preventDefault kills their click.
            if (target?.closest?.("button")) return;
            e.stopPropagation();
            e.preventDefault();
            captureLayer(e);
            const { x, y } = getLocalCoords(e.clientX, e.clientY);
            setInteraction({ kind: "maybeClick", areaId, startX: x, startY: y });
        },
        [drawingEnabled, getLocalCoords, captureLayer]
    );

    const onHandlePointerDown = useCallback(
        (e: PointerEvent, areaId: string, handle: ResizeHandle, rect: SignatureRectPdf) => {
            if (!drawingEnabled) return;
            e.stopPropagation();
            e.preventDefault();
            captureLayer(e);
            const { x, y } = getLocalCoords(e.clientX, e.clientY);
            setInteraction({
                kind: "resize",
                areaId,
                handle,
                startPointerX: x,
                startPointerY: y,
                orig: { ...rect },
            });
        },
        [drawingEnabled, getLocalCoords, captureLayer]
    );

    const onPointerMove = useCallback(
        (e: PointerEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const { x, y } = getLocalCoords(e.clientX, e.clientY);

            if (interaction.kind === "draw") {
                setInteraction({ ...interaction, curX: x, curY: y });
                return;
            }

            if (interaction.kind === "maybeClick") {
                const dx = x - interaction.startX;
                const dy = y - interaction.startY;
                if (Math.hypot(dx, dy) > 5) {
                    const orig =
                        areasRef.current.find((a) => a.id === interaction.areaId)?.rect ?? {
                            coordinate_x: 0,
                            coordinate_y: 0,
                            width: 1,
                            height: 1,
                        };
                    setInteraction({
                        kind: "move",
                        areaId: interaction.areaId,
                        startX: interaction.startX,
                        startY: interaction.startY,
                        orig,
                    });
                }
                return;
            }

            if (interaction.kind === "move") {
                const dx = x - interaction.startX;
                const dy = y - interaction.startY;
                updateAreaRect(interaction.areaId, {
                    coordinate_x: interaction.orig.coordinate_x + dx,
                    coordinate_y: interaction.orig.coordinate_y + dy,
                    width: interaction.orig.width,
                    height: interaction.orig.height,
                });
                return;
            }

            if (interaction.kind === "resize" && bitmapSize) {
                const dx = x - interaction.startPointerX;
                const dy = y - interaction.startPointerY;
                const area = areasRef.current.find((a) => a.id === interaction.areaId);
                const ft: SignaturitFieldType = area?.signaturit?.fieldType ?? "signature";
                const next = applyResizeSignaturit(
                    interaction.handle,
                    interaction.orig,
                    dx,
                    dy,
                    bitmapSize.w,
                    bitmapSize.h,
                    ft
                );
                updateAreaRect(interaction.areaId, next);
            }
        },
        [interaction, getLocalCoords, updateAreaRect, bitmapSize]
    );

    const onPointerUp = useCallback(
        (e: PointerEvent) => {
            if (interaction.kind === "draw") {
                const { startX, startY, curX, curY } = interaction;
                setInteraction({ kind: "idle" });
                const rect = normalizeRect(startX, startY, curX, curY);
                if (rect.width >= 4 && rect.height >= 4 && bitmapSize) {
                    const clamped = clampSignatureRect(rect, bitmapSize.w, bitmapSize.h);
                    const ftNew = "signature" as const;
                    const fittedRect = fitSignaturitRectToConstraints(
                        clamped,
                        ftNew,
                        bitmapSize.w,
                        bitmapSize.h
                    );
                    const id = crypto.randomUUID();
                    const palette = [
                        "#2563eb",
                        "#16a34a",
                        "#ca8a04",
                        "#db2777",
                        "#9333ea",
                        "#ea580c",
                        "#0891b2",
                    ];
                    setAreas((prev) => {
                        const color =
                            colorMode === "primary"
                                ? BULK_SIGNATURE_AREA_COLOR
                                : parallelSignerColor ??
                                  palette[prev.length % palette.length];
                        const signaturit: SignaturitFieldFormState = {
                            ...createDefaultSignaturitFieldState(),
                            fieldType: ftNew,
                            fieldName: t(
                                signaturitFieldTypeLabelKey(ftNew),
                                signaturitFieldTypeDefaultLabel(ftNew)
                            ),
                            fieldId: nextSignaturitFieldIdFromAreas(prev, ftNew),
                        };
                        const next: SignatureAreaVisual = {
                            id,
                            page: pageNumber,
                            rect: fittedRect,
                            color,
                            signaturit,
                        };
                        if (parallelSignerId) {
                            next.signerId = parallelSignerId;
                        }
                        return [...prev, next];
                    });
                    onSelectArea(id);
                }
                return;
            }

            if (interaction.kind === "maybeClick") {
                const { x, y } = getLocalCoords(e.clientX, e.clientY);
                const dx = x - interaction.startX;
                const dy = y - interaction.startY;
                setInteraction({ kind: "idle" });
                if (Math.hypot(dx, dy) <= 5) {
                    onSelectArea(interaction.areaId);
                }
                return;
            }

            setInteraction({ kind: "idle" });
        },
        [
            interaction,
            bitmapSize,
            pageNumber,
            setAreas,
            onSelectArea,
            getLocalCoords,
            colorMode,
            parallelSignerColor,
            parallelSignerId,
            t,
        ]
    );

    const onPointerLeave = useCallback(() => {
        if (interaction.kind === "draw") {
            setInteraction({ kind: "idle" });
        }
    }, [interaction.kind]);

    const draftRect =
        interaction.kind === "draw"
            ? normalizeRect(interaction.startX, interaction.startY, interaction.curX, interaction.curY)
            : null;

    if (!file) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground",
                    className
                )}
            >
                Upload a PDF to place signature areas.
            </div>
        );
    }

    if (loadError) {
        return (
            <div className={cn("rounded-lg border border-destructive/50 p-4 text-sm text-destructive", className)}>
                {loadError}
            </div>
        );
    }

    return (
        <div className={cn("relative inline-block max-w-full", className)}>
            <canvas ref={canvasRef} className="block max-w-full rounded-md border bg-muted/30" />
            {pdfDoc && bitmapSize && (
                <div
                    ref={interactionLayerRef}
                    className={cn("absolute inset-0 touch-none", !drawingEnabled && "pointer-events-none")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => setInteraction({ kind: "idle" })}
                >
                    {/* Draw layer */}
                    <div
                        className={cn(
                            "absolute inset-0",
                            drawingEnabled ? "cursor-crosshair" : "cursor-not-allowed"
                        )}
                        onPointerDown={onBackdropPointerDown}
                        onPointerLeave={onPointerLeave}
                    />

                    {pageAreas.map((area, idx) => {
                        const pct = (v: number, dim: "w" | "h") =>
                            `${(v / (dim === "w" ? bitmapSize.w : bitmapSize.h)) * 100}%`;
                        const isSelected = selectedAreaId === area.id;
                        const ft = area.signaturit?.fieldType ?? "signature";
                        const compactFieldLabel = ft === "checkbox" || ft === "radio";
                        return (
                            <div
                                key={area.id}
                                className={cn(
                                    "group/area absolute cursor-grab active:cursor-grabbing",
                                    isSelected && "z-20"
                                )}
                                style={{
                                    left: pct(area.rect.coordinate_x, "w"),
                                    top: pct(area.rect.coordinate_y, "h"),
                                    width: pct(area.rect.width, "w"),
                                    height: pct(area.rect.height, "h"),
                                    zIndex: 10 + idx,
                                    color: area.color,
                                }}
                                onPointerDown={(e) => onAreaPointerDown(e, area.id)}
                            >
                                <div
                                    className={cn(
                                        "pointer-events-none absolute inset-0 rounded-sm border-2 border-dashed bg-current opacity-25",
                                        "group-hover/area:border-solid"
                                    )}
                                    style={{
                                        borderColor: area.color,
                                        ...SIGNATURE_AREA_REMOVE_BADGE_MASK_STYLE,
                                    }}
                                />
                                <div
                                    className={cn(
                                        "pointer-events-none absolute inset-0 rounded-sm border-2 border-dashed border-current opacity-90",
                                        "group-hover/area:border-solid"
                                    )}
                                    style={SIGNATURE_AREA_REMOVE_BADGE_MASK_STYLE}
                                />

                                <SignatureAreaFieldLabel
                                    compactFieldLabel={compactFieldLabel}
                                    fieldType={ft}
                                    color={area.color}
                                    labelText={t(
                                        signaturitFieldTypeLabelKey(ft),
                                        signaturitFieldTypeDefaultLabel(ft)
                                    )}
                                />

                                {/* Decorative only — pointer-events-none so drag uses the area beneath */}
                                <div
                                    className="pointer-events-none absolute inset-0 z-[23] flex items-center justify-center"
                                    aria-hidden
                                >
                                    <Pencil
                                        className="h-5 w-5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/area:opacity-100"
                                        strokeWidth={2}
                                        style={{ color: area.color }}
                                        aria-hidden
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={cn(
                                        "pointer-events-auto absolute left-0 top-0 z-[38] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-solid",
                                        "hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    )}
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${area.color} 25%, transparent)`,
                                        borderColor: area.color,
                                        color: area.color,
                                    }}
                                    aria-label={t("signingRequests.create.removeSignatureArea", "Remove signature area")}
                                    title={t("signingRequests.create.removeSignatureArea", "Remove signature area")}
                                    onPointerDown={(ev) => {
                                        removeBadgePointerStartRef.current = { x: ev.clientX, y: ev.clientY };
                                    }}
                                    onPointerCancel={() => {
                                        removeBadgePointerStartRef.current = null;
                                    }}
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        const start = removeBadgePointerStartRef.current;
                                        removeBadgePointerStartRef.current = null;
                                        if (start === null) {
                                            removeArea(area.id);
                                            return;
                                        }
                                        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 5) return;
                                        removeArea(area.id);
                                    }}
                                >
                                    <X className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
                                </button>

                                {/* Resize handles — omit `nw` (remove badge sits on that corner). `!cursor-*` overrides default `cursor:pointer` on <button> */}
                                {(["n", "ne", "e", "se", "s", "sw", "w"] as const).map((h) => (
                                    <button
                                        key={h}
                                        type="button"
                                        tabIndex={-1}
                                        className={cn(
                                            HANDLE,
                                            "absolute z-40 opacity-0 pointer-events-none transition-opacity duration-150",
                                            "group-hover/area:pointer-events-auto group-hover/area:opacity-100",
                                            "!cursor-nwse-resize",
                                            h === "n" && "-top-1 left-1/2 -translate-x-1/2 !cursor-ns-resize",
                                            h === "s" && "-bottom-1 left-1/2 -translate-x-1/2 !cursor-ns-resize",
                                            h === "e" && "top-1/2 -right-1 -translate-y-1/2 !cursor-ew-resize",
                                            h === "w" && "top-1/2 -left-1 -translate-y-1/2 !cursor-ew-resize",
                                            h === "ne" && "-right-1 -top-1 !cursor-nesw-resize",
                                            h === "sw" && "-bottom-1 -left-1 !cursor-nesw-resize",
                                            h === "se" && "-bottom-1 -right-1 !cursor-nwse-resize"
                                        )}
                                        aria-label={h}
                                        onPointerDown={(ev) => onHandlePointerDown(ev, area.id, h, area.rect)}
                                    />
                                ))}
                            </div>
                        );
                    })}

                    {draftRect &&
                        draftRect.width >= 4 &&
                        draftRect.height >= 4 &&
                        bitmapSize && (
                            <div
                                className="pointer-events-none absolute border-2 border-dashed border-amber-500 bg-amber-500/10"
                                style={{
                                    left: `${(draftRect.coordinate_x / bitmapSize.w) * 100}%`,
                                    top: `${(draftRect.coordinate_y / bitmapSize.h) * 100}%`,
                                    width: `${(draftRect.width / bitmapSize.w) * 100}%`,
                                    height: `${(draftRect.height / bitmapSize.h) * 100}%`,
                                }}
                            />
                        )}
                </div>
            )}
        </div>
    );
}
