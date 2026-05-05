import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SimpleDatePicker } from "./simple-date-picker";
import { postOrgOrderItemDueDate, deleteOrgOrderItemDueDate } from "@/api/orgs/orders/items/due-dates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DueDate {
    id: string;
    due_date: string;
    quantity: number;
}

interface DueDateEntry {
    id: string;
    due_date: Date | null;
    quantity: number | undefined;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface DueDatesPopoverProps {
    orderItemId: string;
    orderId: string;
    orgId: string;
    dueDates: DueDate[];
    totalQuantity: number;
    receivedQuantity: number;
    onUpdate: () => void;
    disabled?: boolean;
}

export const DueDatesPopover: React.FC<DueDatesPopoverProps> = ({
    orderItemId,
    orderId,
    orgId,
    dueDates,
    totalQuantity,
    receivedQuantity,
    onUpdate,
    disabled = false,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<DueDateEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize entries when popover opens or dueDates change
    useEffect(() => {
        if (open) {
            const initialEntries: DueDateEntry[] = dueDates.map(dd => ({
                id: dd.id,
                due_date: new Date(dd.due_date),
                quantity: dd.quantity,
                isNew: false,
                isDeleted: false,
            }));
            setEntries(initialEntries);
        }
    }, [open, dueDates]);

    const handleAddEntry = () => {
        const newEntry: DueDateEntry = {
            id: `temp_${Date.now()}`,
            due_date: null,
            quantity: 0,
            isNew: true,
            isDeleted: false,
        };
        setEntries([...entries, newEntry]);
    };

    const handleDeleteEntry = (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (entry?.isNew) {
            // Remove new entries immediately
            setEntries(entries.filter(e => e.id !== id));
        } else {
            // Mark existing entries for deletion
            setEntries(entries.map(e => e.id === id ? { ...e, isDeleted: true } : e));
        }
    };

    const handleUpdateEntry = (id: string, field: 'due_date' | 'quantity', value: any) => {
        setEntries(entries.map(e => {
            if (e.id === id) {
                return { ...e, [field]: value };
            }
            return e;
        }));
    };

    const getTotalScheduledQuantity = () => {
        return entries
            .filter(e => !e.isDeleted)
            .reduce((sum, e) => sum + (e.quantity || 0), 0);
    };

    const getRemainingQuantity = () => {
        return totalQuantity - getTotalScheduledQuantity();
    };

    const canAddMore = () => {
        return getTotalScheduledQuantity() < totalQuantity;
    };

    const handleSave = async () => {
        // Validate
        const activeEntries = entries.filter(e => !e.isDeleted);

        // Check if any entry has missing data
        const hasInvalidEntries = activeEntries.some(e => !e.due_date || e.quantity == null || e.quantity <= 0);
        if (hasInvalidEntries) {
            toast.error(t("orders.dueDates.invalidEntries", "Please fill in all due dates and quantities"));
            return;
        }

        // Check if total exceeds available quantity
        const totalScheduled = getTotalScheduledQuantity();
        if (totalScheduled > totalQuantity) {
            toast.error(t("orders.dueDates.exceedsQuantity", "Total scheduled quantity exceeds order quantity"));
            return;
        }

        setIsSaving(true);
        try {
            // Delete removed entries
            for (const entry of entries.filter(e => e.isDeleted && !e.isNew)) {
                await deleteOrgOrderItemDueDate(orgId, orderId, orderItemId, entry.id);
            }

            // Create new entries
            for (const entry of activeEntries.filter(e => e.isNew)) {
                if (entry.due_date) {
                    await postOrgOrderItemDueDate(orgId, orderId, orderItemId, {
                        due_date: entry.due_date.toISOString(),
                        quantity: entry.quantity,
                    });
                }
            }

            toast.success(t("orders.dueDates.saved", "Due dates saved successfully"));
            setOpen(false);
            onUpdate();
        } catch (error) {
            console.error("Error saving due dates:", error);
            toast.error(t("orders.dueDates.errorSaving", "Error saving due dates"));
        } finally {
            setIsSaving(false);
        }
    };

    // Get all deliveries sorted by date for tooltip
    const getAllDeliveries = () => {
        if (dueDates.length === 0) return [];
        return dueDates
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    };

    const allDeliveries = getAllDeliveries();

    const isPastDate = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getNextDelivery = () => {
        if (allDeliveries.length === 0) return null;
        return dueDates.filter(dd => new Date(dd.due_date) > new Date()).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8",
                                    dueDates.length > 0 && "text-primary"
                                )}
                                disabled={disabled}
                            >
                                <Calendar className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                        {dueDates.length > 0 ? (
                            <div className="space-y-1">
                                <div>
                                    <div className="text-sm font-medium">
                                        {t("orders.dueDates.nextDelivery", "Next delivery")}
                                    </div>
                                    <div className="text-sm">
                                        {formatDate(getNextDelivery()?.due_date || "")} - {getNextDelivery()?.quantity} {t("orders.units", "units")}
                                    </div>
                                </div>
                                <div className="text-xs font-medium my-2">
                                    {t("orders.dueDates.allDeliveries", "All deliveries")}
                                </div>
                                <div className="text-xs space-y-1">
                                    {allDeliveries.map((dd) => (
                                        <div
                                            key={dd.id}
                                            className={cn(
                                                isPastDate(dd.due_date) && "text-white/60"
                                            )}
                                        >
                                            {formatDate(dd.due_date)} - {dd.quantity} {t("orders.units", "units")}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm">
                                {t("orders.dueDates.noDueDates", "No due dates set")}
                            </div>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                            {t("orders.dueDates.manageDueDates", "Manage Due Dates")}
                        </h4>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddEntry}
                            disabled={!canAddMore()}
                            className="h-8 gap-1.5"
                        >
                            <Plus className="h-3 w-3" />
                            {t("common.add", "Add")}
                        </Button>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            <span>{t("orders.dueDates.totalQuantity", "Total quantity")}:</span>
                            <span className="font-medium">{totalQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t("orders.dueDates.scheduled", "Scheduled")}:</span>
                            <span className="font-medium">{getTotalScheduledQuantity()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t("orders.dueDates.remaining", "Remaining")}:</span>
                            <span className={cn(
                                "font-medium",
                                getRemainingQuantity() < 0 && "text-destructive"
                            )}>
                                {getRemainingQuantity()}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    <ScrollArea className="h-32 -mr-2 pr-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 w-full">
                                <Label className="text-xs w-2/3">{t("orders.dueDates.dueDate", "Due Date")}</Label>
                                <Label className="text-xs w-1/3 pl-1.5">{t("orders.dueDates.quantity", "Quantity")}</Label>
                            </div>
                            {entries.filter(e => !e.isDeleted).map((entry, index) => (
                                <div key={entry.id} className="flex items-center justify-between gap-2 w-full last:pb-4">
                                    {entry.isNew ? (
                                        <>
                                            <SimpleDatePicker
                                                id={`date-${entry.id}`}
                                                date={entry.due_date}
                                                setDate={(date) => handleUpdateEntry(entry.id, 'due_date', date)}
                                                placeholder={t("orders.dueDates.selectDate", "Select date")}
                                                className="w-2/3 h-8"
                                            />

                                            <Input
                                                id={`quantity-${entry.id}`}
                                                type="number"
                                                value={entry.quantity === undefined ? '' : entry.quantity}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const q = raw.trim() === '' ? undefined : parseFloat(raw);
                                                    handleUpdateEntry(entry.id, 'quantity', Number.isFinite(q as number) ? q : undefined);
                                                }}
                                                min={0}
                                                step="any"
                                                className="h-8"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2/3 h-8 py-2 text-sm flex items-center">
                                                {entry.due_date ? formatDate(entry.due_date.toISOString()) : '-'}
                                            </div>
                                            <div className="flex-1 h-8 py-2 text-sm flex items-center">
                                                {entry.quantity}
                                            </div>
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDeleteEntry(entry.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}

                            {entries.filter(e => !e.isDeleted).length === 0 && (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {t("orders.dueDates.noEntries", "No due dates. Click 'Add' to create one.")}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <Separator />

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            disabled={isSaving}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || getRemainingQuantity() < 0}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    {t("common.saving", "Saving...")}
                                </>
                            ) : (
                                t("common.save", "Save")
                            )}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
