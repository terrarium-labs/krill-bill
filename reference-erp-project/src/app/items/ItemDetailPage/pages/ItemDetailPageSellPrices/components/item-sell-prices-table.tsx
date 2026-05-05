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
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatDecimal } from "@/utils/miscelanea";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys for type-safe column visibility
export type ItemSellPricesTableColumnKey =
    | "id"
    | "is_default"
    | "price_quantity"
    | "margin"
    | "pricing_mode"
    | "rate"
    | "billing_type"
    | "billing_period"
    | "tax_included"
    | "warranty_period"
    | "actions";

interface ItemSellPricesTableProps {
    prices: ItemPriceResponse[];
    isLoading?: boolean;
    hiddenColumns?: ItemSellPricesTableColumnKey[];
    renderActions?: (price: ItemPriceResponse) => ReactNode;
    onRowClick?: (price: ItemPriceResponse) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    onSetDefaultPrice?: (price: ItemPriceResponse) => void;
    onRateClick?: (rateId: string) => void;
}

const ItemSellPricesTableComponent = ({
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
    onSetDefaultPrice,
    onRateClick,
}: ItemSellPricesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<ItemPriceResponse>(renderActions);

    // Check if a column should be visible
    const isColumnVisible = (columnKey: ItemSellPricesTableColumnKey) => {
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
        isColumnVisible("is_default") && {
            accessorKey: "is_default",
            header: t("items.prices.isDefault", "Default"),
            enableResizing: true,
            size: 85,
            cell: ({ row }: { row: any }) => {
                const isDefault = row.original.is_default;
                return (<Switch
                    checked={isDefault || false}
                    onCheckedChange={() => onSetDefaultPrice && onSetDefaultPrice(row.original)}
                    disabled={isLoading}
                />
                );
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
                        {(price.billing_type === "recurring" && price.billing_period
                            ? `/${t(`common.billingPeriod.${price.billing_period}`, price.billing_period)}`
                            : "")}
                    </div>
                );
            },
        },
        isColumnVisible("margin") && {
            accessorKey: "margin",
            header: t("items.prices.margin", "Margin"),
            enableResizing: true,
            size: 100,
            cell: ({ row }: { row: any }) => {
                const margin = row.getValue("margin") as number | null;
                return margin !== null ? (
                    <div>{formatDecimal(margin)} %</div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        isColumnVisible("pricing_mode") && {
            accessorKey: "pricing_mode",
            header: t("items.prices.pricingMode", "Pricing Mode"),
            enableResizing: true,
            size: 130,
            cell: ({ row }: { row: any }) => {
                const pricingMode = row.getValue("pricing_mode") as string;
                return pricingMode ? (
                    <Tag
                        text={pricingMode.replace("_", " ")}
                        color={pricingMode === "price_fixed" ? "blue" : "green"}
                        className="capitalize"
                    />
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        isColumnVisible("rate") && {
            accessorKey: "rate",
            header: t("items.prices.rate", "Rate"),
            enableResizing: true,
            size: 180,
            cell: ({ row }: { row: any }) => {
                const rateName = row.original.rate_name || null;
                const rateId = row.original.rate_id || null;
                return rateName !== null ? (
                    <div className="text-sm font-medium hover:underline cursor-pointer"
                        onClick={() => onRateClick && rateId && onRateClick(rateId)}>{rateName}</div>
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
                return <Tag text={billingType.replace("-", " ").replace("_", " ")} className="capitalize" />
            },
        },
        isColumnVisible("billing_period") && {
            accessorKey: "billing_period",
            header: t("items.prices.billingPeriod", "Billing Period"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const period = row.getValue("billing_period") as string | null;
                return period ? <Tag text={period} color="default" className="capitalize" /> : <span className="text-muted-foreground">-</span>;
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
                                className="capitalize"
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
    ].filter(Boolean) as ColumnDef<ItemPriceResponse>[], [t, hiddenColumns, renderActions, onSetDefaultPrice, onRateClick, isLoading]);

    // Default empty state values
    const defaultEmptyTitle = t("items.prices.noPricesTitle", "No sell prices yet");
    const defaultEmptyDescription = t("items.prices.noPricesDescription", "Start by adding your first sell price");

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

export const ItemSellPricesTable = memo(ItemSellPricesTableComponent);
export default ItemSellPricesTable;
