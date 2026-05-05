import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CommutingRate } from "@/types/general/commuting-rates";
import { TaxType } from "@/types/miscelanea";
import { postOrgCommutingRate, patchOrgCommutingRate } from "@/api/orgs/commuting-rates/commuting-rates";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { Separator } from "@/components/ui/separator";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import Tag from "@/app/components/tag/tag";
import { useOrg } from "@/app/contexts/OrgContext";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(128).trim(),
    description: z.string().max(512).trim().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]),
    valid_from: z.date().optional(),
    due_date: z.date().optional(),

    is_fixed_price: z.boolean(),
    fixed_price: z.number().min(0).nullable().optional(),

    is_price_per_km: z.boolean(),
    price_per_km: z.number().min(0).nullable().optional(),
    min_price: z.number().min(0).nullable().optional(),

    is_travel_time_billable: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommutingRateEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    commutingRate?: CommutingRate | null;
    mode?: "create" | "update";
}

const CommutingRateEditModal = ({
    open,
    onOpenChange,
    onSuccess,
    commutingRate = null,
    mode = "create",
}: CommutingRateEditModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const { org } = useOrg();

    const [availableTaxes, setAvailableTaxes] = useState<TaxType[]>([]);
    const [selectedTaxes, setSelectedTaxes] = useState<TaxType[]>([]);
    const [taxPopoverOpen, setTaxPopoverOpen] = useState(false);
    const [taxSearchQuery, setTaxSearchQuery] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            status: "active",
            valid_from: new Date(),
            due_date: undefined,
            is_fixed_price: false,
            fixed_price: null,
            is_price_per_km: false,
            price_per_km: org.price_per_km ?? null,
            min_price: null,
            is_travel_time_billable: false,
        },
    });

    const isFixedPrice = form.watch("is_fixed_price");
    const isPricePerKm = form.watch("is_price_per_km");

    useEffect(() => {
        if (!open) return;

        if (mode === "update" && commutingRate) {
            form.reset({
                name: commutingRate.name ?? "",
                description: commutingRate.description ?? "",
                status: commutingRate.status ?? "active",
                valid_from: commutingRate.valid_from ? new Date(commutingRate.valid_from) : undefined,
                due_date: commutingRate.due_date ? new Date(commutingRate.due_date) : undefined,
                is_fixed_price: commutingRate.is_fixed_price,
                fixed_price: commutingRate.fixed_price,
                is_price_per_km: commutingRate.is_price_per_km,
                price_per_km: commutingRate.price_per_km,
                min_price: commutingRate.min_price,
                is_travel_time_billable: commutingRate.is_travel_time_billable,
            });
        } else {
            form.reset({
                name: "",
                description: "",
                status: "active",
                valid_from: new Date(),
                due_date: undefined,
                is_fixed_price: false,
                fixed_price: null,
                is_price_per_km: false,
                price_per_km: org.price_per_km ?? null,
                min_price: null,
                is_travel_time_billable: false,
            });
        }
    }, [open, mode, commutingRate]);

    const fetchTaxes = useCallback(async () => {
        if (!orgId) return;
        try {
            const response = await getOrgTaxes(orgId, true);
            if (response.success) {
                setAvailableTaxes(response.success.taxes ?? []);
            }
        } catch {
            /* ignore */
        }
    }, [orgId]);

    useEffect(() => {
        if (open) {
            fetchTaxes();
        }
    }, [open, fetchTaxes]);

    useEffect(() => {
        if (!open) return;
        if (mode === "update" && commutingRate?.taxes) {
            setSelectedTaxes(commutingRate.taxes);
        } else {
            setSelectedTaxes([]);
        }
    }, [open, mode, commutingRate]);

    const handleTaxToggle = (taxId: string) => {
        const currentTaxIds = selectedTaxes.map((tax) => tax.id);

        if (currentTaxIds.includes(taxId)) {
            setSelectedTaxes(selectedTaxes.filter((tax) => tax.id !== taxId));
        } else {
            const taxToAdd = availableTaxes.find((tax) => tax.id === taxId);
            if (taxToAdd) {
                const taxesWithoutSameGroup = selectedTaxes.filter(
                    (tax) => tax.group_name !== taxToAdd.group_name
                );
                setSelectedTaxes([...taxesWithoutSameGroup, taxToAdd]);
            }
        }
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

    const onSubmit = async (values: FormValues) => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const payload = {
                name: values.name,
                description: values.description || null,
                status: values.status,
                valid_from: values.valid_from?.toISOString() ?? null,
                ...(values.due_date && { due_date: values.due_date.toISOString() }),
                is_fixed_price: values.is_fixed_price,
                fixed_price: values.is_fixed_price ? (values.fixed_price ?? null) : null,
                is_price_per_km: values.is_price_per_km,
                price_per_km: values.is_price_per_km ? (values.price_per_km ?? null) : null,
                min_price: values.is_price_per_km ? (values.min_price ?? null) : null,
                is_travel_time_billable: values.is_travel_time_billable,
                taxes_ids: selectedTaxes.map((tax) => tax.id),
            };

            let response;
            if (mode === "update" && commutingRate) {
                response = await patchOrgCommutingRate(orgId, commutingRate.id, payload);
            } else {
                response = await postOrgCommutingRate(orgId, payload);
            }

            if (response.success) {
                toast.success(
                    mode === "update"
                        ? t("commutingRates.updatedSuccess", "Commuting rate updated")
                        : t("commutingRates.createdSuccess", "Commuting rate created")
                );
                form.reset();
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(response.error || t("commutingRates.saveError", "Failed to save commuting rate"));
            }
        } catch {
            toast.error(
                mode === "update"
                    ? t("commutingRates.updateError", "Failed to update commuting rate")
                    : t("commutingRates.createError", "Failed to create commuting rate")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (next: boolean) => {
        if (!next && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (!discard) return;
        }
        form.reset();
        onOpenChange(next);
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? t("commutingRates.createRate", "Create Commuting Rate")
                            : t("commutingRates.editRate", "Edit Commuting Rate")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="overflow-y-auto max-h-[calc(85vh-10rem)] px-1 space-y-6 py-2">

                            {/* ── Section 1: General info ──────────────────── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t("commutingRates.name", "Name")} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("commutingRates.namePlaceholder", "e.g. Standard client commuting")}
                                                    {...field}
                                                    disabled={isLoading}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t("commutingRates.description", "Description")}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t("commutingRates.descriptionPlaceholder", "Optional description...")}
                                                    {...field}
                                                    disabled={isLoading}
                                                    rows={2}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t("commutingRates.status", "Status")} *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("commutingRates.selectStatus", "Select status")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <Tag text="active" className="capitalize" />
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        <Tag text="inactive" className="capitalize" />
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="col-span-2">
                                    <FormLabel className="mb-2 block">
                                        {t("commutingRates.taxes", "Taxes")}
                                    </FormLabel>
                                    <Popover open={taxPopoverOpen} onOpenChange={setTaxPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between font-normal gap-1"
                                                disabled={isLoading}
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
                                                        {t("commutingRates.selectTaxes", "Select taxes...")}
                                                    </span>
                                                )}
                                                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder={t("commutingRates.searchTaxes", "Search taxes...")}
                                                    value={taxSearchQuery}
                                                    onValueChange={setTaxSearchQuery}
                                                />
                                                {filteredTaxes.length === 0 ? (
                                                    <CommandEmpty>
                                                        {t("commutingRates.noTaxesFound", "No taxes found")}
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

                                <DateTimePicker
                                    form={form}
                                    name="valid_from"
                                    showMonthYearPicker={true}
                                    label={t("commutingRates.validFrom", "Valid From")}
                                    disabled={isLoading}
                                />

                                <DateTimePicker
                                    form={form}
                                    name="due_date"
                                    showMonthYearPicker={true}
                                    label={t("commutingRates.validTo", "Valid To")}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* ── Section 2: Fixed Price ───────────────────── */}
                            <Separator />
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
                                                        disabled={isLoading}
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
                                                        disabled={isLoading}
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

                            {/* ── Section 3: Price per km ──────────────────── */}
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
                                                        disabled={isLoading}
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
                                                            disabled={isLoading}
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
                                                            disabled={isLoading}
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

                            {/* ── Section 4: Travel time billable ──────────── */}
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
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {mode === "update"
                                            ? t("commutingRates.updating", "Updating...")
                                            : t("commutingRates.creating", "Creating...")}
                                    </>
                                ) : mode === "update" ? (
                                    t("commutingRates.updateRate", "Update Rate")
                                ) : (
                                    t("commutingRates.createRate", "Create Rate")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CommutingRateEditModal;
