import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TimeFrame, HourlyRateJobTitle } from "@/types/general/hourly-rates";
import { patchOrgHourlyRateJobTitle } from "@/api/orgs/hourly-rates/hourly-rates";

interface HourlyRateTimeframeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTimeframeChanged?: () => void;
    orgId: string;
    hourlyRateId: string;
    rateJobTitle: HourlyRateJobTitle;
    timeframe?: TimeFrame; // If provided, edit mode; otherwise, create mode
    initialIsHoliday?: boolean; // Initial value for holiday toggle in create mode
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

const formSchema = z.object({
    days_of_week: z.array(z.number().min(1).max(7)).min(1, "Select at least one day"),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    price: z.number().min(0, "Price must be positive"),
    min_quantity: z.number().min(0, "Minimum quantity must be positive"),
    step_quantity: z.number().min(0, "Step quantity must be positive"),
    is_holiday: z.boolean(),
}).refine((data) => {
    // Validate that end_time is after start_time
    const [startHours, startMinutes] = data.start_time.split(":").map(Number);
    const [endHours, endMinutes] = data.end_time.split(":").map(Number);
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    return endMinutesTotal > startMinutesTotal;
}, {
    message: "End time must be after start time",
    path: ["end_time"],
});

type FormValues = z.infer<typeof formSchema>;

