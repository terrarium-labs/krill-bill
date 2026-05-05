import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Check, ChevronDown, Search, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TaxType } from "@/types/miscelanea";
import { WorkOrderBillableItem } from "@/types/field-service/work-orders/billable-items";
import { useBillableItems } from "../contexts/BillableItemsContext";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Tag from "@/app/components/tag/tag";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOrgItems } from "@/api/items/items";
import { getClientItemsPrices } from "@/api/clients/items-prices/items-prices";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { Item } from "@/types/items/items";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import IdBadge from "@/app/components/id-badge";
import { formatPercentage, formatItemPrice } from "@/utils/miscelanea";
import { BillableItemTypeSelector } from "@/app/components/billable-item-type-selector";

interface ClientItemPrice {
    id: string;
    price_quantity: number | null;
    price_currency: string | null;
    billing_type: string;
    price_model: string;
    type: string;
    tax_included: boolean;
    rate_id: string | null;
    rate_name: string | null;
    taxes: TaxType[];
    margin: number | null;
    is_default: boolean | null;
    pricing_mode: string | null;
}

interface ItemPriceOption {
    item: Item;
    price: ClientItemPrice | null;
}

interface BillableItemRowProps {
    billableItem: WorkOrderBillableItem;
}

export const BillableItemRow: React.FC<BillableItemRowProps> = ({ billableItem }) => {
    const { t } = useTranslation();
    const { taxes, updateItem, updateItemMultiple, deleteItem } = useBillableItems();
    const { orgId } = useParams<{ orgId: string }>();
    const { workOrder } = useWorkOrder();

    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [itemsPopoverOpen, setItemsPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemOptions, setItemOptions] = useState<ItemPriceOption[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const [quantityInput, setQuantityInput] = useState<string>((billableItem.quantity ?? 0).toString());
    const [priceInput, setPriceInput] = useState<string>((billableItem.price ?? 0).toString());
    const [discountInput, setDiscountInput] = useState<string>((billableItem.discount ?? 0).toString());
    const [totalInput, setTotalInput] = useState<string>("");
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [costPriceInput, setCostPriceInput] = useState<string>(
        billableItem.cost_price != null ? billableItem.cost_price.toString() : ""
    );

    const calculateTotal = useCallback(() => {
        const quantity = billableItem.quantity ?? 0;
        const price = billableItem.price ?? 0;
        const discount = billableItem.discount ?? 0;
        const subtotal = quantity * price;
        const discountAmount = subtotal * (discount / 100);
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxRate =
            billableItem.taxes?.reduce(
                (sum, tax) => sum + (tax.is_negative ? -tax.amount : tax.amount),
                0
            ) || 0;
        const taxAmount = subtotalAfterDiscount * (taxRate / 100);
        const total = subtotalAfterDiscount + taxAmount;
        return parseFloat(total.toFixed(2));
    }, [billableItem.quantity, billableItem.price, billableItem.discount, billableItem.taxes]);

    useEffect(() => {
        setQuantityInput(parseFloat((billableItem.quantity ?? 0).toFixed(2)).toString());
        setPriceInput(parseFloat((billableItem.price ?? 0).toFixed(2)).toString());
        setDiscountInput(parseFloat((billableItem.discount ?? 0).toFixed(2)).toString());
        setCostPriceInput(
            billableItem.cost_price != null
                ? parseFloat(billableItem.cost_price.toFixed(2)).toString()
                : ""
        );
        if (!isEditingTotal) {
            setTotalInput(calculateTotal().toString());
        }
    }, [
        billableItem.quantity,
        billableItem.price,
        billableItem.discount,
        billableItem.taxes,
        billableItem.cost_price,
        calculateTotal,
        isEditingTotal,
    ]);

    const handleNameChange = async (value: string, previousValue: string) => {
        updateItem(billableItem.order, "name", value);

        const lastChar = value.slice(-1);
        const justTypedAt = lastChar === "@" && value.length > previousValue.length;

        if ((justTypedAt || value.startsWith("@")) && orgId) {
            setItemsPopoverOpen(true);
            setLoadingItems(true);
            try {
                const query = value.substring(1);
                if (workOrder.client?.id) {
                    const response = await getClientItemsPrices(orgId, workOrder.client.id, query);
                    if (response.success && response.success.items_prices) {
                        const data: Array<{ item: Item; prices: ClientItemPrice[] }> =
                            response.success.items_prices ?? [];
                        const flattened: ItemPriceOption[] = [];
                        for (const entry of data) {
                            if (entry.prices && entry.prices.length > 0) {
                                for (const price of entry.prices) {
                                    flattened.push({ item: entry.item, price });
                                }
                            } else {
                                flattened.push({ item: entry.item, price: null });
                            }
                        }
                        setItemOptions(flattened);
                    }
                } else {
                    const response = await getOrgItems(orgId, query);
                    if (response.success && response.success.items) {
                        setItemOptions(response.success.items.map((item: Item) => ({ item, price: null })));
                    }
                }
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoadingItems(false);
            }
        } else if (!value.startsWith("@")) {
            setItemsPopoverOpen(false);
        }
    };

    const handleSelectItem = (option: ItemPriceOption) => {
        const { item, price } = option;
        const updates: Partial<WorkOrderBillableItem> = {
            item: item as any,
            name: item.name,
            description: item.description || "",
            cost_price: item.pmc ?? null,
        };

        if (price) {
            if (price.price_quantity) {
                updates.price = price.price_quantity;
            }
            if (price.taxes && price.taxes.length > 0) {
                updates.taxes = price.taxes;
            }
        } else {
            const sellPrice = (item as any).sell_price || (item as any).buy_price;
            if (sellPrice?.price_quantity) {
                updates.price = sellPrice.price_quantity;
            }
            if (sellPrice?.taxes && sellPrice.taxes.length > 0) {
                const itemTaxes = taxes.filter((tax) => sellPrice.taxes?.includes(tax.id));
                updates.taxes = itemTaxes;
            }
        }

        updateItemMultiple(billableItem.order, updates);
        setItemsPopoverOpen(false);
    };

    const handleTaxToggle = (taxId: string) => {
        const currentTaxIds = billableItem.taxes?.map((tax) => tax.id) || [];
        let newTaxIds: string[];

        if (currentTaxIds.includes(taxId)) {
            newTaxIds = currentTaxIds.filter((id) => id !== taxId);
        } else {
            const taxToAdd = taxes.find((tax) => tax.id === taxId);
            if (taxToAdd) {
                const currentTaxes = billableItem.taxes || [];
                const taxesWithoutSameGroup = currentTaxes.filter(
                    (tax) => tax.group_name !== taxToAdd.group_name
                );
                newTaxIds = [...taxesWithoutSameGroup.map((t) => t.id), taxId];
            } else {
                newTaxIds = [...currentTaxIds, taxId];
            }
        }

        const selectedTaxes = taxes.filter((tax) => newTaxIds.includes(tax.id));
        updateItem(billableItem.order, "taxes", selectedTaxes);
    };

    const selectedTaxIds = billableItem.taxes?.map((tax) => tax.id) || [];

    const filteredTaxes = taxes.filter(
        (tax) =>
            tax.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tax.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tax.amount.toString().includes(searchQuery)
    );

    const groupedTaxes = filteredTaxes.reduce((acc, tax) => {
        if (!acc[tax.group_name]) {
            acc[tax.group_name] = [];
        }
        acc[tax.group_name].push(tax);
        return acc;
    }, {} as Record<string, TaxType[]>);

    return (
        <TableRow className="group">
            {/* Name / Concept */}
            <TableCell className="p-1 min-w-48 align-middle">
                <div className="flex items-center gap-1.5 w-full">
                    <BillableItemTypeSelector
                        value={billableItem.type ?? null}
                        onChange={(type) => updateItem(billableItem.order, "type", type)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                        {billableItem.item ? (
                            <div className="flex items-center gap-2">
                                <ItemAvatar item={billableItem.item as any} showName={false} />
                                <span className="text-sm">{billableItem.item.name}</span>
                                <IdBadge
                                    id={billableItem.item.id}
                                    hideIcon={true}
                                    className="text-[10px] rounded-sm"
                                />
                            </div>
                        ) : (
                            <Popover
                                open={itemsPopoverOpen}
                                onOpenChange={(open) => {
                                    if (!open) setItemsPopoverOpen(false);
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <div className="relative flex-1">
                                        <Input
                                            value={billableItem.name || ""}
                                            onChange={(e) =>
                                                handleNameChange(e.target.value, billableItem.name || "")
                                            }
                                            placeholder={t(
                                                "workOrders.billableItemNamePlaceholder",
                                                "Type @ to search items or enter manually..."
                                            )}
                                            className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 pr-6"
                                        />
                                        {billableItem.name?.startsWith("@") && (
                                            <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder={t("workOrders.searchItems", "Search items...")}
                                            value={billableItem.name?.substring(1) || ""}
                                            onValueChange={(value) =>
                                                handleNameChange("@" + value, billableItem.name || "")
                                            }
                                        />
                                        {loadingItems ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : itemOptions.length === 0 ? (
                                            <CommandEmpty>
                                                {t("workOrders.noItemsFound", "No items found")}
                                            </CommandEmpty>
                                        ) : (
                                            <ScrollArea className="h-64">
                                                <CommandGroup>
                                                    {itemOptions.map((option) => {
                                                        const optionKey = option.price
                                                            ? `${option.item.id}-${option.price.id}`
                                                            : option.item.id;
                                                        return (
                                                            <CommandItem
                                                                key={optionKey}
                                                                value={optionKey}
                                                                onSelect={() => handleSelectItem(option)}
                                                                className="cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <ItemAvatar item={option.item} showName={false} />
                                                                    <div className="text-sm flex flex-col flex-1 min-w-0">
                                                                        <div className="text-sm font-medium flex items-center gap-2">
                                                                            {option.item.name}
                                                                            <IdBadge
                                                                                id={option.item.id}
                                                                                hideIcon={true}
                                                                                className="text-[10px] rounded-sm"
                                                                            />
                                                                        </div>
                                                                        {option.price ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {formatItemPrice(option.price, option.item.measure)}
                                                                                </span>
                                                                                {option.price.rate_name && (
                                                                                    <Tag
                                                                                        text={option.price.rate_name}
                                                                                        color="blue"
                                                                                        className="text-[10px] px-1 py-0"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            (option.item as any).sell_price && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {formatItemPrice((option.item as any).sell_price, option.item.measure)}
                                                                                </span>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </ScrollArea>
                                        )}
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Description */}
            <TableCell className="p-1 min-w-32 align-middle">
                <Textarea
                    value={billableItem.description || ""}
                    onChange={(e) => updateItem(billableItem.order, "description", e.target.value)}
                    placeholder={t("workOrders.descriptionPlaceholder", "Desc")}
                    className="min-h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent resize-none max-h-24 p-1 mt-2"
                    rows={2}
                />
            </TableCell>

            {/* Quantity */}
            <TableCell className="p-1 w-20 align-middle">
                <Input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setQuantityInput(value);
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            updateItem(billableItem.order, "quantity", parseFloat(parsed.toFixed(2)));
                        } else if (value === "") {
                            updateItem(billableItem.order, "quantity", 0);
                        }
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Price */}
            <TableCell className="p-1 w-24 align-middle">
                <Input
                    type="number"
                    value={priceInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setPriceInput(value);
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            updateItem(billableItem.order, "price", parseFloat(parsed.toFixed(2)));
                        } else if (value === "") {
                            updateItem(billableItem.order, "price", 0);
                        }
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Discount % */}
            <TableCell className="p-1 w-20 align-middle">
                <Input
                    type="number"
                    value={discountInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setDiscountInput(value);
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            updateItem(billableItem.order, "discount", parseFloat(parsed.toFixed(2)));
                        } else if (value === "") {
                            updateItem(billableItem.order, "discount", 0);
                        }
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Taxes */}
            <TableCell className="p-1 min-w-36 max-w-36 align-middle">
                <Popover open={taxPopoverOpen} onOpenChange={setTaxPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-full justify-between px-2 mt-1 font-normal gap-1 p-1! min-w-36 max-w-36"
                        >
                            {billableItem.taxes && billableItem.taxes.length > 0 ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Tag
                                                    text={billableItem.taxes[0].type}
                                                    color="default"
                                                    className="capitalize text-xs max-w-24 min-w-0 truncate text-left justify-start"
                                                />
                                                {billableItem.taxes.length > 1 && (
                                                    <span className="text-xs shrink-0">
                                                        +{billableItem.taxes.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        {billableItem.taxes.length > 1 && (
                                            <TooltipContent className="max-w-xs">
                                                <div className="flex flex-col gap-1">
                                                    {billableItem.taxes.map((tax: TaxType) => (
                                                        <div key={tax.id} className="text-xs">
                                                            <span className="capitalize">{tax.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <span className="text-muted-foreground text-xs">
                                    {t("workOrders.selectTaxes", "Select taxes...")}
                                </span>
                            )}
                            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder={t("workOrders.searchTaxes", "Search taxes...")}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            {filteredTaxes.length === 0 ? (
                                <CommandEmpty>
                                    {t("workOrders.noTaxesFound", "No taxes found")}
                                </CommandEmpty>
                            ) : (
                                <ScrollArea className="h-64">
                                    {Object.entries(groupedTaxes).map(
                                        ([groupName, groupTaxes], index) => (
                                            <React.Fragment key={groupName}>
                                                <CommandGroup heading={groupName}>
                                                    {groupTaxes.map((tax) => {
                                                        const isSelected = selectedTaxIds.includes(tax.id);
                                                        return (
                                                            <CommandItem
                                                                key={tax.id}
                                                                value={tax.id}
                                                                className={cn(
                                                                    "cursor-pointer",
                                                                    isSelected && "bg-accent/30"
                                                                )}
                                                                onSelect={() => handleTaxToggle(tax.id)}
                                                            >
                                                                <div className="flex items-center gap-2 w-full justify-between min-w-0">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <span className="capitalize">
                                                                            {tax.type}
                                                                        </span>
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4 shrink-0",
                                                                            isSelected
                                                                                ? "opacity-100 text-primary"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                                {index < Object.entries(groupedTaxes).length - 1 && (
                                                    <CommandSeparator />
                                                )}
                                            </React.Fragment>
                                        )
                                    )}
                                </ScrollArea>
                            )}
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>

            {/* Total */}
            <TableCell className="p-1 w-24 align-middle">
                <Input
                    type="number"
                    value={totalInput}
                    onFocus={() => setIsEditingTotal(true)}
                    onChange={(e) => {
                        const value = e.target.value;
                        setTotalInput(value);
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            const discount = billableItem.discount ?? 0;
                            const quantity = billableItem.quantity ?? 0;
                            const discountMultiplier = 1 - discount / 100;
                            const taxRate =
                                billableItem.taxes?.reduce(
                                    (sum, tax) =>
                                        sum + (tax.is_negative ? -tax.amount : tax.amount),
                                    0
                                ) || 0;
                            const divisor = discountMultiplier * (1 + taxRate / 100);
                            const subtotal = parsed / divisor;
                            const newPrice = quantity > 0 ? subtotal / quantity : subtotal;
                            updateItem(
                                billableItem.order,
                                "price",
                                parseFloat(newPrice.toFixed(2))
                            );
                        } else if (value === "") {
                            updateItem(billableItem.order, "price", 0);
                        }
                    }}
                    onBlur={() => setIsEditingTotal(false)}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Divider */}
            <TableCell className="w-px p-0 border-l align-middle" />

            {/* Cost Price */}
            <TableCell className="p-1 w-20 align-middle">
                <Input
                    type="number"
                    value={costPriceInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setCostPriceInput(value);
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            updateItem(
                                billableItem.order,
                                "cost_price",
                                parseFloat(parsed.toFixed(2))
                            );
                        } else if (value === "") {
                            updateItem(billableItem.order, "cost_price", null);
                        }
                    }}
                    placeholder="-"
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Margin */}
            <TableCell className="p-1 w-20 align-middle">
                {(() => {
                    const price = billableItem.price ?? 0;
                    const discount = billableItem.discount ?? 0;
                    const effectivePrice = price * (1 - discount / 100);
                    const hasMargin =
                        billableItem.cost_price != null && effectivePrice > 0;
                    const marginValue = hasMargin
                        ? 1 - billableItem.cost_price! / effectivePrice
                        : null;

                    return (
                        <span
                            className={cn(
                                "text-sm px-1",
                                marginValue != null
                                    ? marginValue >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                            )}
                        >
                            {marginValue != null ? formatPercentage(marginValue) : "-"}
                        </span>
                    );
                })()}
            </TableCell>

            {/* Actions */}
            <TableCell className="w-8 p-1 align-middle">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteItem(billableItem.order)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};
