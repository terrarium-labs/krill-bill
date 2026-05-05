import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Search } from "lucide-react";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableHeaderGroup,
    TableProvider,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableCell as TableCellRaw, TableRow as TableRowRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Currency } from "@/types/general/currencies";
import DateLabel from "@/app/components/labels/date-label";

export type CurrenciesTableColumnKey =
    | "name"
    | "symbol"
    | "exchange_rate"
    | "updated_at"
    | "is_fixed";

interface CurrenciesTableProps {
    currencies: Currency[];
    isLoading: boolean;
    searchQuery: string;
    updatingCurrencies: Set<string>;
    onFixedToggle: (currency: Currency) => void;
    onExchangeRateBlur: (currency: Currency, newRate: string) => void;
    hiddenColumns?: CurrenciesTableColumnKey[] | CurrenciesTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const CurrenciesTableComponent = ({
    currencies,
    isLoading,
    searchQuery,
    updatingCurrencies,
    onFixedToggle,
    onExchangeRateBlur,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: CurrenciesTableProps) => {
    const { t } = useTranslation();

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

    const columns = useMemo<ColumnDef<Currency>[]>(() => [
        {
            accessorKey: "name",
            header: t("settings.currencies.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => <span>{row.getValue("name")}</span>,
        },
        {
            accessorKey: "symbol",
            header: t("settings.currencies.symbol", "Symbol"),
            enableResizing: true,
            size: 80,
            cell: ({ row }) => <span className="font-medium">{row.getValue("symbol")}</span>,
        },
        {
            accessorKey: "exchange_rate",
            header: t("settings.currencies.exchangeRate", "Exchange Rate"),
            enableResizing: true,
            size: 150,
            cell: ({ row }) => {
                const currency = row.original;
                const currencyKey = currency.id || currency.symbol;
                const isUpdating = updatingCurrencies.has(currencyKey);

                return (
                    <Input
                        key={`${currency.symbol}-${currency.is_fixed}`}
                        type="number"
                        step="0.0001"
                        defaultValue={parseFloat(currency.exchange_rate.toFixed(4))}
                        onBlur={(e) => onExchangeRateBlur(currency, e.target.value)}
                        className="h-7 w-24"
                        disabled={isUpdating || !currency.is_fixed}
                    />
                );
            },
        },
        {
            accessorKey: "updated_at",
            header: t("settings.currencies.updatedAt", "Updated At"),
            enableResizing: true,
            size: 160,
            cell: ({ row }) => {
                const updatedAt = row.getValue("updated_at") as string;
                return (
                    <DateLabel
                        data={updatedAt}
                        options={{ hide: ["seconds"] }}
                        className="text-muted-foreground"
                    />
                );
            },
        },
        {
            accessorKey: "is_fixed",
            header: t("settings.currencies.isFixed", "Is Fixed"),
            enableResizing: true,
            size: 85,
            cell: ({ row }) => {
                const currency = row.original;
                const currencyKey = currency.id || currency.symbol;
                const isUpdating = updatingCurrencies.has(currencyKey);

                return (
                    <Switch
                        checked={currency.is_fixed}
                        onCheckedChange={() => onFixedToggle(currency)}
                        disabled={isUpdating}
                    />
                );
            },
        },
    ], [t, updatingCurrencies, onExchangeRateBlur, onFixedToggle]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={currencies}
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
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    {searchQuery.trim() ? (
                                        <>
                                            <Search className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {t("settings.currencies.noSearchResults", "No currencies found")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t("settings.currencies.noSearchResultsDescription", "Try adjusting your search term")}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Coins className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {t("settings.currencies.noCurrenciesTitle", "No currencies yet")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t("settings.currencies.noCurrenciesDescription", "Currencies will appear here once configured")}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => (
                        <TableRowRaw
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const CurrenciesTable = memo(CurrenciesTableComponent);
export default CurrenciesTable;
