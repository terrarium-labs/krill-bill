import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Clock, CalendarDays, Calendars } from "lucide-react";
import { formatDateForAPI } from "@/utils/miscelanea";

import { useTranslation } from "@/hooks/useTranslation";
import {
  getEmployeeAbsenceCounters,
  postEmployeeAbsence,
  patchEmployeeAbsence,
} from "@/api/employees/absences/absences";
import { Absence, AbsenceCounterType } from "@/types/employees/absences";
import { IconLabel } from "@/app/components/custom-labels";

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
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import IdBadge from "@/app/components/id-badge";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import FilesSection from "@/app/components/files/files-section";

import useAbsenceCalculations, {
  HalfDayPeriod,
} from "../../hooks/useAbsenceCalculations";
import AbsenceSummaryCard from "../absence-summary-card";

// Composite key for counter+type selection (absence_counter_id|absence_type_id)
const counterTypeKey = (item: AbsenceCounterType) =>
  `${item.counter_id}|${item.absence_type.id}`;

export type DaysRangeMode = "half_day" | "whole_day" | "multiple_days";

// Form validation schema for employee mode
const employeeAbsenceSchema = z.object({
  counter_type: z.string().min(1, "Counter is required"),
  notes: z.string().optional(),
  start_date: z.date().refine((val) => val !== null && val !== undefined, {
    message: "Start date is required",
  }),
  duration: z.number().min(0.5, "Duration must be at least 0.5"),
  half_day_period: z.enum(["first", "second"]),
  // Only used when unit is "days"
  days_range_mode: z.enum(["half_day", "whole_day", "multiple_days"]).optional(),
  end_date: z.date().optional(),
  // Only used when unit is "hours" – "HH:mm"
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

type FormValues = z.infer<typeof employeeAbsenceSchema>;

// Type for API response
interface ApiResponse {
  success?: any;
  error?: string;
}

export interface AbsenceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAbsenceCreatedOrUpdated?: () => void;
  orgId: string;
  /** Must be "me" for employee mode */
  employeeId: string;
  /** Absence to edit (null for create mode) */
  absence?: Absence | null;
  /** Whether we're editing or creating */
  mode: "create" | "edit";
  /** Pre-selected date when creating from calendar */
  preSelectedDate?: Date | null;
  /** Custom function to create an absence */
  onCreateAbsence?: (data: {
    absence_type_id: string;
    absence_counter_id: string;
    start_date: string;
    end_date: string;
    notes: string | null;
  }) => Promise<ApiResponse>;
  /** Custom function to update an absence */
  onUpdateAbsence?: (
    absenceId: string,
    data: {
      absence_type_id: string;
      absence_counter_id: string;
      start_date: string;
      end_date: string;
      notes: string | null;
    }
  ) => Promise<ApiResponse>;
  /** Whether to show the files section */
  showFiles?: boolean;
  /** Render custom action buttons in the header (right side, next to ID badge). Receives the absence and a close function. */
  renderActions?: (absence: Absence, closeModal: () => void) => React.ReactNode;
}

/**
 * Modal for employees to create or edit their own absences.
 * Only available when employeeId === "me".
 * 
 * Employee can edit:
 * - absence_counter_id
 * - absence_type_id
 * - start_date / end_date (via duration)
 * - notes
 * 
 * Edit is only allowed when status === "pending"
 */
const AbsenceEditModal: React.FC<AbsenceEditModalProps> = ({
  open,
  onOpenChange,
  onAbsenceCreatedOrUpdated,
  orgId,
  employeeId,
  absence,
  mode,
  preSelectedDate,
  onCreateAbsence,
  onUpdateAbsence,
  renderActions,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCounter, setSelectedCounter] =
    useState<AbsenceCounterType | null>(null);
  const [countersData, setCountersData] = useState<AbsenceCounterType[]>([]);
  const [modalAbsenceId, setModalAbsenceId] = useState<string | undefined>(
    absence?.id
  );

  const isEditMode = mode === "edit";

  const form = useForm<FormValues>({
    resolver: zodResolver(employeeAbsenceSchema),
    defaultValues: {
      counter_type: "",
      notes: "",
      start_date: new Date(),
      duration: 1,
      half_day_period: "second",
      days_range_mode: "whole_day",
      end_date: undefined,
      start_time: "09:00",
      end_time: "17:00",
    },
  });

  const watchedCounterType = form.watch("counter_type");
  const watchedDuration = form.watch("duration");
  const watchedStartDate = form.watch("start_date");
  const watchedHalfDayPeriod = form.watch("half_day_period");
  const watchedDaysRangeMode = form.watch("days_range_mode");
  const watchedEndDate = form.watch("end_date");
  const watchedStartTime = form.watch("start_time");
  const watchedEndTime = form.watch("end_time");

  // Use shared calculations hook (only used for days half/whole; multiple_days uses end_date, hours use start/end time)
  const effectiveDuration =
    selectedCounter?.unit === "days" && watchedDaysRangeMode === "multiple_days"
      ? 1
      : watchedDuration;
  const { calculateEndDate, adjustStartDate, parseDurationFromDates } =
    useAbsenceCalculations({
      startDate: watchedStartDate,
      duration: effectiveDuration,
      halfDayPeriod: watchedHalfDayPeriod,
      counter: selectedCounter,
    });

  useEffect(() => {
    if (open) {
      setModalAbsenceId(absence?.id || undefined);
    }
  }, [open, absence?.id]);

  // Fetch counters data when modal opens
  useEffect(() => {
    const fetchCounters = async () => {
      if (open && orgId && employeeId) {
        try {
          const response = await getEmployeeAbsenceCounters(orgId, employeeId);
          if (response.success) {
            const raw = response.success.counters || [];
            // Normalize so every counter has counter_id (required by POST body)
            const normalized: AbsenceCounterType[] = raw.map((c: AbsenceCounterType) => ({
              ...c,
              counter_id: c.counter_id ?? (c as any).id ?? "",
            }));
            setCountersData(normalized);
          }
        } catch (error) {
          console.error("Error fetching counters:", error);
        }
      }
    };
    fetchCounters();
  }, [open, orgId, employeeId]);

  // Update selected counter when counter_type (absence_counter_id|absence_type_id) changes
  useEffect(() => {
    if (watchedCounterType && countersData.length > 0) {
      const counter = countersData.find(
        (c) => counterTypeKey(c) === watchedCounterType
      );
      setSelectedCounter(counter || null);
    } else {
      setSelectedCounter(null);
    }
  }, [watchedCounterType, countersData]);

  // Sync duration when days_range_mode changes (unit is days)
  useEffect(() => {
    if (selectedCounter?.unit !== "days") return;
    const mode = watchedDaysRangeMode ?? "whole_day";
    if (mode === "half_day" && watchedDuration !== 0.5) {
      form.setValue("duration", 0.5, { shouldValidate: false });
    } else if (mode === "whole_day" && watchedDuration !== 1) {
      form.setValue("duration", 1, { shouldValidate: false });
    } else if (mode === "multiple_days" && !watchedEndDate && watchedStartDate) {
      const d = new Date(watchedStartDate);
      d.setHours(23, 59, 59, 0);
      form.setValue("end_date", d, { shouldValidate: false });
    }
  }, [selectedCounter?.unit, watchedDaysRangeMode, watchedDuration, watchedEndDate, watchedStartDate, form]);

  // Auto-adjust start date time based on unit type and half-day period (only for days, not multiple_days)
  useEffect(() => {
    if (!selectedCounter || !watchedStartDate || selectedCounter.unit !== "days") return;
    if ((watchedDaysRangeMode ?? "whole_day") === "multiple_days") return;

    const adjustedDate = adjustStartDate(watchedStartDate);
    if (adjustedDate.getTime() !== watchedStartDate.getTime()) {
      form.setValue("start_date", adjustedDate, { shouldValidate: false });
    }
  }, [selectedCounter, watchedDuration, watchedHalfDayPeriod, watchedDaysRangeMode, adjustStartDate, watchedStartDate, form]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedCounter) return;
    const counterId =
      selectedCounter.counter_id ?? (selectedCounter as any).id;
    if (!counterId) {
      toast.error(t("absences.counterRequired", "Please select a counter"));
      return;
    }
    if (selectedCounter.unit === "days" && values.days_range_mode === "multiple_days") {
      if (!values.end_date) {
        toast.error(t("absences.endDateRequired", "End date is required for multiple days"));
        return;
      }
      if (values.end_date < values.start_date) {
        toast.error(t("absences.endDateAfterStart", "End date must be on or after start date"));
        return;
      }
    }
    if (selectedCounter.unit === "hours") {
      const st = values.start_time ?? "09:00";
      const et = values.end_time ?? "17:00";
      if (!st || !et) {
        toast.error(t("absences.startAndEndTimeRequired", "Start time and end time are required"));
        return;
      }
      const [sh, sm] = st.split(":").map(Number);
      const [eh, em] = et.split(":").map(Number);
      const startMs = new Date(values.start_date).setHours(sh, sm, 0, 0);
      const endMs = new Date(values.start_date).setHours(eh, em, 0, 0);
      if (endMs <= startMs) {
        toast.error(t("absences.endTimeAfterStart", "End time must be after start time"));
        return;
      }
    }
    setIsLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;
      if (selectedCounter.unit === "hours") {
        const st = values.start_time ?? "09:00";
        const et = values.end_time ?? "17:00";
        const [sh, sm] = st.split(":").map(Number);
        const [eh, em] = et.split(":").map(Number);
        startDate = new Date(values.start_date);
        startDate.setHours(sh, sm, 0, 0);
        endDate = new Date(values.start_date);
        endDate.setHours(eh, em, 0, 0);
      } else if (values.days_range_mode === "multiple_days" && values.end_date) {
        startDate = values.start_date;
        endDate = values.end_date;
        endDate.setHours(23, 59, 59, 0);
      } else {
        startDate = values.start_date;
        endDate = calculateEndDate();
      }

      const requestData = {
        absence_type_id: selectedCounter.absence_type.id,
        absence_counter_id: counterId,
        start_date: formatDateForAPI(startDate, "ms"),
        end_date: formatDateForAPI(endDate, "ms"),
        notes: values.notes || null,
      };

      let response: ApiResponse;

      if (isEditMode && absence) {
        if (onUpdateAbsence) {
          response = await onUpdateAbsence(absence.id, requestData);
        } else {
          response = await patchEmployeeAbsence(
            orgId,
            employeeId,
            absence.id,
            requestData
          );
        }
      } else {
        if (onCreateAbsence) {
          response = await onCreateAbsence(requestData);
        } else {
          response = await postEmployeeAbsence(orgId, employeeId, requestData);
        }
      }

      if (response.success) {
        const successMessage = isEditMode
          ? t("absences.updatedSuccess", "Absence updated successfully")
          : t("absences.createdSuccess", "Absence created successfully");

        // Capture absence_id from response for newly created absences
        if (!isEditMode && response.success.absence_id) {
          setModalAbsenceId(response.success.absence_id);
        }

        toast.success(successMessage);
        form.reset();
        onOpenChange(false);
        onAbsenceCreatedOrUpdated?.();
      } else {
        const errorMessage = isEditMode
          ? response.error ||
            t("absences.updateError", "Failed to update absence")
          : response.error ||
            t("absences.createError", "Failed to create absence");
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} absence:`,
        error
      );
      const errorMessage = isEditMode
        ? t("absences.updateError", "Failed to update absence")
        : t("absences.createError", "Failed to create absence");
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
          form.reset();
          setModalAbsenceId(undefined);
          onOpenChange(false);
        }
      } else {
        form.reset();
        setModalAbsenceId(undefined);
        onOpenChange(false);
      }
    } else {
      onOpenChange(open);
    }
  };

  const handleInteractOutside = (e: Event) => {
    if (form.formState.isDirty) {
      e.preventDefault();
      handleOpenChange(false);
    }
  };

  // Reset form when modal opens in create mode (do not depend on countersData so that
  // when counters load after the user has selected one, we don’t overwrite the selection)
  useEffect(() => {
    if (open && !isEditMode) {
      const startOfDay = preSelectedDate
        ? new Date(preSelectedDate)
        : new Date();
      startOfDay.setHours(0, 0, 0, 0);

      form.reset({
        counter_type: "",
        notes: "",
        start_date: startOfDay,
        duration: 1,
        half_day_period: "second",
        days_range_mode: "whole_day",
        end_date: undefined,
        start_time: "09:00",
        end_time: "17:00",
      });
    }
  }, [open, isEditMode, preSelectedDate, form]);

  // Reset form when modal opens in edit mode (wait for countersData to parse duration)
  useEffect(() => {
    if (open && isEditMode && absence && countersData.length > 0) {
      const startDate = new Date(absence.start_date);
      const endDate = new Date(absence.end_date);

      let duration = 1;
      let halfDayPeriod: HalfDayPeriod = "second";
      let daysRangeMode: DaysRangeMode = "whole_day";
      let endDateValue: Date | undefined;
      let startTime = "09:00";
      let endTime = "17:00";

      const counter = countersData.find(
        (c) =>
          c.absence_type.id === absence.absence_type.id &&
          c.counter_id === absence.absence_counter.id
      );

      if (counter) {
        const parsed = parseDurationFromDates(
          startDate,
          endDate,
          counter.unit
        );
        duration = parsed.duration;
        halfDayPeriod = parsed.halfDayPeriod;

        if (counter.unit === "days") {
          const startDay = new Date(startDate);
          startDay.setUTCHours(0, 0, 0, 0);
          const endDay = new Date(endDate);
          endDay.setUTCHours(0, 0, 0, 0);
          const daysDiff =
            (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24);
          if (duration === 0.5) {
            daysRangeMode = "half_day";
          } else if (duration === 1 && daysDiff === 0) {
            daysRangeMode = "whole_day";
          } else {
            daysRangeMode = "multiple_days";
            endDateValue = endDate;
          }
        } else {
          startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
          endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
        }
      }

      form.reset({
        counter_type: counter ? counterTypeKey(counter) : "",
        notes: absence.notes || "",
        start_date: startDate,
        duration: duration,
        half_day_period: halfDayPeriod,
        days_range_mode: daysRangeMode,
        end_date: endDateValue,
        start_time: startTime,
        end_time: endTime,
      });
    }
  }, [open, isEditMode, absence, countersData, form, parseDurationFromDates]);

  const dialogTitle = isEditMode
    ? t("absences.editAbsence", "Edit Absence")
    : t("absences.createAbsence", "Create New Absence");

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      key="absence-employee-modal"
    >
      <DialogContent
        className="max-w-2xl md:min-w-2xl"
        showCloseButton={false}
        onPointerDownOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
            <span>{dialogTitle}</span>
            {isEditMode && modalAbsenceId && absence && (
              <div className="flex items-center gap-2">
                <IdBadge id={modalAbsenceId} />
                {renderActions?.(absence, () => handleOpenChange(false))}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-6">
            {/* Counter + Type (single selection from combined counters list) */}
            <FormField
              control={form.control}
              name="counter_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("absences.counter", "Counter")} *</FormLabel>
                  <FormControl>
                    <MultiSelectApi
                      fetchOptions={getEmployeeAbsenceCounters}
                      fetchArgs={[orgId, employeeId]}
                      optionsKey="counters"
                      customValueKey={counterTypeKey}
                      customLabelKey={(item: AbsenceCounterType) => (
                        <IconLabel
                          icon={item.absence_type.icon_url}
                          text={item.name}
                          color={item.absence_type.color}
                        />
                      )}
                      placeholder={t(
                        "absences.selectCounter",
                        "Select counter"
                      )}
                      searchPlaceholder={t(
                        "absences.searchCounter",
                        "Search counters..."
                      )}
                      emptyText={t(
                        "absences.noCounters",
                        "No counters found"
                      )}
                      value={field.value ? [field.value] : []}
                      onChangeValue={(values) => {
                        field.onChange(values[0] || "");
                      }}
                      defaultItems={
                        isEditMode && absence && countersData.length
                          ? (() => {
                              const c = countersData.find(
                                (x) =>
                                  x.absence_type.id === absence.absence_type.id &&
                                  x.counter_id === absence.absence_counter.id
                              );
                              return c ? [c] : undefined;
                            })()
                          : undefined
                      }
                      maxCount={1}
                      disabled={isLoading}
                      className="w-full truncate"
                      isApiSearchable={false}
                    />
                  </FormControl>
                  {selectedCounter && (
                    <FormDescription>
                      Unit:{" "}
                      {selectedCounter.unit === "days" ? "Days" : "Hours"}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date / time section: depends on unit (days vs hours) */}
            {selectedCounter && (
              <div className="space-y-4">
                {/* Days: Half Day / Whole Day / Multiple Days row (only when unit is days) */}
                {selectedCounter.unit === "days" && (
                  <FormField
                    control={form.control}
                    name="days_range_mode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>
                          {t("absences.rangeType", "Range type")}
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button
                              type="button"
                              variant={
                                (field.value ?? "whole_day") === "half_day"
                                  ? "default"
                                  : "outline"
                              }
                              className="flex-1"
                              onClick={() => field.onChange("half_day")}
                              disabled={isLoading}
                            >
                              <Clock className="h-4 w-4 mr-2 shrink-0" />
                              {t("absences.halfDay", "Half Day")}
                            </Button>
                            <Button
                              type="button"
                              variant={
                                (field.value ?? "whole_day") === "whole_day"
                                  ? "default"
                                  : "outline"
                              }
                              className="flex-1"
                              onClick={() => field.onChange("whole_day")}
                              disabled={isLoading}
                            >
                              <CalendarDays className="h-4 w-4 mr-2 shrink-0" />
                              {t("absences.wholeDay", "Whole Day")}
                            </Button>
                            <Button
                              type="button"
                              variant={
                                (field.value ?? "whole_day") === "multiple_days"
                                  ? "default"
                                  : "outline"
                              }
                              className="flex-1"
                              onClick={() => field.onChange("multiple_days")}
                              disabled={isLoading}
                            >
                              <Calendars className="h-4 w-4 mr-2 shrink-0" />
                              {t("absences.multipleDays", "Multiple Days")}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Days: one or two date selectors */}
                {selectedCounter.unit === "days" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateTimePicker
                      form={form}
                      name="start_date"
                      showMonthYearPicker={true}
                      label={t("absences.startDate", "Start Date")}
                      required={true}
                      disabled={isLoading || !selectedCounter}
                      showTime={false}
                      format24h={true}
                    />
                    {(watchedDaysRangeMode ?? "whole_day") === "multiple_days" && (
                      <DateTimePicker
                        form={form}
                        name="end_date"
                        showMonthYearPicker={true}
                        label={t("absences.endDate", "End Date")}
                        required={true}
                        disabled={isLoading || !selectedCounter}
                        showTime={false}
                        format24h={true}
                      />
                    )}
                  </div>
                )}

                {/* Days half-day: first / last half toggle */}
                {selectedCounter.unit === "days" &&
                  (watchedDaysRangeMode ?? "whole_day") === "half_day" && (
                    <FormField
                      control={form.control}
                      name="half_day_period"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>
                            {t("absences.halfDayPeriod", "Half Day Period")}
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-4">
                              <Button
                                type="button"
                                variant={
                                  field.value === "first" ? "default" : "outline"
                                }
                                className="flex-1"
                                onClick={() => field.onChange("first")}
                                disabled={isLoading}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                {t("absences.firstHalf", "First Half")}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  field.value === "second"
                                    ? "default"
                                    : "outline"
                                }
                                className="flex-1"
                                onClick={() => field.onChange("second")}
                                disabled={isLoading}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                {t("absences.lastHalf", "Last Half")}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                {/* Hours: Start date + Start time + End time */}
                {selectedCounter.unit === "hours" && (
                  <div className="space-y-4">
                    <DateTimePicker
                      form={form}
                      name="start_date"
                      showMonthYearPicker={true}
                      label={t("absences.startDate", "Start Date")}
                      required={true}
                      disabled={isLoading || !selectedCounter}
                      showTime={false}
                      format24h={true}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("absences.startTime", "Start Time")} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                value={field.value ?? "09:00"}
                                onChange={(e) =>
                                  field.onChange(e.target.value)}
                                disabled={isLoading || !selectedCounter}
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
                              {t("absences.endTime", "End Time")} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                value={field.value ?? "17:00"}
                                onChange={(e) =>
                                  field.onChange(e.target.value)}
                                disabled={isLoading || !selectedCounter}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Calculated End Date Display */}
            {selectedCounter &&
              watchedStartDate &&
              (() => {
                const displayEndDate =
                  selectedCounter.unit === "hours"
                    ? (() => {
                        const d = new Date(watchedStartDate);
                        const [h, m] = (
                          watchedEndTime ?? "17:00"
                        ).split(":")
                        .map(Number);
                        d.setHours(h, m, 0, 0);
                        return d;
                      })()
                    : (watchedDaysRangeMode ?? "whole_day") ===
                        "multiple_days" && watchedEndDate
                    ? watchedEndDate
                    : calculateEndDate();
                const displayDuration =
                  selectedCounter.unit === "hours"
                    ? (() => {
                        const [sh, sm] = (
                          watchedStartTime ?? "09:00"
                        ).split(":")
                        .map(Number);
                        const [eh, em] = (
                          watchedEndTime ?? "17:00"
                        ).split(":")
                        .map(Number);
                        return (eh * 60 + em - (sh * 60 + sm)) / 60;
                      })()
                    : (watchedDaysRangeMode ?? "whole_day") ===
                        "multiple_days" && watchedEndDate
                    ? parseDurationFromDates(
                        watchedStartDate,
                        watchedEndDate,
                        "days"
                      ).duration
                    : watchedDuration;
                return (
                  <AbsenceSummaryCard
                    startDate={watchedStartDate}
                    endDate={displayEndDate}
                    duration={displayDuration}
                    counter={selectedCounter}
                  />
                );
              })()}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                      <FormLabel>{t("absences.notes", "Notes")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "absences.notesPlaceholder",
                            "Add any additional notes"
                          )}
                          {...field}
                          disabled={isLoading}
                          rows={3}
                        />
                      </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Files */}
            <FilesSection
              entity_id={modalAbsenceId}
              showBreadcrumbs={isEditMode}
              showSearch={isEditMode}
              showCreateFolder={false}
              showUpload={isEditMode}
            />

            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
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
                disabled={isLoading || !selectedCounter}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode
                      ? t("absences.updating", "Updating...")
                      : t("absences.creating", "Creating...")}
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

export default AbsenceEditModal;
