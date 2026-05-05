import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { Package, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { OrderItem } from "@/types/orders/items/items";
import { Checkbox } from "@/components/ui/checkbox";
import IdBadge from "@/app/components/id-badge";

interface SelectReceiveItemsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderItems: OrderItem[];
    onSelectItems: (items: OrderItem[]) => void;
    nextPageToken?: string | null;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}

const SelectReceiveItemsModal = ({
    open,
    onOpenChange,
    orderItems,
    onSelectItems,
    nextPageToken,
    isLoadingMore = false,
    onLoadMore,
}: SelectReceiveItemsModalProps) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return orderItems;

        const query = searchQuery.toLowerCase();
        return orderItems.filter(orderItem =>
            orderItem.item.name.toLowerCase().includes(query) ||
            (orderItem.item.item_code && orderItem.item.item_code.toLowerCase().includes(query)) ||
            (orderItem.description && orderItem.description.toLowerCase().includes(query))
        );
    }, [orderItems, searchQuery]);

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
        const selectedItemsData = orderItems.filter(item => selectedItems.has(item.id));
        onSelectItems(selectedItemsData);
        setSelectedItems(new Set());
        onOpenChange(false);
    };

    // Table columns
    const columns: ColumnDef<OrderItem>[] = useMemo(
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
            },
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => (
                    <IdBadge id={row.original.item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                ),
                meta: {
                    className: "w-[80px]",
                },
            },
            {
                accessorKey: "name",
                header: t("items.name", "Name"),
                cell: ({ row }) => (
                    <ItemAvatar item={row.original.item} />
                ),
            },
            {
                accessorKey: "item_code",
                header: t("items.itemCode", "Item Code"),
                cell: ({ row }) => (
                    row.original.item.item_code ? (
                        <IdBadge id={row.original.item.item_code} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )
                ),
            },
            {
                accessorKey: "description",
                header: t("orders.description", "Description"),
                cell: ({ row }) => (
                    <div className="max-w-md">
                        {row.original.description ? (
                            <span className="text-sm line-clamp-2">{row.original.description}</span>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "received_quantity",
                header: t("orders.receivedQuantity", "Received"),
                cell: ({ row }) => (
                    <span className="text-sm font-medium">{row.original.received_quantity}</span>
                ),
            },
            {
                accessorKey: "quantity",
                header: t("orders.quantity", "Total"),
                cell: ({ row }) => (
                    <span className="text-sm font-medium">{row.original.quantity}</span>
                ),
            },

        ],
        [t, filteredItems, selectedItems]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[90vh] max-h-[90vh] w-full md:max-w-220 flex flex-col " showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <span>{t("orders.selectItemsToReceive", "Select Items to Receive")}</span>
                    </DialogTitle>
                </DialogHeader>
                {/* Search and Actions */}
                <div className="flex gap-2 items-center">
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
                    {orderItems.length === 0 ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">
                                    {t("orders.noItemsInOrder", "No Items in Order")}
                                </h3>
                                <p className="text-muted-foreground">
                                    {t("orders.noItemsInOrderDescription", "This order has no items")}
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
                                                            : t("orders.noItemsInOrder", "No items in this order")}
                                                    </h3>
                                                    <p className="text-muted-foreground">
                                                        {searchQuery
                                                            ? t("orders.noItemsFoundDescription", `No items match "${searchQuery}"`)
                                                            : t("orders.noItemsInOrderDescription", "This order has no items")}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCellRaw>
                                    </TableRowRaw>
                                }
                            >
                                {({ row }) => {
                                    const orderItem = row.original as OrderItem;
                                    return (
                                        <TableRowRaw
                                            key={row.id}
                                            className="hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleSelectItem(orderItem.id)}
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
                    {nextPageToken && onLoadMore && (
                        <div className="flex justify-center py-4">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={isLoadingMore}
                                className="gap-2"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
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

export default SelectReceiveItemsModal;
