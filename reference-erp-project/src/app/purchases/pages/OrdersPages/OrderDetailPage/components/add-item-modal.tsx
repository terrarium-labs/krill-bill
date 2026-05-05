import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { getSupplierItems } from "@/api/suppliers/items/items";
import { Loader2, Package } from "lucide-react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { Item } from "@/types/items/items";
import { Checkbox } from "@/components/ui/checkbox";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface ItemWithPrice extends Item {
    buy_price?: {
        id: string;
        price_quantity: number;
        price_currency: string;
        margin: number;
        billing_type: "one-off" | "recurring";
        billing_period?: "daily" | "weekly" | "monthly" | "yearly" | null;
        price_model: "flat-rate" | "graduated";
        tax_included: boolean;
        pricing_mode?: "margin_fixed" | "price_fixed";
        taxes?: string[];
    } | null;
}

interface AddItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    supplierId: string | null;
    onAddItems: (items: ItemWithPrice[]) => void;
}

const AddItemModal = ({
    open,
    onOpenChange,
    orgId,
    supplierId,
    onAddItems,
}: AddItemModalProps) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<ItemWithPrice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Fetch items
    const fetchItems = useCallback(async () => {
        if (!open || !supplierId) return;

        setIsLoading(true);
        try {
            const response = await getSupplierItems(orgId, supplierId, searchQuery);
            if (response.success && response.success.items) {
                setItems(response.success.items);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("orders.errorFetchingItems", "Error fetching items"));
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error(t("orders.errorFetchingItems", "Error fetching items"));
        } finally {
            setIsLoading(false);
        }
    }, [open, orgId, supplierId, searchQuery, t]);

    // Load more items
    const loadMoreItems = async () => {
        if (!nextPageToken || loadingMore || !supplierId) return;

        setLoadingMore(true);
        try {
            const response = await getSupplierItems(orgId, supplierId, searchQuery, nextPageToken);
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            }
        } catch (error) {
            console.error("Error loading more items:", error);
            toast.error(t("orders.errorFetchingItems", "Error fetching items"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (open) {
            fetchItems();
            setSelectedItems(new Set());
        }
    }, [open, fetchItems]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;

        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.item_code && item.item_code.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query))
        );
    }, [items, searchQuery]);

    const handleSelectItem = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleAddSelectedItems = () => {
        const selectedItemsData = items.filter(item => selectedItems.has(item.id));
        onAddItems(selectedItemsData);
        onOpenChange(false);
    };

    // Table columns
    const columns: ColumnDef<ItemWithPrice>[] = useMemo(
        () => [
            {
                accessorKey: "select",
                header: () => {
                    const allSelected = filteredItems.length > 0 &&
                        filteredItems.every(item => selectedItems.has(item.id));
                    const someSelected = filteredItems.some(item => selectedItems.has(item.id));

                    return (
                        <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    setSelectedItems(new Set(filteredItems.map(item => item.id)));
                                } else {
                                    setSelectedItems(new Set());
                                }
                            }}
                        />
                    );
                },
                cell: ({ row }) => (
                    <Checkbox
                        checked={selectedItems.has(row.original.id)}
                        onCheckedChange={() => handleSelectItem(row.original.id)}
                    />
                ),
                meta: {
                    className: "w-[30px]",
                },
            },
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                ),
                meta: {
                    className: "w-[80px]",
                },
            },
            {
                accessorKey: "name",
                header: t("items.name", "Name"),
                cell: ({ row }) => (
                    <ItemAvatar item={row.original as Item} />
                ),
            },
            {
                accessorKey: "item_code",
                header: t("items.itemCode", "Item Code"),
                cell: ({ row }) => (
                    row.original.item_code ? (
                        <IdBadge id={row.original.item_code} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )
                ),
            },
            {
                accessorKey: "buy_price",
                header: t("items.buyPrice", "Buy Price"),
                cell: ({ row }) => {
                    const item = row.original;
                    const buyPrice = item.buy_price?.price_quantity;

                    if (!buyPrice || buyPrice === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }

                    return (
                        <div className="text-sm font-medium">
                            <CurrencyLabel data={{ value: buyPrice, currency: item.buy_price?.price_currency || undefined }} />
                        </div>
                    );
                },
            },
        ],
        [t, filteredItems, selectedItems]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[90vh] max-h-[90vh] w-full md:max-w-280 flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <span>{t("orders.addItems", "Add Items")}</span>
                    </DialogTitle>
                </DialogHeader>
                {/* Search and Actions */}
                <div className="flex gap-2 items-center py-4">
                    <SearchBar
                        value={searchQuery}
                        isLoading={false}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={() => { }}
                        placeholder={t("orders.searchItems", "Search items...")}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleAddSelectedItems}
                        disabled={selectedItems.size === 0}
                        className="flex items-center gap-2"
                    >
                        {t("orders.addSelected", `Add Selected (${selectedItems.size})`)}
                    </Button>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : !supplierId ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">
                                    {t("orders.noSupplierSelected", "No Supplier Selected")}
                                </h3>
                                <p className="text-muted-foreground">
                                    {t("orders.selectSupplierFirst", "Please select a supplier first")}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <TableProvider data={filteredItems} columns={columns}>
                            <TableHeader>
                                {({ headerGroup }) => (
                                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                        {({ header }) => <TableHead key={header.id} header={header} />}
                                    </TableHeaderGroup>
                                )}
                            </TableHeader>
                            <TableBody
                                emptyState={
                                    <TableRowRaw className="hover:bg-transparent">
                                        <TableCellRaw className="h-64 text-center hover:bg-transparent" colSpan={columns.length}>
                                            <div className="flex items-center justify-center space-y-4 flex-col">
                                                <Package className="h-10 w-10 text-muted-foreground" />
                                                <div className="flex flex-col items-center justify-center">
                                                    <h3 className="text-lg font-medium">
                                                        {searchQuery
                                                            ? t("orders.noItemsFound", "No items found")
                                                            : t("orders.noItemsInSupplier", "No items in this supplier")}
                                                    </h3>
                                                    <p className="text-muted-foreground">
                                                        {searchQuery
                                                            ? t("orders.noItemsFoundDescription", `No items match "${searchQuery}"`)
                                                            : t("orders.noItemsInSupplierDescription", "This supplier has no items")}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCellRaw>
                                    </TableRowRaw>
                                }
                            >
                                {({ row }) => {
                                    const item = row.original as ItemWithPrice;
                                    return (
                                        <TableRowRaw
                                            key={row.id}
                                            className="hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleSelectItem(item.id)}
                                            data-state={row.getIsSelected() && 'selected'}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} cell={cell} />
                                            ))}
                                        </TableRowRaw>
                                    );
                                }}
                            </TableBody>
                        </TableProvider>
                    )}

                    {/* Load More Button */}
                    {nextPageToken && (
                        <div className="flex justify-center mt-4 pb-4">
                            <Button
                                variant="outline"
                                onClick={loadMoreItems}
                                disabled={loadingMore}
                                className="min-w-32"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("common.loading", "Loading...")}
                                    </>
                                ) : (
                                    t("common.loadMore", "Load More")
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddItemModal;
