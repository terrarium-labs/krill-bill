import { useState, useEffect, useMemo, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Calendar, Info, Loader2, Phone, Sparkles } from "lucide-react";
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
import IdBadge from "@/app/components/id-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { TimePicker } from "@/app/components/forms-elements/time-picker";
import { postTimeSlot, patchTimeSlot } from "@/api/orgs/time-policies/time-slots/time-slots";
import { TimePolicyType, TimeSlot } from "@/types/general/time-policies";

function formatTimeForInput(time: string | undefined): string {
    if (!time) return "09:00";
    const trimmed = time.trim();
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
        const parts = trimmed.slice(0, 5).split(":");
        const h = parts[0]?.padStart(2, "0") ?? "09";
        const m = parts[1]?.padStart(2, "0") ?? "00";
        return `${h}:${m}`;
    }
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    }
    return trimmed.slice(0, 5);
}

/** Calendar day from API ISO string (UTC date parts → local midnight for date-only picker). */
function parseDateFromSlot(isoOrDate: string | undefined): Date | null {
    if (!isoOrDate) return null;
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function getCustomTypeDateDefaults(year = new Date().getFullYear()): { from_date: Date; to_date: Date } {
    return {
        from_date: new Date(year, 0, 1),
        to_date: new Date(year, 11, 31),
    };
}

function clampDateToCalendarYear(d: Date, year: number): Date {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    if (d < start) return start;
    if (d > end) return end;
    return d;
}

function formatLocalYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function localCalendarStartMs(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** JS `getDay()` (Sun=0..Sat=6) → app weekday (Mon=1..Sun=7). */
function jsGetDayToAppWeekday(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay;
}

/** Inclusive number of calendar days from local `from` through `to`. */
function inclusiveLocalDayCount(from: Date, to: Date): number {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
    return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Weekdays (Mon=1..Sun=7) that occur in [from, to] inclusive, in first-seen order.
 * If the span is 7+ calendar days, returns Mon..Sun (full week).
 */
function getEligibleAppWeekdaysInSpecialRange(from: Date, to: Date): number[] {
    if (inclusiveLocalDayCount(from, to) >= 7) {
        return [1, 2, 3, 4, 5, 6, 7];
    }
    const seen = new Set<number>();
    const ordered: number[] = [];
    const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (cur.getTime() <= end.getTime()) {
        const w = jsGetDayToAppWeekday(cur.getDay());
        if (!seen.has(w)) {
            seen.add(w);
            ordered.push(w);
        }
        cur.setDate(cur.getDate() + 1);
    }
    return ordered;
}

/** For `special` slots only. `default` / `on_call` omit dates — the server sets them. */
function datesForApi(from: Date, to: Date): { from_date: string; to_date: string } {
    const fromYmd = formatLocalYmd(from);
    const toYmd = formatLocalYmd(to);
    return {
        from_date: `${fromYmd}T00:00:00.000Z`,
        to_date: `${toYmd}T23:59:59.000Z`,
    };
}

interface TimeShiftModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTimeShiftCreatedOrUpdated: () => void;
    orgId: string;
    timePolicyId: string;
    mode: 'create' | 'edit';
    timeSlot?: TimeSlot;
    defaultIsHoliday?: boolean;
    /** Initial slot type when creating (defaults to `"default"`). User can change type in the modal; not a lock. */
    forceSlotType?: TimePolicyType;
    /**
     * `default_only` — add from Default shifts section.
     * `on_call_only` — add from On call section; no validity dates in UI.
     * `special_only` — add from Special section; validity dates required.
     * `on_call_special` — add from page header: choose On call or Special; dates only for Special.
     */
    createSlotTypePreset?: "default_only" | "on_call_only" | "special_only" | "on_call_special" | null;
    renderActions?: ReactNode;
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

interface ShiftFormValues {
    name: string;
    description: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    break_time_duration: number;
    is_holiday: boolean;
    slot_type: TimePolicyType;
    from_date: Date | null;
    to_date: Date | null;
}

const defaultShiftFormValues = (): ShiftFormValues => ({
    name: "",
    description: "",
    days_of_week: [],
    start_time: "09:00",
    end_time: "17:00",
    break_time_duration: 0,
    is_holiday: false,
    slot_type: "default",
    from_date: null,
    to_date: null,
});

const TimePolicyShiftEditModal = ({
    open,
    onOpenChange,
    onTimeShiftCreatedOrUpdated,
    orgId,
    timePolicyId,
    mode,
    timeSlot,
    defaultIsHoliday = false,
    forceSlotType,
    createSlotTypePreset = null,
    renderActions,
}: TimeShiftModalProps) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ShiftFormValues>({
        defaultValues: defaultShiftFormValues(),
    });

    const isEditMode = mode === 'edit';

    const calendarYear = useMemo(() => new Date().getFullYear(), [open]);

    // Reset form when modal opens/closes or timeSlot changes
    useEffect(() => {
        if (open) {
            const y = new Date().getFullYear();
            if (timeSlot) {
                const initialType = timeSlot.type;
                const customDefaults = getCustomTypeDateDefaults(y);
                form.reset({
                    name: timeSlot.name,
                    description: timeSlot.description || "",
                    days_of_week: [timeSlot.day_of_week],
                    start_time: formatTimeForInput(timeSlot.start_time),
                    end_time: formatTimeForInput(timeSlot.end_time),
                    break_time_duration: timeSlot.break_time_duration,
                    is_holiday: timeSlot.is_holiday,
                    slot_type: initialType,
                    from_date:
                        initialType === "special"
                            ? clampDateToCalendarYear(
                                  parseDateFromSlot(timeSlot.from_date) ?? customDefaults.from_date,
                                  y
                              )
                            : null,
                    to_date:
                        initialType === "special"
                            ? clampDateToCalendarYear(
                                  parseDateFromSlot(timeSlot.to_date) ?? customDefaults.to_date,
                                  y
                              )
                            : null,
                });
            } else if (createSlotTypePreset === "default_only") {
                form.reset({
                    ...defaultShiftFormValues(),
                    is_holiday: defaultIsHoliday,
                    slot_type: "default",
                });
            } else if (createSlotTypePreset === "on_call_only") {
                form.reset({
                    ...defaultShiftFormValues(),
                    is_holiday: defaultIsHoliday,
                    slot_type: "on_call",
                });
            } else if (createSlotTypePreset === "special_only") {
                const customDefaults = getCustomTypeDateDefaults(y);
                form.reset({
                    ...defaultShiftFormValues(),
                    is_holiday: defaultIsHoliday,
                    slot_type: "special",
                    from_date: customDefaults.from_date,
                    to_date: customDefaults.to_date,
                });
            } else if (createSlotTypePreset === "on_call_special") {
                form.reset({
                    ...defaultShiftFormValues(),
                    is_holiday: defaultIsHoliday,
                    slot_type: "on_call",
                });
            } else {
                const customDefaults = getCustomTypeDateDefaults(y);
                form.reset({
                    ...defaultShiftFormValues(),
                    is_holiday: defaultIsHoliday,
                    slot_type: forceSlotType ?? "default",
                    from_date:
                        (forceSlotType ?? "default") === "special"
                            ? customDefaults.from_date
                            : null,
                    to_date:
                        (forceSlotType ?? "default") === "special"
                            ? customDefaults.to_date
                            : null,
                });
            }
        }
    }, [open, timeSlot, defaultIsHoliday, forceSlotType, createSlotTypePreset, form]);

    const effectiveSlotType: TimePolicyType = form.watch("slot_type");

    const fromDate = form.watch("from_date");
    const toDate = form.watch("to_date");

    /** For special slots: if validity is fewer than 7 calendar days, only weekdays in that range; otherwise all seven. */
    const weekdaysForToggle = useMemo(() => {
        if (effectiveSlotType !== "special") {
            return DAYS_OF_WEEK;
        }
        if (!fromDate || !toDate) {
            return DAYS_OF_WEEK;
        }
        if (localCalendarStartMs(fromDate) > localCalendarStartMs(toDate)) {
            return DAYS_OF_WEEK;
        }
        const values = getEligibleAppWeekdaysInSpecialRange(fromDate, toDate);
        return values.map((v) => DAYS_OF_WEEK.find((d) => d.value === v)!);
    }, [effectiveSlotType, fromDate, toDate]);

    useEffect(() => {
        if (!open || isEditMode || effectiveSlotType !== "special") return;
        const allowed = new Set(weekdaysForToggle.map((d) => d.value));
        const current = form.getValues("days_of_week");
        const filtered = current.filter((d) => allowed.has(d));
        if (
            filtered.length === current.length &&
            filtered.every((d) => current.includes(d))
        ) {
            return;
        }
        form.setValue("days_of_week", filtered, { shouldDirty: true });
    }, [open, isEditMode, effectiveSlotType, weekdaysForToggle, form]);

    const setSlotType = (next: TimePolicyType) => {
        if (next === "default" || next === "on_call") {
            form.setValue("slot_type", next);
            form.setValue("from_date", null);
            form.setValue("to_date", null);
            return;
        }
        if (next === "special") {
            const d = getCustomTypeDateDefaults(calendarYear);
            const prev = form.getValues();
            form.setValue("slot_type", "special");
            form.setValue("from_date", prev.from_date ?? d.from_date);
            form.setValue("to_date", prev.to_date ?? d.to_date);
        }
    };

    const onSubmit = async (values: ShiftFormValues) => {
        // Validation
        if (!values.name.trim()) {
            toast.error(t("timePolicies.shifts.validation.nameRequired", "Shift name is required"));
            return;
        }

        if (values.days_of_week.length === 0) {
            toast.error(t("timePolicies.shifts.validation.dayRequired", "Select at least one day"));
            return;
        }

        if (!values.start_time || !values.end_time) {
            toast.error(t("timePolicies.shifts.validation.timesRequired", "Start and end times are required"));
            return;
        }

        const slotTypeForApi = values.slot_type;

        if (slotTypeForApi === "special") {
            if (!values.from_date || !values.to_date) {
                toast.error(
                    t("timePolicies.shifts.validation.dateRangeRequired", "Valid from and to dates are required")
                );
                return;
            }
            if (localCalendarStartMs(values.from_date) > localCalendarStartMs(values.to_date)) {
                toast.error(
                    t(
                        "timePolicies.shifts.validation.dateRangeOrder",
                        "End date must be on or after start date"
                    )
                );
                return;
            }
        }

        // Validate that end time is after start time
        if (values.start_time >= values.end_time) {
            toast.error(t("timePolicies.shifts.validation.endTimeAfterStart", "End time must be after start time"));
            return;
        }

        setIsLoading(true);

        const datePayload =
            slotTypeForApi === "special"
                ? datesForApi(values.from_date!, values.to_date!)
                : {};

        try {
            if (isEditMode && timeSlot) {
                // Edit mode: update the existing time slot
                const payload = {
                    name: values.name.trim(),
                    description: values.description.trim() || null,
                    day_of_week: values.days_of_week[0], // Use first selected day in edit mode
                    start_time: values.start_time,
                    end_time: values.end_time,
                    break_time_duration: values.break_time_duration,
                    is_holiday: values.is_holiday,
                    type: slotTypeForApi,
                    ...datePayload,
                };

                const response = await patchTimeSlot(orgId, timePolicyId, timeSlot.id, payload);

                if (response.success) {
                    toast.success(t("timePolicies.shifts.updateSuccess", "Shift updated successfully"));
                    onTimeShiftCreatedOrUpdated();
                    onOpenChange(false);
                } else {
                    toast.error(
                        response.error || t("timePolicies.shifts.updateError", "Failed to update shift")
                    );
                }
            } else {
                // Create mode: create a time slot for each selected day
                let successCount = 0;
                let errorCount = 0;

                for (const dayOfWeek of values.days_of_week) {
                    const payload = {
                        name: values.name.trim(),
                        description: values.description.trim() || null,
                        day_of_week: dayOfWeek,
                        start_time: values.start_time,
                        end_time: values.end_time,
                        break_time_duration: values.break_time_duration,
                        is_holiday: values.is_holiday,
                        type: slotTypeForApi,
                        ...datePayload,
                    };

                    const response = await postTimeSlot(orgId, timePolicyId, payload);

                    if (response.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    const message = values.days_of_week.length > 1
                        ? `${successCount} shifts created successfully`
                        : "Shift created successfully";
                    toast.success(t("timePolicies.shifts.createSuccess", message));
                    onTimeShiftCreatedOrUpdated();
                    onOpenChange(false);
                }

                if (errorCount > 0) {
                    toast.error(
                        t("timePolicies.shifts.createError", `Failed to create ${errorCount} shift(s)`)
                    );
                }
            }
        } catch (error) {
            console.error("Error saving shift:", error);
            toast.error(
                isEditMode
                    ? t("timePolicies.shifts.updateError", "Failed to update shift")
                    : t("timePolicies.shifts.createError", "Failed to create shift")
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? (
                            <div className="flex items-center justify-between w-full">
                                <span className="flex-shrink-0">
                                    {t("timePolicies.shifts.edit", "Edit Shift")}
                                </span>
                                <div className="flex items-center gap-2 ml-auto">
                                    {timeSlot && <IdBadge id={timeSlot.id} />}
                                    {renderActions}
                                </div>
                            </div>
                        ) : (
                            t("timePolicies.shifts.add", "Add Shift")
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("timePolicies.shifts.name", "Name")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("timePolicies.shifts.namePlaceholder", "e.g., Morning Shift")}
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
                                    <FormLabel>{t("timePolicies.shifts.description", "Description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                "timePolicies.shifts.descriptionPlaceholder",
                                                "Enter shift description"
                                            )}
                                            disabled={isLoading}
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    {/* Slot type — create only; hidden when fixed by section / header preset */}
                    {!isEditMode &&
                        createSlotTypePreset !== "default_only" &&
                        createSlotTypePreset !== "on_call_only" &&
                        createSlotTypePreset !== "special_only" && (
                        <div className="space-y-3">
                            <Label>{t("timePolicies.shifts.slotType", "Slot type")}</Label>
                            <div
                                className={
                                    createSlotTypePreset === "on_call_special"
                                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                                        : "grid grid-cols-1 gap-3 sm:grid-cols-3"
                                }
                            >
                                {createSlotTypePreset !== "on_call_special" && (
                                    <Button
                                        type="button"
                                        variant={effectiveSlotType === "default" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => setSlotType("default")}
                                        disabled={isLoading}
                                    >
                                        <Calendar className="h-4 w-4 mr-2 shrink-0" />
                                        {t("timePolicies.shifts.slotTypeDefault", "Default")}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant={effectiveSlotType === "on_call" ? "default" : "outline"}
                                    className="flex-1"
                                    onClick={() => setSlotType("on_call")}
                                    disabled={isLoading}
                                >
                                    <Phone className="h-4 w-4 mr-2 shrink-0" />
                                    {t("timePolicies.shifts.slotTypeOnCall", "On call")}
                                </Button>
                                <Button
                                    type="button"
                                    variant={effectiveSlotType === "special" ? "default" : "outline"}
                                    className="flex-1"
                                    onClick={() => setSlotType("special")}
                                    disabled={isLoading}
                                >
                                    <Sparkles className="h-4 w-4 mr-2 shrink-0" />
                                    {t("timePolicies.shifts.slotTypeSpecial", "Special")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {((effectiveSlotType === "special" &&
                        !isEditMode &&
                        createSlotTypePreset !== "default_only" &&
                        createSlotTypePreset !== "on_call_only") ||
                        (isEditMode && timeSlot && effectiveSlotType === "special")) && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DateTimePicker
                                form={form}
                                name="from_date"
                                label={t("timePolicies.shifts.fromDate", "Valid from")}
                                required
                                placeholder={t(
                                    "timePolicies.shifts.validFromPlaceholder",
                                    "Select start date"
                                )}
                                disabled={isLoading}
                                showTime={false}
                                showMonthYearPicker={false}
                            />
                            <DateTimePicker
                                form={form}
                                name="to_date"
                                label={t("timePolicies.shifts.toDate", "Valid to")}
                                required
                                placeholder={t(
                                    "timePolicies.shifts.validToPlaceholder",
                                    "Select end date"
                                )}
                                disabled={isLoading}
                                showTime={false}
                                showMonthYearPicker={false}
                            />
                        </div>
                    )}

                    {isEditMode && timeSlot && (
                        <p className="text-sm text-muted-foreground">
                            {t("timePolicies.shifts.rewardCountReadonly", "Reward count")}:{" "}
                            <span className="font-medium text-foreground">{timeSlot.reward_count}</span>
                        </p>
                    )}

                        <FormField
                            control={form.control}
                            name="days_of_week"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("timePolicies.shifts.dayOfWeek", "Days of Week")} *</FormLabel>
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
                                            {weekdaysForToggle.map((day) => (
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
                                        {t(
                                            "admin.timePolicies.shifts.daysOfWeekFieldDescription",
                                            "Which weekdays use this shift. In create mode you can select multiple to add one slot per day.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                    {isEditMode && (
                                        <p className="text-xs text-muted-foreground">
                                            {t("timePolicies.shifts.editDayNote", "Day cannot be changed in edit mode")}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="break_time_duration"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-1.5">
                                        <FormLabel>{t("timePolicies.shifts.breakTime", "Break Time (min)")}</FormLabel>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="inline-flex cursor-help text-muted-foreground hover:text-foreground">
                                                        <Info className="h-3.5 w-3.5" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-64">
                                                    <p className="text-xs">
                                                        {t(
                                                            "timePolicies.shifts.breakTimeTooltip",
                                                            "Duration of the break period in minutes that is deducted from total working hours."
                                                        )}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            disabled={isLoading}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(parseInt(e.target.value, 10) || 0)
                                            }
                                            value={field.value}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.timePolicies.shifts.breakTimeFieldDescription",
                                            "Minutes of break subtracted from worked time for this shift.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <TimePicker
                                form={form}
                                name="start_time"
                                label={t("timePolicies.shifts.startTime", "Start Time")}
                                required
                                disabled={isLoading}
                                placeholder={t(
                                    "timePolicies.shifts.startTimePlaceholder",
                                    "HH:mm"
                                )}
                                format24h={true}
                                minuteStep={5}
                            />

                            <TimePicker
                                form={form}
                                name="end_time"
                                label={t("timePolicies.shifts.endTime", "End Time")}
                                required
                                disabled={isLoading}
                                placeholder={t(
                                    "timePolicies.shifts.endTimePlaceholder",
                                    "HH:mm"
                                )}
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
                                        <FormLabel className="text-base">
                                            {t("timePolicies.shifts.isHoliday", "Holiday")}
                                        </FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormDescription className="text-xs text-muted-foreground pl-2">
                                        {t(
                                            "timePolicies.shifts.isHolidayDescription",
                                            "Mark this shift as a holiday shift"
                                        )}
                                    </FormDescription>
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

export default TimePolicyShiftEditModal;

