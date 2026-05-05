import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SearchBar from '@/app/components/search-bar';
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from '@/components/ui/shadcn-io/table';
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from '@/components/ui/table';
import IdBadge from '@/app/components/id-badge';
import { postOrgsItemsHierarchyItems } from '@/api/orgs/hierachy/items/items';
import { getOrgItems } from '@/api/items/items';
import { Item } from '@/types/items/items';
import { Checkbox } from '@/components/ui/checkbox';
import ItemAvatar from '@/app/components/avatars/item-avatar';

interface TaxonomyItemsAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId?: string;
    taxonomyId?: string;
    onSuccess?: () => void;
}

const TaxonomyItemsAddModal = ({ open, onOpenChange, orgId, taxonomyId, onSuccess }: TaxonomyItemsAddModalProps) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const columns: ColumnDef<Item>[] = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && "indeterminate")
                            }
                            onCheckedChange={(value) => {
                                if (value) {
                                    setSelectedItems(items.map(item => item.id));
                                } else {
                                    setSelectedItems([]);
                                }
                            }}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={(value) => {
                                    if (value) {
                                        setSelectedItems([...selectedItems, item.id]);
                                    } else {
                                        setSelectedItems(selectedItems.filter(id => id !== item.id));
                                    }
                                }}
                                aria-label="Select row"
                            />
                        </div>
                    );
                },
            },
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <IdBadge id={item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            },
            {
                accessorKey: "name",
                header: t("items.columns.name", "Name"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <ItemAvatar item={item} />
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("items.columns.description", "Description"),
                cell: ({ row }) => {
                    const description = row.getValue("description");
                    return (
                        <div className="max-w-xs truncate">
                            {description as string || <span className="text-muted-foreground">-</span>}
                        </div>
                    );
                },
            },
        ],
        [t, items, selectedItems]
    );

    const fetchItems = async (query: string = "") => {
        if (!orgId) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getOrgItems(
                orgId,
                undefined,
                undefined,
                query || undefined,
                undefined,
                undefined,
            );

            if (response.success) {
                const fetchedItems = response.success.items || [];
                setItems(fetchedItems);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("items.errorFetching", "Error fetching items")
                );
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error(
                t("items.errorFetching", "Error fetching items")
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMoreItems = async () => {
        if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgItems(
                orgId,
                undefined,
                undefined,
                searchQuery || undefined,
                nextPageToken,
                undefined,
            );
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.errorFetching", "Error fetching items"));
            }
        } catch (error) {
            toast.error(t("items.errorFetching", "Error fetching items"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (open && orgId) {
            fetchItems();
        } else {
            // Reset state when modal closes
            setItems([]);
            setSelectedItems([]);
            setSearchQuery("");
            setNextPageToken(null);
        }
    }, [open, orgId]);

    const handleAddItems = async () => {
        if (!orgId || !taxonomyId || selectedItems.length === 0) return;

        setIsAdding(true);
        try {
            const response = await postOrgsItemsHierarchyItems(orgId, taxonomyId, {
                items_ids: selectedItems,
            });

            if (response.success) {
                toast.success(
                    t(
                        "taxonomy.items.itemsAdded",
                        "Items added to hierarchy successfully"
                    )
                );
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error ||
                    t("taxonomy.items.errorAddingItems", "Error adding items to hierarchy")
                );
            }
        } catch (error) {
            console.error("Error adding items to hierarchy:", error);
            toast.error(
                t("taxonomy.items.errorAddingItems", "Error adding items to hierarchy")
            );
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-4xl flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t('taxonomy.items.addItemsToHierarchy', 'Add Items to Hierarchy')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto flex-1 px-2 scrollbar-hide">
                    {/* Search Bar */}
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchItems}
                        placeholder={t(
                            "items.searchPlaceholder",
                            "Search items..."
                        )}
                        className="w-full"
                    />

                    {/* Selected count */}
                    {selectedItems.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>
                                {t(
                                    "taxonomy.items.selectedCount",
                                    "{{count}} item(s) selected",
                                    { count: selectedItems.length }
                                )}
                            </span>
                        </div>
                    )}

                    {/* Items Table */}
                    <TableProvider data={items} columns={columns}>
                        <TableHeader>
                            {({ headerGroup }) => (
                                <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                    {({ header }) => <TableHead key={header.id} header={header} />}
                                </TableHeaderGroup>
                            )}
                        </TableHeader>
                        <TableBody
                            isLoading={isLoading}
                            loadingState={
                                <TableRowRaw className="hover:bg-transparent">
                                    <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                        <div className="flex items-center justify-center space-y-2 flex-col">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            }
                            emptyState={
                                <TableRowRaw className="hover:bg-transparent">
                                    <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                        <div className="flex items-center justify-center space-y-4 flex-col">
                                            <Package className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {searchQuery
                                                        ? t("items.noResultsFound", "No results found")
                                                        : t("items.noItems", "No items found")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {searchQuery
                                                        ? t(
                                                            "items.noResultsDescription",
                                                            'No results found for "{{searchQuery}}"',
                                                            { searchQuery }
                                                        )
                                                        : t(
                                                            "items.noItemsDescription",
                                                            "No items available."
                                                        )}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            }
                        >
                            {({ row }) => (
                                <TableRowRaw
                                    key={row.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => {
                                        const item = row.original as Item;
                                        if (selectedItems.includes(item.id)) {
                                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                                        } else {
                                            setSelectedItems([...selectedItems, item.id]);
                                        }
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            cell={cell}
                                        />
                                    ))}
                                </TableRowRaw>
                            )}
                        </TableBody>
                    </TableProvider>

                    {/* Load More Button */}
                    {nextPageToken && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={loadMoreItems}
                                disabled={isLoadingMore}
                                size="sm"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("common.loading", "Loading...")}
                                    </>
                                ) : (
                                    t("common.loadMore", "Load more")
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isAdding}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={handleAddItems}
                        disabled={isAdding || selectedItems.length === 0}
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.adding", "Adding...")}
                            </>
                        ) : (
                            <>
                                {t("taxonomy.items.addItems", "Add Items")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TaxonomyItemsAddModal;

