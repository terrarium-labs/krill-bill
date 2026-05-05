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
import { calculateHeaderLineValues } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useInvoiceItemsColumnLayout } from "@/app/components/invoice-items-table/invoice-items-column-layout";

interface InvoiceHeaderRowProps {
    headerLine: InvoiceItem;
    showDiscount: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    childrenCount: number;
    availableHeaders: InvoiceItem[];
    nestingLevel?: number;
    isDropTarget?: boolean;
}

export const InvoiceHeaderRow: React.FC<InvoiceHeaderRowProps> = ({
    headerLine,
    showDiscount,
    isCollapsed,
    onToggleCollapse,
    childrenCount,
    nestingLevel = 0,
    isDropTarget = false
}) => {
    const { t } = useTranslation();
    const { invoice, updateLine, deleteLine } = useInvoice();
    const { colStyle } = useInvoiceItemsColumnLayout();
    const onUpdate = updateLine;
    const onDelete = deleteLine;
    const invoiceCurrency = invoice.currency || undefined;

    // Use a unique identifier for drag/drop
    const sortableId = headerLine.id || `line-${headerLine.order}`;

    const {
        attributes,
        listeners,
        setNodeRef: setSortableNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sortableId });

    // Make this header droppable
    const { setNodeRef: setDroppableNodeRef } = useDroppable({
        id: sortableId,
    });

    // Combine refs
    const setNodeRef = (node: HTMLElement | null) => {
        setSortableNodeRef(node);
        setDroppableNodeRef(node);
    };

    // Calculate header values from children
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
            {/* Drag Handle / Collapse Toggle */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("grip")}
            >
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={onToggleCollapse}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-move"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </div>
                </div>
            </TableCell>

            {/* Name (Editable) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("concept")}
            >
                <div className="flex items-center gap-2 w-full">
                    {/* Nesting indicator */}
                    {nestingLevel > 0 && (
                        <div className="flex" style={{ marginLeft: `${nestingLevel * 16}px` }} />
                    )}

                    <Input
                        value={headerLine.name || ""}
                        onChange={(e) => onUpdate(headerLine.order, "name", e.target.value)}
                        placeholder={t("invoices.headerNamePlaceholder", "Partida name...")}
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 font-semibold flex-1"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">({childrenCount})</span>
                </div>
            </TableCell>

            {/* Description (Editable) */}
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
                />
            </TableCell>

            {/* Quantity (Calculated, Read-only) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("quantity")}
            >
                <div className="h-8 flex items-center px-2 text-sm text-muted-foreground">
                    {headerValues.quantity}
                </div>
            </TableCell>

            {/* Price (Calculated, Read-only) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("price")}
            >
                <CurrencyLabel data={{ value: headerValues.price, currency: invoiceCurrency }} className="text-muted-foreground" />
            </TableCell>

            {/* Discount - Hidden for headers */}
            {showDiscount && (
                <TableCell
                    className="p-1 align-middle overflow-hidden"
                    style={colStyle("discount")}
                >
                    <div className="h-8 flex items-center px-2 text-sm text-muted-foreground">
                        -
                    </div>
                </TableCell>
            )}

            {/* Taxes (Calculated, Read-only) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("taxes")}
            >
                <CurrencyLabel data={{ value: headerValues.taxesAmount, currency: invoiceCurrency }} className="text-muted-foreground" />
            </TableCell>

            {/* Total (Calculated, Read-only) */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("total")}
            >
                <CurrencyLabel data={{ value: headerValues.total, currency: invoiceCurrency }} className="font-medium" />
            </TableCell>

            {/* Actions */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("actions")}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(headerLine.order)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};
