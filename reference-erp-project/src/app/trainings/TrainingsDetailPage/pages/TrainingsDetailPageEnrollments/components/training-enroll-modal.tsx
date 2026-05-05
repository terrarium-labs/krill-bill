import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { postTrainingEnrollment, patchTrainingEnrollment } from "@/api/trainings/trainings";
import { getOrgEmployees } from "@/api/employees/employees";
import type { TrainingEnrollment } from "@/types/trainings/trainings";
import type { Employee } from "@/types/employees/employees";

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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import Tag from "@/app/components/tag/tag";
import { getTagColorFromString } from "@/app/components/tag/utils";

const ENROLLMENT_STATUSES = [
    "enrolled",
    "in_progress",
    "completed",
    "failed",
    "withdrew",
] as const;

interface TrainingEnrollModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trainingId: string;
    enrollment?: TrainingEnrollment | null;
    mode?: "enroll" | "edit";
    onSaved?: () => void;
}

const TrainingEnrollModal = ({
    open,
    onOpenChange,
    trainingId,
    enrollment = null,
    mode = "enroll",
    onSaved,
}: TrainingEnrollModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = useMemo(
        () =>
            z
                .object({
                    employee_id: z.string().optional(),
                    employee_ids: z.array(z.string()).optional(),
                    status: z.enum(ENROLLMENT_STATUSES),
                    completion_date: z.date().optional().nullable(),
                    score: z.string().optional(),
                    notes: z.string().optional(),
                })
                .superRefine((data, ctx) => {
                    if (mode === "enroll") {
                        const ids = data.employee_ids ?? [];
                        if (ids.length === 0) {
                            ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: t(
                                    "trainings.enrollments.selectAtLeastOneEmployee",
                                    "Select at least one employee",
                                ),
                                path: ["employee_ids"],
                            });
                        }
                    } else if (!data.employee_id?.trim()) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: t("trainings.enrollments.employeeRequired", "Employee is required"),
                            path: ["employee_id"],
                        });
                    }
                }),
        [mode, t],
    );

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            employee_ids: [],
            status: "enrolled",
            completion_date: null,
            score: "",
            notes: "",
        },
    });

    const statusOptions = useMemo(
        () =>
            ENROLLMENT_STATUSES.map((status) => ({
                value: status,
                label: (
                    <Tag
                        text={t(
                            `trainings.enrollmentStatuses.${status === "in_progress" ? "inProgress" : status}`,
                            status.replace(/_/g, " "),
                        )}
                        color={getTagColorFromString(status)}
                        className="capitalize"
                    />
                ),
            })),
        [t],
    );

    useEffect(() => {
        if (open && enrollment && mode === "edit") {
            form.reset({
                employee_id: enrollment.employee_id,
                employee_ids: [],
                status: enrollment.status,
                completion_date: enrollment.completion_date
                    ? new Date(enrollment.completion_date)
                    : null,
                score: enrollment.score != null ? enrollment.score.toString() : "",
                notes: enrollment.notes ?? "",
            });
        } else if (open && mode === "enroll") {
            form.reset({
                employee_id: "",
                employee_ids: [],
                status: "enrolled",
                completion_date: null,
                score: "",
                notes: "",
            });
        }
    }, [open, enrollment, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = {
                status: values.status,
            };
            if (values.completion_date)
                payload.completion_date = values.completion_date.toISOString().split("T")[0];
            if (values.score?.trim()) {
                const parsed = parseFloat(values.score);
                if (!isNaN(parsed)) payload.score = parsed;
            }
            if (values.notes?.trim()) payload.notes = values.notes.trim();

            if (mode === "edit" && enrollment) {
                const response = await patchTrainingEnrollment(
                    orgId,
                    trainingId,
                    enrollment.id,
                    payload,
                );
                if (response.success) {
                    toast.success(
                        t("trainings.enrollments.updatedSuccess", "Enrollment updated"),
                    );
                    form.reset();
                    onOpenChange(false);
                    onSaved?.();
                } else {
                    toast.error(
                        t("trainings.enrollments.errorUpdating", "Error updating enrollment"),
                    );
                }
                return;
            }

            const ids = values.employee_ids ?? [];
            let ok = 0;
            for (const employeeId of ids) {
                const response = await postTrainingEnrollment(orgId, trainingId, {
                    ...payload,
                    employee_id: employeeId,
                });
                if (response.success) ok += 1;
            }

            if (ok === ids.length) {
                toast.success(
                    ids.length > 1
                        ? t("trainings.enrollments.enrolledSuccessMany", "{{count}} employees enrolled", {
                              count: ids.length,
                          })
                        : t("trainings.enrollments.enrolledSuccess", "Employee enrolled successfully"),
                );
                form.reset();
                onOpenChange(false);
                onSaved?.();
            } else if (ok === 0) {
                toast.error(
                    t("trainings.enrollments.errorEnrolling", "Error enrolling employee"),
                );
            } else {
                toast.warning(
                    t(
                        "trainings.enrollments.enrolledPartial",
                        "{{ok}} enrolled, {{failed}} failed",
                        { ok, failed: ids.length - ok },
                    ),
                );
                form.reset();
                onOpenChange(false);
                onSaved?.();
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            if (!newOpen) form.reset();
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-lg flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0"
                showCloseButton={false}
            >
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="shrink-0 px-6 pt-6 pb-2">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">
                                    {mode === "edit"
                                        ? t("trainings.enrollments.editEnrollment", "Edit Enrollment")
                                        : t("trainings.enrollments.enrollEmployee", "Enroll Employee")}
                                </DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
                            {mode === "enroll" && (
                                <FormField
                                    control={form.control}
                                    name="employee_ids"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>
                                                {t("common.employee", "Employee")} *
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                                {t(
                                                    "trainings.enrollments.tipEmployeesMulti",
                                                    "Select one or more.",
                                                )}
                                            </FormDescription>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getOrgEmployees}
                                                    fetchArgs={[orgId]}
                                                    optionsKey="employees"
                                                    enableParams="hidden"
                                                    defaultParams="employees"
                                                    value={field.value ?? []}
                                                    onChangeValue={field.onChange}
                                                    placeholder={t(
                                                        "trainings.enrollments.selectEmployees",
                                                        "Search employees…",
                                                    )}
                                                    searchPlaceholder={t(
                                                        "trainings.enrollments.selectEmployees",
                                                        "Search employees…",
                                                    )}
                                                    emptyText={t(
                                                        "trainings.enrollments.noEmployeesFound",
                                                        "No employees found",
                                                    )}
                                                    customValueKey={(item: Employee) => item.id}
                                                    customLabelKey={(item: Employee) => (
                                                        <EmployeeAvatar
                                                            employee={item}
                                                            showName
                                                            showJobTitle
                                                        />
                                                    )}
                                                    isApiSearchable
                                                    className="w-full min-w-0"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            {t("trainings.enrollments.columns.status", "Status")} *
                                        </FormLabel>
                                        {mode === "enroll" && (
                                            <FormDescription className="text-xs">
                                                {t(
                                                    "trainings.enrollments.tipStatusBulk",
                                                    "One status for all selected.",
                                                )}
                                            </FormDescription>
                                        )}
                                        <FormControl>
                                            <MultiSelect
                                                options={statusOptions}
                                                selected={
                                                    field.value ? [field.value] : []
                                                }
                                                onSelectedChange={(values) =>
                                                    field.onChange(
                                                        (values[0] as (typeof ENROLLMENT_STATUSES)[number]) ??
                                                            "enrolled",
                                                    )
                                                }
                                                placeholder={t(
                                                    "trainings.enrollments.selectStatus",
                                                    "Select status",
                                                )}
                                                searchPlaceholder={t(
                                                    "trainings.enrollments.searchStatus",
                                                    "Search…",
                                                )}
                                                emptyText={t(
                                                    "trainings.enrollments.noStatus",
                                                    "No status",
                                                )}
                                                maxCount={1}
                                                searchable={false}
                                                className="w-full min-w-0 truncate"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <DateTimePicker
                                    form={form}
                                    name="completion_date"
                                    label={t(
                                        "trainings.enrollments.completionDate",
                                        "Completion Date",
                                    )}
                                    showTime={false}
                                    placeholder={t("trainings.fields.optional", "Optional")}
                                />
                                <FormField
                                    control={form.control}
                                    name="score"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("trainings.enrollments.score", "Score (%)")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    placeholder={t(
                                                        "trainings.fields.optional",
                                                        "Optional",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("trainings.enrollments.notes", "Notes")}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t(
                                                    "trainings.fields.optional",
                                                    "Optional",
                                                )}
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="shrink-0 gap-2 bg-background px-6 py-4 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {mode === "edit"
                                            ? t("common.saving", "Saving...")
                                            : t("trainings.enrollments.enrolling", "Enrolling...")}
                                    </>
                                ) : mode === "edit" ? (
                                    t("common.save", "Save")
                                ) : (
                                    t("trainings.enrollments.enroll", "Enroll")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TrainingEnrollModal;
