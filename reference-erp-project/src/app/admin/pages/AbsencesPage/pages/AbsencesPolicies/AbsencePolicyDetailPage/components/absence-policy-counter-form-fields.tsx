import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import IconLabel from "@/app/components/labels/icon-label";
import type { UseFormReturn } from "react-hook-form";
import { AbsenceCounter } from "@/types/general/absences";
import {
    CYCLE_START,
    CYCLE_DURATION,
    UNITS,
    EXPIRATION_PERIOD,
} from "@/utils/absence_policy_conters";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getAbsenceTypes } from "@/api/orgs/absences/absences";
import { cn } from "@/lib/utils";
import {
    getDisplayCycleStartYear,
    type AbsencePolicyCounterFormValues,
} from "./absence-policy-counter-form-types";

export const ABSENCE_POLICY_COUNTER_MODAL_FORM_CLASS =
    "overflow-y-auto max-h-[70vh] px-2 mb-16";

export interface AbsencePolicyCounterFormFieldsProps {
    form: UseFormReturn<AbsencePolicyCounterFormValues>;
    mode: "create" | "edit";
    counter?: AbsenceCounter;
    orgId: string;
    isLoading: boolean;
    /** Merged with space-y-6. Modal uses ABSENCE_POLICY_COUNTER_MODAL_FORM_CLASS. */
    className?: string;
}

