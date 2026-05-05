"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerPropsBase {
    label?: string;
    labelClassName?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    description?: string;
    /** Merged into `FormDescription` (e.g. `text-xs`). */
    descriptionClassName?: string;
    format24h?: boolean;
    minuteStep?: number;
    showTime?: boolean;
    showMonthYearPicker?: boolean;
    /** When provided, shows a subtle clear button next to the label when the field has a value */
    onClear?: () => void;
}

/** Form mode: use with react-hook-form */
interface DateTimePickerPropsForm extends DateTimePickerPropsBase {
    form: UseFormReturn<any>;
    name: string;
    value?: never;
    onChange?: never;
}

/** Controlled mode: use value + onChange without form */
interface DateTimePickerPropsControlled extends DateTimePickerPropsBase {
    form?: never;
    name?: never;
    value: Date | null | undefined;
    onChange: (date: Date | null) => void;
}

type DateTimePickerProps = DateTimePickerPropsForm | DateTimePickerPropsControlled;

function isControlled(props: DateTimePickerProps): props is DateTimePickerPropsControlled {
    return "value" in props && props.onChange !== undefined;
}

export const DateTimePicker = (props: DateTimePickerProps) => {
    const {
        label,
        labelClassName,
        required = false,
        placeholder,
        disabled = false,
        className,
        description,
        descriptionClassName,
        format24h = true,
        minuteStep = 5,
        showTime = true,
        showMonthYearPicker = false,
        onClear,
    } = props;

    const controlled = isControlled(props);
    const form = !controlled ? props.form : undefined;
    const name = !controlled ? props.name : undefined;

    const { i18n, t } = useTranslation();

    /** Keeps the calendar on the month of the selected value (avoids defaulting to "today" when editing). */
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => new Date());

    const watchedFieldValue =
        !controlled && form && name != null ? form.watch(name) : undefined;
    const effectiveValueForCalendar =
        controlled && props.value instanceof Date
            ? props.value
            : watchedFieldValue instanceof Date
              ? watchedFieldValue
              : undefined;

    React.useEffect(() => {
        if (effectiveValueForCalendar instanceof Date) {
            setCalendarMonth(effectiveValueForCalendar);
        }
    }, [effectiveValueForCalendar]);

    const formatDateValue = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        };
        if (showTime) {
            options.hour = "numeric";
            options.minute = "2-digit";
        }
        return Intl.DateTimeFormat(i18n.language, options).format(date);
    };

    const placeholderText = placeholder || (showTime
        ? (format24h ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY hh:mm AM/PM")
        : "DD/MM/YYYY");

    const getValue = (): Date | undefined => {
        if (controlled) return props.value instanceof Date ? props.value : undefined;
        if (form && name != null) {
            const v = form.getValues(name);
            return v instanceof Date ? v : undefined;
        }
        return undefined;
    };

    const setValue = (newDate: Date | null) => {
        if (controlled && props.onChange) {
            props.onChange(newDate);
        } else if (form && name != null) {
            form.setValue(name, newDate, { shouldDirty: true });
        }
    };

    function handleDateSelect(date: Date | undefined) {
        if (date) {
            const currentValue = getValue();
            if (currentValue instanceof Date && showTime) {
                const newDate = new Date(date);
                newDate.setHours(currentValue.getHours());
                newDate.setMinutes(currentValue.getMinutes());
                setValue(newDate);
            } else {
                const newDate = new Date(date);
                if (!showTime) {
                    newDate.setHours(0, 0, 0, 0);
                }
                setValue(newDate);
            }
        }
    }

    function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
        const currentValue = getValue();
        const currentDate = (currentValue instanceof Date) ? currentValue : new Date();
        let newDate = new Date(currentDate);

        if (type === "hour") {
            let hour = parseInt(value, 10);
            if (!format24h) {
                const currentHour = newDate.getHours();
                const isPM = currentHour >= 12;
                if (hour === 12) {
                    hour = isPM ? 12 : 0;
                } else {
                    hour = isPM ? hour + 12 : hour;
                }
            }
            newDate.setHours(hour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
        } else if (type === "ampm") {
            const currentHour = newDate.getHours();
            if (value === "AM" && currentHour >= 12) {
                newDate.setHours(currentHour - 12);
            } else if (value === "PM" && currentHour < 12) {
                newDate.setHours(currentHour + 12);
            }
        }

        setValue(newDate);
    }

    const getDisplayHour = (hour: number) => {
        if (format24h) return hour;
        if (hour === 0) return 12;
        if (hour > 12) return hour - 12;
        return hour;
    };

    const getHourOptions = () => {
        if (format24h) {
            return Array.from({ length: 24 }, (_, i) => i);
        } else {
            return Array.from({ length: 12 }, (_, i) => i + 1);
        }
    };

    const getMinuteOptions = () => {
        return Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);
    };

    const renderPickerContent = (currentValue: Date | undefined) => (
        <>
            <Popover
                modal={true}
                onOpenChange={(isOpen) => {
                    if (isOpen) {
                        const v = getValue();
                        if (v instanceof Date) {
                            setCalendarMonth(v);
                        }
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !currentValue && "text-muted-foreground",
                            className,
                            "shadow-none"
                        )}
                        disabled={disabled}
                        type="button"
                    >
                        {currentValue ? (
                            formatDateValue(currentValue)
                        ) : (
                            <span>{placeholderText}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="sm:flex">
                        <Calendar
                            mode="single"
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            selected={currentValue}
                            onSelect={handleDateSelect}
                            initialFocus
                            disabled={disabled}
                            captionLayout={showMonthYearPicker ? "dropdown" : undefined}
                        />
                        {showTime && (
                            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                <ScrollArea className="w-64 sm:w-auto">
                                    <div className="flex sm:flex-col p-2">
                                        {getHourOptions()
                                            .reverse()
                                            .map((hour) => {
                                                const displayHour = format24h ? hour : hour;
                                                const isSelected = currentValue &&
                                                    (format24h
                                                        ? currentValue.getHours() === hour
                                                        : getDisplayHour(currentValue.getHours()) === hour);

                                                return (
                                                    <Button
                                                        key={hour}
                                                        size="icon"
                                                        variant={isSelected ? "default" : "ghost"}
                                                        className="sm:w-full shrink-0 aspect-square"
                                                        onClick={() =>
                                                            handleTimeChange("hour", hour.toString())
                                                        }
                                                        type="button"
                                                    >
                                                        {displayHour}
                                                    </Button>
                                                );
                                            })}
                                    </div>
                                    <ScrollBar
                                        orientation="horizontal"
                                        className="sm:hidden"
                                    />
                                </ScrollArea>

                                <ScrollArea className="w-64 sm:w-auto">
                                    <div className="flex sm:flex-col p-2">
                                        {getMinuteOptions().map((minute) => (
                                            <Button
                                                key={minute}
                                                size="icon"
                                                variant={
                                                    currentValue && currentValue.getMinutes() === minute
                                                        ? "default"
                                                        : "ghost"
                                                }
                                                className="sm:w-full shrink-0 aspect-square"
                                                onClick={() =>
                                                    handleTimeChange("minute", minute.toString())
                                                }
                                                type="button"
                                            >
                                                {minute.toString().padStart(2, "0")}
                                            </Button>
                                        ))}
                                    </div>
                                    <ScrollBar
                                        orientation="horizontal"
                                        className="sm:hidden"
                                    />
                                </ScrollArea>

                                {!format24h && (
                                    <ScrollArea className="w-64 sm:w-auto">
                                        <div className="flex sm:flex-col p-2">
                                            {["AM", "PM"].map((period) => (
                                                <Button
                                                    key={period}
                                                    size="icon"
                                                    variant={
                                                        currentValue &&
                                                            ((period === "AM" && currentValue.getHours() < 12) ||
                                                                (period === "PM" && currentValue.getHours() >= 12))
                                                            ? "default"
                                                            : "ghost"
                                                    }
                                                    className="sm:w-full shrink-0 aspect-square"
                                                    onClick={() =>
                                                        handleTimeChange("ampm", period)
                                                    }
                                                    type="button"
                                                >
                                                    {period}
                                                </Button>
                                            ))}
                                        </div>
                                        <ScrollBar
                                            orientation="horizontal"
                                            className="sm:hidden"
                                        />
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );

    if (controlled) {
        const currentValue = props.value instanceof Date ? props.value : undefined;
        return (
            <div className="flex flex-col">
                {label != null && label !== "" && (
                    <FormLabel className={cn(labelClassName)}>
                        {label} {required ? "*" : ""}
                    </FormLabel>
                )}
                {renderPickerContent(currentValue)}
                {description && (
                    <FormDescription className={cn(descriptionClassName)}>
                        {description}
                    </FormDescription>
                )}
            </div>
        );
    }

    return (
        <FormField
            control={form!.control}
            name={name!}
            render={({ field }) => {
                const currentValue = field.value instanceof Date ? field.value : undefined;
                const hasValue = field.value != null && field.value !== "";
                return (
                    <FormItem className="flex flex-col">
                        {label != null && label !== "" && (
                            <FormLabel className={cn("inline-flex items-center gap-1.5", labelClassName)}>
                                {label} {required ? "*" : ""}
                                {onClear && hasValue && (
                                    <button
                                        type="button"
                                        className="inline-flex p-0 leading-none text-muted-foreground/70 hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-0"
                                        onClick={onClear}
                                        disabled={disabled}
                                        title={t("common.clear", "Clear")}
                                    >
                                        <Trash2 className="h-3 w-3 shrink-0" />
                                    </button>
                                )}
                            </FormLabel>
                        )}
                        {renderPickerContent(currentValue)}
                        {description && (
                            <FormDescription className={cn(descriptionClassName)}>
                                {description}
                            </FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
};
