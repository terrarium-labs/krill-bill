import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TimePicker } from "@/app/components/forms-elements/time-picker";
import { postOvertimeRule, patchOvertimeRule } from "@/api/orgs/time-policies/overtime-rules/overtime-rules";
import { OvertimeRule } from "@/types/general/time-policies";

interface TimePolicyOvertimeRuleEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOvertimeRuleSaved: () => void;
    orgId: string;
    timePolicyId: string;
    overtimeRule?: OvertimeRule;
    defaultIsHoliday?: boolean;
    defaultMultiplier?: number;
}

const DAYS_OF_WEEK = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" },
];

interface OvertimeRuleFormValues {
    name: string;
    description: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    multiplier: number;
    max_hours: number;
    is_holiday: boolean;
}

const defaultOvertimeRuleFormValues = (
    defaultMultiplier: number,
    defaultIsHoliday: boolean
): OvertimeRuleFormValues => ({
    name: "",
    description: "",
    days_of_week: [],
    start_time: "17:00",
    end_time: "23:00",
    multiplier: defaultMultiplier,
    max_hours: 4,
    is_holiday: defaultIsHoliday,
});

const TimePolicyOvertimeRuleEditModal = ({
    open,
    onOpenChange,
    onOvertimeRuleSaved,
    orgId,
    timePolicyId,
    overtimeRule,
    defaultIsHoliday = false,
    defaultMultiplier = 1.5,
}: TimePolicyOvertimeRuleEditModalProps) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!overtimeRule;

    const form = useForm<OvertimeRuleFormValues>({
        defaultValues: defaultOvertimeRuleFormValues(defaultMultiplier, defaultIsHoliday),
    });

    // Reset form when modal opens/closes or overtimeRule changes
    useEffect(() => {
        if (open) {
            if (overtimeRule) {
                form.reset({
                    name: overtimeRule.name,
                    description: overtimeRule.description || "",
                    days_of_week: [overtimeRule.day_of_week],
                    start_time: overtimeRule.start_time.substring(0, 5),
                    end_time: overtimeRule.end_time.substring(0, 5),
                    multiplier: overtimeRule.multiplier,
                    max_hours: overtimeRule.max_hours,
                    is_holiday: overtimeRule.is_holiday,
                });
            } else {
                form.reset(defaultOvertimeRuleFormValues(defaultMultiplier, defaultIsHoliday));
            }
        }
    }, [open, overtimeRule, defaultIsHoliday, defaultMultiplier, form]);

    const onSubmit = async (values: OvertimeRuleFormValues) => {
        // Validation
        if (!values.name.trim()) {
            toast.error(t("timePolicies.overtimeRules.validation.nameRequired", "Overtime rule name is required"));
            return;
        }

        if (values.days_of_week.length === 0) {
            toast.error(t("timePolicies.overtimeRules.validation.dayRequired", "Select at least one day"));
            return;
        }

        if (!values.start_time || !values.end_time) {
            toast.error(t("timePolicies.overtimeRules.validation.timesRequired", "Start and end times are required"));
            return;
        }

        // Validate that end time is after start time
        if (values.start_time >= values.end_time) {
            toast.error(t("timePolicies.overtimeRules.validation.endTimeAfterStart", "End time must be after start time"));
            return;
        }

        if (values.multiplier <= 0) {
            toast.error(t("timePolicies.overtimeRules.validation.multiplierPositive", "Multiplier must be greater than 0"));
            return;
        }

        if (values.max_hours <= 0) {
            toast.error(t("timePolicies.overtimeRules.validation.maxHoursPositive", "Max hours must be greater than 0"));
            return;
        }

        setIsLoading(true);

        try {
            if (isEditMode && overtimeRule) {
                // Edit mode: update the existing overtime rule
                const payload = {
                    name: values.name.trim(),
                    description: values.description.trim() || null,
                    day_of_week: values.days_of_week[0], // Use first selected day in edit mode
                    start_time: values.start_time,
                    end_time: values.end_time,
                    multiplier: values.multiplier,
                    max_hours: values.max_hours,
                    is_holiday: values.is_holiday,
                };

                const response = await patchOvertimeRule(orgId, timePolicyId, overtimeRule.id, payload);

                if (response.success) {
                    toast.success(t("timePolicies.overtimeRules.updateSuccess", "Overtime rule updated successfully"));
                    onOvertimeRuleSaved();
                    onOpenChange(false);
                } else {
                    toast.error(
                        response.error || t("timePolicies.overtimeRules.updateError", "Failed to update overtime rule")
                    );
                }
            } else {
                // Create mode: create an overtime rule for each selected day
                let successCount = 0;
                let errorCount = 0;

                for (const dayOfWeek of values.days_of_week) {
                    const payload = {
                        name: values.name.trim(),
                        description: values.description.trim() || null,
                        day_of_week: dayOfWeek,
                        start_time: values.start_time,
                        end_time: values.end_time,
                        multiplier: values.multiplier,
                        max_hours: values.max_hours,
                        is_holiday: values.is_holiday,
                    };

                    const response = await postOvertimeRule(orgId, timePolicyId, payload);

                    if (response.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    const message = values.days_of_week.length > 1
                        ? `${successCount} overtime rules created successfully`
                        : "Overtime rule created successfully";
                    toast.success(t("timePolicies.overtimeRules.createSuccess", message));
                    onOvertimeRuleSaved();
                    onOpenChange(false);
                }

                if (errorCount > 0) {
                    toast.error(
                        t("timePolicies.overtimeRules.createError", `Failed to create ${errorCount} overtime rule(s)`)
                    );
                }
            }
        } catch (error) {
            console.error("Error saving overtime rule:", error);
            toast.error(
                isEditMode
                    ? t("timePolicies.overtimeRules.updateError", "Failed to update overtime rule")
                    : t("timePolicies.overtimeRules.createError", "Failed to create overtime rule")
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode
                            ? t("timePolicies.overtimeRules.edit", "Edit Overtime Rule")
                            : t("timePolicies.overtimeRules.add", "Add Overtime Rule")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("timePolicies.overtimeRules.name", "Name")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("timePolicies.overtimeRules.namePlaceholder", "e.g., Evening Overtime")}
                                            disabled={isLoading}
                                            {...field}
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
                                <FormItem>
                                    <FormLabel>{t("timePolicies.overtimeRules.description", "Description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("timePolicies.overtimeRules.descriptionPlaceholder", "Enter overtime rule description")}
                                            disabled={isLoading}
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="days_of_week"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("timePolicies.overtimeRules.dayOfWeek", "Days of Week")} *</FormLabel>
                                    <FormControl>
                                        <ToggleGroup
                                            type="multiple"
                                            value={field.value.map(String)}
                                            onValueChange={(value) => {
                                                field.onChange(value.map(Number));
                                            }}
                                            disabled={isLoading || isEditMode}
                                            className="justify-start"
                                        >
                                            {DAYS_OF_WEEK.map((day) => (
                                                <ToggleGroupItem
                                                    key={day.value}
                                                    value={day.value.toString()}
                                                    aria-label={day.label}
                                                    variant="outline"
                                                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                                >
                                                    {t(`common.days.${day.label.toLowerCase()}`, day.label).substring(0, 3)}
                                                </ToggleGroupItem>
                                            ))}
                                        </ToggleGroup>
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {isEditMode && t("timePolicies.overtimeRules.editDayNote", "Day cannot be changed in edit mode")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="multiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("timePolicies.overtimeRules.multiplier", "Multiplier")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0.1"
                                                step="0.01"
                                                disabled={isLoading}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                                value={field.value}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="max_hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("timePolicies.overtimeRules.maxHours", "Max Hours")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                disabled={isLoading}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                                value={field.value}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TimePicker
                                form={form}
                                name="start_time"
                                label={t("timePolicies.overtimeRules.startTime", "Start Time")}
                                required
                                disabled={isLoading}
                                placeholder={t("timePolicies.overtimeRules.startTimePlaceholder", "HH:mm")}
                                format24h={true}
                                minuteStep={5}
                            />

                            <TimePicker
                                form={form}
                                name="end_time"
                                label={t("timePolicies.overtimeRules.endTime", "End Time")}
                                required
                                disabled={isLoading}
                                placeholder={t("timePolicies.overtimeRules.endTimePlaceholder", "HH:mm")}
                                format24h={true}
                                minuteStep={5}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_holiday"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                {t("timePolicies.overtimeRules.isHoliday", "Holiday")}
                                            </FormLabel>
                                            <FormDescription className="text-sm">
                                                {t("timePolicies.overtimeRules.isHolidayDescription", "Mark this overtime rule as a holiday rule")}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {isEditMode
                                            ? t("common.updating", "Updating...")
                                            : t("common.creating", "Creating...")}
                                    </>
                                ) : isEditMode ? (
                                    t("common.update", "Update")
                                ) : (
                                    t("common.create", "Create")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TimePolicyOvertimeRuleEditModal;

