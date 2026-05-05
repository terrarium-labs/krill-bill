import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createTw } from "@hyperline/react-pdf-tailwind";
import { SaleInvoice, InvoiceItem } from "@/types/invoices/invoices";
import { Org } from "@/types/general/org";
import TAX_CODES from "@/utils/taxes";

const tw = createTw({
    theme: {
        extend: {
            colors: {
                primary: "#18181b",
                muted: "#71717a",
                border: "#e4e4e7",
                "header-bg": "#18181b",
                "header-text": "#ffffff",
                "row-alt": "#fafafa",
            },
        },
    },
});

export type PdfDisplayMode = "lines" | "partidas";

interface InvoicePdfDocumentProps {
    invoice: SaleInvoice;
    org: Org;
    calculations: {
        subtotalBeforeDiscount: number;
        itemsDiscount: number;
        subtotalAfterItemsDiscount: number;
        globalDiscountAmount: number;
        subtotal: number;
        taxesByType: Record<string, number>;
        totalTaxes: number;
        total: number;
    };
    displayMode: PdfDisplayMode;
    partidaLevels: number;
}

const fmtCurrency = (amount: number, currency: string = "EUR"): string => {
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const fmtDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

interface PartidaNode {
    header: InvoiceItem;
    children: InvoiceItem[];
    subPartidas: PartidaNode[];
}

const buildPartidaTree = (lines: InvoiceItem[]): { topPartidas: PartidaNode[]; orphanLines: InvoiceItem[] } => {
    const allLines = lines.filter((l) => !l.is_indirect_cost && l.is_visible !== false);
    const headers = allLines.filter((l) => l.is_header);
    const items = allLines.filter((l) => !l.is_header);

    const headerMap = new Map<string, PartidaNode>();
    headers.forEach((h) => {
        const key = h.id || `temp-${h.order}`;
        headerMap.set(key, { header: h, children: [], subPartidas: [] });
    });

    items.forEach((item) => {
        if (item.parent) {
            const node = headerMap.get(item.parent.id);
            if (node) {
                node.children.push(item);
                return;
            }
        }
    });

    const topPartidas: PartidaNode[] = [];
    const orphanLines: InvoiceItem[] = items.filter((item) => !item.parent);

    const sortedHeaders = [...headers].sort((a, b) => {
        const depthA = getHeaderDepth(a, headerMap);
        const depthB = getHeaderDepth(b, headerMap);
        return depthB - depthA;
    });

    sortedHeaders.forEach((h) => {
        const key = h.id || `temp-${h.order}`;
        const node = headerMap.get(key)!;
        const header = node.header;
        if (header.parent) {
            const parentNode = headerMap.get(header.parent.id);
            if (parentNode) {
                parentNode.subPartidas.push(node);
                return;
            }
        }
        topPartidas.push(node);
    });

    topPartidas.sort((a, b) => a.header.order - b.header.order);

    return { topPartidas, orphanLines };
};

const getHeaderDepth = (header: InvoiceItem, headerMap: Map<string, PartidaNode>): number => {
    let depth = 0;
    let current = header;
    while (current.parent) {
        const parentNode = headerMap.get(current.parent.id);
        if (!parentNode) break;
        depth++;
        current = parentNode.header;
    }
    return depth;
};

const getAllDescendantItems = (node: PartidaNode): InvoiceItem[] => {
    return [
        ...node.children,
        ...node.subPartidas.flatMap((sub) => getAllDescendantItems(sub)),
    ];
};

const getPartidaValues = (node: PartidaNode, showItemDiscount: boolean): {
    quantity: number;
    price: number;
    total: number;
} => {
    const allItems = getAllDescendantItems(node);

    let totalQuantity = 0;
    let subtotalBeforeDiscount = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    allItems.forEach((item) => {
        const qty = item.quantity ?? 0;
        const price = item.price ?? 0;
        const discount = showItemDiscount ? (item.discount ?? 0) : 0;

        const itemSubtotal = qty * price;
        const itemDiscountAmount = itemSubtotal * (discount / 100);
        const itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;

        const taxRate = item.taxes?.reduce((sum, tax) =>
            sum + (tax.is_negative ? -tax.amount : tax.amount), 0
        ) || 0;
        const itemTotal = itemSubtotalAfterDiscount + itemSubtotalAfterDiscount * (taxRate / 100);

        totalQuantity += qty;
        subtotalBeforeDiscount += itemSubtotal;
        totalDiscount += itemDiscountAmount;
        grandTotal += itemTotal;
    });

    const averagePrice = totalQuantity > 0 ? subtotalBeforeDiscount / totalQuantity : 0;

    return {
        quantity: totalQuantity,
        price: averagePrice,
        total: grandTotal,
    };
};

const InvoicePdfDocument = ({ invoice, org, calculations, displayMode, partidaLevels }: InvoicePdfDocumentProps) => {
    const currency = invoice.currency || org.currency || "EUR";
    const showItemDiscount = invoice.item_discount_enabled;

    const flatVisibleLines = invoice.lines.filter(
        (line) => !line.is_header && !line.is_indirect_cost && line.is_visible !== false
    );

    const formatAddress = (parts: { line1?: string | null; line2?: string | null; postalCode?: string | null; city?: string | null; stateProvince?: string | null; country?: string | null }) => {
        const streetLine = [parts.line1, parts.line2].filter(Boolean).join(", ");
        const locationLine = [
            parts.postalCode && parts.city ? `${parts.postalCode} ${parts.city}` : parts.postalCode || parts.city,
            parts.stateProvince,
            parts.country,
        ].filter(Boolean).join(", ");
        return { streetLine, locationLine };
    };

    const orgAddress = formatAddress({
        line1: org.address_line_1, line2: org.address_line_2,
        postalCode: org.postal_code, city: org.city,
        stateProvince: org.state_province, country: org.country,
    });

    const clientAddress = invoice.client ? formatAddress({
        line1: invoice.client.address_line_1, line2: invoice.client.address_line_2,
        postalCode: invoice.client.postal_code, city: invoice.client.city,
        stateProvince: invoice.client.state_province, country: invoice.client.country,
    }) : null;

    const getLineTotal = (line: InvoiceItem): number => {
        const qty = line.quantity ?? 0;
        const price = line.price ?? 0;
        const discount = showItemDiscount ? (line.discount ?? 0) : 0;
        const subtotal = qty * price;
        return subtotal - subtotal * (discount / 100);
    };

    const renderLineRow = (line: InvoiceItem, index: number) => (
        <View
            key={line.id || `line-${index}`}
            style={tw(`flex flex-row py-2 px-3 ${index % 2 === 1 ? "bg-row-alt" : ""}`)}
        >
            <View style={tw("flex-1")}>
                <Text style={tw("text-xs font-medium")}>{line.name || line.item?.name || "—"}</Text>
                {line.description ? (
                    <Text style={tw("text-xs text-muted mt-0.5")}>{line.description}</Text>
                ) : null}
            </View>
            <Text style={tw("w-16 text-right text-xs")}>{line.quantity ?? 0}</Text>
            <Text style={tw("w-24 text-right text-xs")}>{fmtCurrency(line.price ?? 0, currency)}</Text>
            {showItemDiscount && (
                <Text style={tw("w-16 text-right text-xs")}>{line.discount ?? 0}%</Text>
            )}
            <Text style={tw("w-24 text-right text-xs font-medium")}>{fmtCurrency(getLineTotal(line), currency)}</Text>
        </View>
    );

    const partidaBgColors = ["#e4e4e7", "#ececee", "#f4f4f5", "#fafafa"];
    const indent = (depth: number) => depth * 12;

    const renderPartida = (node: PartidaNode, depth: number) => {
        const values = getPartidaValues(node, showItemDiscount);
        const bgColor = partidaBgColors[Math.min(depth, partidaBgColors.length - 1)];
        const isExpanded = depth < partidaLevels - 1;
        const childIndent = indent(depth + 1);

        return (
            <View key={node.header.id || `partida-${node.header.order}`} style={tw(depth === 0 ? "mb-3" : "mb-1")}>
                <View style={[
                    tw(`flex flex-row py-2 px-3 ${depth === 0 ? "rounded-sm" : ""}`),
                    { backgroundColor: bgColor, paddingLeft: 12 + indent(depth) },
                ]}>
                    <Text style={tw("flex-1 font-bold text-xs")}>{node.header.name}</Text>
                    <Text style={tw("w-16 text-right text-xs text-muted")}>{values.quantity}</Text>
                    <Text style={tw("w-24 text-right text-xs text-muted")}>{fmtCurrency(values.price, currency)}</Text>
                    {showItemDiscount && (
                        <Text style={tw("w-16 text-right text-xs text-muted")}>-</Text>
                    )}
                    <Text style={tw("w-24 text-right text-xs font-bold")}>{fmtCurrency(values.total, currency)}</Text>
                </View>

                {isExpanded && (
                    <>
                        {node.subPartidas
                            .sort((a, b) => a.header.order - b.header.order)
                            .map((sub) => renderPartida(sub, depth + 1))}

                        {node.children
                            .sort((a, b) => a.order - b.order)
                            .map((line, idx) => (
                                <View
                                    key={line.id || `pline-${idx}`}
                                    style={[tw(`flex flex-row py-1.5 px-3 ${idx % 2 === 1 ? "bg-row-alt" : ""}`), { paddingLeft: 12 + childIndent }]}
                                >
                                    <View style={tw("flex-1")}>
                                        <Text style={tw("text-xs")}>{line.name || line.item?.name || "—"}</Text>
                                    </View>
                                    <Text style={tw("w-16 text-right text-xs")}>{line.quantity ?? 0}</Text>
                                    <Text style={tw("w-24 text-right text-xs")}>{fmtCurrency(line.price ?? 0, currency)}</Text>
                                    {showItemDiscount && (
                                        <Text style={tw("w-16 text-right text-xs")}>{line.discount ?? 0}%</Text>
                                    )}
                                    <Text style={tw("w-24 text-right text-xs")}>{fmtCurrency(getLineTotal(line), currency)}</Text>
                                </View>
                            ))}
                    </>
                )}
            </View>
        );
    };

    const { topPartidas, orphanLines } = displayMode === "partidas"
        ? buildPartidaTree(invoice.lines)
        : { topPartidas: [], orphanLines: [] };

    return (
        <Document>
            <Page size="A4" style={tw("p-12 text-primary text-xs")}>
                {/* Header: Org & Invoice info */}
                <View style={tw("flex flex-row justify-between mb-8")}>
                    <View style={tw("flex-1")}>
                        <Text style={tw("text-xl font-bold mb-1")}>{org.name}</Text>
                        {orgAddress.streetLine && <Text style={tw("text-muted text-xs mb-0.5")}>{orgAddress.streetLine}</Text>}
                        {orgAddress.locationLine && <Text style={tw("text-muted text-xs mb-0.5")}>{orgAddress.locationLine}</Text>}
                        {org.tax_code && (
                            <Text style={tw("text-muted text-xs mb-0.5 capitalize")}>{TAX_CODES.find(tax => tax.id === org.tax_code_type)?.label || "Tax Code"} {org.tax_code}</Text>
                        )}
                        {org.email && <Text style={tw("text-muted text-xs mb-0.5")}>{org.email}</Text>}
                        {org.phone && <Text style={tw("text-muted text-xs")}>{org.phone}</Text>}
                    </View>
                    <View style={tw("items-end")}>
                        <Text style={tw("text-2xl font-bold text-primary mb-2")}>INVOICE</Text>
                        <Text style={tw("text-xs text-muted mb-0.5")}>
                            {invoice.invoice_number ? `#${invoice.invoice_number}` : "DRAFT"}
                        </Text>
                        <Text style={tw("text-xs text-muted mb-0.5")}>
                            Date: {fmtDate(invoice.invoice_date)}
                        </Text>
                        {invoice.due_dates && invoice.due_dates.length > 0 && (
                            <Text style={tw("text-xs text-muted")}>
                                Due: {fmtDate(invoice.due_dates[0].due_date)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Bill To */}
                {invoice.client && (
                    <View style={tw("mb-8 p-4 bg-row-alt rounded-sm")}>
                        <Text style={tw("text-xs font-bold text-muted mb-2 uppercase tracking-wider")}>Bill To</Text>
                        <Text style={tw("text-sm font-bold mb-0.5")}>{invoice.client.trade_name}</Text>
                        {invoice.client.tax_code && (
                            <Text style={tw("text-xs text-muted mb-0.5 capitalize")}>{TAX_CODES.find(tax => tax.id === invoice.client.tax_code_type)?.label} {invoice.client.tax_code}</Text>
                        )}
                        {clientAddress?.streetLine && <Text style={tw("text-xs text-muted mb-0.5")}>{clientAddress.streetLine}</Text>}
                        {clientAddress?.locationLine && <Text style={tw("text-xs text-muted mb-0.5")}>{clientAddress.locationLine}</Text>}
                        {invoice.client.email && <Text style={tw("text-xs text-muted")}>{invoice.client.email}</Text>}
                    </View>
                )}

                {/* Table Header */}
                <View style={tw("flex flex-row bg-header-bg rounded-sm py-2 px-3 mb-0.5")}>
                    <Text style={tw("flex-1 text-header-text font-bold text-xs")}>Description</Text>
                    {displayMode === "lines" && (
                        <Text style={tw("w-16 text-right text-header-text font-bold text-xs")}>Qty</Text>
                    )}
                    {displayMode === "lines" && (
                        <Text style={tw("w-24 text-right text-header-text font-bold text-xs")}>Price</Text>
                    )}
                    {displayMode === "lines" && showItemDiscount && (
                        <Text style={tw("w-16 text-right text-header-text font-bold text-xs")}>Disc.</Text>
                    )}
                    {displayMode === "partidas" && (
                        <>
                            <Text style={tw("w-16 text-right text-header-text font-bold text-xs")}>Qty</Text>
                            <Text style={tw("w-24 text-right text-header-text font-bold text-xs")}>Price</Text>
                            {showItemDiscount && (
                                <Text style={tw("w-16 text-right text-header-text font-bold text-xs")}>Disc.</Text>
                            )}
                        </>
                    )}
                    <Text style={tw("w-24 text-right text-header-text font-bold text-xs")}>Amount</Text>
                </View>

                {/* Lines mode */}
                {displayMode === "lines" && flatVisibleLines.map((line, index) => renderLineRow(line, index))}

                {/* Partidas mode */}
                {displayMode === "partidas" && (
                    <View>
                        {topPartidas.map((node) => renderPartida(node, 0))}
                        {orphanLines.length > 0 && orphanLines.map((line, index) => (
                            <View
                                key={line.id || `orphan-${index}`}
                                style={tw(`flex flex-row py-1.5 px-3 ${index % 2 === 1 ? "bg-row-alt" : ""}`)}
                            >
                                <View style={tw("flex-1")}>
                                    <Text style={tw("text-xs")}>{line.name || line.item?.name || "—"}</Text>
                                </View>
                                <Text style={tw("w-16 text-right text-xs")}>{line.quantity ?? 0}</Text>
                                <Text style={tw("w-24 text-right text-xs")}>{fmtCurrency(line.price ?? 0, currency)}</Text>
                                {showItemDiscount && (
                                    <Text style={tw("w-16 text-right text-xs")}>{line.discount ?? 0}%</Text>
                                )}
                                <Text style={tw("w-24 text-right text-xs")}>{fmtCurrency(getLineTotal(line), currency)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Separator line */}
                <View style={tw("border-b border-border mt-2 mb-4")} />

                {/* Totals */}
                <View style={tw("flex flex-row justify-end")}>
                    <View style={tw("w-64")}>
                        <View style={tw("flex flex-row justify-between py-1")}>
                            <Text style={tw("text-xs text-muted")}>Subtotal</Text>
                            <Text style={tw("text-xs font-medium")}>{fmtCurrency(calculations.subtotalBeforeDiscount, currency)}</Text>
                        </View>

                        {calculations.itemsDiscount > 0 && (
                            <View style={tw("flex flex-row justify-between py-1")}>
                                <Text style={tw("text-xs text-muted")}>Item Discount</Text>
                                <Text style={tw("text-xs font-medium")}>-{fmtCurrency(calculations.itemsDiscount, currency)}</Text>
                            </View>
                        )}

                        {calculations.globalDiscountAmount > 0 && (
                            <View style={tw("flex flex-row justify-between py-1")}>
                                <Text style={tw("text-xs text-muted")}>Global Discount ({invoice.discount}%)</Text>
                                <Text style={tw("text-xs font-medium")}>-{fmtCurrency(calculations.globalDiscountAmount, currency)}</Text>
                            </View>
                        )}

                        {(calculations.itemsDiscount > 0 || calculations.globalDiscountAmount > 0) && (
                            <View style={tw("flex flex-row justify-between py-1")}>
                                <Text style={tw("text-xs text-muted")}>Subtotal after Discount</Text>
                                <Text style={tw("text-xs font-medium")}>{fmtCurrency(calculations.subtotal, currency)}</Text>
                            </View>
                        )}

                        {Object.entries(calculations.taxesByType).map(([taxType, amount]) => (
                            <View key={taxType} style={tw("flex flex-row justify-between py-1")}>
                                <Text style={tw("text-xs text-muted capitalize")}>{taxType}</Text>
                                <Text style={tw("text-xs font-medium")}>{fmtCurrency(amount, currency)}</Text>
                            </View>
                        ))}

                        <View style={tw("border-t border-border mt-2 pt-2")}>
                            <View style={tw("flex flex-row justify-between")}>
                                <Text style={tw("text-sm font-bold")}>Total</Text>
                                <Text style={tw("text-sm font-bold")}>{fmtCurrency(calculations.total, currency)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Additional fields */}
                {invoice.additional_fields && Object.keys(invoice.additional_fields).length > 0 && (
                    <View style={tw("mt-8")}>
                        <Text style={tw("text-xs font-bold text-muted mb-3 uppercase tracking-wider")}>Additional Information</Text>
                        {Object.entries(invoice.additional_fields).map(([key, value]) => (
                            <View key={key} style={tw("mb-3")}>
                                <Text style={tw("text-xs font-bold mb-1")}>{key}</Text>
                                <Text style={tw("text-xs text-muted")}>{value}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Due dates breakdown */}
                {invoice.due_dates && invoice.due_dates.length > 1 && (
                    <View style={tw("mt-8")}>
                        <Text style={tw("text-xs font-bold text-muted mb-2 uppercase tracking-wider")}>Payment Schedule</Text>
                        {invoice.due_dates.map((dd, index) => (
                            <View key={dd.id || index} style={tw("flex flex-row justify-between py-1")}>
                                <Text style={tw("text-xs text-muted")}>{fmtDate(dd.due_date)}</Text>
                                <Text style={tw("text-xs font-medium")}>{fmtCurrency(dd.amount, currency)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Payment Guides */}
                {org.payment_guides && (
                    <View style={tw("mt-8")}>
                        <Text style={tw("text-xs font-bold text-muted mb-2 uppercase tracking-wider")}>Payment Information</Text>
                        <Text style={tw("text-xs text-muted")}>{org.payment_guides}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={tw("absolute bottom-8 left-12 right-12")}>
                    <View style={tw("border-t border-border pt-3 flex flex-row justify-between")}>
                        <Text style={tw("text-xs text-muted")}>{org.name}</Text>
                        <Text style={tw("text-xs text-muted")}>{invoice.invoice_number || "DRAFT"}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdfDocument;