const HourlyRateTimeframeEditModal: React.FC<HourlyRateTimeframeEditModalProps> = ({
    open,
    onOpenChange,
    onTimeframeChanged,
    orgId,
    hourlyRateId,
    rateJobTitle,
    timeframe,
    initialIsHoliday = false,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!timeframe;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            days_of_week: [],
            start_time: "09:00",
            end_time: "17:00",
            price: rateJobTitle.default_pvp,
            min_quantity: rateJobTitle.min_quantity,
            step_quantity: rateJobTitle.step_quantity,
            is_holiday: false,
        },
    });

    // Update form when timeframe prop changes (edit mode)
    useEffect(() => {
        if (timeframe) {
            form.reset({
                days_of_week: [timeframe.day_of_week],
                start_time: timeframe.start_time.substring(0, 5), // Get HH:MM
                end_time: timeframe.end_time.substring(0, 5),
                price: timeframe.price,
                min_quantity: timeframe.min_quantity,
                step_quantity: timeframe.step_quantity,
                is_holiday: timeframe.is_holiday || false,
            });
        } else {
            form.reset({
                days_of_week: [],
                start_time: "09:00",
                end_time: "17:00",
                price: rateJobTitle.default_pvp,
                min_quantity: rateJobTitle.min_quantity,
                step_quantity: rateJobTitle.step_quantity,
                is_holiday: initialIsHoliday,
            });
        }
    }, [timeframe, form, rateJobTitle, initialIsHoliday]);

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            let updatedTimeframes = [...rateJobTitle.time_frames];

            if (isEditMode && timeframe) {
                // Edit mode: update the existing timeframe
                const newTimeframe: TimeFrame = {
                    day_of_week: values.days_of_week[0], // Use first selected day in edit mode
                    start_time: `${values.start_time}:00`, // Add seconds
                    end_time: `${values.end_time}:00`,
                    price: values.price,
                    min_quantity: values.min_quantity,
                    step_quantity: values.step_quantity,
                    is_holiday: values.is_holiday,
                };

                // Find and replace the existing timeframe
                const index = updatedTimeframes.findIndex(
                    tf =>
                        tf.day_of_week === timeframe.day_of_week &&
                        tf.start_time === timeframe.start_time &&
                        tf.end_time === timeframe.end_time &&
                        tf.price === timeframe.price
                );
                if (index !== -1) {
                    updatedTimeframes[index] = newTimeframe;
                }
            } else {
                // Create mode: add a new timeframe for each selected day
                const newTimeframes: TimeFrame[] = values.days_of_week.map(dayOfWeek => ({
                    day_of_week: dayOfWeek,
                    start_time: `${values.start_time}:00`, // Add seconds
                    end_time: `${values.end_time}:00`,
                    price: values.price,
                    min_quantity: values.min_quantity,
                    step_quantity: values.step_quantity,
                    is_holiday: values.is_holiday,
                }));

                updatedTimeframes.push(...newTimeframes);
            }

            const response = await patchOrgHourlyRateJobTitle(
                orgId,
                hourlyRateId,
                rateJobTitle.job_title.id,
                {
                    ...rateJobTitle,
                    time_frames: updatedTimeframes,
                }
            );

            if (response.success) {
                const message = isEditMode
                    ? "Timeframe updated successfully"
                    : values.days_of_week.length > 1
                        ? `${values.days_of_week.length} timeframes created successfully`
                        : "Timeframe created successfully";

                toast.success(
                    t(
                        isEditMode
                            ? "hourlyRates.timeframe.updated"
                            : "hourlyRates.timeframe.created",
                        message
                    )
                );
                form.reset();
                onOpenChange(false);
                onTimeframeChanged?.();
            } else {
                toast.error(
                    t(
                        "hourlyRates.timeframe.error",
                        "Error saving timeframe"
                    )
                );
            }
        } catch (error) {
            console.error("Error saving timeframe:", error);
            toast.error(
                t(
                    "hourlyRates.timeframe.error",
                    "Error saving timeframe"
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    handleCancel();
                }
                onOpenChange(open);
            }}
        >
            <DialogContent className="max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode
                            ? t("hourlyRates.timeframe.editTitle", "Edit Timeframe")
                            : t("hourlyRates.timeframe.createTitle", "Create Timeframe")}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {rateJobTitle.job_title.name}
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            {/* Days of Week */}
                            <FormField
                                control={form.control}
                                name="days_of_week"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("hourlyRates.timeframe.dayOfWeek", "Days of Week")} *
                                        </FormLabel>
                                        <FormControl>
                                            <ToggleGroup
                                                type="multiple"
                                                value={field.value?.map(String) || []}
                                                onValueChange={(value) => {
                                                    const numericValues = value.map(Number);
                                                    field.onChange(numericValues);
                                                }}
                                                disabled={isLoading || isEditMode}
                                            >
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <ToggleGroupItem
                                                        key={day.value}
                                                        value={day.value.toString()}
                                                        aria-label={day.label}
                                                        variant="outline"
                                                    >
                                                        {t(`common.days.${day.label.toLowerCase()}`, day.label).substring(0, 3)}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormMessage />
                                        {isEditMode && (
                                            <p className="text-xs text-muted-foreground">
                                                {t("hourlyRates.timeframe.editDayNote", "Day cannot be changed in edit mode")}
                                            </p>
                                        )}
                                    </FormItem>
                                )}
                            />

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.timeframe.startTime", "Start Time")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    placeholder="09:00"
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
                                    name="end_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.timeframe.endTime", "End Time")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    placeholder="17:00"
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Price */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("hourlyRates.timeframe.price", "Price")} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t(
                                                    "hourlyRates.timeframe.pricePlaceholder",
                                                    "Enter price..."
                                                )}
                                                disabled={isLoading}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {/* Min Quantity */}
                                <FormField
                                    control={form.control}
                                    name="min_quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.timeframe.minQuantity", "Min Quantity (min)")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    placeholder={t(
                                                        "hourlyRates.timeframe.minQuantityPlaceholder",
                                                        "Enter min quantity..."
                                                    )}
                                                    disabled={isLoading}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Step Quantity */}
                                <FormField
                                    control={form.control}
                                    name="step_quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.timeframe.stepQuantity", "Step Quantity (min)")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    placeholder={t(
                                                        "hourlyRates.timeframe.stepQuantityPlaceholder",
                                                        "Enter step quantity..."
                                                    )}
                                                    disabled={isLoading}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Holiday Toggle */}
                            <FormField
                                control={form.control}
                                name="is_holiday"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                {t("hourlyRates.timeframe.isHoliday", "Holiday")}
                                            </FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                {t("hourlyRates.timeframe.isHolidayDescription", "Mark this timeframe as a holiday rate")}
                                            </p>
                                        </div>
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : isEditMode ? (
                                    t("common.update", "Update")
                                ) : (
                                    t("common.create", "Create")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default HourlyRateTimeframeEditModal;

