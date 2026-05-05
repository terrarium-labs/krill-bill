import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { formatDecimal } from "@/utils/miscelanea";
import { getEmployeeAbsenceCounters } from "@/api/employees/absences/absences";
import { AbsenceCounterType } from "@/types/employees/absences";

/** Counter option plus optional tracker fields when API includes them (e.g. raw-counters / tracker merge) */
type CounterWithTrackerFields = AbsenceCounterType & {
  remaining?: number;
  /** Policy or pool total (some payloads use `total` instead) */
  value?: number;
  total?: number;
  adjustment?: number;
};

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import { Badge } from "@/components/ui/badge";

const adjustmentSchema = z.object({
    counter_id: z.string().min(1, "Counter is required"),
    amount: z.number().refine((val) => val !== 0, {
        message: "Amount must not be zero",
    }),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof adjustmentSchema>;

interface CounterAdjustmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    orgId: string;
    employeeId: string;
    title: string;
    successMessage: string;
    errorMessage: string;
    submitAction: (orgId: string, employeeId: string, data: { counter_id: string; amount: number; notes?: string | null }) => Promise<any>;
    adjustmentMode?: "modify_counter" | "adjustment";
    modifyCounterAction?: (orgId: string, employeeId: string, data: { counter_id: string; amount: number; notes?: string | null }) => Promise<any>;
    adjustmentAction?: (orgId: string, employeeId: string, data: { counter_id: string; amount: number; notes?: string | null }) => Promise<any>;
}

const CounterAdjustmentModal: React.FC<CounterAdjustmentModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    orgId,
    employeeId,
    title,
    successMessage,
    errorMessage,
    submitAction,
    adjustmentMode = "adjustment",
    modifyCounterAction,
    adjustmentAction,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCounter, setSelectedCounter] = useState<AbsenceCounterType | null>(null);
    const [countersData, setCountersData] = useState<AbsenceCounterType[]>([]);
    const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
    const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
    const [currentAdjustmentMode, setCurrentAdjustmentMode] = useState<"modify_counter" | "adjustment">(adjustmentMode);

    const form = useForm<FormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            counter_id: "",
            amount: 0,
            notes: "",
        },
    });

    const watchedCounterId = form.watch("counter_id");

    // Fetch counters data when modal opens
    useEffect(() => {
        const fetchCounters = async () => {
            if (open && orgId && employeeId) {
                try {
                    const response = await getEmployeeAbsenceCounters(orgId, employeeId);
                    if (response.success) {
                        setCountersData(response.success.counters || []);
                    }
                } catch (error) {
                    console.error("Error fetching counters:", error);
                }
            }
        };
        fetchCounters();
    }, [open, orgId, employeeId]);

    // Reset form and adjustment mode when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                counter_id: "",
                amount: 0,
                notes: "",
            });
            setAdjustmentValue(0);
            setAdjustmentType("add");
            setCurrentAdjustmentMode(adjustmentMode);
            setSelectedCounter(null);
        }
    }, [open, form, adjustmentMode]);

    // Update selected counter when counter ID (counter_id) changes
    useEffect(() => {
        if (watchedCounterId && countersData.length > 0) {
            const counter = countersData.find(
                (c) =>
                    (c.counter_id && c.counter_id === watchedCounterId)
            );
            setSelectedCounter(counter || null);
        } else {
            setSelectedCounter(null);
        }
    }, [watchedCounterId, countersData]);

    // Update form adjustment value when type or value changes
    useEffect(() => {
        const finalAdjustment = adjustmentType === "add" ? adjustmentValue : -adjustmentValue;
        form.setValue("amount", finalAdjustment);
    }, [adjustmentType, adjustmentValue, form]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                counter_id: values.counter_id,
                amount: values.amount,
                notes: values.notes || null,
            };

            // Determine which action to use based on current mode
            let actionToUse = submitAction;
            if (modifyCounterAction && adjustmentAction) {
                // If both actions are provided, use the one matching current mode
                actionToUse = currentAdjustmentMode === "modify_counter" ? modifyCounterAction : adjustmentAction;
            }

            const response = await actionToUse(orgId, employeeId, requestData);

            if (response.success) {
                const message = currentAdjustmentMode === "modify_counter"
                    ? (successMessage.includes("Counter Modified") ? successMessage : "Counter Modified")
                    : (successMessage.includes("Adjustment Modified") ? successMessage : "Adjustment Modified");
                toast.success(message);
                form.reset({
                    counter_id: "",
                    amount: 0,
                    notes: "",
                });
                setAdjustmentValue(0);
                setAdjustmentType("add");
                setCurrentAdjustmentMode(adjustmentMode);
                onOpenChange(false);
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error("Error submitting adjustment:", error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset({
                counter_id: "",
                amount: 0,
                notes: "",
            });
            setSelectedCounter(null);
            setAdjustmentValue(0);
            setAdjustmentType("add");
        }
        onOpenChange(open);
    };

    const sc = selectedCounter as CounterWithTrackerFields | null;
    const remaining = sc?.remaining;
    const value = sc?.value;
    const totalBase = sc?.value ?? sc?.total;
    const adjustmentRaw = sc?.adjustment;
    const adjustment = adjustmentRaw ?? 0;

    const delta = adjustmentType === "add" ? adjustmentValue : -adjustmentValue;

    const totalIsUnlimited = sc?.total === -1;

    // Calculate expected values based on mode (when tracker fields are present)
    const calculatedNewRemaining = sc && currentAdjustmentMode === "modify_counter" && remaining !== -1 && remaining !== undefined && value !== -1 && value !== undefined
        ? remaining + delta
        : remaining === -1 || value === -1 ? -1 : (remaining ?? 0);

    const calculatedNewTotal = sc && currentAdjustmentMode === "modify_counter" && value !== -1 && value !== undefined
        ? value + delta
        : value === -1 ? -1 : (value ?? 0);

    // Adjustment mode: absence-counters often omit tracker fields; treat missing as 0 (not "unknown")
    const calculatedNewAdjustment =
        sc && currentAdjustmentMode === "adjustment"
            ? adjustmentRaw === -1 || value === -1 || totalIsUnlimited
                ? -1
                : adjustment + delta
            : adjustmentRaw === -1 || value === -1
              ? -1
              : 0;

    const calculatedNewTotalWithAdjustment =
        sc && currentAdjustmentMode === "adjustment"
            ? adjustmentRaw === -1 || value === -1 || totalIsUnlimited
                ? -1
                : (totalBase ?? 0) + (calculatedNewAdjustment === -1 ? 0 : calculatedNewAdjustment)
            : value === -1
              ? -1
              : (value ?? 0);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Counter Selection */}
                        <FormField
                            control={form.control}
                            name="counter_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("absences.counter", "Counter")} *</FormLabel>
                                    <FormControl>
                                        <MultiSelectApi
                                            fetchOptions={getEmployeeAbsenceCounters}
                                            fetchArgs={[orgId, employeeId]}
                                            optionsKey="counters"
                                            customValueKey={(item) =>
                                                item.counter_id ?? ""
                                            }
                                            customLabelKey={(item) => item.name}
                                            placeholder={t("absences.selectCounter", "Select counter")}
                                            searchPlaceholder={t("absences.searchCounter", "Search counters...")}
                                            emptyText={t("absences.noCounters", "No counters found")}
                                            value={field.value ? [field.value] : []}
                                            onChangeValue={(values) => {
                                                const selectedValue = values[0] || "";
                                                field.onChange(selectedValue);
                                            }}
                                            maxCount={1}
                                            disabled={isLoading}
                                            className="w-full truncate"
                                            isApiSearchable={false}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Counter Details */}
                        {selectedCounter && (
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                                {remaining !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {t("absences.remaining", "Remaining")}
                                        </span>
                                        <Badge variant="secondary">
                                            {remaining === -1
                                                ? t("absences.unlimited", "Unlimited")
                                                : `${formatDecimal(remaining)} ${remaining === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}`}
                                        </Badge>
                                    </div>
                                )}
                                {adjustment !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {t("absences.adjustment", "Adjustment")}
                                        </span>
                                        <Badge variant="secondary">
                                            {adjustment === -1
                                                ? t("absences.unlimited", "Unlimited")
                                                : `${formatDecimal(adjustment)} ${Math.abs(adjustment) === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}`}
                                        </Badge>
                                    </div>
                                )}
                                {selectedCounter.start_date && selectedCounter.end_date && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {t("absences.period", "Period")}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(selectedCounter.start_date).toLocaleDateString()} -{" "}
                                            {new Date(selectedCounter.end_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Adjustment Mode Selection */}
                        {modifyCounterAction && adjustmentAction && (
                            <FormItem>
                                <FormLabel>{t("absences.mode", "Mode")}</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={[
                                            { value: "modify_counter", label: t("absences.modifyCounter", "Modify Counter (Remaining Value)") },
                                            { value: "adjustment", label: t("absences.adjustCounter", "Adjust Counter (Extra days)") },
                                        ]}
                                        selected={[currentAdjustmentMode]}
                                        onSelectedChange={(values) => {
                                            if (values.length > 0) {
                                                setCurrentAdjustmentMode(values[0] as "modify_counter" | "adjustment");
                                            }
                                        }}
                                        placeholder={t("absences.selectAdjustmentMode", "Select mode")}
                                        searchable={false}
                                        maxCount={1}
                                        disabled={isLoading}
                                        className="w-full"
                                    />
                                </FormControl>
                            </FormItem>
                        )}

                        {/* Adjustment Type and Amount - Same Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <FormItem>
                                <FormLabel>{t("absences.type", "Type")}</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={[
                                            { value: "add", label: t("absences.add", "Add") },
                                            { value: "subtract", label: t("absences.subtract", "Subtract") },
                                        ]}
                                        selected={[adjustmentType]}
                                        onSelectedChange={(values) => {
                                            if (values.length > 0) {
                                                setAdjustmentType(values[0] as "add" | "subtract");
                                            }
                                        }}
                                        placeholder={t("absences.selectAdjustmentType", "Select type")}
                                        searchable={false}
                                        maxCount={1}
                                        disabled={!selectedCounter || (remaining !== undefined && value !== undefined && (remaining === -1 || value === -1))}
                                        className="w-full"
                                    />
                                </FormControl>
                            </FormItem>

                            <FormItem>
                                <FormLabel>
                                    {t("absences.amount", "Amount")} *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        placeholder="0"
                                        value={adjustmentValue}
                                        onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
                                        disabled={isLoading || !selectedCounter || (remaining !== undefined && value !== undefined && (remaining === -1 || value === -1))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>

                        {/* Form Description for Amount */}
                        <FormDescription>
                            {selectedCounter && (remaining === -1 || value === -1)
                                ? t("absences.counterIsUnlimited", "This counter has unlimited days/hours and cannot be modified")
                                : selectedCounter && adjustmentValue > 0 && currentAdjustmentMode === "modify_counter" && calculatedNewRemaining !== -1 && calculatedNewTotal !== -1
                                ? `${t("absences.newRemainingWillBe", "New remaining will be")}: ${formatDecimal(calculatedNewRemaining)} ${calculatedNewRemaining === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}. ${t("absences.newTotalWillBe", "New total will be")}: ${formatDecimal(calculatedNewTotal)} ${calculatedNewTotal === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}`
                                : selectedCounter && adjustmentValue > 0 && currentAdjustmentMode === "adjustment" && calculatedNewAdjustment !== -1 && calculatedNewTotalWithAdjustment !== -1
                                ? `${t("absences.newAdjustmentWillBe", "New adjustment will be")}: ${formatDecimal(calculatedNewAdjustment)} ${Math.abs(calculatedNewAdjustment) === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}. ${t("absences.newTotalWillBe", "New total will be")}: ${formatDecimal(calculatedNewTotalWithAdjustment)} ${calculatedNewTotalWithAdjustment === 1 ? (selectedCounter.unit === "days" ? "day" : "hour") : selectedCounter.unit}`
                                : t("absences.selectCounterAndAmount", "Select a counter and enter an amount")}
                        </FormDescription>

                        {/* Notes Field */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("absences.notes", "Notes")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("absences.notesPlaceholder", "Add notes (optional)")}
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isLoading || !selectedCounter || adjustmentValue === 0 || (remaining !== undefined && value !== undefined && (remaining === -1 || value === -1))}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("absences.applying", "Applying...")}
                                    </>
                                ) : (
                                    t("common.apply", "Apply")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CounterAdjustmentModal;
