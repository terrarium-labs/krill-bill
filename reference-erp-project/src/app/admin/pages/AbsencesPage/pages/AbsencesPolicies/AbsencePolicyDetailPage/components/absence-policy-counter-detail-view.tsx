import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import IdBadge from "@/app/components/id-badge";
import IconLabel from "@/app/components/labels/icon-label";
import { AbsenceCounter } from "@/types/general/absences";
import { CYCLE_START, UNITS, EXPIRATION_PERIOD } from "@/utils/absence_policy_conters";
import { formatDate } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { patchAbsencePolicyCounters } from "@/api/orgs/absences/absences";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import AbsencePolicyCounterUnsafeEditModal from "./absence-policy-counuter-unsafe-edit-modal";
import {
    createAbsencePolicyCounterFormSchema,
    absencePolicyCounterDefaultFormValues,
    counterToFormValues,
    buildEditPatchPayload,
    getDisplayCycleStartYear,
    type AbsencePolicyCounterFormValues,
} from "./absence-policy-counter-form-types";
import { AbsencePolicyCounterFormFields } from "./absence-policy-counter-form-fields";

interface AbsencePolicyCounterDetailViewProps {
    counter: AbsenceCounter;
    orgId: string;
    policyId: string;
    onSaved: () => void;
    onDeleteClick: () => void;
    onDuplicateClick: () => void;
}

function getCycleStartLabel(value: string) {
    return CYCLE_START.find((c) => c.value === value)?.label || value;
}

function getUnitLabel(value: string) {
    return UNITS.find((u) => u.value === value)?.label || value;
}

function getExpirationPeriodLabel(counter: AbsenceCounter) {
    const expirationPeriod = counter.expiration_period ?? 0;
    return (
        EXPIRATION_PERIOD.find((p) => p.value === expirationPeriod.toString())?.label ||
        `${expirationPeriod} months`
    );
}

const ReadOnlyCheckboxRow = ({
    label,
    description,
    checked,
}: {
    label: string;
    description?: string;
    checked: boolean;
}) => (
    <div className="flex flex-row items-start space-x-3 space-y-0">
        <Checkbox checked={checked} disabled className="bg-muted cursor-not-allowed mt-0.5" />
        <div className="space-y-1 leading-none">
            <Label className="cursor-not-allowed font-normal">{label}</Label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    </div>
);

