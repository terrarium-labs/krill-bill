import { memo, useMemo, useCallback, type ReactNode } from "react";
import { FileText, Plus, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PurchaseInvoice, InvoicesMetadata } from "@/types/invoices/invoices";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw, TableFooter as TableFooterRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import CurrencyLabel from "@/app/components/labels/currency-label";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { useNavigateToOrigin, TypeToName } from "@/utils/origin";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { TaxType } from "@/types/miscelanea";
import SupplierLabel from "@/app/components/labels/supplier-label";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { useOrg } from "@/app/contexts/OrgContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type PurchaseInvoiceTableColumnKey =
    | "id"
    | "invoice_number"
    | "supplier"
    | "invoice_date"
    | "status"
    | "origins"
    | "subtotal_with_discount"
    | "taxes"
    | "total"
    | "actions"
    | "created_at";

interface PurchaseInvoicesTableProps {
    invoices: PurchaseInvoice[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding). Not saved to preferences. */
    hiddenColumns?: PurchaseInvoiceTableColumnKey[] | PurchaseInvoiceTableColumnKey;
    renderActions?: (invoice: PurchaseInvoice) => ReactNode;
    onRowClick?: (invoice: PurchaseInvoice) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    metadata?: InvoicesMetadata | null;
    /** TanStack column visibility (from usePurchaseInvoicesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const PurchaseInvoicesTableComponent = ({
    invoices,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
    metadata,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: PurchaseInvoicesTableProps) => {
    const { t } = useTranslation();
    const navigateToOrigin = useNavigateToOrigin();
    const { wrapRowWithContextMenu } = useTableContextMenu<PurchaseInvoice>(renderActions);
    const { org } = useOrg();

    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) return hiddenColumns;
        return hiddenColumns ? [hiddenColumns] : [];
    }, [hiddenColumns]);

    const effectiveColumnVisibility = useMemo<VisibilityState | undefined>(() => {
        if (hiddenColumnsArray.length === 0) return columnVisibility;
        const structural = hiddenColumnsArray.reduce<VisibilityState>((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        return { ...(columnVisibility ?? {}), ...structural };
    }, [columnVisibility, hiddenColumnsArray]);

    const isColumnVisible = useCallback(
        (key: PurchaseInvoiceTableColumnKey): boolean => {
            if (!effectiveColumnVisibility) return true;
            return effectiveColumnVisibility[key] !== false;
        },
        [effectiveColumnVisibility],
    );

    const renderCurrencyAmount = useCallback(
        (amount: number | null | undefined, invoice: PurchaseInvoice) => {
            if (amount == null) return <span className="text-muted-foreground text-sm">-</span>;
            const isDefaultCurrency = !invoice.currency || invoice.currency === org.currency;
            if (isDefaultCurrency) {
                return <CurrencyLabel data={amount} />;
            }
            const convertedAmount = amount / invoice.exchange_rate;
            return (
                <div className="flex items-center gap-1">
                    <CurrencyLabel data={{ value: amount, currency: invoice.currency }} />
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex flex-col gap-1 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        {t("invoices.localCurrency", "Local")}: <CurrencyLabel data={convertedAmount} className="text-xs" />
                                    </div>
                                    <div className="text-muted/50">
                                        1 {org.currency} = {invoice.exchange_rate.toFixed(4)} {invoice.currency}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            );
        },
        [org, t],
    );

    const columns = useMemo<ColumnDef<PurchaseInvoice>[]>(() => {
        const cols: ColumnDef<PurchaseInvoice>[] = [
            {
                accessorKey: "origins",
                header: t("invoices.origin", "Origin"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const invoice = row.original;
                    const origins = invoice.origins as import("@/types/general/origin").Origin[] | null;
                    if (!origins || origins.length === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    if (origins.length === 1) {
                        return (
                            <IdBadge
                                id={origins[0].id}
                                hideIcon
                                customTooltip={t("invoices.goToOrigin", "Go to origin")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigateToOrigin(origins[0]);
                                }}
                            />
                        );
                    }
                    return (
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className="font-mono font-medium text-muted-foreground hover:bg-muted/50 cursor-pointer bg-muted/25"
                                >
                                    {origins.length} origins
                                </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto min-w-[140px] p-2" align="start">
                                <div className="flex flex-col gap-1">
                                    {origins.map((origin) => (
                                        <IdBadge
                                            key={origin.id}
                                            id={origin.id}
                                            hideIcon
                                            customTooltip={TypeToName(origin.type)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigateToOrigin(origin);
                                            }}
                                        />
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    );
                },
            },
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "invoice_number",
                header: t("invoices.invoiceNumber", "Invoice #"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) =>
                    row.original.invoice_number ? (
                        <span className="font-medium">{row.original.invoice_number}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                accessorKey: "supplier",
                header: t("invoices.supplier", "Supplier"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <SupplierLabel data={row.original.supplier} link />
                    </div>
                ),
            },
            {
                accessorKey: "invoice_date",
                header: t("invoices.invoiceDate", "Invoice Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel data={row.original.invoice_date} options={{ hide: ["seconds", "hours", "minutes"] }} />
                ),
            },
            {
                accessorKey: "status",
                header: t("invoices.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={(row.original.status as string).replace("_", " ")} className="capitalize" />
                ),
            },
            {
                accessorKey: "subtotal_with_discount",
                header: t("invoices.subtotal", "Subtotal"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => renderCurrencyAmount(row.original.subtotal_with_discount, row.original),
            },
            {
                accessorKey: "taxes",
                header: t("invoices.taxes", "Taxes"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const invoice = row.original;
                    const taxTotal = invoice.taxes && invoice.taxes.length > 0
                        ? invoice.taxes.reduce((sum: number, tax: { tax: string; is_negative: boolean; amount: number }) => sum + (tax.is_negative ? tax.amount * -1 : tax.amount), 0)
                        : null;
                    return renderCurrencyAmount(taxTotal as number | null | undefined, invoice);
                },
            },
            {
                accessorKey: "total",
                header: t("invoices.total", "Total"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => renderCurrencyAmount(row.original.total, row.original),
            },
            {
                accessorKey: "created_at",
                header: t("invoices.createdAt", "Created At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel data={row.original.created_at} options={{ hide: ["seconds"] }} />
                ),
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title=""
                    />
                ),
                cell: ({ row }) => (
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, navigateToOrigin, renderCurrencyAmount]);

    const defaultEmptyTitle = searchQuery
        ? t("invoices.noResultsFound", "No invoices found")
        : t("invoices.noInvoicesTitle", "No purchase invoices yet");

    const defaultEmptyDescription = searchQuery
        ? t("invoices.noResultsDescription", "No invoices match your search for '{{searchQuery}}'", { searchQuery })
        : t("invoices.noInvoicesDescription", "Start by adding your first purchase invoice");

    const columnsBeforeSubtotal = [
        isColumnVisible("origins"),
        isColumnVisible("id"),
        isColumnVisible("invoice_number"),
        isColumnVisible("supplier"),
        isColumnVisible("invoice_date"),
        isColumnVisible("status"),
    ].filter(Boolean).length;

    const showTotalsRow = metadata && invoices.length > 0 && !isLoading;
    const hasActionsColumn = isColumnVisible("actions") && !!renderActions;

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={invoices}
                columns={columns}
                enableColumnResizing
                columnVisibility={effectiveColumnVisibility}
                onColumnVisibilityChange={onColumnVisibilityChange}
                columnOrder={columnOrder}
                onColumnOrderChange={onColumnOrderChange}
                columnSizing={columnSizing}
                onColumnSizingChange={onColumnSizingChange}
            >
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={isLoading}
                    loadingState={<TableSkeleton columnCount={columns.length} />}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || defaultEmptyTitle}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || defaultEmptyDescription}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("invoices.addInvoice", "Add Invoice")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const invoice = row.original as PurchaseInvoice;
                        return wrapRowWithContextMenu(
                            invoice,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick && onRowClick(invoice)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>,
                        );
                    }}
                </TableBody>
                {showTotalsRow && (
                    <TableFooterRaw>
                        <TableRowRaw className="bg-muted/50 font-medium hover:bg-muted/50">
                            {columnsBeforeSubtotal > 0 && (
                                <TableCellRaw colSpan={columnsBeforeSubtotal} className="text-left text-sm font-semibold">
                                    {t("common.totals", "Totals")}
                                </TableCellRaw>
                            )}
                            {isColumnVisible("subtotal_with_discount") && (
                                <TableCellRaw className="text-sm font-semibold">
                                    <CurrencyLabel data={metadata.subtotal} />
                                </TableCellRaw>
                            )}
                            {isColumnVisible("taxes") && (
                                <TableCellRaw className="text-sm font-semibold">
                                    <CurrencyLabel data={metadata.taxes} />
                                </TableCellRaw>
                            )}
                            {isColumnVisible("total") && (
                                <TableCellRaw className="text-sm font-semibold">
                                    <CurrencyLabel data={metadata.total} />
                                </TableCellRaw>
                            )}
                            {isColumnVisible("created_at") && <TableCellRaw />}
                            {hasActionsColumn && <TableCellRaw />}
                        </TableRowRaw>
                    </TableFooterRaw>
                )}
            </TableProvider>
        </div>
    );
};

export const PurchaseInvoicesTable = memo(PurchaseInvoicesTableComponent);
export default PurchaseInvoicesTable;
