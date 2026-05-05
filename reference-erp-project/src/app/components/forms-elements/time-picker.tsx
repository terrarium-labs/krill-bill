"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { UseFormReturn } from "react-hook-form";

interface TimePickerPropsBase {
    label?: string;
    labelClassName?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    description?: string;
    descriptionClassName?: string;
    format24h?: boolean;
    minuteStep?: number;
}

/** Form mode: use with react-hook-form */
interface TimePickerPropsForm extends TimePickerPropsBase {
    form: UseFormReturn<any>;
    name: string;
    value?: never;
    onChange?: never;
}

/** Controlled mode: use value + onChange without form */
interface TimePickerPropsControlled extends TimePickerPropsBase {
    form?: never;
    name?: never;
    value: string | null | undefined;
    onChange: (time: string | null) => void;
}

type TimePickerProps = TimePickerPropsForm | TimePickerPropsControlled;

function isControlled(props: TimePickerProps): props is TimePickerPropsControlled {
    return "value" in props && props.onChange !== undefined;
}

const formatTimeForDisplay = (timeString: string | undefined, format24h: boolean): string => {
    if (!timeString) return "";
    const trimmed = timeString.trim();
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
        const parts = trimmed.slice(0, 5).split(":");
        const h = parseInt(parts[0] || "0", 10);
        const m = parseInt(parts[1] || "0", 10);

        if (format24h) {
            return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        } else {
            const period = h >= 12 ? "PM" : "AM";
            const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
        }
    }
    return trimmed;
};

const parseTimeString = (timeString: string | undefined): { hours: number; minutes: number } => {
    if (!timeString) return { hours: 9, minutes: 0 };
    const trimmed = timeString.trim();
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
        const parts = trimmed.slice(0, 5).split(":");
        return {
            hours: parseInt(parts[0] || "0", 10),
            minutes: parseInt(parts[1] || "0", 10),
        };
    }
    return { hours: 9, minutes: 0 };
};

const timeToString = (hours: number, minutes: number): string => {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const TimePicker = (props: TimePickerProps) => {
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
    } = props;

    const controlled = isControlled(props);
    const form = !controlled ? props.form : undefined;
    const name = !controlled ? props.name : undefined;
    const { t } = useTranslation();

    const getValue = (): string | undefined => {
        if (controlled) return props.value || undefined;
        if (form && name != null) {
            return form.getValues(name) || undefined;
        }
        return undefined;
    };

    const setValue = (newTime: string | null) => {
        if (controlled && props.onChange) {
            props.onChange(newTime);
        } else if (form && name != null) {
            form.setValue(name, newTime, { shouldDirty: true });
        }
    };

    const renderPickerContent = (currentValue: string | undefined) => {
        const { hours, minutes } = parseTimeString(currentValue);
        const placeholderText = placeholder || (format24h ? "HH:mm" : "HH:mm AM/PM");

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

        const getDisplayHour = (hour: number) => {
            if (format24h) return hour;
            if (hour === 0) return 12;
            if (hour > 12) return hour - 12;
            return hour;
        };

        const getCurrentDisplayHour = () => {
            return getDisplayHour(hours);
        };

        const getPeriod = () => {
            return hours >= 12 ? "PM" : "AM";
        };

        const handleHourChange = (newHour: number) => {
            let finalHour = newHour;
            if (!format24h) {
                const isPM = getPeriod() === "PM";
                if (newHour === 12) {
                    finalHour = isPM ? 12 : 0;
                } else {
                    finalHour = isPM ? newHour + 12 : newHour;
                }
            }
            setValue(timeToString(finalHour, minutes));
        };

        const handleMinuteChange = (newMinute: number) => {
            setValue(timeToString(hours, newMinute));
        };

        const handlePeriodChange = (period: "AM" | "PM") => {
            let newHours = hours;
            if (period === "AM" && hours >= 12) {
                newHours = hours - 12;
            } else if (period === "PM" && hours < 12) {
                newHours = hours + 12;
            }
            setValue(timeToString(newHours, minutes));
        };

        return (
            <>
                <Popover modal={true}>
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
                                formatTimeForDisplay(currentValue, format24h)
                            ) : (
                                <span>{placeholderText}</span>
                            )}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                            <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex sm:flex-col p-2">
                                    {getHourOptions()
                                        .reverse()
                                        .map((hour) => {
                                            const displayHour = format24h ? hour : hour;
                                            const isSelected = format24h
                                                ? hours === hour
                                                : getCurrentDisplayHour() === hour;

                                            return (
                                                <Button
                                                    key={hour}
                                                    size="icon"
                                                    variant={isSelected ? "default" : "ghost"}
                                                    className="sm:w-full shrink-0 aspect-square"
                                                    onClick={() => handleHourChange(hour)}
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
                                                minutes === minute
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() => handleMinuteChange(minute)}
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
                                                    getPeriod() === period
                                                        ? "default"
                                                        : "ghost"
                                                }
                                                className="sm:w-full shrink-0 aspect-square"
                                                onClick={() =>
                                                    handlePeriodChange(period as "AM" | "PM")
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
                    </PopoverContent>
                </Popover>
            </>
        );
    };

    if (controlled) {
        const currentValue = props.value || undefined;
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
                const currentValue = field.value || undefined;
                return (
                    <FormItem>
                        {label != null && label !== "" && (
                            <FormLabel className={labelClassName}>
                                {label} {required ? "*" : ""}
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
