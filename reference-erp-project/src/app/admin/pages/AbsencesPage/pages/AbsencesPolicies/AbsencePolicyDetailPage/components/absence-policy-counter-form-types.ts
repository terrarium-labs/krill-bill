import * as z from "zod";
import type { TFunction } from "i18next";
import { AbsenceCounter } from "@/types/general/absences";

export type AbsencePolicyCounterFormValues = {
    name: string;
    description?: string;
    cycle_start: string;
    cycle_start_year: number;
    cycle_duration: number;
    unit: string;
    value: number;
    is_working_day: boolean;
    is_unlimited: boolean;
    count_if_holiday: boolean;
    is_prorated: boolean;
    max_days: number;
    negative_counter: boolean;
    expiration: boolean;
    expiration_period: number;
    absence_type_ids: string[];
    admin_only: boolean;
};

export const absencePolicyCounterDefaultFormValues: AbsencePolicyCounterFormValues = {
    name: "",
    description: "",
    cycle_start: "january",
    cycle_start_year: new Date().getFullYear(),
    cycle_duration: 12,
    unit: "days",
    value: 0,
    is_working_day: true,
    is_unlimited: false,
    count_if_holiday: false,
    is_prorated: true,
    max_days: 0,
    negative_counter: false,
    expiration: false,
    expiration_period: 12,
    absence_type_ids: [],
    admin_only: false,
};

export function createAbsencePolicyCounterFormSchema(t: TFunction) {
    return z.object({
        name: z
            .string()
            .min(1, t("absence-policies.validation.nameRequired", "Counter name is required"))
            .min(
                2,
                t(
                    "absence-policies.validation.nameMinLength",
                    "Counter name must be at least 2 characters"
                )
            )
            .max(
                64,
                t(
                    "absence-policies.validation.nameMaxLength",
                    "Counter name must be less than 64 characters"
                )
            )
            .trim(),
        description: z
            .string()
            .max(
                500,
                t(
                    "absence-policies.validation.descriptionMaxLength",
                    "Description must be less than 500 characters"
                )
            )
            .optional(),
        cycle_start: z
            .string()
            .min(1, t("absence-policies.validation.cycleStartRequired", "Cycle start is required")),
        cycle_start_year: z
            .number()
            .int()
            .min(1900)
            .max(2200),
        cycle_duration: z.number().min(1).max(60),
        unit: z.string().min(1, t("absence-policies.validation.unitRequired", "Unit is required")),
        value: z.number().min(0),
        is_working_day: z.boolean(),
        is_unlimited: z.boolean(),
        count_if_holiday: z.boolean(),
        is_prorated: z.boolean(),
        max_days: z.number().min(0),
        negative_counter: z.boolean(),
        expiration: z.boolean(),
        expiration_period: z.number().min(1),
        absence_type_ids: z
            .array(z.string())
            .min(
                1,
                t(
                    "absence-policies.validation.absenceTypesRequired",
                    "At least one absence type is required"
                )
            ),
        admin_only: z.boolean(),
    });
}

/** Prefer `cycle_start_year`; if missing, use the calendar year from `start_date` (ISO). */
export function getDisplayCycleStartYear(counter: AbsenceCounter): number | null {
    if (counter.cycle_start_year != null) {
        return counter.cycle_start_year;
    }
    const raw = counter.start_date?.trim();
    if (!raw) return null;
    const fromIsoPrefix = /^(\d{4})/.exec(raw)?.[1];
    if (fromIsoPrefix) return parseInt(fromIsoPrefix, 10);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.getUTCFullYear();
}

export function counterToFormValues(counter: AbsenceCounter): AbsencePolicyCounterFormValues {
    return {
        name: counter.name,
        description: counter.description || "",
        cycle_start: counter.cycle_start,
        cycle_start_year: getDisplayCycleStartYear(counter) ?? new Date().getFullYear(),
        cycle_duration: counter.cycle_duration,
        unit: counter.unit,
        value: counter.value,
        is_working_day: counter.is_working_day,
        is_unlimited: counter.is_unlimited,
        count_if_holiday: counter.count_if_holiday,
        is_prorated: counter.is_prorated,
        max_days: counter.max_days,
        negative_counter: counter.negative_counter,
        expiration: counter.expiration,
        expiration_period: counter.expiration_period,
        absence_type_ids: counter.absence_types?.map((at) => at.id) || [],
        admin_only: counter.admin_only,
    };
}

/** PATCH body for edit mode (matches modal behavior). */
export function buildEditPatchPayload(values: AbsencePolicyCounterFormValues) {
    return values.is_unlimited
        ? { is_unlimited: values.is_unlimited }
        : {
              value: values.value,
              max_days: values.max_days,
              is_unlimited: values.is_unlimited,
          };
}
