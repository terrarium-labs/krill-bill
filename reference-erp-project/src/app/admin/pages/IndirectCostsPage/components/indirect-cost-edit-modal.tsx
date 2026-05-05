import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { postOrgIndirectCost, patchOrgIndirectCost } from "@/api/orgs/indirect-costs/indirect-costs";
import { IndirectCost, INDIRECT_COST_ENTITIES } from "@/types/financials/indirect-costs";
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
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TipsCard from "@/app/components/cards/tips-card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";

const ENTITY_LABELS: Record<(typeof INDIRECT_COST_ENTITIES)[number], string> = {
    work_orders: "Work Orders",
};

const ENTITY_OPTIONS = INDIRECT_COST_ENTITIES.map((entity) => ({
    value: entity,
    label: ENTITY_LABELS[entity],
}));

const rangeSchema = z.object({
    from_quantity: z.coerce.number().min(0, "Must be >= 0"),
    to_quantity: z.preprocess(
        (val) => (val === null || val === undefined || val === "") ? null : Number(val),
        z.number().min(0, "Must be >= 0").nullable()
    ),
    no_limit: z.boolean().optional(),
    value: z.coerce.number().min(0, "Must be >= 0"),
});

const indirectCostSchema = z.object({
    name: z.string().min(1, "Name is required").max(256, "Name must be at most 256 characters"),
    description: z.string().optional(),
    entity: z.enum(["work_orders"]),
    is_percentage: z.boolean(),
    ranges: z.array(rangeSchema),
});

type FormValues = z.infer<typeof indirectCostSchema>;

interface IndirectCostEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    orgId: string;
    indirectCost?: IndirectCost | null;
    mode?: "create" | "update";
    currencySymbol: string;
}