export function AbsencePolicyCounterFormFields({
    form,
    mode,
    counter,
    orgId,
    isLoading,
    className,
}: AbsencePolicyCounterFormFieldsProps) {
    const { t } = useTranslation();
    const isEditMode = mode === "edit";
    const watchIsUnlimited = form.watch("is_unlimited");
    const watchUnit = isEditMode
        ? (counter?.unit ?? form.watch("unit") ?? "days")
        : form.watch("unit");
    const isHours = watchUnit === "hours";
    const watchExpiration = isEditMode
        ? counter?.expiration || false
        : form.watch("expiration");

    const getCycleStartLabel = (value: string) => {
        return CYCLE_START.find((c) => c.value === value)?.label || value;
    };

    const getUnitLabel = (value: string) => {
        return UNITS.find((u) => u.value === value)?.label || value;
    };

    /** Last calendar year through current year + 4 (for create-mode cycle start year). */
    const cycleStartYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let y = currentYear - 1; y <= currentYear + 4; y++) {
            years.push(y);
        }
        return years;
    }, []);

    const editCycleStartYearDisplay = useMemo(() => {
        if (!counter) return "—";
        const y = getDisplayCycleStartYear(counter);
        return y != null ? String(y) : "—";
    }, [counter]);

    return (
        <div className={cn("space-y-6", className)}>

              {/* Basic Information */}
              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>
                        {t("absence-policies.counters.name", "Name")} {!isEditMode && "*"}
                      </FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input
                            value={counter?.name || ""}
                            disabled={true}
                            className="bg-muted"
                          />
                        ) : (
                          <Input
                            placeholder={t(
                              "absence-policies.counters.namePlaceholder",
                              "e.g., Annual Leave, Sick Leave"
                            )}
                            {...field}
                            disabled={isLoading}
                            autoFocus
                          />
                        )}
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
                      <FormLabel>
                        {t("absence-policies.counters.description", "Description")}
                      </FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Textarea
                            value={counter?.description || ""}
                            disabled={true}
                            rows={3}
                            className="bg-muted"
                          />
                        ) : (
                          <Textarea
                            placeholder={t(
                              "absence-policies.counters.descriptionPlaceholder",
                              "Optional description for this counter"
                            )}
                            {...field}
                            disabled={isLoading}
                            rows={3}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="absence_type_ids"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-1.5">
                        {t("absence-policies.counters.absenceTypes", "Absence Types")}{" "}
                        {!isEditMode && "*"}
                      </FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <div
                            className="mt-1 text-sm rounded-md bg-muted px-3 py-2 border border-transparent flex flex-wrap items-center gap-y-1 cursor-not-allowed pointer-events-none"
                            aria-readonly
                          >
                            {counter?.absence_types?.length ? (
                              counter.absence_types.map((type, index) => (
                                <span
                                  key={type.id}
                                  className="inline-flex items-center"
                                >
                                  {index > 0 ? (
                                    <span className="text-muted-foreground">, </span>
                                  ) : null}
                                  <IconLabel
                                    className="text-muted-foreground"
                                    data={{
                                      icon: type.icon_url,
                                      text: type.name,
                                      color: type.color,
                                    }}
                                  />
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        ) : (
                          <MultiSelectApi
                            fetchOptions={getAbsenceTypes}
                            fetchArgs={[orgId]}
                            optionsKey="absence_types"
                            className="w-full truncate"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) => (
                              <IconLabel data={{icon: item.icon_url, text: item.name, color: item.color}} />
                            )}
                            placeholder={t(
                              "absence-policies.counters.selectAbsenceTypes",
                              "Select absence types"
                            )}
                            onChangeValue={field.onChange}
                            value={form.watch("absence_type_ids") || []}
                          />
                        )}
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "admin.absencePolicies.counters.absenceTypesFieldDescription",
                          "Absence types that draw from this counter when requested.",
                        )}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cycle Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium  border-b pb-2 col-span-1 md:col-span-2 mt-4">
                  {t(
                    "absence-policies.counters.sections.cycleConfig",
                    "Cycle Configuration"
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cycle_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("absence-policies.counters.cycleStart", "Cycle Start")}{" "}
                          {!isEditMode && "*"}
                        </FormLabel>
                        {isEditMode ? (
                          <FormControl>
                            <Input
                              value={getCycleStartLabel(counter?.cycle_start || "")}
                              disabled={true}
                              className="bg-muted mt-2"
                            />
                          </FormControl>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    "absence-policies.counters.selectCycleStart",
                                    "Select cycle start"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CYCLE_START.map((start) => (
                                <SelectItem key={start.value} value={start.value}>
                                  {start.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormDescription className="text-xs text-muted-foreground">
                          {t(
                            "admin.absencePolicies.counters.cycleStartFieldDescription",
                            "When each accrual period begins (e.g. calendar year or hire date).",
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cycle_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "absence-policies.counters.cycleDuration",
                            "Cycle Duration (months)"
                          )}{" "}
                          {!isEditMode && "*"}
                        </FormLabel>
                        {isEditMode ? (
                          <FormControl>
                            <Input
                              value={`${counter?.cycle_duration || 0} ${t(
                                "absence-policies.counters.months",
                                "months"
                              )}`}
                              disabled={true}
                              className="bg-muted mt-2"
                            />
                          </FormControl>
                        ) : (
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    "absence-policies.counters.selectDuration",
                                    "Select duration"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CYCLE_DURATION.map((duration) => (
                                <SelectItem
                                  key={duration.value}
                                  value={duration.value}
                                >
                                  {duration.label}{" "}
                                  {t("absence-policies.counters.months", "months")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormDescription className="text-xs text-muted-foreground">
                          {t(
                            "admin.absencePolicies.counters.cycleDurationFieldDescription",
                            "Length of each accrual cycle in months.",
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cycle_start_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "absence-policies.counters.cycleStartYear",
                            "Cycle start year"
                          )}{" "}
                          {!isEditMode && "*"}
                        </FormLabel>
                        {isEditMode ? (
                          <FormControl>
                            <Input
                              value={editCycleStartYearDisplay}
                              disabled={true}
                              className="bg-muted mt-2"
                            />
                          </FormControl>
                        ) : (
                          <Select
                            value={String(field.value)}
                            onValueChange={(v) => field.onChange(parseInt(v, 10))}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    "absence-policies.counters.selectCycleStartYear",
                                    "Select year"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cycleStartYearOptions.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormDescription className="text-xs text-muted-foreground">
                          {t(
                            "admin.absencePolicies.counters.cycleStartYearFieldDescription",
                            "Calendar year when the first cycle starts for new counters.",
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Counter Configuration */}
              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                <h3 className="text-sm font-medium  border-b pb-2 col-span-1 md:col-span-2 mt-4">
                  {t(
                    "absence-policies.counters.sections.counterConfig",
                    "Counter Configuration"
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-1 md:col-span-2 items-start">
                  <div className="flex flex-col gap-3">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isHours
                              ? t("absence-policies.counters.valueHours", "Number of hours")
                              : t("absence-policies.counters.value", "Number of days")}{" "}
                            *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t(
                                "absence-policies.counters.valuePlaceholder",
                                "e.g., 21"
                              )}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              disabled={isLoading || watchIsUnlimited}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            {t(
                              "admin.absencePolicies.counters.valueFieldDescription",
                              "Total allowance per cycle when not unlimited (days or hours per unit).",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_unlimited"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-row items-center gap-3">
                            <FormControl>
                              <Checkbox
                                className="shrink-0"
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("value", 0);
                                    form.setValue("max_days", 0);
                                  }
                                }}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer font-normal leading-snug">
                              {t("absence-policies.counters.isUnlimited", "Unlimited")}
                            </FormLabel>
                          </div>
                          <FormDescription className="text-xs text-muted-foreground">
                            {t(
                              "admin.absencePolicies.counters.isUnlimitedFieldDescription",
                              "When enabled, no fixed balance cap is enforced for linked absence types.",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("absence-policies.counters.unit", "Unit")}{" "}
                          {!isEditMode && "*"}
                        </FormLabel>
                        {isEditMode ? (
                          <FormControl>
                            <Input
                              value={getUnitLabel(counter?.unit || "")}
                              disabled={true}
                              className="bg-muted"
                            />
                          </FormControl>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full min-w-30">
                                <SelectValue
                                  placeholder={t(
                                    "absence-policies.counters.selectUnit",
                                    "Select a unit"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNITS.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormDescription className="text-xs text-muted-foreground">
                          {t(
                            "admin.absencePolicies.counters.unitFieldDescription",
                            "Whether this counter tracks days or hours.",
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isHours
                            ? t("absence-policies.counters.maxHours", "Maximum extra hours")
                            : t("absence-policies.counters.maxDays", "Maximum extra days")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t(
                              "absence-policies.counters.maxDaysPlaceholder",
                              "0 for no limit"
                            )}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            disabled={isLoading || watchIsUnlimited}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          {isHours
                            ? t(
                                "absence-policies.counters.maxHoursDescription",
                                "Maximum hours that can be accumulated"
                              )
                            : t(
                                "absence-policies.counters.maxDaysDescription",
                                "Maximum days that can be accumulated"
                              )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_working_day"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex flex-row items-center gap-3",
                          isEditMode && "cursor-not-allowed",
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            className={cn(
                              "shrink-0",
                              isEditMode && "bg-muted cursor-not-allowed",
                            )}
                            checked={
                              isEditMode
                                ? counter?.is_working_day || false
                                : field.value
                            }
                            onCheckedChange={
                              isEditMode ? undefined : field.onChange
                            }
                            disabled={isLoading || isEditMode}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                            isEditMode && "cursor-not-allowed",
                          )}
                        >
                          {t(
                            "absence-policies.counters.isWorkingDay",
                            "Count Working Days Only"
                          )}
                        </FormLabel>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t(
                          "absence-policies.counters.isWorkingDayDescription",
                          "Only count working days, excluding weekends"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="count_if_holiday"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex flex-row items-center gap-3",
                          isEditMode && "cursor-not-allowed",
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            className={cn(
                              "shrink-0",
                              isEditMode && "bg-muted cursor-not-allowed",
                            )}
                            checked={
                              isEditMode
                                ? counter?.count_if_holiday || false
                                : field.value
                            }
                            onCheckedChange={
                              isEditMode ? undefined : field.onChange
                            }
                            disabled={isLoading || isEditMode}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                            isEditMode && "cursor-not-allowed",
                          )}
                        >
                          {t(
                            "absence-policies.counters.countIfHoliday",
                            "Count Holidays"
                          )}
                        </FormLabel>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t(
                          "absence-policies.counters.countIfHolidayDescription",
                          "Count days that fall on holidays"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_prorated"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex flex-row items-center gap-3",
                          isEditMode && "cursor-not-allowed",
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            className={cn(
                              "shrink-0",
                              isEditMode && "bg-muted cursor-not-allowed",
                            )}
                            checked={
                              isEditMode
                                ? counter?.is_prorated || false
                                : field.value
                            }
                            onCheckedChange={
                              isEditMode ? undefined : field.onChange
                            }
                            disabled={isLoading || isEditMode}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                            isEditMode && "cursor-not-allowed",
                          )}
                        >
                          {t("absence-policies.counters.isProrated", "Prorate")}
                        </FormLabel>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t(
                          "absence-policies.counters.isProratedDescription",
                          "Prorate days based on employment start date"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="negative_counter"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex flex-row items-center gap-3",
                          isEditMode && "cursor-not-allowed",
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            className={cn(
                              "shrink-0",
                              isEditMode && "bg-muted cursor-not-allowed",
                            )}
                            checked={
                              isEditMode
                                ? counter?.negative_counter || false
                                : field.value
                            }
                            onCheckedChange={
                              isEditMode ? undefined : field.onChange
                            }
                            disabled={isLoading || isEditMode}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                            isEditMode && "cursor-not-allowed",
                          )}
                        >
                          {t(
                            "absence-policies.counters.negativeCounter",
                            "Allow Negative Balance"
                          )}
                        </FormLabel>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t(
                          "absence-policies.counters.negativeCounterDescription",
                          "Allow the counter to go below zero"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Expiration and Admin Configuration */}
              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                <h3 className="text-sm font-medium  border-b pb-2 col-span-1 md:col-span-2 mt-4">
                  {t(
                    "absence-policies.counters.sections.expirationAndAdmin",
                    "Expiration and Admin Configuration"
                  )}
                </h3>
                {!watchIsUnlimited && (
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="expiration"
                      render={({ field }) => (
                        <FormItem>
                          <div
                            className={cn(
                              "flex flex-row items-center gap-3",
                              isEditMode && "cursor-not-allowed",
                            )}
                          >
                            <FormControl>
                              <Checkbox
                                className={cn(
                                  "shrink-0",
                                  isEditMode && "bg-muted cursor-not-allowed",
                                )}
                                checked={
                                  isEditMode
                                    ? counter?.expiration || false
                                    : field.value
                                }
                                onCheckedChange={
                                  isEditMode ? undefined : field.onChange
                                }
                                disabled={isLoading || isEditMode}
                              />
                            </FormControl>
                            <FormLabel
                              className={cn(
                                "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                                isEditMode && "cursor-not-allowed",
                              )}
                            >
                              {t(
                                "absence-policies.counters.expiration",
                                "Enable Expiration"
                              )}
                            </FormLabel>
                          </div>
                          <FormDescription className="text-xs text-muted-foreground">
                            {t(
                              "absence-policies.counters.expirationDescription",
                              "Unused days expire after a certain period"
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchExpiration && (
                      <FormField
                        control={form.control}
                        name="expiration_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t(
                                "absence-policies.counters.expirationPeriod",
                                "Expiration Period"
                              )}
                            </FormLabel>
                            {isEditMode ? (
                              <FormControl>
                                <Input
                                  value={(() => {
                                    const expirationPeriod =
                                      counter?.expiration_period || 0;
                                    return (
                                      EXPIRATION_PERIOD.find(
                                        (p) =>
                                          p.value === expirationPeriod.toString()
                                      )?.label || `${expirationPeriod} months`
                                    );
                                  })()}
                                  disabled={true}
                                  className="bg-muted mt-2"
                                />
                              </FormControl>
                            ) : (
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                defaultValue={field.value.toString()}
                                disabled={isLoading || !watchExpiration}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={t(
                                        "absence-policies.counters.selectExpirationPeriod",
                                        "Select expiration period"
                                      )}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EXPIRATION_PERIOD.map((period) => (
                                    <SelectItem
                                      key={period.value}
                                      value={period.value}
                                    >
                                      {period.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormDescription className="text-xs text-muted-foreground">
                              {t(
                                "admin.absencePolicies.counters.expirationPeriodFieldDescription",
                                "How long unused balance remains before it expires.",
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="admin_only"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "flex flex-row items-center gap-3",
                          isEditMode && "cursor-not-allowed",
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            className={cn(
                              "shrink-0",
                              isEditMode && "bg-muted cursor-not-allowed",
                            )}
                            checked={
                              isEditMode
                                ? counter?.admin_only || false
                                : field.value
                            }
                            onCheckedChange={
                              isEditMode ? undefined : field.onChange
                            }
                            disabled={isLoading || isEditMode}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "!mt-0 flex-1 cursor-pointer font-normal leading-snug",
                            isEditMode && "cursor-not-allowed",
                          )}
                        >
                          {t("absence-policies.counters.adminOnly", "Admin Only")}
                        </FormLabel>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t(
                          "absence-policies.counters.adminOnlyDescription",
                          "If active, only admins can use this counter"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
    );
}
