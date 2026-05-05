import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pdfjsLib } from "@/lib/pdfjs";
import type { SignatureAreaVisual } from "./pdf-multi-signature-canvas";

const THUMB_MAX_WIDTH = 88;

type PdfPageThumbnailsStripProps = {
    file: File | null;
    currentPage: number;
    onSelectPage: (page: number) => void;
    /** Signature areas (used to show per-page counts on thumbnails). */
    areas: SignatureAreaVisual[];
    /** Vertical strip on the left of the document, or horizontal bar above. */
    orientation?: "horizontal" | "vertical";
    className?: string;
};

function PageThumbnail({
    pdfDoc,
    pageNumber,
    active,
    signatureAreaCount,
    onSelect,
}: {
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
    active: boolean;
    signatureAreaCount: number;
    onSelect: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { t } = useTranslation();

    const render = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas || !pdfDoc) return;
        const page = await pdfDoc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = THUMB_MAX_WIDTH / base.width;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
    }, [pdfDoc, pageNumber]);

    useEffect(() => {
        void render();
    }, [render]);

    useEffect(() => {
        if (active) {
            buttonRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        }
    }, [active]);

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={onSelect}
            title={
                signatureAreaCount > 0
                    ? t(
                          "signingRequests.create.pageThumbTitle",
                          "Page {{page}} — {{count}} signature area(s)",
                          { page: pageNumber, count: signatureAreaCount }
                      )
                    : t("signingRequests.create.pageThumbTitleEmpty", "Page {{page}}", {
                          page: pageNumber,
                      })
            }
            aria-label={
                signatureAreaCount > 0
                    ? t(
                          "signingRequests.create.pageThumbAria",
                          "Page {{page}}, {{count}} signature areas",
                          { page: pageNumber, count: signatureAreaCount }
                      )
                    : t("signingRequests.create.pageThumbAriaEmpty", "Page {{page}}", {
                          page: pageNumber,
                      })
            }
            className={cn(
                "relative flex w-[92px] shrink-0 flex-col items-center gap-1 rounded-lg border bg-background p-1.5 text-left shadow-sm transition-colors",
                active
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/80 hover:border-muted-foreground/40"
            )}
        >
            {signatureAreaCount > 0 ? (
                <Badge
                    variant="default"
                    className="pointer-events-none absolute right-0.5 top-0.5 z-10 h-5 min-w-[1.25rem] justify-center rounded-full border-0 px-1 text-[10px] font-semibold tabular-nums leading-none shadow-sm"
                >
                    {signatureAreaCount}
                </Badge>
            ) : null}
            <canvas ref={canvasRef} className="block max-h-[120px] w-full rounded-sm bg-muted/40" />
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {t("signingRequests.create.pageN", "Page {{n}}", { n: pageNumber })}
            </span>
        </button>
    );
}

/**
 * Horizontal strip of rendered page miniatures (scroll along the top of the document area).
 */
export function PdfPageThumbnailsStrip({
    file,
    currentPage,
    onSelectPage,
    areas,
    orientation = "horizontal",
    className,
}: PdfPageThumbnailsStripProps) {
    const { t } = useTranslation();
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const areaCountByPage = useMemo(() => {
        const m = new Map<number, number>();
        for (const a of areas) {
            m.set(a.page, (m.get(a.page) ?? 0) + 1);
        }
        return m;
    }, [areas]);

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
                const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
                if (cancelled) return;
                setPdfDoc(pdf);
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Failed to load PDF");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [file]);

    if (!file) {
        return null;
    }

    if (loadError) {
        return (
            <div
                className={cn(
                    "w-full shrink-0 rounded border border-destructive/40 p-2 text-[10px] text-destructive",
                    className
                )}
            >
                {loadError}
            </div>
        );
    }

    const isVertical = orientation === "vertical";

    if (!pdfDoc) {
        return (
            <div
                className={cn(
                    "flex shrink-0 gap-2 bg-muted/15",
                    isVertical
                        ? "h-full min-h-[200px] w-[112px] min-w-0 flex-col overflow-y-auto overflow-x-hidden border-r border-border/80 pl-2 pr-3 py-2"
                        : "h-[140px] w-full shrink-0 items-center overflow-x-auto border-b border-border/80 px-2 py-2",
                    className
                )}
            >
                <div
                    className={cn(
                        "shrink-0 animate-pulse rounded-lg bg-muted",
                        isVertical ? "h-24 w-full" : "h-[120px] w-24"
                    )}
                />
                <div
                    className={cn(
                        "shrink-0 animate-pulse rounded-lg bg-muted",
                        isVertical ? "h-24 w-full" : "h-[120px] w-24"
                    )}
                />
                <div
                    className={cn(
                        "shrink-0 animate-pulse rounded-lg bg-muted",
                        isVertical ? "h-24 w-full" : "h-[120px] w-24"
                    )}
                />
            </div>
        );
    }

    const n = pdfDoc.numPages;

    return (
        <nav
            className={cn(
                "flex min-w-0 shrink-0 gap-2 bg-muted/15 scroll-smooth [scrollbar-gutter:stable]",
                isVertical
                    ? "h-full min-h-0 w-[112px] max-w-[112px] flex-col overflow-y-auto overflow-x-hidden border-r border-border/80 pl-2 pr-3 py-2"
                    : "w-full flex-row overflow-x-auto overflow-y-hidden border-b border-border/80 px-2 py-2",
                className
            )}
            aria-label={t("signingRequests.create.pageThumbnailsNav", "PDF pages")}
        >
            {Array.from({ length: n }, (_, i) => i + 1).map((p) => (
                <PageThumbnail
                    key={p}
                    pdfDoc={pdfDoc}
                    pageNumber={p}
                    active={currentPage === p}
                    signatureAreaCount={areaCountByPage.get(p) ?? 0}
                    onSelect={() => onSelectPage(p)}
                />
            ))}
        </nav>
    );
}
