import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { OrderItem } from "@/types/orders/items/items";
import { TaxType } from "@/types/miscelanea";
import { useOrder } from "../../contexts/OrderContext";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
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
import IdBadge from "@/app/components/id-badge";
import { DueDatesPopover } from "./due-dates-popover";

export interface EditableOrderItem extends Omit<OrderItem, "id"> {
    id: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface OrderItemRowProps {
    orderItem: EditableOrderItem;
    onUpdate: (id: string, field: keyof EditableOrderItem, value: any) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    taxes: TaxType[];
    orgId: string;
    orderId: string;
    isReadOnly?: boolean;
}

export const OrderItemRow: React.FC<OrderItemRowProps> = ({ 
    orderItem, 
    onUpdate, 
    onDelete, 
    onRefresh, 
    taxes, 
    orgId, 
    orderId, 
    isReadOnly = false 
}) => {
    const { t } = useTranslation();
    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { order } = useOrder();

    // Local state for editable number inputs to allow empty strings
    const [quantityInput, setQuantityInput] = useState<string>(orderItem.quantity.toString());
    const [priceInput, setPriceInput] = useState<string>(orderItem.price.toString());
    const [totalInput, setTotalInput] = useState<string>("");
    const [isEditingTotal, setIsEditingTotal] = useState(false);

    // Calculate total whenever quantity, price, or taxes change
    const calculateTotal = useCallback(() => {
        const subtotal = orderItem.quantity * orderItem.price;
        const taxRate = orderItem.taxes?.reduce((sum, tax) =>
            sum + (tax.is_negative ? -tax.amount : tax.amount), 0
        ) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        // Format to max 2 decimals, but remove trailing zeros
        return parseFloat(total.toFixed(2));
    }, [orderItem.quantity, orderItem.price, orderItem.taxes]);

    // Update local state when orderItem changes (from external updates)
    useEffect(() => {
        // Format to max 2 decimals, remove trailing zeros
        setQuantityInput(parseFloat(orderItem.quantity.toFixed(2)).toString());
        setPriceInput(parseFloat(orderItem.price.toFixed(2)).toString());
        // Only update total if not actively editing it
        if (!isEditingTotal) {
            setTotalInput(calculateTotal().toString());
        }
    }, [orderItem.quantity, orderItem.price, orderItem.taxes, calculateTotal, isEditingTotal]);

    const handleTaxToggle = (taxId: string) => {
        const currentTaxIds = orderItem.taxes?.map(tax => tax.id) || [];
        let newTaxIds: string[];

        if (currentTaxIds.includes(taxId)) {
            // Deselect
            newTaxIds = currentTaxIds.filter(id => id !== taxId);
        } else {
            // Find the tax being selected
            const taxToAdd = taxes.find(tax => tax.id === taxId);
            if (taxToAdd) {
                // Remove any existing tax from the same group
                const currentTaxes = orderItem.taxes || [];
                const taxesWithoutSameGroup = currentTaxes.filter(
                    tax => tax.group_name !== taxToAdd.group_name
                );
                newTaxIds = [...taxesWithoutSameGroup.map(t => t.id), taxId];
            } else {
                newTaxIds = [...currentTaxIds, taxId];
            }
        }

        const selectedTaxes = taxes.filter(tax => newTaxIds.includes(tax.id));
        onUpdate(orderItem.id, "taxes", selectedTaxes);
    };

    // Get selected tax IDs
    const selectedTaxIds = orderItem.taxes?.map(tax => tax.id) || [];

    // Filter taxes based on search query
    const filteredTaxes = taxes.filter(tax =>
        tax.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tax.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tax.amount.toString().includes(searchQuery)
    );

    // Group filtered taxes by group_name
    const groupedTaxes = filteredTaxes.reduce((acc, tax) => {
        if (!acc[tax.group_name]) {
            acc[tax.group_name] = [];
        }
        acc[tax.group_name].push(tax);
        return acc;
    }, {} as Record<string, TaxType[]>);

    return (
        <TableRow
            className={cn(
                "group",
                orderItem.isDeleted && "opacity-30",
            )}
        >
            <TableCell className="p-1 w-10 align-middle">
                <IdBadge id={orderItem.item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
            </TableCell>
            {/* Item */}
            <TableCell className="p-1 w-16 align-middle">
                <div className="flex items-center gap-2 px-2">
                    <ItemAvatar item={orderItem.item} showName={false}/>
                    <span className="text-sm">{orderItem.item.name}</span>
                </div>
            </TableCell>

            {/* Description */}
            <TableCell className="p-1 pt-1 min-w-32 align-middle">
                <Textarea
                    value={orderItem.description || ""}
                    onChange={(e) => onUpdate(orderItem.id, "description", e.target.value)}
                    placeholder={t("orders.itemDescriptionPlaceholder", "Description...")}
                    className="min-h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent resize-none max-h-24 p-1 mt-2 disabled:opacity-80"
                    disabled={orderItem.isDeleted || isReadOnly}
                    rows={2}
                />
            </TableCell>

            {/* Quantity */}
            <TableCell className="p-1 w-20 align-middle">
                <div className="flex items-center">
                    {order.status !== "draft" && <span className="text-sm whitespace-nowrap">
                        {orderItem.received_quantity} /
                    </span>}
                    <Input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => {
                            const value = e.target.value;
                            setQuantityInput(value);

                            // Update parent state only if valid number
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                                // Limit to max 2 decimals
                                onUpdate(orderItem.id, "quantity", parseFloat(parsed.toFixed(2)));
                            } else if (value === '') {
                                onUpdate(orderItem.id, "quantity", 0);
                            }
                        }}
                        step="any"
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 disabled:opacity-80"
                        disabled={orderItem.isDeleted || isReadOnly}
                    />
                </div>

            </TableCell>

            {/* Subtotal */}
            <TableCell className="p-1 w-24 align-middle">
                <Input
                    type="number"
                    value={priceInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setPriceInput(value);

                        // Update parent state only if valid number
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            // Limit to max 2 decimals
                            onUpdate(orderItem.id, "price", parseFloat(parsed.toFixed(2)));
                        } else if (value === '') {
                            onUpdate(orderItem.id, "price", 0);
                        }
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 disabled:opacity-80"
                    disabled={orderItem.isDeleted || isReadOnly}
                />
            </TableCell>

            {/* Taxes */}
            <TableCell className="p-1 min-w-36 max-w-36 align-middle">
                <Popover open={taxPopoverOpen} onOpenChange={setTaxPopoverOpen} >
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-full justify-between px-2 mt-1 font-normal gap-1 p-1! min-w-36 max-w-36 disabled:opacity-80"
                            disabled={orderItem.isDeleted || isReadOnly}
                        >
                            {orderItem.taxes && orderItem.taxes.length > 0 ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Tag
                                                    text={orderItem.taxes[0].type}
                                                    color="default"
                                                    className="capitalize text-xs max-w-24 min-w-0 truncate text-left justify-start"
                                                />
                                                {orderItem.taxes.length > 1 && <span className="text-xs shrink-0">+{orderItem.taxes.length - 1}</span>}
                                            </div>
                                        </TooltipTrigger>
                                        {orderItem.taxes.length > 1 && (
                                            <TooltipContent className="max-w-xs">
                                                <div className="flex flex-col gap-1">
                                                    {orderItem.taxes.map((tax: TaxType) => (
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
                                <span className="text-muted-foreground text-xs">{t("orders.selectTaxes", "Select taxes...")}</span>
                            )}
                            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder={t("orders.searchTaxes", "Search taxes...")}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />

                            {filteredTaxes.length === 0 ? (
                                <CommandEmpty>{t("orders.noTaxesFound", "No taxes found")}</CommandEmpty>
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
            <TableCell className="p-1 w-24 align-middle">
                <Input
                    type="number"
                    value={totalInput}
                    onFocus={() => {
                        setIsEditingTotal(true);
                    }}
                    onChange={(e) => {
                        const value = e.target.value;
                        setTotalInput(value);

                        // Update price based on new total
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                            // Sum tax rates, considering is_negative flag
                            const taxRate = orderItem.taxes?.reduce((sum, tax) =>
                                sum + (tax.is_negative ? -tax.amount : tax.amount), 0
                            ) || 0;
                            const divisor = 1 + (taxRate / 100);
                            const subtotal = parsed / divisor;
                            // Update price based on new total (excluding taxes): price = subtotal / quantity
                            const newPrice = orderItem.quantity > 0 ? subtotal / orderItem.quantity : subtotal;
                            // Limit to max 2 decimals
                            onUpdate(orderItem.id, "price", parseFloat(newPrice.toFixed(2)));
                        } else if (value === '') {
                            onUpdate(orderItem.id, "price", 0);
                        }
                    }}
                    onBlur={() => {
                        setIsEditingTotal(false);
                    }}
                    step="any"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent p-1 disabled:opacity-80"
                    disabled={orderItem.isDeleted || isReadOnly}
                />

            </TableCell>

            {/* Due Dates */}
            <TableCell className="p-1 w-8 align-middle">
                <div className="flex items-center justify-center mt-1">
                    <DueDatesPopover
                        orderItemId={orderItem.id}
                        orderId={orderId}
                        orgId={orgId}
                        dueDates={orderItem.due_dates || []}
                        totalQuantity={orderItem.quantity}
                        receivedQuantity={orderItem.received_quantity}
                        onUpdate={onRefresh}
                        disabled={false}
                    />
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="w-8 p-1 align-middle">
                {!isReadOnly && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-80"
                        onClick={() => onDelete(orderItem.id)}
                        disabled={orderItem.isDeleted || isReadOnly}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
};