const IndirectCostEditModal: React.FC<IndirectCostEditModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    orgId,
    indirectCost = null,
    mode = "create",
    currencySymbol,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = mode === "update" || !!indirectCost;

    const getDefaultValues = (data?: IndirectCost | null): FormValues => {
        if (!data) {
            return {
                name: "",
                description: "",
                entity: "work_orders",
                is_percentage: false,
                ranges: [],
            };
        }

        return {
            name: data.name || "",
            description: data.description || "",
            entity: data.entity || "work_orders",
            is_percentage: data.is_percentage ?? false,
            ranges: data.ranges?.map((r) => ({
                from_quantity: r.from_quantity,
                to_quantity: r.to_quantity,
                no_limit: r.to_quantity === null,
                value: r.value,
            })) || [],
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(indirectCostSchema) as any,
        defaultValues: getDefaultValues(indirectCost),
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ranges",
    });

    const isPercentage = form.watch("is_percentage");

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description || null,
                entity: values.entity,
                is_percentage: values.is_percentage,
                ranges: values.ranges.map((r) => ({
                    from_quantity: r.from_quantity,
                    to_quantity: r.no_limit ? null : r.to_quantity,
                    value: r.value,
                })),
            };

            let response;

            if (isEditMode && indirectCost) {
                const { entity, ...patchData } = requestData;
                response = await patchOrgIndirectCost(orgId, indirectCost.id, patchData);
            } else {
                response = await postOrgIndirectCost(orgId, requestData);
            }

            if (response.success !== undefined) {
                const successMessage = isEditMode
                    ? t("settings.indirectCosts.updatedSuccess", "Indirect cost updated successfully")
                    : t("settings.indirectCosts.createdSuccess", "Indirect cost created successfully");

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t("settings.indirectCosts.updateError", "Failed to update indirect cost")
                    : response.error || t("settings.indirectCosts.createError", "Failed to create indirect cost");

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? "updating" : "creating"} indirect cost:`, error);
            const errorMessage = isEditMode
                ? t("settings.indirectCosts.updateError", "Failed to update indirect cost")
                : t("settings.indirectCosts.createError", "Failed to create indirect cost");
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    if (!isEditMode) {
                        form.reset();
                    }
                    onOpenChange(false);
                }
            } else {
                if (!isEditMode) {
                    form.reset();
                }
                onOpenChange(false);
            }
        } else {
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(indirectCost));
        }
    }, [open, indirectCost, form]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl md:min-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {isEditMode
                            ? t("settings.indirectCosts.edit", "Edit Indirect Cost")
                            : t("settings.indirectCosts.createNew", "Create Indirect Cost")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        <TipsCard
                            title={t(
                                "settings.indirectCosts.explanationCardTitle",
                                "About indirect costs",
                            )}
                            summary={
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>
                                        {t(
                                            "settings.indirectCosts.explanation",
                                            "Indirect costs are additional charges applied to the total of an entity (e.g. a work order).",
                                        )}
                                    </p>
                                    <p>
                                        <strong>
                                            {t("settings.indirectCosts.percentageExplanation", "Percentage:")}
                                        </strong>{" "}
                                        {t(
                                            "settings.indirectCosts.percentageDetail",
                                            "Applies a proportional percentage on the total of the entity. For example, 10% on a 1,000€ work order adds 100€.",
                                        )}
                                    </p>
                                    <p>
                                        <strong>
                                            {t("settings.indirectCosts.fixedExplanation", "Fixed Amount:")}
                                        </strong>{" "}
                                        {t(
                                            "settings.indirectCosts.fixedDetail",
                                            "Applies a fixed amount on top of the entity total. For example, 50€ is added regardless of the work order value.",
                                        )}
                                    </p>
                                </div>
                            }
                            doc={{ slug: "pd_admin_indirect_costs" }}
                        />

                        {/* Name and Entity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("settings.indirectCosts.name", "Name")} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settings.indirectCosts.namePlaceholder", "e.g., Overhead, Transport")}
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
                                name="entity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("settings.indirectCosts.entity", "Entity")} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isLoading || isEditMode}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settings.indirectCosts.selectEntity", "Select entity")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ENTITY_OPTIONS.map((entity) => (
                                                    <SelectItem key={entity.value} value={entity.value}>
                                                        {entity.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Is Percentage toggle */}
                        <FormField
                            control={form.control}
                            name="is_percentage"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isLoading}
                                        />
                                        <Label className="text-sm">
                                            {field.value
                                                ? t("settings.indirectCosts.percentageMode", "Percentage mode — values applied as % of total")
                                                : t("settings.indirectCosts.fixedMode", "Fixed amount mode — values applied in {{symbol}}", { symbol: currencySymbol })}
                                        </Label>
                                    </div>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "settings.indirectCosts.percentageToggleDescription",
                                            "Toggle whether range values are interpreted as a percent of the entity total or a fixed amount.",
                                        )}
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("settings.indirectCosts.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("settings.indirectCosts.descriptionPlaceholder", "Optional description for this indirect cost")}
                                            {...field}
                                            disabled={isLoading}
                                            rows={2}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ranges */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">
                                        {t("settings.indirectCosts.ranges", "Ranges")}
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t("settings.indirectCosts.rangesHint", "Define quantity ranges and the value to apply for each range.")}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const ranges = form.getValues("ranges");
                                        const lastRange = ranges[ranges.length - 1];
                                        const nextFrom = lastRange?.no_limit ? lastRange.from_quantity : (lastRange?.to_quantity ?? 0);
                                        append({ from_quantity: nextFrom, to_quantity: 0, no_limit: false, value: 0 });
                                    }}
                                    disabled={isLoading || (fields.length > 0 && !!form.watch(`ranges.${fields.length - 1}.no_limit`))}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t("settings.indirectCosts.addRange", "Add Range")}
                                </Button>
                            </div>

                            {fields.length === 0 && (
                                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                                    {t("settings.indirectCosts.noRangesYet", "No ranges added yet. Click 'Add Range' to define value ranges.")}
                                </p>
                            )}

                            {fields.map((field, index) => {
                                const noLimit = form.watch(`ranges.${index}.no_limit`);
                                const isFirst = index === 0;
                                const isLast = index === fields.length - 1;

                                return (
                                    <div key={field.id} className="p-3 border rounded-md space-y-3">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {t("settings.indirectCosts.rangeIndex", "Range {{n}}", { n: index + 1 })}
                                            </span>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            {/* From */}
                                            <FormField
                                                control={form.control}
                                                name={`ranges.${index}.from_quantity`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-xs">
                                                            {t("settings.indirectCosts.fromQuantity", "From")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                {...field}
                                                                disabled={isLoading || !isFirst}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* To */}
                                            <FormField
                                                control={form.control}
                                                name={`ranges.${index}.to_quantity`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-xs">
                                                            {t("settings.indirectCosts.toQuantity", "To")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            {noLimit ? (
                                                                <Input
                                                                    type="text"
                                                                    value="∞"
                                                                    disabled
                                                                    className="text-center"
                                                                />
                                                            ) : (
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={field.value ?? ""}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                                        field.onChange(val);
                                                                        // Cascade: set next range's from_quantity
                                                                        if (!isLast) {
                                                                            form.setValue(`ranges.${index + 1}.from_quantity`, val);
                                                                        }
                                                                    }}
                                                                    disabled={isLoading}
                                                                />
                                                            )}
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Value with InputGroup */}
                                            <FormField
                                                control={form.control}
                                                name={`ranges.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-xs">
                                                            {t("settings.indirectCosts.value", "Value")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <InputGroup>
                                                                <InputGroupInput
                                                                    type="number"
                                                                    step="0.01"
                                                                    {...field}
                                                                    disabled={isLoading}
                                                                />
                                                                <InputGroupAddon align="inline-end">
                                                                    <InputGroupText>
                                                                        {isPercentage ? "%" : currencySymbol}
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                            </InputGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Delete button — only last range can be removed */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                                onClick={() => remove(index)}
                                                disabled={isLoading || !isLast}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* No limit toggle — only on the last range */}
                                        {isLast && (
                                            <FormField
                                                control={form.control}
                                                name={`ranges.${index}.no_limit`}
                                                render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={field.value ?? false}
                                                            onCheckedChange={(checked) => {
                                                                field.onChange(checked);
                                                                if (checked) {
                                                                    form.setValue(`ranges.${index}.to_quantity`, null);
                                                                } else {
                                                                    form.setValue(`ranges.${index}.to_quantity`, 0);
                                                                }
                                                            }}
                                                            disabled={isLoading}
                                                        />
                                                        <Label className="text-xs text-muted-foreground cursor-pointer" onClick={() => {
                                                            const current = field.value ?? false;
                                                            field.onChange(!current);
                                                            if (!current) {
                                                                form.setValue(`ranges.${index}.to_quantity`, null);
                                                            } else {
                                                                form.setValue(`ranges.${index}.to_quantity`, 0);
                                                            }
                                                        }}>
                                                            {t("settings.indirectCosts.noLimit", "No upper limit (applies from this quantity onwards)")}
                                                        </Label>
                                                    </div>
                                                )}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t("settings.indirectCosts.updating", "Updating...")
                                            : t("settings.indirectCosts.creating", "Creating...")}
                                    </>
                                ) : (
                                    isEditMode
                                        ? t("common.update", "Update")
                                        : t("common.create", "Create")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default IndirectCostEditModal;
