/**
 * Re-export the InvoiceHeaderRow from purchase invoices but using the sale invoice context bridge.
 * The bridge file at contexts/InvoiceContext.tsx re-exports useSaleInvoice as useInvoice.
 */
import React from "react";
import { Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/types/invoices/invoices";
import { useInvoice } from "../../contexts/InvoiceContext";
import { Input } from "@/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { calculateHeaderLineValues, formatPercentage } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useInvoiceItemsColumnLayout } from "@/app/components/invoice-items-table/invoice-items-column-layout";

interface SaleInvoiceHeaderRowProps {
    headerLine: InvoiceItem;
    showDiscount: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    childrenCount: number;
    availableHeaders: InvoiceItem[];
    nestingLevel?: number;
    isDropTarget?: boolean;
}

export const SaleInvoiceHeaderRow: React.FC<SaleInvoiceHeaderRowProps> = ({
    headerLine,
    showDiscount,
    isCollapsed,
    onToggleCollapse,
    childrenCount,
    nestingLevel = 0,
    isDropTarget = false
}) => {
    const { t } = useTranslation();
    const { invoice, updateLine, deleteLine, isReadOnly } = useInvoice();
    const { colStyle } = useInvoiceItemsColumnLayout();
    const onUpdate = updateLine;
    const onDelete = deleteLine;
    const invoiceCurrency = invoice.currency || undefined;

    const sortableId = headerLine.id || `line-${headerLine.order}`;

    const {
        attributes,
        listeners,
        setNodeRef: setSortableNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sortableId });

    const { setNodeRef: setDroppableNodeRef } = useDroppable({
        id: sortableId,
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setSortableNodeRef(node);
        setDroppableNodeRef(node);
    };

    const headerValues = calculateHeaderLineValues(
        headerLine,
        invoice.lines,
        invoice.item_discount_enabled
    );

    const style = {
        transform: isDragging ? 'none' : CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: nestingLevel === 0
                    ? 'hsl(var(--muted) / 0.3)'
                    : `hsl(var(--muted) / ${Math.max(0.25 - (nestingLevel * 0.05), 0.1)})`
            }}
            className={cn(
                "group font-medium hover:bg-muted/50 transition-all",
                isDropTarget && "ring-2 ring-blue-400 bg-blue-500/10! dark:bg-blue-950/20"
            )}
        >
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("grip")}
            >
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={onToggleCollapse}>
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {!isReadOnly && (
                        <div {...attributes} {...listeners} className="cursor-move">
                            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </div>
                    )}
                </div>
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("concept")}
            >
                <div className="flex items-center gap-2 w-full">
                    {nestingLevel > 0 && <div className="flex" style={{ marginLeft: `${nestingLevel * 16}px` }} />}
                    <Input
                        value={headerLine.name || ""}
                        onChange={(e) => onUpdate(headerLine.order, "name", e.target.value)}
                        placeholder={t("invoices.headerNamePlaceholder", "Partida name...")}
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 font-semibold flex-1"
                        disabled={isReadOnly}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">({childrenCount})</span>
                </div>
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("description")}
            >
                <Textarea
                    value={headerLine.description || ""}
                    onChange={(e) => onUpdate(headerLine.order, "description", e.target.value)}
                    placeholder={t("invoices.descriptionPlaceholder", "Desc")}
                    className="min-h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent resize-none max-h-24 p-1 mt-2"
                    rows={2}
                    disabled={isReadOnly}
                />
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("quantity")}
            >
                <div className="h-8 flex items-center px-2 text-sm text-muted-foreground">{headerValues.quantity}</div>
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("price")}
            >
                <CurrencyLabel data={{ value: headerValues.price, currency: invoiceCurrency }} className="text-muted-foreground" />
            </TableCell>

            {showDiscount && (
                <TableCell
                    className="p-1 align-middle overflow-hidden"
                    style={colStyle("discount")}
                >
                    <div className="h-8 flex items-center px-2 text-sm text-muted-foreground">-</div>
                </TableCell>
            )}

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("taxes")}
            >
                <CurrencyLabel data={{ value: headerValues.taxesAmount, currency: invoiceCurrency }} className="text-muted-foreground" />
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("total")}
            >
                <CurrencyLabel data={{ value: headerValues.total, currency: invoiceCurrency }} className="font-medium" />
            </TableCell>

            {/* Divider between sale and cost */}
            <TableCell
                className="p-0 border-l align-middle overflow-hidden"
                style={colStyle("divider")}
            />

            {/* Cost Price (PC) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("cost")}
            >
                {headerValues.costPrice != null ? (
                    <CurrencyLabel data={{ value: headerValues.costPrice, currency: invoiceCurrency }} className="text-muted-foreground" />
                ) : (
                    <span className="text-sm text-muted-foreground px-1">-</span>
                )}
            </TableCell>

            {/* Margin % */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("margin")}
            >
                <span className={cn(
                    "text-sm px-1",
                    headerValues.margin != null
                        ? headerValues.margin >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                )}>
                    {headerValues.margin != null ? formatPercentage(headerValues.margin) : "-"}
                </span>
            </TableCell>

            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("actions")}
            >
                {!isReadOnly && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(headerLine.order)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
};
