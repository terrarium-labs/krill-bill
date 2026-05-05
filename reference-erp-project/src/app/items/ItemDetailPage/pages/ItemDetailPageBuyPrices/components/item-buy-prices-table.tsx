import { memo, useMemo, ReactNode } from "react";
import { DollarSign, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ItemPriceResponse } from "@/types/items/items";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
    TableColumnHeader,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SupplierLabel from "@/app/components/labels/supplier-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { formatDecimal } from "@/utils/miscelanea";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys for type-safe column visibility
export type ItemBuyPriceTableColumnKey =
    | "id"
    | "priority"
    | "price_quantity"
    | "supplier_pvp"
    | "supplier_discount"
    | "supplier"
    | "supplier_barcode"
    | "billing_type"
    | "billing_period"
    | "tax_included"
    | "warranty_period"
    | "actions";

interface ItemBuyPricesTableProps {
    prices: ItemPriceResponse[];
    isLoading?: boolean;
    hiddenColumns?: ItemBuyPriceTableColumnKey[];
    renderActions?: (price: ItemPriceResponse) => ReactNode;
    onRowClick?: (price: ItemPriceResponse) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    onSetPriority?: (price: ItemPriceResponse, priority: string) => void;
    isLoadingPriority?: boolean;
}

const ItemBuyPricesTableComponent = ({
    prices,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    onSetPriority,
    isLoadingPriority = false,
}: ItemBuyPricesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<ItemPriceResponse>(renderActions);

    // Check if a column should be visible
    const isColumnVisible = (columnKey: ItemBuyPriceTableColumnKey) => {
        return !hiddenColumns.includes(columnKey);
    };

    // Table columns definition
    const columns = useMemo<ColumnDef<ItemPriceResponse>[]>(() => [
        isColumnVisible("id") && {
            accessorKey: "id",
            header: t("items.prices.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const price = row.original;
                return (
                    <IdBadge id={price.id} hideIcon={true} customTooltip={t("items.prices.id", "Copy ID")} />
                );
            },
        },
        isColumnVisible("priority") && {
            accessorKey: "priority",
            header: t("items.prices.priority", "Priority"),
            enableResizing: true,
            size: 80,
            cell: ({ row }: { row: any }) => {
                const priority = row.original.priority;
                return <Input
                    type="number"
                    min={1}
                    className="w-16 h-8 shadow-none "
                    defaultValue={priority ?? ''}
                    onBlur={(e) => onSetPriority && onSetPriority(row.original, e.target.value)}
                    disabled={isLoading || isLoadingPriority}
                />
            },
        },
        isColumnVisible("price_quantity") && {
            accessorKey: "price_quantity",
            header: t("items.prices.price", "Price"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const price = row.original;
                return (
                    <div className="font-medium text-sm flex items-center gap-2">
                        <CurrencyLabel data={{ value: price.price_quantity, currency: price.price_currency }} />
                        {price.billing_type === "recurring" && price.billing_period
                            ? `/${t(`common.billingPeriod.${price.billing_period}`, price.billing_period as string)}`
                            : ""}
                    </div>
                );
            },
        },
        isColumnVisible("supplier_pvp") && {
            accessorKey: "supplier_pvp",
            header: t("items.prices.supplierPvp", "Sup. PVP"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const supplierPvp = row.original.supplier_pvp;
                return supplierPvp ? <div className="text-sm flex items-center gap-2">
                    <CurrencyLabel data={supplierPvp} />
                </div> : <span className="text-muted-foreground">-</span>;
            },
        },
        isColumnVisible("supplier_discount") && {
            accessorKey: "supplier_discount",
            header: t("items.prices.supplierDiscount", "Sup. Discount"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const supplierDiscount = row.original.supplier_discount;
                return supplierDiscount ? <div className="text-sm flex items-center gap-2">
                    {formatDecimal(supplierDiscount)} %
                </div> : <span className="text-muted-foreground">-</span>;
            },
        },
        isColumnVisible("supplier") && {
            accessorKey: "supplier",
            header: t("items.prices.supplier", "Supplier"),
            enableResizing: true,
            size: 180,
            cell: ({ row }: { row: any }) => {
                const supplier = row.original.supplier;
                return <SupplierLabel data={supplier} options={{ showNameExtra: true }} link />;
            },
        },
        isColumnVisible("supplier_barcode") && {
            accessorKey: "supplier_barcode",
            header: t("items.prices.supplierBarcode", "Supplier Barcode"),
            enableResizing: true,
            size: 140,
            cell: ({ row }: { row: any }) => {
                const barcode = row.original.supplier_barcode;
                return barcode ? (
                    <IdBadge id={barcode} hideIcon={true} customTooltip={t("items.prices.supplierBarcodeTooltip", "Copy Supplier Barcode")} />
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        isColumnVisible("billing_type") && {
            accessorKey: "billing_type",
            header: t("items.prices.billingType", "Billing Type"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const billingType = row.getValue("billing_type") as string;
                return (
                    <Tag text={billingType.replace("-", " ").replace("_", " ")} className="capitalize" />
                );
            },
        },
        isColumnVisible("billing_period") && {
            accessorKey: "billing_period",
            header: t("items.prices.billingPeriod", "Billing Period"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const period = row.getValue("billing_period") as string | null;
                return period ? <Tag text={period} className="capitalize" /> : <span className="text-muted-foreground">-</span>;
            },
        },
        isColumnVisible("tax_included") && {
            accessorKey: "tax_included",
            header: t("items.prices.taxIncluded", "Taxes"),
            enableResizing: true,
            size: 150,
            cell: ({ row }: { row: any }) => {
                const taxes = row.original.taxes;
                if (!taxes || taxes.length === 0) {
                    return <span className="text-muted-foreground">-</span>;
                }

                const visibleTaxes = taxes.slice(0, 2);
                const remainingCount = taxes.length - 2;

                return (
                    <div className="flex items-center gap-2">
                        {visibleTaxes.map((tax: any, index: number) => (
                            <Tag
                                key={index}
                                text={tax.type + " " + formatDecimal(tax.amount) + "%"}
                                color="default"
                            />
                        ))}
                        {remainingCount > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-xs">+{remainingCount}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <div className="flex flex-col gap-1">
                                            {taxes.map((tax: any, index: number) => (
                                                <div key={index} className="text-xs capitalize">
                                                    {tax.type} {formatDecimal(tax.amount)}%
                                                </div>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        },
        isColumnVisible("warranty_period") && {
            accessorKey: "warranty_period",
            header: t("items.prices.warranty", "Warranty"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const price = row.original;
                if (!price.warranty_period || !price.warranty_unit) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <div>
                        {price.warranty_period} {price.warranty_unit}
                    </div>
                );
            },
        },
        isColumnVisible("actions") && renderActions && {
            id: "actions",
            enableResizing: false,
            size: 52,
            header: ({ header }: { header: any }) => (
                <TableColumnHeader
                    column={header.column}
                    className="justify-center items-center flex"
                    title=""
                />
            ),
            cell: ({ row }: { row: any }) => {
                const price = row.original;
                return (
                    <div className="flex justify-center items-center">
                        {renderActions(price)}
                    </div>
                );
            },
            meta: {
                sticky: "right",
            },
        },
    ].filter(Boolean) as ColumnDef<ItemPriceResponse>[], [t, hiddenColumns, renderActions, onSetPriority, isLoading, isLoadingPriority]);

    // Default empty state values
    const defaultEmptyTitle = t("items.prices.noBuyPricesTitle", "No buy prices yet");
    const defaultEmptyDescription = t("items.prices.noBuyPricesDescription", "Start by adding your first buy price");

    return (
        <TableProvider data={prices} columns={columns} enableColumnResizing>
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
                        <TableCellRaw
                            className="h-96 text-center hover:bg-transparent"
                            colSpan={columns.length}
                        >
                            <div className="flex items-center justify-center space-y-4 flex-col">
                                <DollarSign className="h-10 w-10 text-muted-foreground" />
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
                                        {emptyStateActionLabel || t("items.prices.addPrice", "Add Price")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const price = row.original as ItemPriceResponse;
                    return wrapRowWithContextMenu(
                        price,
                        <TableRowRaw
                            key={row.id}
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            onClick={() => clickableRows && onRowClick && onRowClick(price)}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                }}
            </TableBody>
        </TableProvider>
    );
};

export const ItemBuyPricesTable = memo(ItemBuyPricesTableComponent);
export default ItemBuyPricesTable;
