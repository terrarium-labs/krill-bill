import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Check, ChevronDown, GripVertical, Search, Loader2, EyeOff, Eye } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InvoiceItem } from "@/types/invoices/invoices";
import { TaxType } from "@/types/miscelanea";
import { useSaleInvoice } from "../../contexts/SaleInvoiceContext";
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
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOrgItems } from "@/api/items/items";
import { getClientItemsPrices } from "@/api/clients/items-prices/items-prices";
import { Item } from "@/types/items/items";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import IdBadge from "@/app/components/id-badge";
import { formatItemPrice, formatPercentage } from "@/utils/miscelanea";
import { BillableItemTypeSelector } from "@/app/components/billable-item-type-selector";
import { useInvoiceItemsColumnLayout } from "@/app/components/invoice-items-table/invoice-items-column-layout";

// Represents a price entry from the client items-prices API (taxes are full objects)
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

// Flattened option for the item selector dropdown: one entry per item-price combination
interface ItemPriceOption {
    item: Item;
    price: ClientItemPrice | null;
}

interface SaleInvoiceItemRowProps {
    invoiceItem: InvoiceItem;
    showDiscount: boolean;
    isChild?: boolean;
    activeTab?: string;
    nestingLevel?: number;
}

export const SaleInvoiceItemRow: React.FC<SaleInvoiceItemRowProps> = ({
    invoiceItem,
    showDiscount,
    isChild = false,
    activeTab = "items",
    nestingLevel = 0
}) => {
    const { t } = useTranslation();
    const { invoice, taxes, updateLine, updateLineMultiple, deleteLine, isReadOnly } = useSaleInvoice();
    const { orgId } = useParams<{ orgId: string }>();
    const { colStyle } = useInvoiceItemsColumnLayout();

    const onUpdate = updateLine;
    const onDelete = deleteLine;
    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [itemsPopoverOpen, setItemsPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemOptions, setItemOptions] = useState<ItemPriceOption[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Use a unique identifier for drag/drop
    const sortableId = invoiceItem.id || `line-${invoiceItem.order}`;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sortableId });

    // Local state for editable number inputs
    const [quantityInput, setQuantityInput] = useState<string>((invoiceItem.quantity ?? 0).toString());
    const [priceInput, setPriceInput] = useState<string>((invoiceItem.price ?? 0).toString());
    const [discountInput, setDiscountInput] = useState<string>((invoiceItem.discount ?? 0).toString());
    const [totalInput, setTotalInput] = useState<string>("");
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [pmcInput, setPmcInput] = useState<string>(invoiceItem.cost_price != null ? invoiceItem.cost_price.toString() : "");

    // Calculate total whenever quantity, price, discount, or taxes change
    const calculateTotal = useCallback(() => {
        const quantity = invoiceItem.quantity ?? 0;
        const price = invoiceItem.price ?? 0;
        const discount = invoiceItem.discount ?? 0;
        const subtotal = quantity * price;
        const discountAmount = subtotal * (discount / 100);
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxRate = invoiceItem.taxes?.reduce((sum, tax) =>
            sum + (tax.is_negative ? -tax.amount : tax.amount), 0
        ) || 0;
        const taxAmount = subtotalAfterDiscount * (taxRate / 100);
        const total = subtotalAfterDiscount + taxAmount;
        return parseFloat(total.toFixed(2));
    }, [invoiceItem.quantity, invoiceItem.price, invoiceItem.discount, invoiceItem.taxes]);

    // Update local state when invoiceItem changes
    useEffect(() => {
        setQuantityInput(parseFloat((invoiceItem.quantity ?? 0).toFixed(2)).toString());
        setPriceInput(parseFloat((invoiceItem.price ?? 0).toFixed(2)).toString());
        setDiscountInput(parseFloat((invoiceItem.discount ?? 0).toFixed(2)).toString());
        setPmcInput(invoiceItem.cost_price != null ? parseFloat(invoiceItem.cost_price.toFixed(2)).toString() : "");
        if (!isEditingTotal) {
            setTotalInput(calculateTotal().toString());
        }
    }, [invoiceItem.quantity, invoiceItem.price, invoiceItem.discount, invoiceItem.taxes, invoiceItem.cost_price, calculateTotal, isEditingTotal]);

    // Fetch items when @ is typed (use client-specific prices if client is set, otherwise fall back to org items)
    const handleNameChange = async (value: string, previousValue: string) => {
        onUpdate(invoiceItem.order, "name", value);

        const lastChar = value.slice(-1);
        const justTypedAt = lastChar === "@" && value.length > previousValue.length;

        if ((justTypedAt || value.startsWith("@")) && orgId) {
            setItemsPopoverOpen(true);
            setLoadingItems(true);
            try {
                const searchQuery = value.substring(1);
                if (invoice.client?.id) {
                    const response = await getClientItemsPrices(orgId, invoice.client.id, searchQuery);
                    if (response.success) {
                        const data: Array<{ item: Item; prices: ClientItemPrice[] }> =
                            response.success.items_prices ?? [];
                        // Flatten: one entry per item-price combo; items with no prices get one entry
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
                    const response = await getOrgItems(orgId, searchQuery);
                    if (response.success && response.success.items) {
                        // Wrap plain items as ItemPriceOption with no price
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

        const updates: Partial<InvoiceItem> = {
            item: item,
            name: item.name,
            description: item.description || "",
            cost_price: item.pmc ?? null,
        };

        if (price) {
            // Use the attached price from client items-prices response
            if (price.price_quantity) {
                updates.price = price.price_quantity;
            }
            // Taxes come as full objects from the client items-prices API
            if (price.taxes && price.taxes.length > 0) {
                updates.taxes = price.taxes;
            }
        } else {
            // Fallback: use sell_price / buy_price from the item itself (org items flow)
            const sellPrice = (item as any).sell_price || (item as any).buy_price;
            if (sellPrice?.price_quantity) {
                updates.price = sellPrice.price_quantity;
            }
            if (sellPrice?.taxes && sellPrice.taxes.length > 0) {
                const itemTaxes = taxes.filter(tax => sellPrice.taxes?.includes(tax.id));
                updates.taxes = itemTaxes;
            }
        }

        updateLineMultiple(invoiceItem.order, updates);
        setItemsPopoverOpen(false);
    };

    const handleTaxToggle = (taxId: string) => {
        const currentTaxIds = invoiceItem.taxes?.map(tax => tax.id) || [];
        let newTaxIds: string[];

        if (currentTaxIds.includes(taxId)) {
            newTaxIds = currentTaxIds.filter(id => id !== taxId);
        } else {
            const taxToAdd = taxes.find(tax => tax.id === taxId);
            if (taxToAdd) {
                const currentTaxes = invoiceItem.taxes || [];
                const taxesWithoutSameGroup = currentTaxes.filter(
                    tax => tax.group_name !== taxToAdd.group_name
                );
                newTaxIds = [...taxesWithoutSameGroup.map(t => t.id), taxId];
            } else {
                newTaxIds = [...currentTaxIds, taxId];
            }
        }

        const selectedTaxes = taxes.filter(tax => newTaxIds.includes(tax.id));
        onUpdate(invoiceItem.order, "taxes", selectedTaxes);
    };

    const selectedTaxIds = invoiceItem.taxes?.map(tax => tax.id) || [];

    const filteredTaxes = taxes.filter(tax =>
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

    const style = {
        transform: activeTab === "group" && isDragging ? 'none' : CSS.Transform.toString(transform),
        transition: activeTab === "group" && isDragging ? 'none' : transition,
        opacity: isDragging ? (activeTab === "items" ? 0 : 0.3) : 1,
    };

    const isIndirectCost = invoiceItem.is_indirect_cost === true;
    const isNotVisible = invoiceItem.is_visible === false;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <TableRow
                    ref={setNodeRef}
                    style={style}
                    className={cn(
                        "group",
                        isChild && "bg-muted/10",
                        isReadOnly && "opacity-80",
                        isIndirectCost && "bg-blue-50/70 dark:bg-blue-950/20",
                        isNotVisible && "opacity-50"
                    )}
                >
                    {/* Drag Handle / Order */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("grip")}
                    >
                        <div className="flex items-center gap-1">
                            {isChild && <div className="w-4" />}
                            {!isReadOnly && (
                                <div
                                    {...attributes}
                                    {...listeners}
                                    className="flex items-center justify-center text-muted-foreground cursor-move hover:text-foreground"
                                >
                                    <GripVertical className={cn(
                                        "h-4 w-4 text-muted-foreground cursor-move hover:text-foreground",
                                        nestingLevel > 0 && activeTab === "group" && "ml-2",
                                        nestingLevel === 0 && activeTab === "group" && "ml-7"
                                    )} />
                                </div>
                            )}
                        </div>
                    </TableCell>

                    {/* Concepto / Name */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("concept")}
                    >
                        <div className="flex items-center gap-1.5 w-full">
                            {isChild && nestingLevel > 0 && (
                                <div className="flex" style={{ marginLeft: `${nestingLevel * 16}px` }} />
                            )}

                            <BillableItemTypeSelector
                                value={invoiceItem.type ?? null}
                                onChange={(type) => onUpdate(invoiceItem.order, "type", type)}
                                disabled={isReadOnly}
                            />
                            <div className="flex items-center gap-2 flex-1">
                                {invoiceItem.item ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <ItemAvatar item={invoiceItem.item} showName={false} />
                                            <span className="text-sm">{invoiceItem.item.name}</span>
                                        </div>
                                        <IdBadge id={invoiceItem.item.id} hideIcon={true} className="text-[10px] rounded-sm" />
                                    </div>
                                ) : (
                                    <Popover open={itemsPopoverOpen} onOpenChange={(open) => {
                                        if (!open) {
                                            setItemsPopoverOpen(false);
                                        }
                                    }}>
                                        <PopoverTrigger asChild>
                                            <div className="relative flex-1">
                                                <Input
                                                    value={invoiceItem.name || ""}
                                                    onChange={(e) => handleNameChange(e.target.value, invoiceItem.name || "")}
                                                    placeholder={t("invoices.conceptPlaceholder", "Type @ to search items or enter manually...")}
                                                    className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 pr-6"
                                                    disabled={isReadOnly}
                                                />
                                                {invoiceItem.name?.startsWith("@") && (
                                                    <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder={t("invoices.searchItems", "Search items...")}
                                                    value={invoiceItem.name?.substring(1) || ""}
                                                    onValueChange={(value) => handleNameChange("@" + value, invoiceItem.name || "")}
                                                />
                                                {loadingItems ? (
                                                    <div className="flex items-center justify-center p-4">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    </div>
                                                ) : itemOptions.length === 0 ? (
                                                    <CommandEmpty>{t("invoices.noItemsFound", "No items found")}</CommandEmpty>
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
                                                                                    <IdBadge id={option.item.id} hideIcon={true} className="text-[10px] rounded-sm" />
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
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("description")}
                    >
                        <Textarea
                            value={invoiceItem.description || ""}
                            onChange={(e) => onUpdate(invoiceItem.order, "description", e.target.value)}
                            placeholder={t("invoices.descriptionPlaceholder", "Desc")}
                            className="min-h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent resize-none max-h-24 p-1 mt-2"
                            rows={2}
                            disabled={isReadOnly}
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
                                    onUpdate(invoiceItem.order, "quantity", parseFloat(parsed.toFixed(2)));
                                } else if (value === '') {
                                    onUpdate(invoiceItem.order, "quantity", 0);
                                }
                            }}
                            step="any"
                            className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                            disabled={isReadOnly}
                        />
                    </TableCell>

                    {/* Price */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("price")}
                    >
                        <Input
                            type="number"
                            value={priceInput}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPriceInput(value);
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                    onUpdate(invoiceItem.order, "price", parseFloat(parsed.toFixed(2)));
                                } else if (value === '') {
                                    onUpdate(invoiceItem.order, "price", 0);
                                }
                            }}
                            step="any"
                            className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                            disabled={isReadOnly}
                        />
                    </TableCell>

                    {/* Discount % */}
                    {showDiscount && (
                        <TableCell
                            className="p-1 align-middle overflow-hidden"
                            style={colStyle("discount")}
                        >
                            <Input
                                type="number"
                                value={discountInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setDiscountInput(value);
                                    const parsed = parseFloat(value);
                                    if (!isNaN(parsed)) {
                                        onUpdate(invoiceItem.order, "discount", parseFloat(parsed.toFixed(2)));
                                    } else if (value === '') {
                                        onUpdate(invoiceItem.order, "discount", 0);
                                    }
                                }}
                                step="any"
                                className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                                disabled={isReadOnly}
                            />
                        </TableCell>
                    )}

                    {/* Taxes */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("taxes")}
                    >
                        <Popover open={!isReadOnly && taxPopoverOpen} onOpenChange={isReadOnly ? undefined : setTaxPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-full min-w-0 justify-between px-2 mt-1 font-normal gap-1 p-1! disabled:opacity-80 disabled:cursor-not-allowed"
                                    disabled={isReadOnly}
                                >
                                    {invoiceItem.taxes && invoiceItem.taxes.length > 0 ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <Tag
                                                            text={invoiceItem.taxes[0].type}
                                                            color="default"
                                                            className="capitalize text-xs max-w-24 min-w-0 truncate text-left justify-start"
                                                        />
                                                        {invoiceItem.taxes.length > 1 && <span className="text-xs shrink-0">+{invoiceItem.taxes.length - 1}</span>}
                                                    </div>
                                                </TooltipTrigger>
                                                {invoiceItem.taxes.length > 1 && (
                                                    <TooltipContent className="max-w-xs">
                                                        <div className="flex flex-col gap-1">
                                                            {invoiceItem.taxes.map((tax: TaxType) => (
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
                                        <span className="text-muted-foreground text-xs">{t("invoices.selectTaxes", "Select taxes...")}</span>
                                    )}
                                    <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder={t("invoices.searchTaxes", "Search taxes...")}
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    {filteredTaxes.length === 0 ? (
                                        <CommandEmpty>{t("invoices.noTaxesFound", "No taxes found")}</CommandEmpty>
                                    ) : (
                                        <ScrollArea className="h-64">
                                            {Object.entries(groupedTaxes).map(([groupName, groupTaxes], index) => (
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
                                                                            <span className="capitalize">{tax.type}</span>
                                                                        </div>
                                                                        <Check className={cn(
                                                                            "h-4 w-4 shrink-0",
                                                                            isSelected ? "opacity-100 text-primary" : "opacity-0"
                                                                        )} />
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                    {index < Object.entries(groupedTaxes).length - 1 && <CommandSeparator />}
                                                </React.Fragment>
                                            ))}
                                        </ScrollArea>
                                    )}
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </TableCell>

                    {/* Total */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("total")}
                    >
                        <Input
                            type="number"
                            value={totalInput}
                            onFocus={() => setIsEditingTotal(true)}
                            disabled={isReadOnly}
                            onChange={(e) => {
                                const value = e.target.value;
                                setTotalInput(value);
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                    const discount = invoiceItem.discount ?? 0;
                                    const quantity = invoiceItem.quantity ?? 0;
                                    const discountMultiplier = 1 - (discount / 100);
                                    const taxRate = invoiceItem.taxes?.reduce((sum, tax) =>
                                        sum + (tax.is_negative ? -tax.amount : tax.amount), 0
                                    ) || 0;
                                    const divisor = discountMultiplier * (1 + (taxRate / 100));
                                    const subtotal = parsed / divisor;
                                    const newPrice = quantity > 0 ? subtotal / quantity : subtotal;
                                    onUpdate(invoiceItem.order, "price", parseFloat(newPrice.toFixed(2)));
                                } else if (value === '') {
                                    onUpdate(invoiceItem.order, "price", 0);
                                }
                            }}
                            onBlur={() => setIsEditingTotal(false)}
                            step="any"
                            className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                        />
                    </TableCell>

                    {/* Divider between sale and cost */}
                    <TableCell
                        className="p-0 border-l align-middle overflow-hidden"
                        style={colStyle("divider")}
                    />

                    {/* Cost Price (PC) - editable */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("cost")}
                    >
                        <Input
                            type="number"
                            value={pmcInput}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPmcInput(value);
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                    onUpdate(invoiceItem.order, "cost_price", parseFloat(parsed.toFixed(2)));
                                } else if (value === '') {
                                    onUpdate(invoiceItem.order, "cost_price", null);
                                }
                            }}
                            placeholder="-"
                            step="any"
                            className="disabled:opacity-80 disabled:cursor-not-allowed h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                            disabled={isReadOnly}
                        />
                    </TableCell>

                    {/* Margin % (with discounts) */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("margin")}
                    >
                        {(() => {
                            const price = invoiceItem.price ?? 0;
                            const itemDiscount = invoiceItem.discount ?? 0;
                            const globalDiscount = invoice.discount ?? 0;
                            const effectivePrice = price * (1 - itemDiscount / 100) * (1 - globalDiscount / 100);
                            const hasMargin = invoiceItem.cost_price != null && effectivePrice > 0;
                            const marginValue = hasMargin ? 1 - (invoiceItem.cost_price! / effectivePrice) : null;

                            return (
                                <span className={cn(
                                    "text-sm px-1",
                                    marginValue != null
                                        ? marginValue >= 0
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                        : "text-muted-foreground"
                                )}>
                                    {marginValue != null ? formatPercentage(marginValue) : "-"}
                                </span>
                            );
                        })()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                        className="p-1 align-middle overflow-hidden"
                        style={colStyle("actions")}
                    >
                        {!isReadOnly && (
                            <div className="flex items-center gap-0.5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 mt-1 transition-opacity text-muted-foreground hover:text-foreground",
                                                    isNotVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                )}
                                                onClick={() => onUpdate(invoiceItem.order, "is_visible", isNotVisible ? true : false)}
                                            >
                                                {isNotVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {isNotVisible
                                                ? t("invoices.makeVisible", "Make visible")
                                                : t("invoices.makeNotVisible", "Make not visible")}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => onDelete(invoiceItem.order)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </TableCell>
                </TableRow>
            </ContextMenuTrigger>
            <ContextMenuContent className="min-w-48">
                <ContextMenuItem
                    onClick={() => onUpdate(invoiceItem.order, "is_indirect_cost", true)}
                    disabled={isIndirectCost}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700" />
                        <span>{t("invoices.setAsIndirectCost", "Set as indirect cost")}</span>
                    </div>
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => onUpdate(invoiceItem.order, "is_indirect_cost", false)}
                    disabled={!isIndirectCost}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-background border border-border" />
                        <span>{t("invoices.setAsNormal", "Set as normal")}</span>
                    </div>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={() => onUpdate(invoiceItem.order, "is_visible", isNotVisible ? true : false)}
                >
                    <div className="flex items-center gap-2">
                        {isNotVisible ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                        <span>
                            {isNotVisible
                                ? t("invoices.makeVisible", "Make visible")
                                : t("invoices.makeNotVisible", "Make not visible")}
                        </span>
                    </div>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