const AbsencePolicyCounterDetailView = ({
    counter,
    orgId,
    policyId,
    onSaved,
    onDeleteClick,
    onDuplicateClick,
}: AbsencePolicyCounterDetailViewProps) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [unsafeModalOpen, setUnsafeModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formSchema = createAbsencePolicyCounterFormSchema(t);
    const form = useForm<AbsencePolicyCounterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: absencePolicyCounterDefaultFormValues,
    });

    const isHours = counter.unit === "hours";

    useEffect(() => {
        setIsEditing(false);
        setUnsafeModalOpen(false);
    }, [counter.id]);

    const beginEditAfterUnsafe = () => {
        setUnsafeModalOpen(false);
        setIsEditing(true);
        form.reset(counterToFormValues(counter));
    };

    const handleCancelEdit = async () => {
        if (form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (!discard) return;
        }
        setIsEditing(false);
        form.reset(absencePolicyCounterDefaultFormValues);
    };

    const onSubmit = async (values: AbsencePolicyCounterFormValues) => {
        setIsSaving(true);
        try {
            const requestData = buildEditPatchPayload(values);
            const response = await patchAbsencePolicyCounters(
                orgId,
                policyId,
                requestData,
                counter.id
            );
            if (response.success) {
                toast.success(
                    t("absence-policies.counters.updatedSuccess", "Counter updated successfully")
                );
                setIsEditing(false);
                form.reset(absencePolicyCounterDefaultFormValues);
                onSaved();
            } else {
                toast.error(
                    response.error ||
                    t("absence-policies.counters.updateError", "Failed to update counter")
                );
            }
        } catch (e) {
            console.error(e);
            toast.error(t("absence-policies.counters.updateError", "Failed to update counter"));
        } finally {
            setIsSaving(false);
        }
    };

    const readOnlyBody = (
        <>
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t("absence-policies.counters.basicInfo", "Basic information")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.name", "Name")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2 border border-transparent">
                            {counter.name}
                        </p>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.description", "Description")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2 min-h-[4.5rem] whitespace-pre-wrap border border-transparent">
                            {counter.description?.trim() ? counter.description : "—"}
                        </p>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.absenceTypes", "Absence Types")}
                        </Label>
                        <div className="mt-1 text-sm rounded-md bg-muted px-3 py-2 border border-transparent flex flex-wrap items-center gap-y-1">
                            {counter.absence_types?.length ? (
                                counter.absence_types.map((type, index) => (
                                    <span
                                        key={type.id}
                                        className="inline-flex items-center"
                                    >
                                        {index > 0 ? (
                                            <span className="text-muted-foreground">, </span>
                                        ) : null}
                                        <IconLabel
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
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t(
                        "absence-policies.counters.sections.cycleConfig",
                        "Cycle Configuration"
                    )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.cycleStart", "Cycle Start")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {getCycleStartLabel(counter.cycle_start || "")}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t(
                                "absence-policies.counters.cycleDuration",
                                "Cycle Duration (months)"
                            )}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {counter.cycle_duration ?? 0}{" "}
                            {t("absence-policies.counters.months", "months")}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t(
                                "absence-policies.counters.cycleStartYear",
                                "Cycle start year"
                            )}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {getDisplayCycleStartYear(counter) ?? "—"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t(
                        "absence-policies.counters.sections.counterConfig",
                        "Counter Configuration"
                    )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {isHours
                                ? t("absence-policies.counters.valueHours", "Number of hours")
                                : t("absence-policies.counters.value", "Number of days")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {counter.is_unlimited
                                ? t("absence-policies.counters.unlimited", "Unlimited")
                                : counter.value}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.unit", "Unit")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {getUnitLabel(counter.unit || "")}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {isHours
                                ? t("absence-policies.counters.maxHours", "Maximum extra hours")
                                : t("absence-policies.counters.maxDays", "Maximum extra days")}
                        </Label>
                        <p className="text-sm rounded-md bg-muted px-3 py-2">
                            {counter.max_days ?? 0}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {counter.is_unlimited && (
                        <Tag
                            text={t("absence-policies.counters.isUnlimited", "Unlimited")}
                        />
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ReadOnlyCheckboxRow
                        label={t(
                            "absence-policies.counters.isWorkingDay",
                            "Count Working Days Only"
                        )}
                        description={t(
                            "absence-policies.counters.isWorkingDayDescription",
                            "Only count working days, excluding weekends"
                        )}
                        checked={!!counter.is_working_day}
                    />
                    <ReadOnlyCheckboxRow
                        label={t("absence-policies.counters.countIfHoliday", "Count Holidays")}
                        description={t(
                            "absence-policies.counters.countIfHolidayDescription",
                            "Count days that fall on holidays"
                        )}
                        checked={!!counter.count_if_holiday}
                    />
                    <ReadOnlyCheckboxRow
                        label={t("absence-policies.counters.isProrated", "Prorate")}
                        description={t(
                            "absence-policies.counters.isProratedDescription",
                            "Prorate days based on employment start date"
                        )}
                        checked={!!counter.is_prorated}
                    />
                    <ReadOnlyCheckboxRow
                        label={t(
                            "absence-policies.counters.negativeCounter",
                            "Allow Negative Balance"
                        )}
                        description={t(
                            "absence-policies.counters.negativeCounterDescription",
                            "Allow the counter to go below zero"
                        )}
                        checked={!!counter.negative_counter}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t(
                        "absence-policies.counters.sections.expirationAndAdmin",
                        "Expiration and Admin Configuration"
                    )}
                </h3>
                {counter.is_unlimited ? (
                    <ReadOnlyCheckboxRow
                        label={t("absence-policies.counters.adminOnly", "Admin Only")}
                        description={t(
                            "absence-policies.counters.adminOnlyDescription",
                            "If active, only admins can use this counter"
                        )}
                        checked={!!counter.admin_only}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                        <div className="space-y-4 min-w-0">
                            <ReadOnlyCheckboxRow
                                label={t(
                                    "absence-policies.counters.expiration",
                                    "Enable Expiration"
                                )}
                                description={t(
                                    "absence-policies.counters.expirationDescription",
                                    "Unused days expire after a certain period"
                                )}
                                checked={!!counter.expiration}
                            />
                            {counter.expiration && (
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground">
                                        {t(
                                            "absence-policies.counters.expirationPeriod",
                                            "Expiration Period"
                                        )}
                                    </Label>
                                    <p className="text-sm rounded-md bg-muted px-3 py-2">
                                        {getExpirationPeriodLabel(counter)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <ReadOnlyCheckboxRow
                                label={t(
                                    "absence-policies.counters.adminOnly",
                                    "Admin Only"
                                )}
                                description={t(
                                    "absence-policies.counters.adminOnlyDescription",
                                    "If active, only admins can use this counter"
                                )}
                                checked={!!counter.admin_only}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t("absence-policies.counters.datesSection", "Dates")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.columns.startDate", "Start Date")}
                        </Label>
                        <p className="text-sm">
                            {counter.start_date
                                ? formatDate(counter.start_date, { showTime: false })
                                : "—"}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.columns.endDate", "End Date")}
                        </Label>
                        <p className="text-sm">
                            {counter.end_date
                                ? formatDate(counter.end_date, { showTime: false })
                                : "—"}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t(
                                "absence-policies.counters.columns.expiryDate",
                                "Expiry Date"
                            )}
                        </Label>
                        <p className="text-sm">
                            {counter.theoretical_end_date
                                ? formatDate(counter.theoretical_end_date, {
                                    showTime: false,
                                })
                                : "—"}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );

    const datesWhileEditing = (
        <div className="space-y-6 pt-2">
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">
                    {t("absence-policies.counters.datesSection", "Dates")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.columns.startDate", "Start Date")}
                        </Label>
                        <p className="text-sm">
                            {counter.start_date
                                ? formatDate(counter.start_date, { showTime: false })
                                : "—"}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t("absence-policies.counters.columns.endDate", "End Date")}
                        </Label>
                        <p className="text-sm">
                            {counter.end_date
                                ? formatDate(counter.end_date, { showTime: false })
                                : "—"}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground">
                            {t(
                                "absence-policies.counters.columns.expiryDate",
                                "Expiry Date"
                            )}
                        </Label>
                        <p className="text-sm">
                            {counter.theoretical_end_date
                                ? formatDate(counter.theoretical_end_date, {
                                    showTime: false,
                                })
                                : "—"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Card className="shadow-none border-border">
                <CardHeader className="space-y-4 pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 min-w-0">
                            <h2 className="text-xl font-semibold leading-tight break-words">
                                {counter.name}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <IdBadge id={counter.id} hideIcon={true} />
                            {isEditing ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                    >
                                        {t("common.cancel", "Cancel")}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t(
                                                    "absence-policies.counters.updatingCounter",
                                                    "Updating Counter..."
                                                )}
                                            </>
                                        ) : (
                                            t("common.save", "Save")
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => setUnsafeModalOpen(true)}
                                >
                                    {t("common.edit", "Edit")}
                                </Button>
                            )}
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("common.duplicate", "Duplicate"),
                                        icon: "copy",
                                        onClick: onDuplicateClick,
                                        showOption: !isEditing,
                                    },
                                    {
                                        label: t("common.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: onDeleteClick,
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    {isEditing ? (
                        <Form {...form}>
                            <div className="space-y-6">
                                <AbsencePolicyCounterFormFields
                                    form={form}
                                    mode="edit"
                                    counter={counter}
                                    orgId={orgId}
                                    isLoading={isSaving}
                                />
                                {datesWhileEditing}
                            </div>
                        </Form>
                    ) : (
                        readOnlyBody
                    )}
                </CardContent>
            </Card>

            <AbsencePolicyCounterUnsafeEditModal
                open={unsafeModalOpen}
                onOpenChange={setUnsafeModalOpen}
                onConfirm={beginEditAfterUnsafe}
                counter={counter}
            />
        </>
    );
};

export default AbsencePolicyCounterDetailView;
