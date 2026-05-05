import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Check, ChevronDown, GripVertical, Search, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InvoiceItem } from "@/types/invoices/invoices";
import { TaxType } from "@/types/miscelanea";
import { useInvoice } from "../../contexts/InvoiceContext";
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
import { getSupplierItems } from "@/api/suppliers/items/items";
import { Item } from "@/types/items/items";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import IdBadge from "@/app/components/id-badge";
import { formatItemPrice } from "@/utils/miscelanea";
import { BillableItemTypeSelector } from "@/app/components/billable-item-type-selector";
import { useInvoiceItemsColumnLayout } from "@/app/components/invoice-items-table/invoice-items-column-layout";

interface InvoiceItemRowProps {
    invoiceItem: InvoiceItem;
    showDiscount: boolean;
    isChild?: boolean;
    activeTab?: string;
    nestingLevel?: number;
}

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
    invoiceItem,
    showDiscount,
    isChild = false,
    activeTab = "items",
    nestingLevel = 0
}) => {
    const { t } = useTranslation();
    const { invoice, taxes, updateLine, updateLineMultiple, deleteLine } = useInvoice();
    const { orgId } = useParams<{ orgId: string }>();
    const { colStyle } = useInvoiceItemsColumnLayout();

    const supplierId = invoice.supplier?.id || null;
    const onUpdate = updateLine;
    const onDelete = deleteLine;
    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [itemsPopoverOpen, setItemsPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [supplierItems, setSupplierItems] = useState<Item[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Use a unique identifier for drag/drop - use id if available, otherwise use order
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
        if (!isEditingTotal) {
            setTotalInput(calculateTotal().toString());
        }
    }, [invoiceItem.quantity, invoiceItem.price, invoiceItem.discount, invoiceItem.taxes, calculateTotal, isEditingTotal]);

    // Fetch supplier items when @ is typed
    const handleNameChange = async (value: string, previousValue: string) => {
        onUpdate(invoiceItem.order, "name", value);

        // Check if the last character typed is @ or if input starts with @
        const lastChar = value.slice(-1);
        const justTypedAt = lastChar === "@" && value.length > previousValue.length;

        if ((justTypedAt || value.startsWith("@")) && supplierId && orgId) {
            setItemsPopoverOpen(true);
            setLoadingItems(true);
            try {
                const response = await getSupplierItems(orgId, supplierId, value.substring(1));
                if (response.success && response.success.items) {
                    setSupplierItems(response.success.items);
                }
            } catch (error) {
                console.error("Error fetching supplier items:", error);
            } finally {
                setLoadingItems(false);
            }
        } else if (!value.startsWith("@")) {
            setItemsPopoverOpen(false);
        }
    };

    const handleSelectItem = (item: Item) => {
        // Get buy price if available
        const buyPrice = (item as any).buy_price;

        // Prepare all updates to apply at once
        const updates: Partial<InvoiceItem> = {
            item: item,
            name: item.name,
            description: item.description || "",
        };

        // Add price if available
        if (buyPrice?.price_quantity) {
            updates.price = buyPrice.price_quantity;
        }

        // Set taxes from buy price
        if (buyPrice?.taxes && buyPrice.taxes.length > 0) {
            const itemTaxes = taxes.filter(tax => buyPrice.taxes?.includes(tax.id));
            updates.taxes = itemTaxes;
        }

        // Apply all updates at once
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

    // In "items" tab: allow normal sortable behavior (items move, dragged item disappears)
    // In "partidas" tab: keep static (items don't move, dragged item stays with low opacity)
    const style = {
        transform: activeTab === "group" && isDragging ? 'none' : CSS.Transform.toString(transform),
        transition: activeTab === "group" && isDragging ? 'none' : transition,
        opacity: isDragging ? (activeTab === "items" ? 0 : 0.3) : 1,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn("group", isChild && "bg-muted/10")}
        >
            {/* Drag Handle / Order */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("grip")}
            >
                <div className="flex items-center gap-1">
                    {isChild && <div className="w-4" />}
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
                                // Only allow closing the popover, not opening via click
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
                                            className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 pr-6"
                                        />
                                        {invoiceItem.name?.startsWith("@") && (
                                            <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder={t("invoices.searchItems", "Search items...")}
                                            value={invoiceItem.name?.substring(1) || ""}
                                            onValueChange={(value) => handleNameChange("@" + value, invoiceItem.name || "")}
                                        />
                                        {loadingItems ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : supplierItems.length === 0 ? (
                                            <CommandEmpty>{t("invoices.noItemsFound", "No items found")}</CommandEmpty>
                                        ) : (
                                            <ScrollArea className="h-64">
                                                <CommandGroup>
                                                    {supplierItems.map((item: Item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.id}
                                                            onSelect={(value) => {
                                                                const selectedItem = supplierItems.find(i => i.id === value);
                                                                if (selectedItem) {
                                                                    handleSelectItem(selectedItem);
                                                                }
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <ItemAvatar item={item} showName={false} />
                                                                <div className="text-sm flex flex-col">
                                                                    <div className="text-sm font-medium flex items-center gap-2">
                                                                        {item.name}
                                                                        <IdBadge id={item.id} hideIcon={true} className="text-[10px] rounded-sm" />
                                                                    </div>
                                                                    {item.buy_price && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {formatItemPrice(item.buy_price, item.measure)}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </CommandItem>
                                                    ))}
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
                />
            </TableCell>

            {/* Quantity */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("quantity")}
            >
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
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
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
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Discount % - Conditional */}
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
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                    />
                </TableCell>
            )}

            {/* Taxes */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("taxes")}
            >
                <Popover open={taxPopoverOpen} onOpenChange={setTaxPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-full min-w-0 justify-between px-2 mt-1 font-normal gap-1 p-1!"
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
                                                                    <span className="capitalize">
                                                                        {tax.type}
                                                                    </span>
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
                    onFocus={() => {
                        setIsEditingTotal(true);
                    }}
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
                    onBlur={() => {
                        setIsEditingTotal(false);
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1"
                />
            </TableCell>

            {/* Actions */}
            <TableCell
                className="p-1 align-middle overflow-hidden"
                style={colStyle("actions")}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(invoiceItem.order)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};
