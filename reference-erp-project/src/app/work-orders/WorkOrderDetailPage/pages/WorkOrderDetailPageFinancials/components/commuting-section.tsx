import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Check, X, Save, MapPin, Clock, DownloadCloud, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import CurrencyLabel from "@/app/components/labels/currency-label";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { getOrgCommutingRates, getOrgCommutingRate } from "@/api/orgs/commuting-rates/commuting-rates";
import {
    patchWorkOrderBillableCommutings,
} from "@/api/field-service/work-orders/billable-commutings/billable-commutings";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { useBillableItems, getBillableMinutes } from "../contexts/BillableItemsContext";
import { TaxType } from "@/types/miscelanea";
import { CommutingRate } from "@/types/general/commuting-rates";
import EmployeeLabel from "@/app/components/labels/employee-label";

const formSchema = z.object({
    distance: z.number().min(0),
    time_to_travel: z.number().min(0),
    is_fixed_price: z.boolean(),
    fixed_price: z.number().min(0).nullable().optional(),
    is_price_per_km: z.boolean(),
    price_per_km: z.number().min(0).nullable().optional(),
    min_price: z.number().min(0).nullable().optional(),
    is_travel_time_billable: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const CommutingSection: React.FC = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { workOrder } = useWorkOrder();

    const [isSaving, setIsSaving] = useState(false);
    const [isRatePopoverOpen, setIsRatePopoverOpen] = useState(false);
    const [rateOptions, setRateOptions] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);
    const [rateSearchQuery, setRateSearchQuery] = useState("");

    const {
        taxes: availableTaxes,
        setCommutingCalculations,
        commutingData: data,
        isCommutingLoading: isLoading,
        refetchCommutingData,
    } = useBillableItems();
    const [selectedTaxes, setSelectedTaxes] = useState<TaxType[]>([]);
    const [initialTaxes, setInitialTaxes] = useState<TaxType[]>([]);
    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [taxSearchQuery, setTaxSearchQuery] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            distance: workOrder.location?.distance ?? 0,
            time_to_travel: workOrder.location?.time_to_travel ?? 0,
            is_fixed_price: false,
            fixed_price: null,
            is_price_per_km: false,
            price_per_km: null,
            min_price: null,
            is_travel_time_billable: false,
        },
    });

    const isFixedPrice = form.watch("is_fixed_price");
    const isPricePerKm = form.watch("is_price_per_km");

    useEffect(() => {
        if (!data) return;
        const taxes = data.commuting_rate?.taxes ?? data.taxes;
        if (taxes) {
            setSelectedTaxes(taxes);
            setInitialTaxes(taxes);
        }
        const loadedDistance = data.distance ?? 0;
        const loadedTimeToTravel = data.time_to_travel ?? 0;
        if (data.commuting_rate) {
            form.reset({
                distance: loadedDistance,
                time_to_travel: loadedTimeToTravel,
                is_fixed_price: data.commuting_rate.is_fixed_price,
                fixed_price: data.commuting_rate.fixed_price,
                is_price_per_km: data.commuting_rate.is_price_per_km,
                price_per_km: data.commuting_rate.price_per_km,
                min_price: data.commuting_rate.min_price,
                is_travel_time_billable: data.commuting_rate.is_travel_time_billable,
            });
        } else {
            form.reset({
                ...form.getValues(),
                distance: loadedDistance,
                time_to_travel: loadedTimeToTravel,
            });
        }
    }, [data]);

    const prefillPricingFromRate = (rate: CommutingRate) => {
        form.setValue("is_fixed_price", rate.is_fixed_price, { shouldDirty: true });
        form.setValue("fixed_price", rate.fixed_price, { shouldDirty: true });
        form.setValue("is_price_per_km", rate.is_price_per_km, { shouldDirty: true });
        form.setValue("price_per_km", rate.price_per_km, { shouldDirty: true });
        form.setValue("min_price", rate.min_price, { shouldDirty: true });
        form.setValue("is_travel_time_billable", rate.is_travel_time_billable, { shouldDirty: true });
    };

    const fetchRateOptions = useCallback(async (query?: string) => {
        if (!orgId) return;
        setIsLoadingRates(true);
        try {
            const response = await getOrgCommutingRates(orgId, query || undefined);
            if (response.success) {
                setRateOptions(response.success.commuting_rates ?? []);
            }
        } catch {
            /* ignore */
        } finally {
            setIsLoadingRates(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (isRatePopoverOpen) {
            setRateSearchQuery("");
            fetchRateOptions();
        }
    }, [isRatePopoverOpen, fetchRateOptions]);

    useEffect(() => {
        if (!isRatePopoverOpen) return;
        const timeout = setTimeout(() => fetchRateOptions(rateSearchQuery), 300);
        return () => clearTimeout(timeout);
    }, [rateSearchQuery, isRatePopoverOpen, fetchRateOptions]);

    const handleSelectCommutingRate = useCallback(async (rateId: string) => {
        if (!orgId) return;
        try {
            const response = await getOrgCommutingRate(orgId, rateId);
            if (response.success) {
                const rate: CommutingRate = response.success.commuting_rate;
                prefillPricingFromRate(rate);
                setIsRatePopoverOpen(false);
            }
        } catch {
            toast.error(t("workOrders.commutingRateFetchError", "Failed to load commuting rate"));
        }
    }, [orgId]);

    const handleTaxToggle = (taxId: string) => {
        const currentTaxIds = selectedTaxes.map((tax) => tax.id);
        let newTaxIds: string[];

        if (currentTaxIds.includes(taxId)) {
            newTaxIds = currentTaxIds.filter((id) => id !== taxId);
        } else {
            const taxToAdd = availableTaxes.find((tax) => tax.id === taxId);
            if (taxToAdd) {
                const taxesWithoutSameGroup = selectedTaxes.filter(
                    (tax) => tax.group_name !== taxToAdd.group_name
                );
                newTaxIds = [...taxesWithoutSameGroup.map((t) => t.id), taxId];
            } else {
                newTaxIds = [...currentTaxIds, taxId];
            }
        }

        const newSelectedTaxes = availableTaxes.filter((tax) => newTaxIds.includes(tax.id));
        setSelectedTaxes(newSelectedTaxes);
    };

    const selectedTaxIds = selectedTaxes.map((tax) => tax.id);

    const filteredTaxes = availableTaxes.filter(
        (tax) =>
            tax.type.toLowerCase().includes(taxSearchQuery.toLowerCase()) ||
            tax.group_name.toLowerCase().includes(taxSearchQuery.toLowerCase()) ||
            tax.amount.toString().includes(taxSearchQuery)
    );

    const groupedTaxes = filteredTaxes.reduce((acc, tax) => {
        if (!acc[tax.group_name]) {
            acc[tax.group_name] = [];
        }
        acc[tax.group_name].push(tax);
        return acc;
    }, {} as Record<string, TaxType[]>);

    const taxesDirty = JSON.stringify(selectedTaxes.map((t) => t.id).sort()) !== JSON.stringify(initialTaxes.map((t) => t.id).sort());

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !workOrder.id) return;
        setIsSaving(true);
        try {
            const payload = {
                distance: values.distance,
                time_to_travel: values.time_to_travel,
                is_fixed_price: values.is_fixed_price,
                fixed_price: values.is_fixed_price ? (values.fixed_price ?? null) : null,
                is_price_per_km: values.is_price_per_km,
                price_per_km: values.is_price_per_km ? (values.price_per_km ?? null) : null,
                min_price: values.is_price_per_km ? (values.min_price ?? null) : null,
                is_travel_time_billable: values.is_travel_time_billable,
                taxes_ids: selectedTaxes.map((tax) => tax.id),
            };

            const response = await patchWorkOrderBillableCommutings(orgId, workOrder.id, payload);
            if (response.success !== undefined) {
                toast.success(t("workOrders.commutingUpdated", "Commuting updated successfully"));
                form.reset(values);
                setInitialTaxes(selectedTaxes);
                refetchCommutingData();
            } else {
                toast.error(response.error || t("workOrders.commutingUpdateError", "Failed to update commuting"));
            }
        } catch {
            toast.error(t("workOrders.commutingUpdateError", "Failed to update commuting"));
        } finally {
            setIsSaving(false);
        }
    };

    const assigneesPrices = data?.assignees_prices ?? [];

    const distance = form.watch("distance") ?? 0;
    const timeToTravel = form.watch("time_to_travel") ?? 0;

    const isTravelTimeBillable = form.watch("is_travel_time_billable");

    const fixedPriceComponent = isFixedPrice ? (form.watch("fixed_price") ?? 0) : 0;
    const pricePerKmVal = form.watch("price_per_km") ?? 0;
    const minPriceVal = form.watch("min_price") ?? 0;
    const perKmComponent = isPricePerKm
        ? Math.max(distance * pricePerKmVal, minPriceVal)
        : 0;
    const assigneePvpTotal = isTravelTimeBillable
        ? assigneesPrices.reduce((sum, ap) => {
            const billableHours = getBillableMinutes(timeToTravel, ap.min_quantity, ap.step_quantity) / 60;
            return sum + ap.pvp * billableHours;
        }, 0)
        : 0;
    const assigneeCostTotal = assigneesPrices.reduce((sum, ap) => {
        const billableHours = getBillableMinutes(timeToTravel, ap.min_quantity, ap.step_quantity) / 60;
        return sum + ap.cost_price * billableHours;
    }, 0);
    const subtotal = fixedPriceComponent + perKmComponent + assigneePvpTotal;
    const totalCostPrice = assigneeCostTotal;

    const taxesByType = selectedTaxes.reduce((acc, tax) => {
        const taxAmount = subtotal * (tax.amount / 100) * (tax.is_negative ? -1 : 1);
        if (!acc[tax.type]) acc[tax.type] = 0;
        acc[tax.type] += taxAmount;
        return acc;
    }, {} as Record<string, number>);
    const totalTaxes = Object.values(taxesByType).reduce((sum, amount) => sum + amount, 0);
    const total = subtotal + totalTaxes;
    const netMargin = subtotal - totalCostPrice;

    useEffect(() => {
        setCommutingCalculations({
            subtotal,
            taxesByType,
            totalTaxes,
            total,
            totalCostPrice,
            netMargin,
        });
    }, [subtotal, totalTaxes, total, totalCostPrice, netMargin, setCommutingCalculations]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex gap-6 px-1">
                        {/* Left: Form fields */}
                        <div className="flex-1 space-y-6">
                            {/* Distance & Time from location */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="distance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {t("workOrders.distance", "Distance")} (km)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    placeholder="0"
                                                    disabled={isSaving}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const v = e.target.valueAsNumber;
                                                        field.onChange(isNaN(v) ? 0 : v);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="time_to_travel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {t("workOrders.timeToTravel", "Time to Travel")} (min)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    placeholder="0"
                                                    disabled={isSaving}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const v = e.target.valueAsNumber;
                                                        field.onChange(isNaN(v) ? 0 : v);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div>
                                    <FormLabel className="mb-2 block">
                                        {t("workOrders.taxes", "Taxes")}
                                    </FormLabel>
                                    <Popover open={taxPopoverOpen} onOpenChange={setTaxPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between font-normal gap-1"
                                                disabled={isSaving}
                                            >
                                                {selectedTaxes.length > 0 ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <Tag
                                                                        text={selectedTaxes[0].type}
                                                                        color="default"
                                                                        className="capitalize text-xs max-w-32 min-w-0 truncate text-left justify-start"
                                                                    />
                                                                    {selectedTaxes.length > 1 && (
                                                                        <span className="text-xs shrink-0">
                                                                            +{selectedTaxes.length - 1}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TooltipTrigger>
                                                            {selectedTaxes.length > 1 && (
                                                                <TooltipContent className="max-w-xs">
                                                                    <div className="flex flex-col gap-1">
                                                                        {selectedTaxes.map((tax: TaxType) => (
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
                                                    <span className="text-muted-foreground text-sm">
                                                        {t("workOrders.selectTaxes", "Select taxes...")}
                                                    </span>
                                                )}
                                                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder={t("workOrders.searchTaxes", "Search taxes...")}
                                                    value={taxSearchQuery}
                                                    onValueChange={setTaxSearchQuery}
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
                                </div>
                            </div>

                            {/* Taxes */}


                            {/* Advanced Options Accordion */}
                            <Accordion type="single" collapsible>
                                <AccordionItem value="advanced-options" className="rounded-lg">
                                    <AccordionTrigger className="text-sm hover:underline">
                                        {t("workOrders.advancedOptions", "Advanced Options")}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-6 px-1">
                                        {/* Fixed Price */}
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-semibold">
                                                        {t("commutingRates.fixedPrice", "Fixed Price")}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t("commutingRates.fixedPriceDescription", "A flat amount always billed per commute, regardless of distance.")}
                                                    </p>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="is_fixed_price"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    disabled={isSaving}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {isFixedPrice && (
                                                <FormField
                                                    control={form.control}
                                                    name="fixed_price"
                                                    render={({ field }) => (
                                                        <FormItem className="max-w-xs">
                                                            <FormLabel>{t("commutingRates.fixedPriceAmount", "Amount")}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    step={0.01}
                                                                    placeholder="0.00"
                                                                    disabled={isSaving}
                                                                    value={field.value ?? ""}
                                                                    onChange={(e) => {
                                                                        const v = e.target.valueAsNumber;
                                                                        field.onChange(isNaN(v) ? null : v);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>

                                        {/* Price per km */}
                                        <Separator />
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-semibold">
                                                        {t("commutingRates.pricePerKm", "Price per Kilometre")}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t("commutingRates.pricePerKmDescription", "Billed per km driven. When a minimum price is set, the charge is max(km × price/km, min_price).")}
                                                    </p>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="is_price_per_km"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    disabled={isSaving}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {isPricePerKm && (
                                                <div className="grid grid-cols-2 gap-4 items-start">
                                                    <FormField
                                                        control={form.control}
                                                        name="price_per_km"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t("commutingRates.pricePerKmLabel", "Price / km")}</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        step={0.01}
                                                                        placeholder="0.00"
                                                                        disabled={isSaving}
                                                                        value={field.value ?? ""}
                                                                        onChange={(e) => {
                                                                            const v = e.target.valueAsNumber;
                                                                            field.onChange(isNaN(v) ? null : v);
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="min_price"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t("commutingRates.minPrice", "Minimum price")}</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        step={0.01}
                                                                        placeholder="0.00"
                                                                        disabled={isSaving}
                                                                        value={field.value ?? ""}
                                                                        onChange={(e) => {
                                                                            const v = e.target.valueAsNumber;
                                                                            field.onChange(isNaN(v) ? null : v);
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    {t("commutingRates.minPriceDescription", "If set, ensures at least this amount is charged.")}
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Travel time billable */}
                                        <Separator />
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-semibold">
                                                        {t("commutingRates.travelTimeBillable", "Travel Time Billable")}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t("commutingRates.travelTimeBillableDescription", "Bills the worker's time during commuting based on their hourly rate.")}
                                                    </p>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="is_travel_time_billable"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    disabled={isSaving}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <Popover open={isRatePopoverOpen} onOpenChange={setIsRatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            disabled={isSaving}
                                        >
                                            <DownloadCloud className="h-4 w-4" />
                                            {t("workOrders.loadFromRate", "Load from Rate")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-0" align="end">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder={t("common.search", "Search...")}
                                                value={rateSearchQuery}
                                                onValueChange={setRateSearchQuery}
                                            />
                                            <CommandList>
                                                {isLoadingRates ? (
                                                    <div className="flex items-center justify-center py-6">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : rateOptions.length === 0 ? (
                                                    <CommandEmpty>
                                                        {t("workOrders.noCommutingRatesFound", "No commuting rates found")}
                                                    </CommandEmpty>
                                                ) : (
                                                    <ScrollArea className="max-h-64">
                                                        <CommandGroup>
                                                            {rateOptions.map((rate) => (
                                                                <CommandItem
                                                                    key={rate.id}
                                                                    value={rate.id}
                                                                    onSelect={() => handleSelectCommutingRate(rate.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {rate.name || "-"}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </ScrollArea>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    type="submit"
                                    disabled={isSaving || (!form.formState.isDirty && !taxesDirty)}
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t("common.saving", "Saving...")}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {t("common.save", "Save")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Right: Assignees prices summary */}
                        <div className="w-96 min-w-96 space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                                <h4 className="text-sm font-semibold">
                                    {t("workOrders.commutingSummary", "Commuting Summary")}
                                </h4>

                                {/* Location info */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {t("workOrders.distance", "Distance")}
                                        </span>
                                        <span className="font-medium">{distance} km</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {t("workOrders.timeToTravel", "Time to Travel")}
                                        </span>
                                        <span className="font-medium">{timeToTravel} min</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Rate breakdown */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {t("commutingRates.fixedPrice", "Fixed Price")}
                                        </span>
                                        {isFixedPrice ? (
                                            <CurrencyLabel data={fixedPriceComponent} className="font-medium" />
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                {t("common.disabled", "Disabled")}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {t("commutingRates.pricePerKm", "Price per Km")}
                                        </span>
                                        {isPricePerKm ? (
                                            <div className="text-right text-xs">
                                                <CurrencyLabel data={perKmComponent} className="font-medium" />
                                                <p className="text-xs text-muted-foreground">
                                                    {distance} km × <CurrencyLabel className="text-xs" data={pricePerKmVal} />
                                                    {minPriceVal > 0 && (
                                                        <> (min. <CurrencyLabel className="text-xs" data={minPriceVal} />)</>
                                                    )}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                {t("common.disabled", "Disabled")}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {t("commutingRates.travelTimeBillable", "Travel Time")}
                                        </span>
                                        {form.watch("is_travel_time_billable") ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                                <span className="font-medium">{t("commutingRates.billable", "Billable")}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm">
                                                <X className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-muted-foreground text-xs">
                                                    {t("common.disabled", "Disabled")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assignees prices */}
                                {assigneesPrices.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t("workOrders.assigneesPrices", "Assignees")}
                                            </h5>
                                            {assigneesPrices.map((ap, idx) => {
                                                const billableMinutes = getBillableMinutes(timeToTravel, ap.min_quantity, ap.step_quantity);
                                                const billableHours = billableMinutes / 60;
                                                const billedPvp = ap.pvp * billableHours;
                                                const billedCost = ap.cost_price * billableHours;
                                                return (
                                                    <div
                                                        key={ap.assignee?.id ?? idx}
                                                        className="flex items-center justify-between py-1.5 text-sm"
                                                    >
                                                        <span className="truncate max-w-[140px]">
                                                            {ap.assignee
                                                                ? <EmployeeLabel data={ap.assignee} />
                                                                : t("common.unknown", "Unknown")}
                                                        </span>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="text-right">
                                                                {isTravelTimeBillable && (
                                                                    <>
                                                                        <div className="font-medium">
                                                                            <CurrencyLabel data={billedPvp} />
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            <CurrencyLabel className="text-xs" data={ap.pvp} />/h × {billableMinutes} min
                                                                            {billableMinutes !== timeToTravel && (
                                                                                <span className="italic"> ({timeToTravel} min actual)</span>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <div className="text-xs text-muted-foreground">
                                                                    {t("workOrders.costPrice", "PC")}: <CurrencyLabel className="text-xs" data={billedCost} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* Totals */}
                                <Separator />
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">
                                            {t("workOrders.subtotal", "Subtotal")}
                                        </span>
                                        <CurrencyLabel data={subtotal} className="font-medium" />
                                    </div>

                                    {Object.entries(taxesByType).map(([taxType, amount]) => (
                                        <div key={taxType} className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground capitalize">{taxType}</span>
                                            <CurrencyLabel data={amount} className="font-medium" />
                                        </div>
                                    ))}

                                    <div className="flex justify-between items-center text-sm pt-1 border-t">
                                        <span className="font-semibold">
                                            {t("workOrders.total", "Total")}
                                        </span>
                                        <CurrencyLabel data={total} className="font-semibold" />
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">
                                            {t("workOrders.costPrice", "PC")}
                                        </span>
                                        <CurrencyLabel data={totalCostPrice} className="font-medium" />
                                    </div>

                                    <div className="flex justify-between items-center text-sm pt-1 border-t">
                                        <span className="font-medium">
                                            {t("workOrders.netMargin", "Net Margin")}
                                        </span>
                                        <CurrencyLabel
                                            data={netMargin}
                                            className={`font-semibold ${netMargin >= 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CommutingSection;
