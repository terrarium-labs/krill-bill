import React from "react";
import { Clock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { useTranslation } from "@/hooks/useTranslation";
import { AbsenceCounterType } from "@/types/employees/absences";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";

interface AbsenceDateDurationSelectorsProps {
  form: UseFormReturn<any>;
  selectedCounter: AbsenceCounterType | null;
  isLoading?: boolean;
  /** Whether the date/duration fields are disabled */
  disabled?: boolean;
}

/**
 * Shared component for absence date and duration selection.
 * Used by both AbsenceEmployeeModal and AbsenceAdminModal.
 */
const AbsenceDateDurationSelectors: React.FC<AbsenceDateDurationSelectorsProps> = ({
  form,
  selectedCounter,
  isLoading = false,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const watchedDuration = form.watch("duration");

  return (
    <div className="space-y-4">
      {/* Start Date and Duration on same row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <FormItem>
          <FormControl>
            <DateTimePicker
              form={form}
              name="start_date"
              showMonthYearPicker={true}
              label={t("absences.startDate", "Start Date")}
              required={true}
              disabled={isLoading || disabled || !selectedCounter}
              showTime={selectedCounter?.unit === "hours"}
              format24h={true}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        {/* Duration Selector */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => {
            const unitLabel =
              selectedCounter?.unit === "days"
                ? field.value === 1
                  ? t("absences.day", "day")
                  : t("absences.days", "days")
                : field.value === 1
                ? t("absences.hour", "hour")
                : t("absences.hours", "hours");
            const maxValue = selectedCounter?.unit === "days" ? 30 : 3.5;

            return (
              <FormItem>
                <FormLabel>{t("absences.duration", "Duration")} *</FormLabel>
                <div className="flex">
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        type="number"
                        step="0.5"
                        min="0.5"
                        max={maxValue}
                        value={field.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (
                            !isNaN(value) &&
                            value >= 0.5 &&
                            value <= maxValue
                          ) {
                            field.onChange(value);
                          }
                        }}
                        disabled={isLoading || disabled || !selectedCounter}
                        className="rounded-r-none"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>{unitLabel}</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      {/* Half Day Period Toggle - Show when duration has .5 decimal */}
      {selectedCounter?.unit === "days" && watchedDuration % 1 !== 0 && (
        <FormField
          control={form.control}
          name="half_day_period"
          render={({ field }) => {
            const isHalfDay = watchedDuration === 0.5;
            return (
              <FormItem className="space-y-3">
                <FormLabel>
                  {isHalfDay
                    ? t("absences.halfDayPeriod", "Half Day Period")
                    : t("absences.halfDayPosition", "Half Day Position")}
                </FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={field.value === "first" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => field.onChange("first")}
                      disabled={isLoading || disabled}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {isHalfDay
                        ? t("absences.firstHalf", "First Half")
                        : t("absences.firstDay", "First Day")}
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "second" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => field.onChange("second")}
                      disabled={isLoading || disabled}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {isHalfDay
                        ? t("absences.lastHalf", "Last Half")
                        : t("absences.lastDay", "Last Day")}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}
    </div>
  );
};

export default AbsenceDateDurationSelectors;
