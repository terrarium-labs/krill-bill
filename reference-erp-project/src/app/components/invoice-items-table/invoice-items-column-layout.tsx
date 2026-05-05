import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type InvoiceItemsTableVariant = "sale" | "purchase";

const MIN_WIDTHS: Record<string, number> = {
    concept: 100,
    description: 80,
    quantity: 56,
    price: 64,
    discount: 56,
    taxes: 100,
    total: 72,
    cost: 56,
    margin: 56,
};

const SALE_DEFAULT_WIDTHS: Record<string, number> = {
    grip: 32,
    concept: 192,
    description: 128,
    quantity: 80,
    price: 96,
    discount: 80,
    taxes: 144,
    total: 96,
    divider: 1,
    cost: 80,
    margin: 80,
    actions: 72,
};

const PURCHASE_DEFAULT_WIDTHS: Record<string, number> = {
    grip: 32,
    concept: 192,
    description: 128,
    quantity: 80,
    price: 96,
    discount: 80,
    taxes: 144,
    total: 96,
    actions: 40,
};

const SALE_RESIZABLE = new Set([
    "concept",
    "description",
    "quantity",
    "price",
    "discount",
    "taxes",
    "total",
    "cost",
    "margin",
]);

const PURCHASE_RESIZABLE = new Set([
    "concept",
    "description",
    "quantity",
    "price",
    "discount",
    "taxes",
    "total",
]);

interface InvoiceItemsColumnLayoutContextValue {
    variant: InvoiceItemsTableVariant;
    showDiscount: boolean;
    colStyle: (col: string) => React.CSSProperties;
    beginResize: (col: string, clientX: number) => void;
}

const InvoiceItemsColumnLayoutContext =
    createContext<InvoiceItemsColumnLayoutContextValue | null>(null);

export function InvoiceItemsColumnLayoutProvider({
    variant,
    showDiscount,
    children,
}: {
    variant: InvoiceItemsTableVariant;
    showDiscount: boolean;
    children: React.ReactNode;
}) {
    const [widths, setWidths] = useState<Record<string, number>>(() =>
        variant === "sale"
            ? { ...SALE_DEFAULT_WIDTHS }
            : { ...PURCHASE_DEFAULT_WIDTHS },
    );

    const resizableSet =
        variant === "sale" ? SALE_RESIZABLE : PURCHASE_RESIZABLE;

    const colStyle = useCallback(
        (col: string) => {
            const w = widths[col];
            if (w == null) return {};
            return {
                width: w,
                minWidth: w,
                maxWidth: w,
            } as React.CSSProperties;
        },
        [widths],
    );

    const beginResize = useCallback(
        (col: string, clientX: number) => {
            if (!resizableSet.has(col)) return;
            const startPointerX = clientX;
            const startW = widths[col];
            const min = MIN_WIDTHS[col] ?? 48;
            if (startW == null) return;

            const onMove = (e: PointerEvent) => {
                const next = Math.max(
                    min,
                    startW + (e.clientX - startPointerX),
                );
                setWidths((prev) => ({ ...prev, [col]: next }));
            };

            const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
            };

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        },
        [resizableSet, widths],
    );

    const value = useMemo(
        () => ({
            variant,
            showDiscount,
            colStyle,
            beginResize,
        }),
        [variant, showDiscount, colStyle, beginResize],
    );

    return (
        <InvoiceItemsColumnLayoutContext.Provider value={value}>
            {children}
        </InvoiceItemsColumnLayoutContext.Provider>
    );
}

export function useInvoiceItemsColumnLayout(): InvoiceItemsColumnLayoutContextValue {
    const ctx = useContext(InvoiceItemsColumnLayoutContext);
    if (!ctx) {
        throw new Error(
            "useInvoiceItemsColumnLayout must be used within InvoiceItemsColumnLayoutProvider",
        );
    }
    return ctx;
}

/** Use inside invoice items table rows when a provider may be absent (e.g. tests). */
export function InvoiceItemsTh({
    col,
    className,
    children,
}: {
    col: string;
    className?: string;
    children?: React.ReactNode;
}) {
    const { colStyle } = useInvoiceItemsColumnLayout();
    return (
        <TableHead
            className={cn(
                "relative overflow-hidden px-2 py-2 text-left align-middle text-sm font-medium",
                className,
            )}
            style={colStyle(col)}
        >
            {children}
        </TableHead>
    );
}

export function InvoiceItemsResizableTh({
    col,
    className,
    children,
}: {
    col: string;
    className?: string;
    children?: React.ReactNode;
}) {
    const { colStyle, beginResize, variant } = useInvoiceItemsColumnLayout();
    const resizable =
        variant === "sale"
            ? SALE_RESIZABLE.has(col)
            : PURCHASE_RESIZABLE.has(col);
    const style = colStyle(col);

    return (
        <TableHead
            className={cn(
                "relative overflow-hidden px-2 py-2 text-left align-middle text-sm font-medium",
                className,
            )}
            style={style}
        >
            <span className="block truncate pr-2">{children}</span>
            {resizable && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-hidden
                    className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize select-none hover:bg-primary/25 active:bg-primary/35"
                    onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        beginResize(col, e.clientX);
                    }}
                />
            )}
        </TableHead>
    );
}
